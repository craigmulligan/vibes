import EventEmitter from "events";
import {
  buffer,
  booleanPointInPolygon,
  distance as turfDistance,
  nearestPointOnLine,
  LineString,
  truncate,
} from "@turf/turf";
import {
  DirectionsResponse,
  Route,
  Step,
} from "@mapbox/mapbox-sdk/services/directions";

type Location = [number, number];

type Options = {
  leadDistance?: number;
  buffer?: number;
  location?: Location;
};

class Director extends EventEmitter {
  location: Location;
  prevSteps: string[];
  route: Route<LineString>;
  stepRoute: LineString;
  leadDistance: number;
  buffedRoute: any;

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

    // steps that have already been sent to the client
    this.prevSteps = [];
    // the distance when a step is primed/appropriate for the client
    this.leadDistance = opts.leadDistance;
    this.route = res.routes[0];
    const locations = this.route.legs[0].steps.map(({ maneuver }) => {
      return maneuver.location;
    });
    this.stepRoute = { type: "LineString" as const, coordinates: locations };

    this.buffedRoute = buffer(this.stepRoute, opts.buffer, {
      units: "meters",
    });
    this.location = opts.location || res.waypoints[0].coordinates;
  }

  hasDeviated() {
    return booleanPointInPolygon(this.location, this.buffedRoute);
  }

  nextStep() {
    const foundPoint = nearestPointOnLine(this.stepRoute, this.location);

    if (!foundPoint.properties.index) {
      throw new Error("could not find point on route");
    }

    const [lat, lng] = this.stepRoute.coordinates[foundPoint.properties.index];

    const step = this.route.legs[0].steps.find(({ maneuver }) => {
      console.log(maneuver.location);
      return maneuver.location[0] === lat && maneuver.location[1] === lng;
    });

    if (!step) {
      throw new Error("could not find next step");
    }

    return this.getStep(step);
  }

  getStep(step: Step): Step {
    // if we have already notified the client it's not the next
    if (!this.prevSteps.includes(step.name)) {
      return step;
    } else {
      let current = this.route.legs[0].steps.findIndex(
        (s) => s.name == step.name,
      );
      return this.getStep(this.route.legs[0].steps[current + 1]);
    }
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

  updateLocation(location: Location) {
    try {
      this.location = location;
      if (this.hasDeviated()) {
        this.emit("deviation");
      }

      const step = this.nextStep();
      console.log({ step });

      if (this.shouldNotify(step)) {
        this.prevSteps.push(step.name);
        this.emit("step", step);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }
}

export default Director;
