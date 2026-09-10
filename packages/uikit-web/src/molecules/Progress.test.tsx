import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Progress } from "@/molecules/Progress";

type ProgressProps = ComponentProps<typeof Progress>;

/**
 * Waits for the browser to have laid out what was just rendered.
 *
 * Not a duration in disguise — it is the difference between a transition running and
 * not running at all. `render` and `rerender` resolve on back-to-back microtasks, so
 * with no frame between them the browser computes style once and the fill is simply
 * born at its new width. No transition ran, so there is no `transitionend`, and
 * `onComplete` never fires. In a browser a person has always seen the previous width;
 * this is what puts the test in that position too.
 */
const painted = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

// `w-100` is 400px on the spacing scale — pinned so the ratios below land on round
// numbers, and written as a scale step rather than an arbitrary pixel value, because
// 400 is one.
async function mountProgress({ className = "w-100", ...props }: Partial<ProgressProps> = {}) {
  // One place builds the element, so `update` below changes a prop without every
  // caller restating the rest of them.
  const element = (next: Partial<ProgressProps> = {}) => (
    // The base every part derives its id from, so `progress-track`,
    // `progress-indicator`, `progress-text`, `progress-label` and `progress-value`
    // are what the DOM carries. `createTestIdFor` returns `undefined` for every part
    // without it, which the last test relies on.
    <Progress data-testid="progress" className={className} {...props} {...next} />
  );

  const view = await render(element());
  await painted();
  // Scoped to this render: `getByTestId` otherwise searches the whole page, which
  // is shared by every test in the file.
  const within = page.elementLocator(view.container);

  // The `role="progressbar"` is the root — the column holding the text row and the
  // bar — and no longer the bar itself, so the two are separate accessors: every ARIA
  // assertion belongs on the root, every measurement on the bar.
  const root = () => within.getByRole("progressbar").element() as HTMLElement;
  const track = () => within.getByTestId("progress-track").element() as HTMLElement;
  const fill = () => within.getByTestId("progress-indicator").element() as HTMLElement;
  const row = () => within.getByTestId("progress-text");
  const label = () => within.getByTestId("progress-label");
  const percent = () => within.getByTestId("progress-value");

  /**
   * How much of the bar the fill covers, which is the whole of "the value is
   * shown". Measured against `clientWidth` rather than the bounding box because the
   * fill is positioned against the bar's padding box — the border sits outside it,
   * and its width comes from a brand token this runtime deliberately does not load.
   */
  const fillRatio = () => fill().getBoundingClientRect().width / track().clientWidth;

  const states = () => [root().dataset.state, fill().dataset.state];

  /**
   * Re-renders in place, then lets the frame through. Never a second `render` in the
   * same test: two of those overlap React's `act()`, and the warning that follows is
   * the mild symptom — the page is shared by the whole file, so the tests after it
   * mount into nothing.
   */
  const update = async (next: Partial<ProgressProps>) => {
    await view.rerender(element(next));
    await painted();
  };

  return { view, within, root, track, fill, fillRatio, row, label, percent, states, update };
}

describe("reporting a value", () => {
  it("exposes the value to assistive technology", async () => {
    const { root } = await mountProgress({ value: 40 });

    expect(root()).toHaveAttribute("aria-valuenow", "40");
    expect(root()).toHaveAttribute("aria-valuemin", "0");
    expect(root()).toHaveAttribute("aria-valuemax", "100");
  });

  it("fills the track in proportion to the value", async () => {
    const { fillRatio, update } = await mountProgress({ value: 0 });

    expect(fillRatio()).toBeCloseTo(0, 2);

    for (const [value, ratio] of [
      [25, 0.25],
      [50, 0.5],
      [100, 1],
    ] as const) {
      await update({ value });
      // Polled, not measured: the fill takes 300ms to get there, and it passes
      // through every wrong width on the way.
      await expect.poll(() => fillRatio()).toBeCloseTo(ratio, 2);
    }
  });

  it("measures the fill against a custom max rather than always against 100", async () => {
    const { root, fillRatio } = await mountProgress({ value: 5, max: 10 });

    expect(root()).toHaveAttribute("aria-valuemax", "10");
    // 5 of 10, not 5 of 100.
    expect(fillRatio()).toBeCloseTo(0.5, 2);
  });

  it("clamps a value below the range instead of drawing a negative fill", async () => {
    const { root, fillRatio } = await mountProgress({ value: -20 });

    expect(root()).toHaveAttribute("aria-valuenow", "0");
    expect(fillRatio()).toBeCloseTo(0, 2);
  });

  it("clamps a value above the range instead of overflowing the track", async () => {
    const { root, fillRatio, states } = await mountProgress({ value: 150 });

    expect(root()).toHaveAttribute("aria-valuenow", "100");
    expect(fillRatio()).toBeCloseTo(1, 2);
    // Clamping is what makes an over-range value read as complete rather than as
    // some fourth state.
    expect(states()).toEqual(["complete", "complete"]);
  });
});

