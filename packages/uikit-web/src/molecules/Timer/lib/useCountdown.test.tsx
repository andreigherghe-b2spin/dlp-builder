import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useCountdown } from "@/molecules/Timer/lib/useCountdown";

// `act` is what flushes the state update the faked interval schedules. React only
// honours it when the environment says it is a test one, and browser mode does not
// set that flag for us the way a jsdom preset would.
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The interval APIs the hook touches, plus `Date` — which is the clock the hook counts
// its deadline down against, so advancing the timers without it would fire the ticks
// into a countdown that never moves. `renderHook` and React's own scheduling run on
// promises and `setTimeout`, and those stay real: replacing the whole clock would
// deadlock the render rather than speed it up.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Advances the faked clock and lets React flush what the interval scheduled. */
const tick = (seconds: number) =>
  act(async () => {
    vi.advanceTimersByTime(seconds * 1000);
    // Lets the state updates the interval just queued settle before `act` returns.
    await Promise.resolve();
  });

type Props = { duration: number; running?: boolean; runId?: string | number };

const mount = (durationInSeconds: number, onEnd?: () => void) =>
  renderHook(
    (props?: Props) =>
      useCountdown(props?.duration ?? durationInSeconds, {
        onEnd,
        runId: props?.runId,
        running: props?.running,
      }),
    { initialProps: { duration: durationInSeconds } },
  );

/** Re-renders the hook with new props and lets the adjustment settle. */
const update = (rerender: (props: Props) => unknown, props: Props) =>
  act(async () => {
    await rerender(props);
  });

describe("counting down", () => {
  it("starts at the duration it was given", async () => {
    const { result } = await mount(90);

    expect(result.current).toBe(90);
  });

  it("loses one second per second", async () => {
    const { result } = await mount(3);

    await tick(1);
    expect(result.current).toBe(2);

    await tick(2);
    expect(result.current).toBe(0);
  });

  it("stops at zero rather than going negative", async () => {
    const { result } = await mount(1);

    await tick(5);

    expect(result.current).toBe(0);
  });
});

