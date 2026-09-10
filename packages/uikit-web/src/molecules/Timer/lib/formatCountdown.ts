/** The three zero-padded segments a `Timer` draws, plus the machine-readable duration. */
export type CountdownParts = {
  hours: string;
  minutes: string;
  seconds: string;
  /** An ISO 8601 duration for `<time dateTime>`, e.g. `PT1H2M3S`. */
  dateTime: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Splits a number of seconds into `HH`, `MM` and `SS`.
 *
 * Hours are not wrapped at 24: a two-day countdown reads `48:00:00` rather than
 * starting over, because the component's job is to say how much is left, and a
 * timer that silently loses a day is worse than a wide one. `padStart` only ever
 * pads, so three-digit hours pass through intact.
 *
 * Anything that is not a finite, positive number is zero — `NaN`, `Infinity`, a
 * negative that a caller's arithmetic overshot. A countdown cannot run backwards,
 * and clamping here is what lets the component render at all rather than drawing
 * `-1:-1:-1` while someone works out where the bad number came from.
 *
 * @param totalSeconds - Seconds remaining. Fractions are floored.
 */
export function formatCountdown(totalSeconds: number): CountdownParts {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    dateTime: `PT${hours}H${minutes}M${seconds}S`,
  };
}
