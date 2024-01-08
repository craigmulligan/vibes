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
    //   setDestination({ "type": "Feature", "geometry": { "coordinates": [-118.498585, 34.019088], "type": "Point" }, "properties": { "name": "Premier Business Centers - 401 Wilshire", "mapbox_id": "dXJuOm1ieHJldDowcEQ5SFNDODhkdXdVUFJ1UkE2Qnk0M2NnUGd6bS1tcF9Ia1Nob0JKUUdiWWFOeVdiX2hVdk5WZGo4WFlTWVctZ1JxWEtDV1l5SXNrajd0eXBvZ2d5MWh3TlZNTlVMMUVJTUl3STdEQk1iVFJkNUFBY3RNNDltTEQ4TWVwMEhyYWpQUm5RZDFUb3hwWWFTbDlCeXNQaWJOQVJadktEM1F3MldVRGpaVVh6MTY5ZUdsRXNEdWRuQUlEYjZNMDRMLUdVZnQ1Q1BfdE5mdlZFQXpwTVUtTGJldjJSQTlDcnR6UGxKOHdMR0dKdTlXX2ZzUGNUWV8ycDl5Wkx3dlRMMHVxa0NrLTdNcXNpSnJOUnlGNUltUlJkVzI4MFpyZXdOY2FjY1VPVEhlamtRWDI0VTBQblRWYXVrVmVmdlRIdThWSUd2LU1lZlhlRjV6elllY0o0Yy1NLVJvODduMXlBTWtZaEp2Tm5vY2dOZWVXWlRrTmxfTV9ONE5iMUZDMWd4UzU5SzliLV80Z3VBYzMwSzNjUTdsQklCNU5yYmF4R1llVnpVZFVaZ0lyNW1OZV9XRXRleEFOblF1eXZlY3BtWmJOVHJLVVlGUllfNnhzOHV5X2g4OGUzS29WYXlKRDBZQ2FNZjYxX1BqdGI0TXVUejZiaWhSRmVSVWhiaUpsTGZPczVXY0ZCcDhJcEdBZmdSMmlNaXJKbFZRSGNrNnVsZU81Ml90STFTeW4yenQtSDlQMnZCS20tVWFiYXpQRXpLakM2b1dZZ2llSjNBU1lrVkJqOUt5U1JGZ2NfbE5IOHhzQVY3NHBoY0JYeDAxR2J0SlRFeFdoOVlEM3Y0dGpCQmt2QVAzNkZjNzJWVGNMTHBQVy1oMmNnT2F0RXg0WFpHc0tzRS1GSEt3MVFJRmVSWmVoRjA1aE9kNlVRMEFianhsallBZ2VMRWhnOGVUdXdPblU1cEQ1bDM3Yk1JcEswb0VqTjI2NldHT013amgtUDlDd2FpQnp3eXNSSmJUeUNzZnJHUUViME9sTUJESDU2MEt2clJzUXpaQkg2VlVPWk43TkhNQ2ZNcWdBZGszWG41Q09WSl82eVlBdk5ucXU4UHRPVW5CYW5WZ2NMdU5XOXdJTjhXUnpYdUF0YzQ1WklDNC1jdmVNM3pEb2x5LU5OakRZdU8wSXY2Mjd3QWF2Yy05VFlIc2c1clozQ3RaV2E3YmNKUUpyWnZzQW5lQzlCZW1sRWMtUGlPdHh5UWZHRFRQV1RhMGU3SkhUb0FIeGgxZ3VYVTJtOW81N3RubW5TbHpwMlltc25RUnpmODhBNHhuNlhZQ1BzWDN1RTV1Tl9yX083TG93XzV2Q0FabnVuYVQ1R0Zla0ZIS0hrN3hNS2VjeWFCa0FlM0ZUb0lWUTlZc28xb0pEOUliRHl5NWpmd0NXTFN0WkczREdaWm5VSmJyS0ZBYmJORXVPb1UtNUFkWnBjN1FuWDM1bEdGQWRXNjFWY1JTdXFwdlE2dGxDZjdfWTdZZmhOZFRnaHVVTzNzUXNqWDcteTYyb01oTWJoQkdUVFZmZkh5bFA5TXpQV29PbUdfczFmTjVCbjNTWENvSHlXZnR5bFVPOG03N1FWMWNsOE9vTi1NRzc0VGpGellsZHJPYXBGR09pb1RxRXgyS3lxVi1KMTRtWU94NmJwdVd3RXNuZm1NbmF6YjNSeFowZG5TYXZZaVp2djRuZXppeGd3RGJCeUp2cmRQa3hxQmhZdjVnZ1ZONVdMc0t3Ujh0S0o3V1pyMng2RFJmWHlHMW1aU2xiWmlYcjc4a1Mza2YyYmYySFVYSVl0SFNPazJmOGpQRjNkcjJjMFNIN2tfT2RfQVZUU28waDZlWDdkTUZlN0lWcEdidGh4Q1k2ZmFXRWhyQVZLQ09EcGVXTjhKMXdNcXlwdjlsV3d2UVlNTkptWldpVThVdXNMN2tHOGd4aVlkV25NeXRlMXdBbmp3V1ljdV9lQXp3M2c0d1NHRC1USFJLTTBsNHk2N05GNlh4elBEM0lnbkNxMnpVcHJLOEVnS3o5SlBZQ0p6S2tfb0JvWGpJV1pqa2Mxbi1CYXBxc2o3dTFYQk12TVJvNkQtcFpXMENwZzU3TTRLRkkzOVFjWTlmRUUyYzFCUS1PRl9fcTVscW1VeHRCRko2LV9nWDU1QXhpUVFqQThGeXNzX1lBX2pIbWhCYlQ2YWltNWtFMU84emN6NGoxX0tnams1Q014TEVuY1BBc3l4bXhPbmF3cHoyU0JRWUVSU0ZUdkliRTNDREdVbEZYd3NLY29pX3lTZFdNYnlzdUdjaHRlbFJHLUM2TlNuUUotU3h2Sk9MVnZySnZyRTBtdGp4NHo0OGJPYWR5RUpidm53WmVUeHlQclJmY01YNVZqNUNYT1VaMlVMcTdSVlVNSDd0Wjd2cENGUndCTVNyTElENUVzUDhkaWZORTd1MkUwbXBpNkxiRmEzWlVJNVBOcjZZSmFwLWtYOFNEcWNjSDN4QmFYWUlDYWxSdXVkVXlSb2dmd0pYNTU3VFkyTlMybHRIWTZxN1E2R185VkdIXzA2eEYxbGZmVjYxcVl2aFY5bkU1eVBOUWhEb1JhS1hITm8wNmhIcjRSeWNzRk83QVVxYnNrc0VkOGl0T2tZMmJnZlpTd3dmYXM3OFp6STdQSUtrc2Zvb1JoUWJ3Um41c0djZk03TkVQSUNYdU5yZW9TLVBYUnlsX1UyY1puWEMxZG1xdzF2S0Rxc2tkaUZkVFRPWlpGaUw3aEd6cDZJekk5Zjhvb0JkOTk5TW1vQnh6aWZyMFhCeWRuVXBnd0RUSTRPT0RYWHJxRGNwLUNuMV9laDQ3N3hWbGVYRXpWQjhzVDJEZ1FWa0FSY3ZJSGlPZHMtamc0dy0tZU9LUDhHNVFVU0ozc09TQ0JKcjk2UWRyYWs2dFBUWjc4RUJZdEthZUVtclJyell4dE5vMUttTGU1X2gyV05hajlVSEI0NTRlUlYtRzBmZm1EcTFpQVZCVDdlU01YVklNcWdEdDJnSGFvTFZBMkZLMnBLVTBFVGJGMUdfRmU3ZFZoWHBPN3BVc2hUZUQwMVFTWHY4Tk5OQT0=", "feature_type": "poi", "address": "401 Wilshire Blvd", "full_address": "401 Wilshire Blvd, Santa Monica, California 90403, United States", "place_formatted": "Santa Monica, California 90403, United States", "context": { "country": { "name": "United States", "country_code": "US", "country_code_alpha_3": "USA" }, "region": { "name": "California", "region_code": "CA", "region_code_full": "US-CA" }, "postcode": { "id": "dXJuOm1ieHBsYzpFZlh1N0E", "name": "90403" }, "place": { "id": "dXJuOm1ieHBsYzpFWHRvN0E", "name": "Santa Monica" }, "address": { "name": "401 Wilshire Blvd", "address_number": "401", "street_name": "wilshire blvd" }, "street": { "name": "wilshire blvd" } }, "coordinates": { "latitude": 34.019088, "longitude": -118.498585, "routable_points": [{ "name": "default", "latitude": 34.01898207792791, "longitude": -118.4984980069674 }] }, "maki": "marker", "poi_category": ["office"], "poi_category_ids": ["office"], "external_ids": { "foursquare": "6d6d0409a5a34b4cb6ba5fa0" }, "metadata": { "phone": "(424) 252-4800", "website": "http://www.pbcenters.com/locations/california/los-angeles-county/executive-suites-santa-monica-401-wilshire", "open_hours": { "periods": [{ "open": { "day": 0, "time": "0830" }, "close": { "day": 0, "time": "1700" } }, { "open": { "day": 1, "time": "0830" }, "close": { "day": 1, "time": "1700" } }, { "open": { "day": 2, "time": "0830" }, "close": { "day": 2, "time": "1700" } }, { "open": { "day": 3, "time": "0830" }, "close": { "day": 3, "time": "1700" } }, { "open": { "day": 4, "time": "0830" }, "close": { "day": 4, "time": "1700" } }] } } } })
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
    async function updateLocation() {
      if (currentLocation) {
        await director.updateLocation(currentLocation);
      }
    }
    updateLocation()
  }, [currentLocation])

  useEffect(() => {
    // this effect handles running a
    // simulation of a basic route.
    // used for dev/testing.
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
    return <View><Text>Enable location</Text></View>
  }

  if (error) {
    return <View><Text>{error}</Text></View>
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
