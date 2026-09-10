import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Timer } from "@/molecules/Timer";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// See `../lib/useCountdown.test.tsx` — the interval APIs and `Date`, which is the clock
// the countdown measures its deadline against. React's own scheduling and the browser
// locators run on `setTimeout` and promises, and those keep their real clock.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

const tick = (seconds: number) =>
  act(async () => {
    vi.advanceTimersByTime(seconds * 1000);
    // Lets the state updates the interval just queued settle before `act` returns.
    await Promise.resolve();
  });

async function mount(props: Partial<React.ComponentProps<typeof Timer>> = {}) {
  const view = await render(
    <Timer data-testid="timer" durationInSeconds={0} aria-label="Ends in" {...props} />,
  );
  // Scoped to this render: `page.getByTestId` searches the whole document, which is
  // shared by every test in the file.
  const within = page.elementLocator(view.container);

  return {
    ...view,
    within,
    root: within.getByTestId("timer"),
    hours: within.getByTestId("timer-hours"),
    minutes: within.getByTestId("timer-minutes"),
    seconds: within.getByTestId("timer-seconds"),
  };
}

describe("drawing the remaining time", () => {
  it("splits it into three padded segments", async () => {
    const { hours, minutes, seconds } = await mount({ durationInSeconds: 3661 });

    await expect.element(hours).toHaveTextContent("01");
    await expect.element(minutes).toHaveTextContent("01");
    await expect.element(seconds).toHaveTextContent("01");
  });

  it("reads as HH:MM:SS in the document", async () => {
    const { root } = await mount({ durationInSeconds: 45 });

    await expect.element(root).toHaveTextContent("00:00:45");
  });

  it("carries the duration in a machine-readable dateTime", async () => {
    const { root } = await mount({ durationInSeconds: 3661 });

    // The three spans are digits; this is the part a parser can use.
    await expect.element(root).toHaveAttribute("datetime", "PT1H1M1S");
  });

  it("puts the caller's label and the remaining time in one accessible name", async () => {
    const { root } = await mount({
      durationInSeconds: 60,
      "aria-label": "Time left in this promotion",
    });

    // `role="timer"` takes its name from the author only, so the digits inside are not
    // part of it. Without the value appended, a screen reader arriving here would say
    // what is ending and never how long is left.
    await expect.element(root).toHaveAccessibleName("Time left in this promotion 00:01:00");
  });

  it("keeps the value in the name as it runs", async () => {
    const { root } = await mount({ durationInSeconds: 60, "aria-label": "Ends in" });

    await tick(5);

    await expect.element(root).toHaveAccessibleName("Ends in 00:00:55");
  });

  it("is named by the time alone when the caller named nothing", async () => {
    const view = await render(<Timer durationInSeconds={45} />);
    const within = page.elementLocator(view.container);

    await expect.element(within.getByRole("timer")).toHaveAccessibleName("00:00:45");
  });
});

