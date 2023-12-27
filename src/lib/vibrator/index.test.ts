import { mock, describe, test, beforeEach } from "node:test";
import Vibrator from ".";
import Director from "../director";
import assert from "assert/strict";
import { MockRouter } from "../router";

describe("vibrator", () => {
  const vibrate = mock.fn<(_: VibratePattern) => boolean>();
  let director: Director;
  let vibrator: Vibrator;

  beforeEach(() => {
    director = new Director(new MockRouter());
    vibrator = new Vibrator(director, vibrate);
  });

  test("should handle on 'deviation'", () => {
    director.emit("deviation");

    assert.strictEqual(
      vibrate.mock.calls[0].arguments[0],
      vibrator.vibrationPatterns.deviation,
    );
  });
});
