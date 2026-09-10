"use client";

import * as React from "react";

/** Anything that is not a finite, positive count of seconds is nothing to count. */
function normalise(durationInSeconds: number) {
  return Number.isFinite(durationInSeconds) ? Math.max(0, Math.floor(durationInSeconds)) : 0;
}

/**
 * How often the remaining time is recomputed from the deadline.
 *
 * Four times a second rather than once, and it costs nothing: the tick recomputes
 * `remaining` and returns the state object unchanged when the whole second has not
 * turned over, so React re-renders about once a second either way. What the extra
 * polls buy is the boundary — a deadline that falls between two ticks is drawn late by
 * at most 250ms instead of at most a second.
 */
const TICK_MS = 250;

/**
 * Whole seconds left at a given millisecond remainder.
 *
 * `ceil`, not `floor`: with 89,999ms left there is still some of the 90th second to
 * run, and a countdown that reads `89` while 89.999 seconds remain is a second fast for
 * its whole life. It reaches `0` exactly at the deadline and not before.
 */
const secondsLeft = (remainingMs: number) => Math.max(0, Math.ceil(remainingMs / 1000));

type UseCountdownOptions = {
  /**
   * Whether the countdown is running. `false` pauses it where it is; starting at
   * `false` is how a countdown waits for an event before it begins.
   */
  running?: boolean;
  /** Changing this restarts the countdown, even at the duration it is already counting. */
  runId?: string | number;
  /** Called once, when a countdown that actually ran reaches zero. */
  onEnd?: () => void;
};

/**
 * Counts a number of seconds down to zero and calls back when it gets there.
 *
 * **It counts a deadline down, not its own ticks.** Each tick recomputes what is left
 * from a `Date.now()` deadline rather than subtracting one from the last value, which
 * is the difference between a timer that is right and one that is merely usually right:
 * `setInterval` drifts under load, and a browser throttles it to about once a minute in
 * a hidden tab. Subtracting per tick, a five-minute countdown left in a background tab
 * comes back minutes slow and fires `onEnd` late; counting a deadline down, it comes
 * back correct on the first tick after the tab is shown again.
 *
 * The interval is therefore only a repaint pulse. It is also the one thing here that
 * genuinely lives outside React, which is why it is the only thing in an effect — the
 * countdown *restarting* is derived from the arguments, so it happens during render via
 * the state-adjustment pattern rather than in an effect that would let one frame paint
 * the previous countdown's value first.
 *
 * @param durationInSeconds - Seconds to count down from. Changing it to a *different*
 * value restarts the countdown; a non-finite or negative value is treated as `0`.
 * Handing it the value it is already counting does nothing, which is what keeps a
 * parent that re-renders every second from freezing the countdown at its start — pass
 * `runId` to replay the same duration.
 * @param options - `running`, `runId` and `onEnd`; see {@link UseCountdownOptions}.
 * @returns The seconds remaining, never below zero.
 */
export function useCountdown(
  durationInSeconds: number,
  { running = true, runId, onEnd }: UseCountdownOptions = {},
): number {
  const target = normalise(durationInSeconds);

  // What identifies *this* run. An object rather than two pieces of state because the
  // effect below depends on it by identity: one new object per restart is one
  // re-arming, whichever of the two changed.
  const [run, setRun] = React.useState({ target, runId });

  // Whole seconds, and the only thing here that is state — it is the only thing that
  // gets drawn. The deadline and the exact remainder are the mechanism, and mechanism
  // in state would mean an effect writing it, which is a render React did not need.
  const [remaining, setRemaining] = React.useState(target);

  // Exactly what is left, in milliseconds, and which run it belongs to. Written by the
  // tick and by the cleanup that ends a run, read when a run is armed — so a pause
  // resumes from the fraction of a second it landed in rather than from the top of that
  // second. It is a ref because nothing draws it, and it carries its run so that the
  // effect can tell a resumed countdown from a fresh one without being told.
  const leftRef = React.useRef({ run, remainingMs: target * 1000 });

  if (run.target !== target || run.runId !== runId) {
    setRun({ target, runId });
    setRemaining(target);
  }

  // The callback is read through a ref so that a caller passing an inline arrow —
  // which is most of them — does not tear down and rebuild the interval on every
  // render of their component.
  const onEndRef = React.useRef(onEnd);
  React.useEffect(() => {
    onEndRef.current = onEnd;
  });

  const ticking = running && remaining > 0;

  React.useEffect(() => {
    // A restart is the one thing that discards the remainder rather than continuing
    // from it. Done here rather than beside the `setRemaining` above because a ref
    // written during render is a value the next render cannot be trusted to have seen —
    // and it has to happen even when the countdown is not ticking, so that a restart
    // while paused resumes from the top rather than from the old run's leftovers.
    if (leftRef.current.run !== run) leftRef.current = { run, remainingMs: run.target * 1000 };

    if (!ticking) return;

    // The deadline is a local, not state: it is derived once when the run is armed and
    // only the interval below reads it, so putting it in state would buy an extra
    // render and a way for the two to disagree.
    const endsAt = Date.now() + leftRef.current.remainingMs;

    const id = setInterval(() => {
      const left = Math.max(0, endsAt - Date.now());
      leftRef.current.remainingMs = left;

      // Called four times a second and re-renders about once: React bails out when the
      // value is identical, and the whole second has not turned over on three of them.
      setRemaining(secondsLeft(left));
    }, TICK_MS);

    return () => {
      clearInterval(id);
      // This runs on a pause and on arriving at zero alike — both are the run ending —
      // so freezing the remainder here is what a resume continues from.
      leftRef.current.remainingMs = Math.max(0, endsAt - Date.now());
    };
    // `run` is in here so a restart re-arms the deadline. Without it a countdown
    // restarted while already running would keep the interval it had, counting to the
    // previous run's deadline.
  }, [ticking, run]);

  const ended = run.target > 0 && remaining === 0;

  React.useEffect(() => {
    if (!ended) return;
    onEndRef.current?.();
    // `run` is in here so a restart re-arms the callback: without it, a second
    // countdown finishing at the same `ended` value would not fire again.
  }, [ended, run]);

  return remaining;
}

export type { UseCountdownOptions };
