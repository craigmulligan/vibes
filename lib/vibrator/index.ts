import { Step, Route } from "@mapbox/mapbox-sdk/services/directions";
import Director from "../director";
import { Vibration } from "react-native";
import { LineString } from "@turf/turf";

const wait = 500;

class Vibrator {
  vibrate: Window["navigator"]["vibrate"] | Vibration["vibrate"];
  director: Director;
  vibrationPatterns: Record<string, number[]>;

  constructor(director: Director, vibrate: Vibration["vibrate"]) {
    this.vibrate = vibrate;
    this.director = director;
    // setup event listeners
    this.director.on("step", this.#onStep.bind(this));
    this.director.on("deviation", this.#onDeviation.bind(this));

    this.vibrationPatterns = {
      // director events
      deviation: [1000, 1000, 1000, 1000, 1000, 1000] as const,

      // maneuvers
      arrive: [wait, 2000] as const,
      depart: [wait, 2000] as const,

      // Right now we treat all maneuvers
      // as "turns"
      turn: [wait, 1000] as const,

      // modifiers
      right: [wait * 2, 200] as const,
      left: [wait * 2, 200, wait, 200, wait, 200] as const,
      straight: [wait * 2, 200, wait, 200] as const,

      rightSharp: [wait * 2, 200] as const,
      leftSharp: [wait * 2, 200, wait, 200, wait, 200] as const,

      rightSlight: [wait * 2, 200] as const,
      leftSlight: [wait * 2, 200, wait, 200, wait, 200] as const,
    } as const;
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

  #onDeviation() {
    this.vibrate(this.vibrationPatterns.deviation);
  }
}

export default Vibrator;
