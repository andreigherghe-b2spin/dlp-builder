import { describe, expect, it } from "vitest";

import { formatCountdown } from "@/molecules/Timer/lib/formatCountdown";

describe("splitting seconds into HH:MM:SS", () => {
  it("pads every segment to two digits", () => {
    expect(formatCountdown(0)).toMatchObject({ hours: "00", minutes: "00", seconds: "00" });
    expect(formatCountdown(9)).toMatchObject({ hours: "00", minutes: "00", seconds: "09" });
    expect(formatCountdown(61)).toMatchObject({ hours: "00", minutes: "01", seconds: "01" });
  });

  it("carries seconds into minutes and minutes into hours", () => {
    expect(formatCountdown(3600)).toMatchObject({ hours: "01", minutes: "00", seconds: "00" });
    expect(formatCountdown(3661)).toMatchObject({ hours: "01", minutes: "01", seconds: "01" });
    expect(formatCountdown(86_399)).toMatchObject({ hours: "23", minutes: "59", seconds: "59" });
  });

  it("lets hours run past a day rather than wrapping", () => {
    // A two-day countdown that read 00:00:00 would be losing a day silently.
    expect(formatCountdown(172_800)).toMatchObject({ hours: "48", minutes: "00", seconds: "00" });
    expect(formatCountdown(360_000)).toMatchObject({ hours: "100", minutes: "00", seconds: "00" });
  });

  it("floors fractions instead of rounding up to a second that has not passed", () => {
    expect(formatCountdown(1.9)).toMatchObject({ seconds: "01" });
  });

  it("treats anything that is not a positive finite number as zero", () => {
    for (const value of [-1, -3600, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(formatCountdown(value)).toMatchObject({
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
    }
  });

  it("emits an ISO 8601 duration for <time dateTime>, unpadded", () => {
    expect(formatCountdown(3661).dateTime).toBe("PT1H1M1S");
    expect(formatCountdown(0).dateTime).toBe("PT0H0M0S");
  });
});
