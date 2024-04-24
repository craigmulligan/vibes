import Director, { Location } from "./";
import res from "./simple.res.json";
import reroutedResponse from "./rerouted.res.json";
import steps from "./simple.steps.json";
import multiSkipSteps from "./multi-and-skip.steps.json";
import reroutedSteps from "./rerouted.steps.json";
import assert from "assert/strict";
import { mock, describe, test, beforeEach } from "node:test";
import { MockRouter, RouterResponse } from "../router";

let d: Director;
let r: MockRouter;
const onStepCallback = mock.fn();
const onRouteCallback = mock.fn();
const onFinishCallback = mock.fn();
const onDeviationCallback = mock.fn();
const getLatestStep = (n = 0) => {
  // get last element of array
  const lastCall = onStepCallback.mock.calls.at(-1);
  return lastCall ? lastCall.arguments[n] : undefined;
};

beforeEach(() => {
  r = new MockRouter();
  // @ts-ignore
  r.setResponse(res as RouterResponse);

  d = new Director(r);
  d.on("step", onStepCallback);
  d.on("finish", onFinishCallback);
  d.on("route", onRouteCallback);
  d.on("deviation", onDeviationCallback);
});

beforeEach(() => {
  onStepCallback.mock.resetCalls();
  onFinishCallback.mock.resetCalls();
  onRouteCallback.mock.resetCalls();
  onDeviationCallback.mock.resetCalls();
});

describe("routing", () => {
  test("should handle simple route", async () => {
    await d.updateLocation([-118.506001, 34.022483]);
    await d.navigate([-118.490471, 34.01714]);

    const coords = steps.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates) as Location[];

    for (const coord of coords) {
      d.updateLocation(coord);
    }

    assert.strictEqual(
      onStepCallback.mock.callCount(),
      res.routes[0].legs[0].steps.length,
    );

    assert.strictEqual(onFinishCallback.mock.callCount(), 1);
    assert.strictEqual(onDeviationCallback.mock.callCount(), 0);
  });

  test("should handle route with skipped locations", async () => {
    await d.updateLocation([-118.506001, 34.022483]);
    await d.navigate([-118.490471, 34.01714]);
    // this test cases has multipe locations per line segment and
    // in some cases doesn't have a location within lead distance of a manuever
    const routeSteps = res.routes[0].legs[0].steps;

    const coords = multiSkipSteps.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates) as Location[];

    d.updateLocation(coords[0]);
    // should emit the departure step
    assert.strictEqual(onStepCallback.mock.callCount(), 1);
    assert.strictEqual(getLatestStep().name, routeSteps[0].name);
    d.updateLocation(coords[1]);
    assert.strictEqual(onStepCallback.mock.callCount(), 1);
    d.updateLocation(coords[2]);
    assert.strictEqual(onStepCallback.mock.callCount(), 2);
    assert.strictEqual(getLatestStep().name, routeSteps[1].name);
    d.updateLocation(coords[3]);
    assert.strictEqual(onStepCallback.mock.callCount(), 2);
    d.updateLocation(coords[4]);
    assert.strictEqual(onStepCallback.mock.callCount(), 2);
    // // Now we skip over the manuever and are in the next
    // // line segment so we should skip step 1
    d.updateLocation(coords[5]);
    d.updateLocation(coords[6]);
    d.updateLocation(coords[7]);
    d.updateLocation(coords[8]);
    assert.strictEqual(onStepCallback.mock.callCount(), 3);
    assert.strictEqual(onFinishCallback.mock.callCount(), 1);
  });

  test("should handle re-routing", async () => {
    await d.updateLocation([-118.506001, 34.022483]);
    await d.navigate([-118.490471, 34.01714]);
    // go two location points.
    // then go off course
    // then it should call router.getRoute
    // and emit another `route` event.
    const routeSteps = res.routes[0].legs[0].steps;
    const newRouteSteps = reroutedResponse.routes[0].legs[0].steps;

    const coords = reroutedSteps.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates) as Location[];

    d.updateLocation(coords[0]);
    // should emit the departure step
    assert.strictEqual(onStepCallback.mock.callCount(), 1);
    assert.strictEqual(getLatestStep().name, routeSteps[0].name);
    d.updateLocation(coords[1]);
    // should emit the departure step
    assert.strictEqual(onStepCallback.mock.callCount(), 2);
    assert.strictEqual(getLatestStep().name, routeSteps[1].name);

    // Now we go off route
    // First set the router to the new response
    // @ts-ignore
    r.setResponse(reroutedResponse as RouterResponse);
    await d.updateLocation(coords[2]);
    // Check we have notifed a new route.
    assert.strictEqual(onDeviationCallback.mock.callCount(), 1);
    assert.strictEqual(onRouteCallback.mock.callCount(), 2);
    assert.strictEqual(onStepCallback.mock.callCount(), 3);
    assert.strictEqual(getLatestStep().name, newRouteSteps[0].name);
    // there are a couple stange "continue" dirctions but we should skip those
    // so we are now on diration index 3
    await d.updateLocation(coords[3]);
    assert.strictEqual(onStepCallback.mock.callCount(), 4);
    assert.strictEqual(
      getLatestStep().maneuver.instruction,
      newRouteSteps[3].maneuver.instruction,
    );

    // Drop the remained of the points.
    d.updateLocation(coords[4]);
    d.updateLocation(coords[5]);
    d.updateLocation(coords[6]);
    d.updateLocation(coords[7]);
    d.updateLocation(coords[8]);

    assert.strictEqual(onFinishCallback.mock.callCount(), 1);
    assert.strictEqual(onStepCallback.mock.callCount(), 5);
  });
});
