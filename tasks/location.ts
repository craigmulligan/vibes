import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

import * as turf from "@turf/turf";
import { generateEquallySpacedPointsAlongLine } from "../lib/utils";
import { Route } from "@mapbox/mapbox-sdk/services/directions";

import * as ExpoLocation from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Location } from "../lib/director";
import Director from "../lib/director";

type LocationTaskEventTypes = {
  location: (route: Location) => void;
  error: (error: TaskManager.TaskManagerError) => void;
};

export const LOCATION_TASK_NAME = "background-location-task";

export default class LocationTask extends (EventEmitter as new () => TypedEmitter<LocationTaskEventTypes>) {
  director: Director;
  shouldSimulate: boolean;

  constructor(director: Director, shouldSimulate: boolean) {
    super();
    this.director = director;
    this.shouldSimulate = shouldSimulate;
  }

  boot() {
    console.log("Location task booting");
    if (this.shouldSimulate) {
      this.simulate();
    } else {
      this.watch();
    }

    console.log("Location task booted");
  }

  async start() {
    const currentLocation = await ExpoLocation.getCurrentPositionAsync();

    if (!currentLocation) {
      return;
    }

    this.emit("location", [
      currentLocation.coords.longitude,
      currentLocation.coords.latitude,
    ]);

    this.director.updateLocation([
      currentLocation.coords.longitude,
      currentLocation.coords.latitude,
    ]);
  }

  simulate() {
    let timerId: NodeJS.Timeout;

    this.director.on("route", (route: Route<turf.LineString>) => {
      const coords = generateEquallySpacedPointsAlongLine(route.geometry, 20);

      // Here we incrementall load each point
      timerId = setInterval(async () => {
        const location = coords.shift();
        if (location) {
          this.emit("location", location);
          await this.director.updateLocation(location);
        }
      }, 1000);
    });
    this.director.on("finish", () => {
      clearInterval(timerId);
    });
    this.director.on("cancel", () => {
      clearInterval(timerId);
    });
  }

  watch() {
    TaskManager.defineTask<{ locations: ExpoLocation.LocationObject[] }>(
      LOCATION_TASK_NAME,
      async ({ data, error }) => {
        if (error) {
          this.emit("error", error);
          return;
        }
        if (data) {
          const { locations } = data;
          for (const location of locations) {
            this.emit("location", [
              location.coords.longitude,
              location.coords.latitude,
            ]);
            await this.director.updateLocation([
              location.coords.longitude,
              location.coords.latitude,
            ]);
          }
        }
      },
    );

    // start and stop the background location task
    // when we start and stop a route
    this.director.on("navigate", async () => {
      await ExpoLocation.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: ExpoLocation.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 0,
      });
    });

    this.director.on("cancel", async () => {
      await ExpoLocation.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    });

    this.director.on("finish", async () => {
      await ExpoLocation.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    });
  }
}
