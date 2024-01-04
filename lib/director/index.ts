import EventEmitter from "events";
import * as turf from "@turf/turf";
import { Route, Step } from "@mapbox/mapbox-sdk/services/directions";
import { IRouter } from "../router";

export type Location = [number, number];

type Options = {
  leadDistance?: number;
  buffer?: number;
  location?: Location;
};

class Director extends EventEmitter {
  // Current users location
  location: Location;
  destination: Location | null;
  currentStepIndex: number;
  // Route is the full route geojson
  route?: Route<turf.LineString | turf.MultiLineString>;
  // step route is just the locations
  steps: Step[];
  options: {
    leadDistance: number;
    buffer: number;
  };
  router: IRouter;

  // this takes a mapbox direction response and emits the manuers based on the current location
  constructor(
    router: IRouter,
    options: Options = { leadDistance: 20, buffer: 50 },
  ) {
    super();

    this.router = router;

    const opts = {
      ...options,
      ...{ leadDistance: 20, buffer: 50 },
    };

    this.currentStepIndex = 0;
    this.options = opts;
    this.location = [0, 0];
    this.destination = null;
    this.steps = [];
  }

  async navigate(start: Location, end: Location) {
    this.destination = end;
    const res = await this.router.getRoute(start, end);
    if (res.routes.length === 0) {
      throw new Error("No route found");
    }
    // todo handle multilinestring
    this.route = res.routes[0];
    const steps = this.route?.legs[0].steps;
    if (!steps) {
      throw new Error("No steps found");
    }
    this.steps = steps;
    this.currentStepIndex = 0;
    this.emit("route", this.route);
  }

  shouldNotify(step: Step) {
    const distance = turf.distance(this.location, step.maneuver.location, {
      units: "meters",
    });

    if (distance <= this.options.leadDistance) {
      return true;
    }
    return false;
  }

  hasDeviated(location: Location) {
    if (!this.route) {
      throw new Error("No route");
    }

    const withinRoute = turf.booleanPointInPolygon(
      location,
      turf.buffer(this.route.geometry, this.options.buffer, {
        units: "meters",
      }),
    );

    return !withinRoute;
  }

  getNextStep(location: Location): Step | undefined {
    const remainingSteps = this.steps.slice(this.currentStepIndex);

    for (const step of remainingSteps) {
      const isInStep = turf.booleanPointInPolygon(
        location,
        turf.buffer(step.geometry, this.options.buffer, { units: "meters" }),
      );

      if (isInStep) {
        // check if we have already passed the manuever.
        // this can happen if don't get a loc before the maneuver
        // First get distance on line from manuever to end.
        const maneuverPoint = turf.nearestPointOnLine(
          step.geometry,
          step.maneuver.location,
        );
        const locationPoint = turf.nearestPointOnLine(step.geometry, location);

        if (
          typeof locationPoint.properties.index === "number" &&
          typeof maneuverPoint.properties.index === "number" &&
          locationPoint.properties.index > maneuverPoint.properties.index
        ) {
          // we've passed the manuever
          continue;
        }

        return step;
      }
    }
  }

  isLastStep(step: Step) {
    const index = this.steps.indexOf(step);
    if (index === this.steps.length - 1) {
      return true;
    }

    return false;
  }

  notify(step: Step) {
    if (this.isLastStep(step)) {
      this.destination = null;
      this.emit("finish");
    }

    this.emit("step", step);
    this.currentStepIndex = this.steps.indexOf(step) + 1;
  }

  async updateLocation(location: Location): Promise<void> {
    console.log("updateLocation", location);
    try {
      this.location = location;

      if (!this.destination || !this.route) {
        return;
      }

      if (this.hasDeviated(location)) {
        this.emit("deviation");
        await this.navigate(this.location, this.destination);
        return this.updateLocation(this.location);
      }

      const step = this.getNextStep(location);

      if (step && this.shouldNotify(step)) {
        this.notify(step);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }
}

export default Director;
