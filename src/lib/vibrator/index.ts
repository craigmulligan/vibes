import { Step, Route } from "@mapbox/mapbox-sdk/services/directions";
import Director from "../director";
import { LineString } from "@turf/turf";

class Vibrator {
  vibrate: Window["navigator"]["vibrate"];
  director: Director;

  constructor(director: Director, vibrate: Window["navigator"]["vibrate"]) {
    this.vibrate = vibrate;
    this.director = director;
    // setup event listeners
    this.director.on("finish", this.#onFinish.bind);
    this.director.on("step", this.#onStep.bind);
    this.director.on("route", this.#onRoute.bind);
    this.director.on("deviation", this.#onDeviation.bind);
  }

  #onFinish() {
    this.vibrate(1000);
  }

  #onStep(step: Step) {
    console.log(step);
  }

  #onRoute(route: Route<LineString>) {
    console.log("route", route);
  }

  #onDeviation() {
    this.vibrate(500);
  }
}

export default Vibrator;
