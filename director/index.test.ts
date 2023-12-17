import Director, { Location } from "./";
import res from "./simple.res.json";
import steps from "./simple.steps.json";
import multiSkipSteps from "./multi-and-skip.steps.json";
import assert from "assert/strict";
import { mock, describe, test, beforeEach } from "node:test";

let d: Director;

beforeEach(() => {
  d = new Director(res as any, { location: [-118.506001, 34.022483] });
});

describe("routing", () => {
  test("should handle simple route", () => {
    const stepCallback = mock.fn();
    const finishCallback = mock.fn();
    d.on("step", stepCallback);
    d.on("finish", finishCallback);

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

    assert.strictEqual(finishCallback.mock.callCount(), 1);
  });

  test("should handle route with skipped locations", () => {
    // this test cases has multipe locations per line segment and
    // in some cases doesn't have a location within lead distance of a manuever
    const stepCallback = mock.fn();
    const finishCallback = mock.fn();
    d.on("step", stepCallback);
    d.on("finish", finishCallback);

    const routeSteps = res.routes[0].legs[0].steps;

    const coords = multiSkipSteps.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates) as Location[];

    const getLatestCallArg = (n = 0) => {
      // get last element of array
      const lastCall = stepCallback.mock.calls.at(-1);
      return lastCall ? lastCall.arguments[n] : undefined;
    };

    d.updateLocation(coords[0]);
    // should emit the departure step
    assert.strictEqual(stepCallback.mock.callCount(), 1);
    assert.strictEqual(getLatestCallArg().name, routeSteps[0].name);
    d.updateLocation(coords[1]);
    assert.strictEqual(stepCallback.mock.callCount(), 1);
    d.updateLocation(coords[2]);
    assert.strictEqual(stepCallback.mock.callCount(), 2);
    assert.strictEqual(getLatestCallArg().name, routeSteps[1].name);
    d.updateLocation(coords[3]);
    assert.strictEqual(stepCallback.mock.callCount(), 2);
    d.updateLocation(coords[4]);
    assert.strictEqual(stepCallback.mock.callCount(), 2);
    // // Now we skip over the manuever and are in the next
    // // line segment so we should skip step 1
    d.updateLocation(coords[5]);
    d.updateLocation(coords[6]);
    d.updateLocation(coords[7]);
    d.updateLocation(coords[8]);
    assert.strictEqual(stepCallback.mock.callCount(), 3);
    assert.strictEqual(finishCallback.mock.callCount(), 1);
  });
});
