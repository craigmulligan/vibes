import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
} from "react-native";
import { Route, Step } from "@mapbox/mapbox-sdk/services/directions";
import { Location } from "./lib/director";
import StepOverlay from "./components/StepOverlay";
import Search from "./components/Search";
import Toggle from "./components/Toggle";
import * as ExpoLocation from "expo-location";
import * as turf from "@turf/turf";
import useDirector from "./hooks/useDirector";
import { generateEquallySpacedPointsAlongLine } from "./lib/utils";
import MapView, { Geojson, Marker } from 'react-native-maps';
import FullScreenMessage from "./components/FullScreenMessage";
// import defaultDestination from "./destination.json"

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldSimulate, setShouldSimulate] = useState(true);
  const [destination, setDestination] = useState<turf.Feature<turf.Point> | undefined>(
    undefined,
  );
  const [status, requestPermission] = ExpoLocation.useBackgroundPermissions();
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Location>();
  const [route, setRoute] = useState<any | undefined>()
  const { director } = useDirector({ vibrate: false })

  useEffect(() => {
    // setTimeout(() => {
    //   setDestination(defaultDestination)
    // }, 5000)
  }, [])


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
    async function updateLocation() {
      if (currentLocation) {
        await director.updateLocation(currentLocation);
      }
    }
    updateLocation()
  }, [currentLocation])

  const start = async () => {
    setIsLoading(true);
    if (!currentLocation || !destination) {
      throw new Error("missing current location or destination");
    }
    await director.navigate(
      currentLocation,
      destination.geometry.coordinates as Location,
    );
  };

  useEffect(() => {
    // non simulation mode
    if (
      shouldSimulate ||
      !destination ||
      !currentLocation ||
      error
    ) {
      return;
    }

    let locationSubscription: ExpoLocation.LocationSubscription;

    const watchLocation = async () => {
      try {
        console.log("setting up location watcher")
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
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          throw error;
        }
      }
    }

    const onRoute = () => {
      setIsLoading(false);
      watchLocation();
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
    // simulation mode
    if (!shouldSimulate || !destination || error) {
      return;
    }
    console.log("starting simulation")
    let timerId: NodeJS.Timeout;

    const onRoute = (route: Route<turf.LineString>) => {
      console.log("setting up simulated location")
      setIsLoading(false);
      const coords = generateEquallySpacedPointsAlongLine(route.geometry, 100);

      // here we incrementall load each point
      timerId = setInterval(async () => {
        const location = coords.shift();
        if (location) {
          console.log("new simulated location", location)
          setCurrentLocation(location)
        }
      }, 1000);
    }

    const onFinish = () => {
      console.log("finish");
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


    director.on("route", onRoute);
    director.on("finish", onFinish);
    director.on("step", onStep);
    director.on("deviation", onDeviation);

    start();

    return () => {
      clearInterval(timerId);
      director.removeListener("route", onRoute)
      director.removeListener("finish", onFinish);
      director.removeListener("step", onStep);
      director.removeListener("deviation", onDeviation);
    };
  }, [shouldSimulate, destination, error]);

  useEffect(() => {
    function updateRoute(route: any) {
      const feat = turf.feature(route.geometry)
      setRoute({
        "type": "FeatureCollection",
        "features": [feat],
        "properties": {}
      })
    }

    director.on("route", updateRoute)

    return () => { director.removeListener("deviation", updateRoute) };
  }, [])

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