describe("having no value passed", () => {
  it("renders an empty bar rather than an indeterminate one", async () => {
    const { root, fillRatio, states } = await mountProgress();

    // The design draws no indeterminate variant, so nothing here reaches Radix's
    // `indeterminate` state: a bar with nothing passed is 0, and is still announced
    // as a measurement rather than as an unknown.
    expect(states()).toEqual(["loading", "loading"]);
    expect(root()).toHaveAttribute("aria-valuenow", "0");
    expect(fillRatio()).toBeCloseTo(0, 2);
  });

  it("treats an explicit null the same as an omitted value", async () => {
    const { root, fillRatio, states } = await mountProgress({ value: null });

    expect(states()).toEqual(["loading", "loading"]);
    expect(root()).toHaveAttribute("aria-valuenow", "0");
    expect(fillRatio()).toBeCloseTo(0, 2);
  });
});

describe("reaching completion", () => {
  it("holds the loading state until the value is exactly max", async () => {
    const { states, update } = await mountProgress({ value: 99 });

    expect(states()).toEqual(["loading", "loading"]);

    await update({ value: 100 });

    // Both the root and the fill, because a consumer styles completion off either.
    expect(states()).toEqual(["complete", "complete"]);
  });

  it("calls onComplete when the fill has finished animating to max", async () => {
    const onComplete = vi.fn();
    const { update } = await mountProgress({ value: 20, onComplete });

    await update({ value: 100 });

    // The condition, not a duration: the transition is declared at 300ms but the
    // event is what the prop promises.
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it("sweeps the whole track from zero and reports it", async () => {
    const onComplete = vi.fn();
    // The case the `Filling` story shows, and the one worth pinning: the fill starts at
    // `scaleX(0)`, which is a zero-width box, and a transition out of one is exactly the
    // kind of thing a browser is entitled to skip.
    const { fillRatio, update } = await mountProgress({ value: 0, onComplete });

    expect(fillRatio()).toBeCloseTo(0, 2);

    await update({ value: 100 });

    await expect.poll(() => fillRatio()).toBeCloseTo(1, 2);
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it("does not call onComplete for a value that lands short of max", async () => {
    const onComplete = vi.fn();
    const { fillRatio, update } = await mountProgress({ value: 20, onComplete });

    await update({ value: 60 });
    // The 60 has to be allowed to *finish* for this to assert anything. Cutting it short
    // with a second update only proves that interrupting a transition dispatches
    // `transitioncancel` — the silence below would hold with the completion guard
    // deleted, which is exactly what this test is named after.
    await expect.poll(() => fillRatio()).toBeCloseTo(0.6, 2);
    expect(onComplete).not.toHaveBeenCalled();

    await update({ value: 100 });
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it("calls onComplete even when no transition runs", async () => {
    const onComplete = vi.fn();
    // Reduced motion behind a `transition: none` reset, a `display: none` ancestor and a
    // consumer's own override all come to the same thing: nothing animates, so a
    // `transitionend` listener hears nothing ever. A callback a flow is gated on must not
    // fail closed and silent.
    const { fill, fillRatio, update } = await mountProgress({
      value: 20,
      onComplete,
      indicatorClassName: "transition-none",
    });

    await update({ value: 100 });

    // Proving the path rather than assuming it: if `cn()` had not let the override win,
    // this would pass through the ordinary transition and assert nothing.
    expect(fill().getAnimations()).toHaveLength(0);
    expect(fillRatio()).toBeCloseTo(1, 2);
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it("does not call onComplete when it mounts already complete", async () => {
    const onComplete = vi.fn();
    const { fillRatio, update } = await mountProgress({ value: 100, onComplete });

    expect(fillRatio()).toBeCloseTo(1, 2);
    expect(onComplete).not.toHaveBeenCalled();

    // Same absence proof: the mechanism fires once a transition actually runs.
    await update({ value: 40 });
    await update({ value: 100 });

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });
});

describe("hardening its inputs", () => {
  it("treats NaN as empty rather than letting it reach the DOM", async () => {
    // What `(done / total) * 100` hands you when `total` is 0. Unguarded, NaN survives
    // the clamp, arrives as `scaleX(NaN)`, is dropped as invalid CSS — and the
    // untransformed full-width fill then draws a finished bar for a task at zero.
    const { root, fill, fillRatio } = await mountProgress({ value: (0 / 0) * 100 });

    expect(fill().style.transform).toBe("scaleX(0)");
    expect(fillRatio()).toBeCloseTo(0, 2);
    expect(root()).toHaveAttribute("aria-valuenow", "0");
    expect(root()).toHaveAttribute("data-state", "loading");
  });

  it("falls back to a max of 100 rather than inverting the clamp", async () => {
    // `Math.min(Math.max(2, 0), -5)` is -5, which Radix rejects and reports as
    // `indeterminate` — the one state this component promises cannot happen.
    const { root, fillRatio } = await mountProgress({ value: 2, max: -5 });

    expect(root()).toHaveAttribute("aria-valuemax", "100");
    expect(root()).toHaveAttribute("aria-valuenow", "2");
    expect(root()).toHaveAttribute("data-state", "loading");
    expect(fillRatio()).toBeCloseTo(0.02, 2);
  });

  it("does not call a zero-length bar complete", async () => {
    // "0 of 0 items". `clamped === max` would be `0 === 0`, while Radix — falling back to
    // its own default max — reports `loading`: the component's notion of completion and
    // the `data-state` consumers are told to style on, disagreeing with each other.
    const { root, states } = await mountProgress({ value: 0, max: 0 });

    expect(states()).toEqual(["loading", "loading"]);
    expect(root()).toHaveAttribute("aria-valuemax", "100");
  });
});

describe("announcing its value", () => {
  it("announces the percentage Radix computes for it", async () => {
    const { root } = await mountProgress({ value: 3, max: 5 });

    // A percentage of `max`, not the raw value — the same number the drawn row shows.
    expect(root()).toHaveAttribute("aria-valuetext", "60%");
  });

  it("lets a consumer announce something that is not a percentage", async () => {
    // The replacement for `label` doubling as `aria-valuetext`, which it did while it
    // stood in for the percentage rather than sitting beside it. There is no prop for
    // this: the attribute reaches the root through `...props` like any other.
    const { root } = await mountProgress({
      value: 60,
      label: "Quest line",
      "aria-valuetext": "3 of 5 quests",
    });

    expect(root()).toHaveAttribute("aria-valuetext", "3 of 5 quests");
  });

  it("does not turn a label into the announced value", async () => {
    const { root } = await mountProgress({ value: 60, label: "Quest line" });

    // The label names the bar; the percentage is its value. A label doing both is how
    // "Quest line, Quest line" happens.
    expect(root()).toHaveAttribute("aria-valuetext", "60%");
  });
});

describe("naming the bar", () => {
  it("takes its accessible name from the drawn label", async () => {
    const { root } = await mountProgress({ value: 56, label: "Upload progress" });

    // The row is `aria-hidden`, so this passes only through the `aria-labelledby`
    // reference — which is the point: a hidden element referenced directly still
    // contributes its text, so the name is the visible text and cannot drift from it.
    expect(root()).toHaveAccessibleName("Upload progress");
  });

  it("names an undrawn bar from a string label", async () => {
    const { root, within } = await mountProgress({
      value: 60,
      label: "Quest line",
      showLabel: false,
    });

    expect(within.getByTestId("progress-text").elements()).toHaveLength(0);
    expect(root()).toHaveAccessibleName("Quest line");
  });

  it("lets a consumer's own aria-label win over the label", async () => {
    const { root } = await mountProgress({
      value: 56,
      label: "Upload progress",
      "aria-label": "Avatar upload",
    });

    // Ours is `aria-labelledby`, which beats `aria-label` in the spec — so it has to
    // not be set at all rather than merely be set first.
    expect(root()).not.toHaveAttribute("aria-labelledby");
    expect(root()).toHaveAccessibleName("Avatar upload");
  });

  it("leaves a bar with no label of any kind unnamed", async () => {
    const { root } = await mountProgress({ value: 56, showLabel: true });

    // Nothing here can invent a name: the percentage says how far, never of what. The
    // component does not fake one, which is what makes the JSDoc's warning true.
    expect(root()).not.toHaveAccessibleName();
  });
});

describe("drawing the row above the bar", () => {
  it("draws no row when none was asked for", async () => {
    const { within } = await mountProgress({ value: 45 });

    expect(within.getByTestId("progress-text").elements()).toHaveLength(0);
  });

  it("draws the label at the left and the percentage at the right", async () => {
    const { label, percent } = await mountProgress({
      value: 56,
      label: "Upload progress",
    });

    await expect.element(label()).toHaveTextContent("Upload progress");
    await expect.element(percent()).toHaveTextContent("56%");
    // Figma's `justify-between` pair, in that order and on one line.
    const [left, right] = [label().element(), percent().element()].map((element) =>
      element.getBoundingClientRect(),
    );
    expect(left.right).toBeLessThanOrEqual(right.left);
    expect(left.top).toBeCloseTo(right.top, 0);
  });

  it("shows the percentage alone when a row was asked for without a label", async () => {
    const { label, percent } = await mountProgress({ value: 45, showLabel: true });

    await expect.element(percent()).toHaveTextContent("45%");
    // The empty label element stays: it is the flex child `justify-between` pushes the
    // percentage away from, so without it the percentage would sit at the left edge.
    expect(label().element().textContent).toBe("");
    expect(percent().element().getBoundingClientRect().right).toBeCloseTo(
      label().element().parentElement!.getBoundingClientRect().right,
      0,
    );
  });

  it("keeps a label out of the row when showLabel is explicitly false", async () => {
    // An explicit `false` has to beat the mere presence of a label for a bar to be
    // named without being annotated.
    const { within } = await mountProgress({
      value: 60,
      label: "Quest line",
      showLabel: false,
    });

    expect(within.getByTestId("progress-text").elements()).toHaveLength(0);
  });

  it("shows the rounded percentage", async () => {
    const { percent } = await mountProgress({ value: 45.4, showLabel: true });

    await expect.element(percent()).toHaveTextContent("45%");
  });

  it("reports the percentage of max, not the raw value", async () => {
    const { percent } = await mountProgress({ value: 3, max: 5, showLabel: true });

    await expect.element(percent()).toHaveTextContent("60%");
  });

  it("never reads 100% before the bar is complete", async () => {
    // A bar a user reads as finished while it is styled and announced as still loading —
    // no `data-[state=complete]` treatment, `aria-valuenow` short of max.
    const { percent, states } = await mountProgress({ value: 99.6, showLabel: true });

    await expect.element(percent()).toHaveTextContent("99%");
    expect(states()).toEqual(["loading", "loading"]);
  });

  it("never reads 0% on a bar that is not empty", async () => {
    const { percent } = await mountProgress({ value: 0.4, showLabel: true });

    await expect.element(percent()).toHaveTextContent("1%");
  });

  it("keeps the row out of the accessibility tree", async () => {
    const { row } = await mountProgress({ value: 45, label: "Upload progress" });

    // The percentage is already on the root as `aria-valuenow` and the label reaches
    // the name by reference, so anything read here would be said twice.
    await expect.element(row()).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the row above the bar rather than inside it", async () => {
    const { row, track } = await mountProgress({ value: 56, label: "Upload progress" });

    // The whole of this design change, and the one thing a class list cannot be trusted
    // to prove: the text used to be centred over the fill.
    expect(row().element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
      track().getBoundingClientRect().top,
    );
    expect(track().contains(row().element())).toBe(false);
  });

  it("keeps the bar at its 12px height whether or not a row is drawn", async () => {
    // What moving the label out of the bar bought: `h-6` used to be mandatory for a
    // labelled bar, because the text was inside a box that clipped it.
    const { track, update } = await mountProgress({ value: 56 });

    expect(track().getBoundingClientRect().height).toBeCloseTo(12, 0);

    await update({ label: "Upload progress" });

    expect(track().getBoundingClientRect().height).toBeCloseTo(12, 0);
  });
});

describe("being restyled from outside", () => {
  it("applies indicatorClassName to the fill", async () => {
    // `opacity-50` rather than a colour: this runtime loads the components' own
    // classes but no brand tokens, so a token-backed colour has nothing to compute
    // to, while opacity resolves and can be read back.
    const { fill } = await mountProgress({ value: 50, indicatorClassName: "opacity-50" });

    expect(getComputedStyle(fill()).opacity).toBe("0.5");
  });

  it("applies trackClassName to the bar", async () => {
    const { track } = await mountProgress({ value: 50, trackClassName: "h-6" });

    // `cn()` puts it last, so `h-6` replaces the bar's own `h-3`. The bar needs a prop
    // of its own now that `className` styles the column holding it.
    expect(track().getBoundingClientRect().height).toBeCloseTo(24, 0);
  });

  it("applies className to the root, which is what carries the width", async () => {
    const { root, track } = await mountProgress({ value: 50, className: "w-100" });

    expect(root().getBoundingClientRect().width).toBeCloseTo(400, 0);
    // And the bar fills it, which is what makes one width on the root enough.
    expect(track().getBoundingClientRect().width).toBeCloseTo(400, 0);
  });
});

describe("naming its parts", () => {
  it("puts nothing test-only in the DOM when nobody named it", async () => {
    const view = await render(<Progress value={50} showLabel className="w-100" />);

    expect(view.container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });
});
