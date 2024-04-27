import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Step } from "@mapbox/mapbox-sdk/services/directions";
import { Location } from "../lib/director";
import StepOverlay from "../components/StepOverlay";
import * as turf from "@turf/turf";
import Director from "../lib/director";
import MapView, { Geojson, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import FullScreenMessage from "./FullScreenMessage";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import LocationTask from "../tasks/location";
import useRequestPermissions from "../hooks/useRequestPermissions";

export default function Map({
  locationTask,
  director,
  shouldSimulate,
}: {
  locationTask: LocationTask;
  director: Director;
  shouldSimulate: boolean;
}) {
  const [currentStep, setCurrentStep] = useState<Step>();
  const [isLoading, setIsLoading] = useState(false);
  const [marker, setMarker] = useState<Location | undefined>(undefined);
  const [destination, setDestination] = useState<Location | undefined>(
    undefined,
  );
  const [route, setRoute] = useState<any | undefined>(undefined);
  const [currentLocation, setCurrentLocation] = useState<
    Location | undefined
  >();
  const { granted, error: permissionsError } = useRequestPermissions();
  const [error, setError] = useState("");

  useEffect(() => {
    if (granted) {
      locationTask.start();
    }
  }, [locationTask, granted]);

  useEffect(() => {
    locationTask.on("location", (location) => {
      setCurrentLocation(location);
    });

    locationTask.on("error", (err) => {
      setError(err.message);
    });
  }, [locationTask, setCurrentLocation]);

  const cancel = useCallback(() => {
    director.cancel();
  }, []);

  useEffect(() => {
    const start = async () => {
      setIsLoading(true);
      if (!destination) {
        setError("No destination is set");
        return;
      }
      await director.navigate(destination);
    };

    if (destination) {
      start();
    }
  }, [destination]);

  useEffect(() => {
    const onRoute = () => {
      setIsLoading(false);
    };

    const onDeviation = () => {
      setIsLoading(false);
    };

    const onStep = (step: Step) => {
      setCurrentStep(step);
    };

    function updateRoute(route: any) {
      setIsLoading(false);
      const feat = turf.feature(route.geometry);
      setRoute({
        type: "FeatureCollection",
        features: [feat],
        properties: {},
      });
    }

    function onCancelOrFinish() {
      setDestination(undefined);
      setRoute(undefined);
      setCurrentStep(undefined);
    }

    director.on("route", updateRoute);
    director.on("route", onRoute);
    director.on("step", onStep);
    director.on("deviation", onDeviation);
    director.on("cancel", onCancelOrFinish);
    director.on("finish", onCancelOrFinish);

    return () => {
      director.removeListener("route", updateRoute);
      director.removeListener("route", onRoute);
      director.removeListener("deviation", onDeviation);
      director.removeListener("step", onStep);
      director.removeListener("cancel", onCancelOrFinish);
      director.removeListener("finish", onCancelOrFinish);
    };
  }, [director]);

  if (error) {
    return (
      <FullScreenMessage>
        <Text>{error}</Text>
      </FullScreenMessage>
    );
  }

  if (permissionsError) {
    return (
      <FullScreenMessage>
        <Text>
          Location permissions are required for this app: {permissionsError}
        </Text>
      </FullScreenMessage>
    );
  }

  if (!currentLocation) {
    return (
      <FullScreenMessage>
        <Text>Location permissions are required for this app</Text>
      </FullScreenMessage>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MapView
        onLongPress={(e) =>
          setMarker([
            e.nativeEvent.coordinate.longitude,
            e.nativeEvent.coordinate.latitude,
          ])
        }
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={true}
        mapPadding={{ top: 600, left: 0, right: 0, bottom: 0 }}
        initialRegion={
          currentLocation && {
            latitude: currentLocation[1],
            longitude: currentLocation[0],
            latitudeDelta: 0.00922,
            longitudeDelta: 0.00421,
          }
        }
        style={styles.map}
      >
        {route && (
          <Geojson
            geojson={route as any}
            strokeColor="red"
            fillColor="green"
            strokeWidth={2}
          />
        )}
        {currentLocation && shouldSimulate && (
          <Marker
            pinColor="blue"
            coordinate={{
              latitude: currentLocation[1],
              longitude: currentLocation[0],
            }}
          />
        )}
        {marker && (
          <Marker
            pinColor="red"
            coordinate={{ latitude: marker[1], longitude: marker[0] }}
          />
        )}
        {destination && (
          <Marker
            coordinate={{ latitude: destination[1], longitude: destination[0] }}
          />
        )}
      </MapView>

      <View style={styles.header}>
        {!destination && currentLocation && (
          <GooglePlacesAutocomplete
            placeholder="Search"
            fetchDetails
            enablePoweredByContainer={false}
            onPress={(_, details = null) => {
              setDestination([
                details?.geometry.location.lng || 0,
                details?.geometry.location.lat || 0,
              ]);
            }}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_KEY as string,
              language: "en",
            }}
          />
        )}
      </View>
      <View style={styles.footer}>
        {marker && (
          <TouchableOpacity
            style={styles.buttonStart}
            onPress={() => {
              setDestination(marker);
              setMarker(undefined);
            }}
          >
            <Text>Start</Text>
          </TouchableOpacity>
        )}
        {destination && (
          <TouchableOpacity style={styles.buttonCancel} onPress={cancel}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        )}
        {isLoading && <ActivityIndicator size="large" />}
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
    flex: 1,
  },
  header: {
    position: "absolute",
    width: "90%",
    top: 70,
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: "white",
    borderRadius: 10,
  },
  error: {
    color: "salmon",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonCancel: {
    alignItems: "center",
    backgroundColor: "lightsalmon",
    padding: 30,
  },
  buttonStart: {
    alignItems: "center",
    backgroundColor: "lightblue",
    padding: 30,
  },
});
