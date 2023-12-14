import Director, { Location } from "./";
import res from "./simple.res.json";
import steps from "./simple.steps.json";
import assert from "assert/strict";
import { mock, describe, test, beforeEach } from "node:test";

let d: Director;

beforeEach(() => {
  d = new Director(res as any, { location: [-118.506001, 34.022483] });
});

describe("update Location", () => {
  test("should emit all steps until done", () => {
    const stepCallback = mock.fn();
    d.on("step", stepCallback);

    const coords = steps.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates) as Location[];

    for (const coord of coords) {
      d.updateLocation(coord);
    }

    assert.strictEqual(
      stepCallback.mock.callCount(),
      res.routes[0].legs[0].steps.length,
    );
  });

  // test("should only be called once when locations are near one another", () => {
  //   const cb = mock.fn();
  //   d.on("step", cb);
  //   d.updateLocation([-0.073446, 51.528247]);
  //   d.updateLocation([-0.073447, 51.528247]);

  //   assert.strictEqual(cb.mock.callCount(), 1);
  // });

  // test("should emit deviation event when user leaves route", () => {
  //   const cb = mock.fn();
  //   d.on("deviation", cb);
  //   d.updateLocation([-0.1, 51.528247]);

  //   assert.strictEqual(cb.mock.callCount(), 1);
  // });
});

// describe.only(".hasDeviated", () => {
//   test("should return true if current location is inside of route buffer", () => {
//     console.log("Heyo");
//     console.log(JSON.stringify(d.stepRoute));
//     assert.ok(d.hasDeviated());
//   });

//   test("should return false if current location is outside of route buffer", () => {
//     d.location = [-0.052848, 52.53507];
//     assert.strictEqual(d.hasDeviated(), false);
//   });
// });

// describe(".nextStep", () => {
//   test("should return the next closest step (forwards)", () => {
//     const step = d.nextStep();
//     assert.strictEqual(step.name, "Regent's Canal towpath");
//     d.location = [-0.073446, 51.528247];
//     const step2 = d.nextStep();
//     assert.strictEqual(step2.name, "Virginia Road");
//   });

//   test("should return the next step with regards to route bearing", () => {
//     const step = d.nextStep();
//     assert.strictEqual(step.name, "Regent's Canal towpath");
//     d.location = [-0.073446, 51.528247];
//     const step2 = d.nextStep();
//     assert.strictEqual(step2.name, "Virginia Road");
//   });
// });
