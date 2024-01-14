import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
} from "react-native";
import { Step } from "@mapbox/mapbox-sdk/services/directions";
import { Location } from "./lib/director";
import StepOverlay from "./components/StepOverlay";
import Search from "./components/Search";
import Toggle from "./components/Toggle";
import * as turf from "@turf/turf";
import useDirector from "./hooks/useDirector";
import MapView, { Geojson, Marker } from 'react-native-maps';
import FullScreenMessage from "./components/FullScreenMessage";
import useWatchLocation from "./hooks/useWatchLocation";
// import defaultDestination from "./destination.json"

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldSimulate, setShouldSimulate] = useState(true);
  const [destination, setDestination] = useState<turf.Feature<turf.Point> | undefined>(
    undefined,
  );
  const [route, setRoute] = useState<any | undefined>()
  const { director } = useDirector({ vibrate: false })
  const { currentLocation, error } = useWatchLocation({ shouldSimulate, director })

  useEffect(() => {
    // setTimeout(() => {
    //   setDestination(defaultDestination)
    // }, 5000)
  }, [])

  useEffect(() => {
    const start = async () => {
      setIsLoading(true);
      if (!destination) {
        throw new Error("missing current location or destination");
      }
      await director.navigate(
        director.location,
        destination.geometry.coordinates as Location,
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
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        region={{
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
        {currentLocation && <Marker pinColor="blue" coordinate={{ latitude: currentLocation[1], longitude: currentLocation[0] }} />}
        {destination && <Marker coordinate={{ latitude: destination.geometry.coordinates[1], longitude: destination.geometry.coordinates[0] }} />}
      </MapView>

      <View style={styles.header}>
        {!destination && currentLocation && (
          <Search
            onSelect={setDestination}
            currentLocation={currentLocation}
          />
        )}
      </View>
      <View style={styles.footer}>
        {destination && (
          <Button title="cancel" onPress={() => setDestination(undefined)} />
        )}
        {isLoading && <ActivityIndicator size="large" />}
        {!destination && <Toggle value={shouldSimulate} setValue={setShouldSimulate} />}
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
    top: 50,
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
