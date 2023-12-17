import EventEmitter from "events";
import {
  buffer,
  booleanPointInPolygon,
  distance as turfDistance,
  LineString,
  Feature,
  Polygon,
  nearestPointOnLine,
} from "@turf/turf";
import {
  DirectionsResponse,
  Route,
  Step,
} from "@mapbox/mapbox-sdk/services/directions";

export type Location = [number, number];

type Options = {
  leadDistance?: number;
  buffer?: number;
  location?: Location;
};

class Director extends EventEmitter {
  // Current users location
  location: Location;
  currentStepIndex: number;
  // Route is the full route geojson
  route: Route<LineString>;
  // step route is just the locations
  steps: Step[];
  leadDistance: number;
  // a buffer around the this.route
  // which we check to see if user has hasDeviated.
  buffedRoute: Feature<Polygon>;
  options: {
    leadDistance: number;
    buffer: number;
  };

  // this takes a mapbox direction response and emits the manuers based on the current location
  constructor(
    res: DirectionsResponse<LineString>,
    options: Options = { leadDistance: 20, buffer: 50 },
  ) {
    super();

    const opts = {
      ...options,
      ...{ leadDistance: 20, buffer: 50 },
    };

    this.currentStepIndex = 0;
    this.options = opts;

    // the distance when a step is primed/appropriate for the client
    this.leadDistance = opts.leadDistance;
    this.route = res.routes[0];
    this.steps = this.route.legs[0].steps;
    this.buffedRoute = buffer(this.route.geometry, opts.buffer, {
      units: "meters",
    });
    this.location = opts.location || res.waypoints[0].coordinates;
  }

  hasDeviated() {
    return booleanPointInPolygon(this.location, this.buffedRoute);
  }

  shouldNotify(step: Step) {
    const distance = turfDistance(this.location, step.maneuver.location, {
      units: "meters",
    });

    if (distance <= this.leadDistance) {
      return true;
    }
    return false;
  }

  #getNextStep(location: Location): Step | undefined {
    const remainingSteps = this.steps.slice(this.currentStepIndex);

    for (const step of remainingSteps) {
      const isInStep = booleanPointInPolygon(
        location,
        buffer(step.geometry, this.options.buffer),
      );

      if (isInStep) {
        // check if we have already passed the manuever.
        // this can happen if don't get a loc before the maneuver
        // First get distance on line from manuever to end.
        const maneuverPoint = nearestPointOnLine(
          step.geometry,
          step.maneuver.location,
        );

        const locationPoint = nearestPointOnLine(step.geometry, location);
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

  #isLastStep(step: Step) {
    const index = this.steps.indexOf(step);
    if (index === this.steps.length - 1) {
      return true;
    }

    return false;
  }

  #notify(step: Step) {
    // const isNextStep = this.#incrementStepIndex();
    if (this.#isLastStep(step)) {
      console.log("finish");
      this.emit("finish");
    }

    this.emit("step", step);
    this.currentStepIndex = this.steps.indexOf(step) + 1;
  }

  updateLocation(location: Location) {
    try {
      this.location = location;
      const step = this.#getNextStep(location);

      if (!step) {
        // TODO: test this
        this.emit("deviation");
        return;
      }

      if (this.shouldNotify(step)) {
        this.#notify(step);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }
}

export default Director;
