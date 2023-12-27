import { Step, Route } from "@mapbox/mapbox-sdk/services/directions";
import Director from "../director";
import { LineString } from "@turf/turf";

class Vibrator {
  vibrate: Window["navigator"]["vibrate"];
  director: Director;
  vibrationPatterns: Record<string, number[]>;

  constructor(director: Director, vibrate: Window["navigator"]["vibrate"]) {
    this.vibrate = vibrate;
    this.director = director;
    // setup event listeners
    this.director.on("finish", this.#onFinish.bind(this));
    this.director.on("step", this.#onStep.bind(this));
    this.director.on("route", this.#onRoute.bind(this));
    this.director.on("deviation", this.#onDeviation.bind(this));

    this.vibrationPatterns = {
      // director events
      deviation: [1000, 1000, 1000] as const,

      // mmaneuvers
      arrive: [1000] as const,
      depart: [1000] as const,

      // Right now we treat all maneuvers
      // as "turns"
      turn: [500] as const,

      // modifiers
      right: [100] as const,
      left: [100, 100, 100] as const,
      straight: [100, 100] as const,

      rightSharp: [100] as const,
      leftSharp: [100, 100, 100] as const,

      rightSlight: [100] as const,
      leftSlight: [100, 100, 100] as const,
    };
  }

  #onFinish() {
    this.vibrate(1000);
  }

  #onStep(step: Step) {
    switch (step.maneuver.type) {
      case "depart":
        return this.vibrate(this.vibrationPatterns.depart);
      case "arrive":
        return this.vibrate(this.vibrationPatterns.arrive);
      default:
        if (
          step.maneuver.modifier &&
          step.maneuver.modifier in this.vibrationPatterns
        ) {
          const modifierSignature =
            this.vibrationPatterns[step.maneuver.modifier];

          return this.vibrate([
            ...this.vibrationPatterns.turn,
            ...modifierSignature,
          ]);
        } else {
          throw new Error(
            `Unknown maneuver or modifier  - ${step.maneuver.type} - ${step.maneuver.modifier}`,
          );
        }
    }
  }

  #onRoute(route: Route<LineString>) {
    console.log("route", route);
  }

  #onDeviation() {
    this.vibrate(this.vibrationPatterns.deviation);
  }
}

export default Vibrator;
