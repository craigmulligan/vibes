import EventEmitter from "events";
import {
  buffer,
  booleanPointInPolygon,
  distance as turfDistance,
  LineString,
  Feature,
  Polygon,
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

  #incrementStepIndex() {
    if (this.currentStepIndex >= this.steps.length) {
      return false;
    }

    this.currentStepIndex++;
    return true;
  }

  updateLocation(location: Location) {
    try {
      this.location = location;
      if (this.hasDeviated()) {
        this.emit("deviation");
      }

      // TODO should handle skipping steps
      const step = this.steps[this.currentStepIndex];

      if (this.shouldNotify(step)) {
        console.log("should notify");
        const isNextStep = this.#incrementStepIndex();
        if (!isNextStep) {
          this.emit("finished");
        }

        this.emit("step", step);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }
}

export default Director;