describe("reaching zero", () => {
  it("calls back once, not once per tick after", async () => {
    const onEnd = vi.fn();
    await mount(2, onEnd);

    await tick(2);
    expect(onEnd).toHaveBeenCalledTimes(1);

    await tick(5);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("does not call back while there is time left", async () => {
    const onEnd = vi.fn();
    await mount(10, onEnd);

    await tick(9);

    expect(onEnd).not.toHaveBeenCalled();
  });

  it("never ends a countdown that never ran", async () => {
    const onEnd = vi.fn();
    const { result } = await mount(0, onEnd);

    await tick(3);

    // A caller whose data has not arrived yet passes 0. Firing on mount would tell
    // them a promotion had expired before they knew when it started.
    expect(result.current).toBe(0);
    expect(onEnd).not.toHaveBeenCalled();
  });
});

describe("being given a new duration", () => {
  it("restarts from it instead of continuing the old count", async () => {
    const { result, rerender } = await mount(10);

    await tick(4);
    expect(result.current).toBe(6);

    await update(rerender, { duration: 30 });

    expect(result.current).toBe(30);
  });

  it("re-arms the callback, so a second countdown ends too", async () => {
    const onEnd = vi.fn();
    const { rerender } = await mount(1, onEnd);

    await tick(1);
    expect(onEnd).toHaveBeenCalledTimes(1);

    await update(rerender, { duration: 2 });
    await tick(2);

    expect(onEnd).toHaveBeenCalledTimes(2);
  });

  it("does nothing when handed the duration it is already counting", async () => {
    const onEnd = vi.fn();
    const { result, rerender } = await mount(10, onEnd);

    await tick(4);
    await update(rerender, { duration: 10 });

    // Same props, same state — a re-render is not an instruction to start over, so a
    // parent that re-renders every second does not freeze the countdown at 10. To
    // replay an identical countdown, remount with a `key`.
    expect(result.current).toBe(6);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("treats a value that is not a positive finite number as zero", async () => {
    const { result, rerender } = await mount(10);

    await update(rerender, { duration: -5 });
    expect(result.current).toBe(0);

    await update(rerender, { duration: Number.NaN });
    expect(result.current).toBe(0);
  });

  it("floors a fractional duration", async () => {
    const { result } = await mount(2.7);

    expect(result.current).toBe(2);
  });
});

describe("being unmounted", () => {
  it("leaves no interval running", async () => {
    const onEnd = vi.fn();
    const { unmount } = await mount(60, onEnd);

    expect(vi.getTimerCount()).toBe(1);

    await unmount();

    expect(vi.getTimerCount()).toBe(0);

    // And the callback cannot arrive late for a component nobody is rendering.
    vi.advanceTimersByTime(120_000);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("holds no interval once the countdown has finished", async () => {
    await mount(1);

    await tick(1);

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("being paused", () => {
  it("holds where it is while running is false", async () => {
    const { result, rerender } = await mount(10);

    await tick(4);
    expect(result.current).toBe(6);

    await update(rerender, { duration: 10, running: false });
    await tick(30);

    expect(result.current).toBe(6);
  });

  it("holds no interval while paused", async () => {
    const { rerender } = await mount(10);

    await update(rerender, { duration: 10, running: false });

    expect(vi.getTimerCount()).toBe(0);
  });

  it("carries on from where it stopped rather than restarting", async () => {
    const { result, rerender } = await mount(10);

    await tick(4);
    await update(rerender, { duration: 10, running: false });
    await tick(30);
    await update(rerender, { duration: 10, running: true });

    expect(result.current).toBe(6);

    await tick(2);
    expect(result.current).toBe(4);
  });

  it("does not end a countdown that was paused before it got there", async () => {
    const onEnd = vi.fn();
    const { rerender } = await mount(3, onEnd);

    await update(rerender, { duration: 3, running: false });
    await tick(60);

    expect(onEnd).not.toHaveBeenCalled();
  });
});

describe("starting later than it mounts", () => {
  it("sits at its full duration until running turns true", async () => {
    const { result, rerender } = await mount(45);

    await update(rerender, { duration: 45, running: false });
    await tick(20);
    expect(result.current).toBe(45);

    await update(rerender, { duration: 45, running: true });
    await tick(5);

    expect(result.current).toBe(40);
  });
});

describe("being told to run again with runId", () => {
  it("restarts a duration it is already counting", async () => {
    const { result, rerender } = await mount(10);

    await tick(4);
    expect(result.current).toBe(6);

    // The same `duration`, which on its own is deliberately not a restart.
    await update(rerender, { duration: 10, runId: "second" });

    expect(result.current).toBe(10);
  });

  it("re-arms the callback for a countdown that had already ended", async () => {
    const onEnd = vi.fn();
    const { rerender } = await mount(1, onEnd);

    await tick(1);
    expect(onEnd).toHaveBeenCalledTimes(1);

    await update(rerender, { duration: 1, runId: 2 });
    await tick(1);

    expect(onEnd).toHaveBeenCalledTimes(2);
  });

  it("keeps counting when handed the runId it already has", async () => {
    const { result, rerender } = await mount(10);

    await tick(4);
    await update(rerender, { duration: 10, runId: "same" });
    expect(result.current).toBe(10);

    await tick(3);
    await update(rerender, { duration: 10, runId: "same" });

    // The second re-render is the same run, so it is not a restart — this is what a
    // parent re-rendering every second does, and it must not freeze the countdown.
    expect(result.current).toBe(7);
  });
});

describe("keeping time rather than counting ticks", () => {
  it("catches up after the interval was throttled, instead of running slow", async () => {
    const { result } = await mount(60);

    // What a background tab does: the clock moves 30 seconds while the interval fires
    // almost none of the times it should have. `setSystemTime` moves the clock without
    // running any timer, so this is the throttling rather than a simulation of it — and
    // then one tick is allowed through. A countdown subtracting one per tick would read
    // 59 here; one counting a deadline down reads the truth on the first tick it gets.
    await act(async () => {
      vi.setSystemTime(Date.now() + 30_000);
      vi.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(result.current).toBe(30);
  });
});
