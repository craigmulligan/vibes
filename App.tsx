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
import simpleSteps from "./lib/director/simple.steps.json";
import simpleRes from './lib/director/simple.res.json'
import { Location } from "./lib/director";
import StepOverlay from "./components/StepOverlay";
import DestinationForm from "./components/CoordinateForm";
import Toggle from "./components/Toggle";
import * as ExpoLocation from "expo-location";
import { Feature, Point } from "@turf/turf";
import useDirector, { useMockDirector } from "./hooks/useDirector";

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
  const { director } = useDirector()
  const { director: mockDirector } = useMockDirector()

  useEffect(() => {
    if (!status) {
      requestPermission();
    } else {
      async function fetchCurrentLocation() {
        try {
          const currentLocation = await ExpoLocation.getCurrentPositionAsync();
          setCurrentLocation([
            currentLocation.coords.longitude,
            currentLocation.coords.latitude,
          ]);
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message)
          }
        }
      }

      fetchCurrentLocation();
    }
  }, [status]);

  useEffect(() => {
    if (
      shouldSimulate ||
      !destination ||
      !status ||
      !currentLocation ||
      error
    ) {
      return;
    }

    let locationSubscription: ExpoLocation.LocationSubscription;

    const onRoute = () => {
      setIsLoading(false);
    }

    const onStep = (step: Step) => {
      setCurrentStep(step);
    }

    const onFinish = () => {
      locationSubscription.remove()
    }

    const onDeviation = () => {
      setIsLoading(true);
      console.log("deviation");
    }

    director.on("route", onRoute);
    director.on("step", onStep);
    director.on("finish", onFinish);
    director.on("deviation", onDeviation);

    const start = async () => {
      setIsLoading(true);
      console.log("starting navigate", { destination });
      try {
        locationSubscription = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          async (location) => {
            try {
              await director.updateLocation([
                location.coords.longitude,
                location.coords.latitude,
              ]);
            } catch (error) {
              if (error instanceof Error) {
                setError(error.message);
              } else {
                throw error;
              }
            }
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
    };

    start();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      director.removeListener("route", onRoute);
      director.removeListener("step", onStep);
      director.removeListener("finish", onFinish);
      director.removeListener("deviation", onDeviation);
    };
  }, [shouldSimulate, destination, status, currentLocation, error]);

  useEffect(() => {
    if (shouldSimulate && !destination) {
      const lastStep = simpleRes.routes[0].legs[0].steps.at(-1) as Step

      const destination = {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: lastStep.geometry.coordinates as any,
        },
        properties: { name: "simulation" },
      }

      console.log("set destination", JSON.stringify(destination))
      setDestination(destination)
    }

  }, [shouldSimulate])

  useEffect(() => {
    // this effect handles running a
    // simulation of a basic route.
    // used for dev/testing.
    if (!shouldSimulate || !destination || error) {
      console.log({ shouldSimulate, destination, error })
      return;
    }
    let timerId: NodeJS.Timeout;


    const onRoute = () => {
      setIsLoading(false);
    }

    const onFinish = () => {
      console.log("finish");
      setShouldSimulate(false);
      clearInterval(timerId);
    }

    const onStep = (step: Step) => {
      console.log("step", step);
      setCurrentStep(step);
    }

    const onDeviation = () => {
      setIsLoading(true);
      console.log("deviation");
    }

    const coords = simpleSteps.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates) as Location[];

    mockDirector.on("route", onRoute);
    mockDirector.on("finish", onFinish);
    mockDirector.on("step", onStep);
    mockDirector.on("deviation", onDeviation);

    const start = async () => {
      setIsLoading(true);
      await mockDirector.navigate(
        [-118.506001, 34.022483],
        [-118.490471, 34.01714],
      );

      timerId = setInterval(async () => {
        const location = coords.shift();
        if (location) {
          await mockDirector.updateLocation(location);
        }
      }, 5000);

      return timerId;
    };

    start();

    return () => {
      clearInterval(timerId);
      mockDirector.removeListener("route", onRoute)
      mockDirector.removeListener("finish", onFinish);
      mockDirector.removeListener("step", onStep);
      mockDirector.removeListener("deviation", onDeviation);
    };
  }, [shouldSimulate, destination, error]);

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
    flex: 0.75,
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
