import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
} from "react-native";
import { Step } from "@mapbox/mapbox-sdk/services/directions";
import { Location } from "../lib/director";
import StepOverlay from "../components/StepOverlay";
import Toggle from "./Toggle";
import * as turf from "@turf/turf";
import useDirector from "../hooks/useDirector";
import MapView, { Geojson, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import FullScreenMessage from "./FullScreenMessage";
import useWatchLocation from "../hooks/useWatchLocation";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { isDev } from "../lib/utils";
// import defaultDestination from "./destination.json"

export default function Map() {
  const [currentStep, setCurrentStep] = useState<Step>();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldSimulate, setShouldSimulate] = useState(isDev());
  const [destination, setDestination] = useState<Location | undefined>(
    undefined,
  );
  const [route, setRoute] = useState<any | undefined>()
  const { director } = useDirector({ apiKey: process.env.EXPO_PUBLIC_MAPBOX_KEY as string })
  const { currentLocation, error } = useWatchLocation({ shouldSimulate, director })

  const cancel = useCallback(() => {
    setDestination(undefined)
    setCurrentStep(undefined)
  }, [])

  // useEffect(() => {
  //   setTimeout(() => {
  //     setDestination(defaultDestination.geometry.coordinates as Location)
  //   }, 5000)
  // }, [])

  useEffect(() => {
    const start = async () => {
      setIsLoading(true);
      if (!destination) {
        throw new Error("No destination is set");
      }
      await director.navigate(
        destination
      );
    };

    if (destination) {
      start()
    }
  }, [destination])

  useEffect(() => {
    const onRoute = () => {
      setIsLoading(false);
    }

    const onDeviation = () => {
      setIsLoading(false);
    }

    const onStep = (step: Step) => {
      setCurrentStep(step);
    }

    function updateRoute(route: any) {
      const feat = turf.feature(route.geometry)
      setRoute({
        "type": "FeatureCollection",
        "features": [feat],
        "properties": {}
      })
    }

    director.on("route", updateRoute)
    director.on("route", onRoute);
    director.on("step", onStep);
    director.on("deviation", onDeviation);

    return () => {
      director.removeListener("route", onRoute);
      director.removeListener("deviation", onDeviation);
      director.removeListener("step", onStep);
      director.removeListener("route", updateRoute)
    }
  }, [director])

  if (!currentLocation) {
    return <FullScreenMessage><Text>Location permissions are required for this app.</Text></FullScreenMessage>
  }

  if (error) {
    return <FullScreenMessage><Text>{error}</Text></FullScreenMessage>
  }



  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MapView
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={true}
        mapPadding={{ top: 600, left: 0, right: 0, bottom: 0 }}
        initialRegion={{
          latitude: currentLocation[1],
          longitude: currentLocation[0],
          latitudeDelta: 0.00922,
          longitudeDelta: 0.00421,
        }}
        style={styles.map}>
        {route &&
          <Geojson
            geojson={route as any}
            strokeColor="red"
            fillColor="green"
            strokeWidth={2}
          />}
        {currentLocation && shouldSimulate && <Marker pinColor="blue" coordinate={{ latitude: currentLocation[1], longitude: currentLocation[0] }} />}
        {destination && <Marker coordinate={{ latitude: destination[1], longitude: destination[0] }} />}
      </MapView>

      <View style={styles.header}>
        {!destination && currentLocation && (
          <GooglePlacesAutocomplete
            placeholder='Search'
            fetchDetails
            enablePoweredByContainer={false}
            onPress={(_, details = null) => {
              setDestination([details?.geometry.location.lng || 0, details?.geometry.location.lat || 0])
            }}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_KEY as string,
              language: 'en',
            }}
          />
        )}
      </View>
      <View style={styles.footer}>
        {destination && (
          <Button title="cancel" onPress={cancel} />
        )}
        {isLoading && <ActivityIndicator size="large" />}
        {!destination && isDev() && <Toggle value={shouldSimulate} setValue={setShouldSimulate} />}
        {currentStep && <StepOverlay step={currentStep} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    backgroundColor: "#fff",
  },
  footer: {
    position: "absolute",
    width: "100%",
    bottom: 0,
  },
  header: {
    position: "absolute",
    width: "90%",
    top: 70,
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  error: {
    color: "salmon",
  },
  map: {
    width: "100%",
    height: '100%'
  }
});
