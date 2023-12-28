import { mock, describe, test, beforeEach, afterEach } from "node:test";
import Vibrator from ".";
import Director from "../director";
import assert from "assert/strict";
import res from "../director/simple.res.json";
import { MockRouter } from "../router";

describe("vibrator", () => {
  const vibrate = mock.fn<(_: VibratePattern) => boolean>();
  const steps = res.routes[0].legs[0].steps;
  let director: Director;
  let vibrator: Vibrator;

  beforeEach(() => {
    director = new Director(new MockRouter());
    vibrator = new Vibrator(director, vibrate);
  });

  afterEach(() => {
    vibrate.mock.resetCalls();
  });

  test("deviation", () => {
    director.emit("deviation");

    assert.strictEqual(
      vibrate.mock.calls[0].arguments[0],
      vibrator.vibrationPatterns.deviation,
    );
  });

  test("departing", () => {
    director.emit("step", steps.at(0));

    assert.deepEqual(
      vibrate.mock.calls[0].arguments[0],
      vibrator.vibrationPatterns.depart,
    );
  });

  test("arriving", () => {
    director.emit("step", steps.at(-1));

    assert.deepEqual(
      vibrate.mock.calls[0].arguments[0],
      vibrator.vibrationPatterns.arrive,
    );
  });

  test("turn left", () => {
    director.emit("step", steps.at(1));

    assert.deepEqual(vibrate.mock.calls[0].arguments[0], [
      ...vibrator.vibrationPatterns.turn,
      ...vibrator.vibrationPatterns.left,
    ]);
  });

  test("turn right", () => {
    director.emit("step", steps.at(1));

    assert.deepEqual(vibrate.mock.calls[0].arguments[0], [
      ...vibrator.vibrationPatterns.turn,
      ...vibrator.vibrationPatterns.left,
    ]);
  });
});