describe("running", () => {
  it("counts down a second at a time", async () => {
    const { root } = await mount({ durationInSeconds: 62 });

    await expect.element(root).toHaveTextContent("00:01:02");

    await tick(3);

    await expect.element(root).toHaveTextContent("00:00:59");
  });

  it("holds at zero and tells the caller once", async () => {
    const onEnd = vi.fn();
    const { root } = await mount({ durationInSeconds: 2, onEnd });

    await tick(2);
    await expect.element(root).toHaveTextContent("00:00:00");
    expect(onEnd).toHaveBeenCalledTimes(1);

    await tick(10);
    await expect.element(root).toHaveTextContent("00:00:00");
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("restarts when pointed at a new duration", async () => {
    const { root, rerender } = await mount({ durationInSeconds: 10 });

    await tick(4);
    await expect.element(root).toHaveTextContent("00:00:06");

    await act(async () => {
      await rerender(<Timer aria-label="Ends in" data-testid="timer" durationInSeconds={120} />);
    });

    await expect.element(root).toHaveTextContent("00:02:00");
  });
});

describe("its parts", () => {
  it("names nothing when the caller named nothing", async () => {
    const view = await render(<Timer durationInSeconds={30} aria-label="Ends in" />);
    const within = page.elementLocator(view.container);

    // `createTestIdFor` returns undefined for every part without a base, so an
    // unnamed timer puts no test-only attributes into a consumer's DOM — while the
    // timer itself is still there to be found by role.
    expect(within.getByTestId("timer-hours").elements()).toHaveLength(0);
    await expect.element(within.getByRole("timer")).toHaveTextContent("00:00:30");
  });

  it("keeps the caller's classes on the pill", async () => {
    const { root } = await mount({ durationInSeconds: 30, className: "w-40" });

    await expect.element(root).toHaveClass("w-40");
  });
});

describe("starting later than it mounts", () => {
  it("holds at its full duration, then runs to zero and calls back once it is started", async () => {
    const onEnd = vi.fn();
    const { root, rerender } = await mount({ durationInSeconds: 3, onEnd, running: false });

    // Mounted paused, and asserted over a stretch far longer than the countdown
    // itself: the pill sits on screen at its full duration rather than appearing when
    // the round does, which is why one prop is both the pause and the delayed start.
    await tick(30);
    await expect.element(root).toHaveTextContent("00:00:03");
    expect(onEnd).not.toHaveBeenCalled();

    await act(async () => {
      await rerender(
        <Timer
          aria-label="Ends in"
          data-testid="timer"
          durationInSeconds={3}
          onEnd={onEnd}
          running
        />,
      );
    });
    await tick(3);

    // The whole journey in one test, because the three halves fail in different ways:
    // a start that counts from the wrong place, one that never reaches zero, and one
    // that reaches it without telling the caller.
    await expect.element(root).toHaveTextContent("00:00:00");
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("being paused", () => {
  it("holds its digits while running is false", async () => {
    const { root, rerender } = await mount({ durationInSeconds: 30 });

    await tick(4);
    await expect.element(root).toHaveTextContent("00:00:26");

    await act(async () => {
      await rerender(
        <Timer aria-label="Ends in" data-testid="timer" durationInSeconds={30} running={false} />,
      );
    });
    await tick(60);

    await expect.element(root).toHaveTextContent("00:00:26");
  });

  it("resumes from where it stopped", async () => {
    const { root, rerender } = await mount({ durationInSeconds: 30, running: false });

    await tick(10);
    await expect.element(root).toHaveTextContent("00:00:30");

    await act(async () => {
      await rerender(
        <Timer aria-label="Ends in" data-testid="timer" durationInSeconds={30} running />,
      );
    });
    await tick(3);

    await expect.element(root).toHaveTextContent("00:00:27");
  });

  it("does not call back for a countdown held short of zero", async () => {
    const onEnd = vi.fn();
    const { root, rerender } = await mount({ durationInSeconds: 5, onEnd });

    await tick(4);
    await expect.element(root).toHaveTextContent("00:00:01");

    await act(async () => {
      await rerender(
        <Timer
          aria-label="Ends in"
          data-testid="timer"
          durationInSeconds={5}
          onEnd={onEnd}
          running={false}
        />,
      );
    });
    await tick(60);

    // A second short of zero, and held there. `onEnd` is the promotion expiring or the
    // round closing — a paused countdown has done neither, and a callback that fired
    // here would refetch or submit behind a timer the page deliberately stopped.
    await expect.element(root).toHaveTextContent("00:00:01");
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("freezes the machine-readable value along with the digits", async () => {
    const { root, rerender } = await mount({ durationInSeconds: 90 });

    await tick(30);
    await act(async () => {
      await rerender(
        <Timer aria-label="Ends in" data-testid="timer" durationInSeconds={90} running={false} />,
      );
    });
    await tick(60);

    // Asserted next to the digits rather than instead of them: the three spans and the
    // `dateTime` are rendered from the same value, so a pause that stopped one and not
    // the other would pass a text-only check while lying to every parser.
    await expect.element(root).toHaveAttribute("datetime", "PT0H1M0S");
    await expect.element(root).toHaveAccessibleName("Ends in 00:01:00");
  });

  it("puts neither running nor runId into the DOM", async () => {
    const { root } = await mount({ durationInSeconds: 30, runId: "first", running: false });

    // Neither is an attribute, so a `...props` that carried them would leave
    // `running="false"` on the element in every consumer's markup.
    await expect.element(root).not.toHaveAttribute("running");
    await expect.element(root).not.toHaveAttribute("runId");
  });
});

describe("running the same duration again", () => {
  it("restarts on a new runId, which the duration alone would not do", async () => {
    const { root, rerender } = await mount({ durationInSeconds: 30, runId: "first" });

    await tick(10);
    await expect.element(root).toHaveTextContent("00:00:20");

    await act(async () => {
      await rerender(
        <Timer aria-label="Ends in" data-testid="timer" durationInSeconds={30} runId="second" />,
      );
    });

    await expect.element(root).toHaveTextContent("00:00:30");
  });

  it("resets a paused countdown to the top and leaves it paused", async () => {
    const { root, rerender } = await mount({ durationInSeconds: 30, runId: "first" });

    await tick(10);
    await expect.element(root).toHaveTextContent("00:00:20");

    await act(async () => {
      await rerender(
        <Timer
          aria-label="Ends in"
          data-testid="timer"
          durationInSeconds={30}
          runId="second"
          running={false}
        />,
      );
    });

    // Restarting and pausing in one change. A restart discards the leftover remainder
    // rather than resuming from it, and that has to happen while the countdown is not
    // ticking too — otherwise starting this timer later would carry on from the
    // previous run's 20 seconds instead of its own 30.
    await expect.element(root).toHaveTextContent("00:00:30");
    await tick(30);
    await expect.element(root).toHaveTextContent("00:00:30");
  });

  it("re-arms the callback, so a second countdown ends too", async () => {
    const onEnd = vi.fn();
    const { root, rerender } = await mount({ durationInSeconds: 2, onEnd, runId: "first" });

    await tick(2);
    await expect.element(root).toHaveTextContent("00:00:00");
    expect(onEnd).toHaveBeenCalledTimes(1);

    await act(async () => {
      await rerender(
        <Timer
          aria-label="Ends in"
          data-testid="timer"
          durationInSeconds={2}
          onEnd={onEnd}
          runId="second"
        />,
      );
    });
    await tick(2);

    // Both halves matter. The timer is at zero either way, so a callback that only
    // fired for the first run would leave this reading `00:00:00` and look correct —
    // the count is what a resent code or a replayed round hangs off.
    await expect.element(root).toHaveTextContent("00:00:00");
    expect(onEnd).toHaveBeenCalledTimes(2);
  });
});
