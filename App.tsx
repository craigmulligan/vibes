import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Vibration,
  ActivityIndicator,
  Button,
} from "react-native";
import Router, { MockRouter } from "./lib/router";
import Director from "./lib/director";
import Vibrator from "./lib/vibrator";
import { Step } from "@mapbox/mapbox-sdk/services/directions";
import simpleSteps from "./lib/director/simple.steps.json";
import simpleRes from "./lib/director/simple.res.json";
import { Location } from "./lib/director";
import StepOverlay from "./components/StepOverlay";
import DestinationForm from "./components/CoordinateForm";
import Toggle from "./components/Toggle";
import * as ExpoLocation from "expo-location";
import { Feature, Point } from "@turf/turf";

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldSimulate, setShouldSimulate] = useState(false);
  const [destination, setDestination] = useState<Feature<Point> | undefined>(
    undefined,
  );
  const [status, requestPermission] = ExpoLocation.useBackgroundPermissions();
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Location>();

  useEffect(() => {
    if (!status) {
      requestPermission();
    } else {
      async function fetchCurrentLocation() {
        const currentLocation = await ExpoLocation.getCurrentPositionAsync();
        setCurrentLocation([
          currentLocation.coords.longitude,
          currentLocation.coords.latitude,
        ]);
      }

      fetchCurrentLocation();
    }
  }, [status]);

  useEffect(() => {
    if (shouldSimulate || !destination || !status || !currentLocation) {
      return;
    }

    console.log({ destination });

    const router = new Router(process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string);
    const director = new Director(router);
    new Vibrator(director, Vibration.vibrate);

    let timerId: NodeJS.Timeout;

    const start = async () => {
      director.on("route", () => {
        setIsLoading(false);
      });

      director.on("step", (step) => {
        setCurrentStep(step);
      });

      director.on("finish", () => {
        clearInterval(timerId);
      });

      director.on("deviation", () => {
        setIsLoading(true);
        console.log("deviation");
      });

      let locationSubscription: ExpoLocation.LocationSubscription;
      try {
        locationSubscription = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          async (location) => {
            await director.updateLocation([
              location.coords.longitude,
              location.coords.longitude,
            ]);
            // Log the new location update
            console.log("New Location:", location.coords);
          },
        );

        await director.navigate(
          currentLocation,
          destination.geometry.coordinates as Location,
        );
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          throw error;
        }
      }

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    };

    start();

    return () => {
      clearInterval(timerId);
    };
  }, [shouldSimulate, destination, status, currentLocation]);

  useEffect(() => {
    // this effect handles running a
    // simulation of a basic route.
    // used for dev/testing.
    if (!shouldSimulate) {
      return;
    }
    const router = new MockRouter();
    const director = new Director(router);
    new Vibrator(director, Vibration.vibrate);

    let timerId: NodeJS.Timeout;

    const start = async () => {
      const coords = simpleSteps.features
        .filter((f) => f.geometry.type === "Point")
        .map((f) => f.geometry.coordinates) as Location[];

      router.setResponse(simpleRes as any);
      director.on("route", () => {
        setIsLoading(false);
      });

      director.on("step", (step) => {
        console.log("step", step);
        setCurrentStep(step);
      });

      director.on("finish", () => {
        console.log("finish");
        setShouldSimulate(false);
        clearInterval(timerId);
      });

      director.on("deviation", () => {
        setIsLoading(true);
        console.log("deviation");
      });

      await director.navigate(
        [-118.506001, 34.022483],
        [-118.490471, 34.01714],
      );
      setIsLoading(true);

      timerId = setInterval(async () => {
        const location = coords.shift();
        if (location) {
          await director.updateLocation(location);
        }
      }, 5000);

      return timerId;
    };

    start();

    return () => {
      clearInterval(timerId);
    };
  }, [shouldSimulate]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.main}>
        <Text>Good vibes</Text>
        <Toggle value={shouldSimulate} setValue={setShouldSimulate} />
        {destination && (
          <Button title="cancel" onPress={() => setDestination(undefined)} />
        )}
        {!destination && currentLocation && (
          <DestinationForm
            onSelect={setDestination}
            currentLocation={currentLocation}
          />
        )}
        {error && <Text>{error}</Text>}
        {isLoading && <ActivityIndicator size="large" />}
      </View>
      <View style={styles.footer}>
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
  main: {
    flex: 0.75, // Takes up 25% of the container's height
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flex: 0.25,
    width: "100%",
  },
  error: {
    color: "salmon",
  },
});
