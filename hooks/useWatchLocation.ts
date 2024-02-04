import { Route } from "@mapbox/mapbox-sdk/services/directions";
import * as turf from "@turf/turf";
import { useEffect, useState } from "react";
import * as ExpoLocation from "expo-location";
import { generateEquallySpacedPointsAlongLine } from "../lib/utils";
import Director, { Location } from "../lib/director";

const useWatchLocation = ({ shouldSimulate, director }: { shouldSimulate: boolean, director: Director }) => {
  const [currentLocation, setCurrentLocation] = useState<Location>();
  const [error, setError] = useState("");
  const [status, requestPermission] = ExpoLocation.useForegroundPermissions();

  useEffect(() => {
    if (!status?.granted) {
      requestPermission();
    } else {
      async function fetchCurrentLocation() {
        try {
          const currentLocation = await ExpoLocation.getCurrentPositionAsync();
          if (!currentLocation) {
            return
          }
          setCurrentLocation([
            currentLocation.coords.longitude,
            currentLocation.coords.latitude,
          ]);
          setError("")
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message)
          }
        }
      }

      console.log('fetching location')
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

  useEffect(() => {
    // simulation mode
    if (!shouldSimulate || !status) {
      return;
    }

    console.log("starting simulation")
    let timerId: NodeJS.Timeout;

    const onRoute = (route: Route<turf.LineString>) => {
      console.log("setting up simulated location")
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
      clearInterval(timerId);
    }

    director.on("route", onRoute);
    director.on("finish", onFinish);

    return () => {
      clearInterval(timerId);
      director.removeListener("route", onRoute)
      director.removeListener("finish", onFinish);
    };
  }, [shouldSimulate, setCurrentLocation]);

  useEffect(() => {
    // non simulation mode
    if (
      shouldSimulate ||
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

    watchLocation()

    const onFinish = () => {
      locationSubscription.remove()
    }

    director.on("finish", onFinish);

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      director.removeListener("finish", onFinish);
    };
  }, [shouldSimulate, error]);

  return {
    currentLocation,
    error
  }
}

export default useWatchLocation
