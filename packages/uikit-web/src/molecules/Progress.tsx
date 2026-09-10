"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { TypographyCaption } from "@/atoms/Typography";
import { cn, createTestIdFor } from "@/lib/utils";

const root = "flex w-full flex-col gap-1";

const textRow = `
  flex w-full items-center justify-between gap-2
  text-foreground-on-surface-default
`;

const track = `
  relative w-full h-3 overflow-hidden
  rounded-base
  border-solid
  border-(length:--border-width-border-1)
  border-border-neutral-subtle
  bg-background-layout-surface-variant1
`;

/**
 * The fill. Full width, scaled by `transform: scaleX()` from its left edge, so the
 * animation runs on the compositor and costs no layout per frame.
 *
 * `scaleX` rather than `translateX` because the gradients survive it. Figma paints a shade
 * at the fill's trailing edge and a sheen at its leading one, and gradient stops are
 * percentages of the element's own box: scaling paints them across the box first and
 * squashes the result, so a stop at 59.6% stays at 59.6% of the *visible* fill at every
 * value — which is exactly what Figma's per-percent variants draw. A translated
 * full-width bar resolves the same stops against the track instead, which anchors the
 * shade to an edge that is off-screen below ~40% and stretches the sheen across the whole
 * visible fill.
 *
 * What the scale does cost is the cap: `border-radius` is computed on the unscaled box and
 * then squashed with everything else, so Figma's pill cap is a progressively narrower
 * ellipse as the value drops — right at 100%, close to a vertical edge near 0. The
 * trailing end is unaffected, being shaped by the track's own clip.
 *
 * The stops are the transparent-black/white primitives rather than semantic tokens because
 * Figma binds no variable to them: they are the same two values in every variant and every
 * brand, so there is nothing per-brand for a semantic token to carry.
 *
 * No `will-change`. A transform transition is composited without the hint, and declaring
 * it in a class list rather than around the animation would hold a GPU layer for the
 * lifetime of every bar on the page — fifty idle quest bars, fifty permanent layers.
 */
const fill = `
  absolute inset-y-0 left-0 w-full origin-left
  rounded-base
  bg-background-brand-accent1container
  bg-[image:linear-gradient(270deg,transparent_59.615%,var(--color-custom-transparent-black-400)_100%),linear-gradient(270deg,var(--color-custom-transparent-white-200)_0%,transparent_50%)]
  transition-transform duration-300 ease-in-out
`;

/**
 * Displays an indicator showing the completion progress of a task, as a horizontal bar.
 * Built on top of Radix UI's Progress primitive.
 *
 * @param {string} [className] - Additional CSS classes for the root, which is the column
 * holding the text row and the bar. This is where a width goes
 * @param {string} [trackClassName] - Additional CSS classes for the bar itself — a height
 * other than the 12px default, for instance
 * @param {string} [indicatorClassName] - Additional CSS classes to apply to the fill, which
 * is otherwise unreachable from outside. Matches `@ui/native`'s prop of the same name
 * @param {number | null} [value] - The current progress, clamped to `0..max` so that an
 * out-of-range number cannot produce a fill wider than its track or a label reading `140%`.
 * Anything that is not a finite number — `null`, omitted, or the `NaN` that `0 / 0` hands
 * you — is `0`, an empty bar. There is no indeterminate state: the design draws none, so
 * `Progress` always reports a measurement
 * @param {number} [max=100] - The value that counts as complete. A non-finite or
 * non-positive `max` falls back to `100` rather than inverting the clamp
 * @param {React.ReactNode} [label] - The text at the left of the row above the bar, naming
 * what is progressing — Figma's "Upload progress". It also becomes the bar's accessible
 * name, unless the consumer gave one: by reference when it is drawn, and as an `aria-label`
 * when it is an undrawn string. An `aria-label` or `aria-labelledby` of your own always
 * wins
 * @param {boolean} [showLabel] - Whether to draw the row above the bar. Defaults to on when
 * `label` was given and off otherwise, and an explicit `false` always wins — which is how a
 * bar keeps its name without drawing one — a string `label` becomes its `aria-label`
 * instead. Drawn without a `label`, the row holds the percentage alone
 * @param {() => void} [onComplete] - Called once the fill has finished *animating* to
 * `max`. Deliberately not "when `value` became `max`" — a parent that sets the value
 * already knows that, whereas the moment the bar looks full is 300ms later and is not
 * derivable from props. It still fires when no animation runs at all (reduced motion, a
 * `transition-none` override, an offscreen ancestor), because a callback a flow is gated on
 * must not fail closed. It does not fire for a bar that mounts already complete: nothing
 * completed, it was born that way
 *
 * @example
 * ```tsx
 * // Figma's own composition: the label at the left of the row, the percentage at the
 * // right. The label names the bar, so there is no `aria-label` to remember.
 * <Progress value={56} label="Upload progress" />
 *
 * // The percentage alone, on a bar named the ordinary way
 * <Progress value={40} showLabel aria-label="Upload progress" />
 *
 * // Named but bare: no row drawn, the string becomes the bar's `aria-label`
 * <Progress value={60} label="Quest line" showLabel={false} />
 *
 * // A value that is not a percentage. `aria-valuetext` reaches the root like any attribute
 * <Progress value={60} label="Quest line" aria-valuetext="3 of 5 quests" />
 *
 * // Completion is a data attribute Radix already sets — no `completed` prop needed
 * <Progress value={100} indicatorClassName="data-[state=complete]:animate-pop-effect" />
 * ```
 *
 * @remarks
 * **The bar has to be named, and a drawn `label` is the easiest way.** The root is a
 * `role="progressbar"`, and the row of text inside it cannot name it by being read: the
 * whole row is `aria-hidden`, because the percentage is already announced through
 * `aria-valuenow` and would otherwise be said twice. So a drawn `label` names the bar *by
 * reference* — `aria-labelledby` pointing at that one element, whose text the
 * accessible-name computation still reads, an element referenced directly being exempt from
 * the hidden check. An undrawn string `label` becomes the `aria-label` instead, there being
 * no element to point at. Anything else — a node label with the row hidden, or no label at
 * all — needs an `aria-label` (or `aria-labelledby`) of your own: it reaches the root
 * through `...props` and always beats either of ours. A bar with none of them announces
 * "56%" with no indication of what is at 56%.
 *
 * **`label` is a name, not a value.** It no longer sets `aria-valuetext`, which it did
 * while it replaced the percentage rather than sitting beside it. A bar labelled "Upload
 * progress" at 56% now announces both, each in the ARIA slot that means it. For a value
 * that is not a percentage — "3 of 5 quests" — pass `aria-valuetext` yourself.
 *
 * `Progress` puts `data-state` on the root and the fill — `loading`, or `complete` once
 * the value reaches `max`. That is Radix's own attribute, not ours, and it is the
 * intended hook for styling completion, in place of the boolean `completed` prop the
 * product's own bars carry: theirs exists to patch up geometry those components invented,
 * and there is nothing here for it to patch.
 *
 * @cssVariables
 * Component:
 * - `--radius-base`
 * - `--border-width-border-1`
 *
 * Typography, consumed through `TypographyCaption` when the text row is drawn:
 * - `--typography-font-family`
 * - `--typography-font-weight-medium`
 * - `--typography-font-size-caption-m`
 *
 * Primitives, for the fill's gradient overlays:
 * - `--color-custom-transparent-black-400`
 * - `--color-custom-transparent-white-200`
 *
 * Semantic colors:
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-brand-accent1container`
 * - `--color-border-neutral-subtle`
 * - `--color-foreground-on-surface-default`
 *
 * @see [Reference](https://www.radix-ui.com/primitives/docs/components/progress#api-reference)
 */
function Progress({
  className,
  trackClassName,
  indicatorClassName,
  value,
  max: maxProp = 100,
  label,
  showLabel,
  onComplete,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  trackClassName?: string;
  indicatorClassName?: string;
  label?: React.ReactNode;
  showLabel?: boolean;
  onComplete?: () => void;
  /**
   * Names the root. The bar becomes `<testId>-track` and the fill `<testId>-indicator`; the
   * row `<testId>-text`, holding `<testId>-label` and `<testId>-value`.
   */
  "data-testid"?: string;
}) {
  // Read off `props` rather than destructured, which is the convention here and not an
  // oversight: `...props` is what carries `data-testid` to the root, so taking it would
  // mean re-placing it by hand and having two mechanisms that can disagree. The bracket
  // access is forced by the attribute being hyphenated, and the declaration above is what
  // makes it type-check. Four elements below need naming, so the base has to be read at all.
  const testIdFor = createTestIdFor(props["data-testid"]);

  // Both inputs are neutralised once, here, rather than guarded at each use — the fill,
  // the label, `aria-valuenow` and Radix's own `data-state` all read what comes out, and
  // any of them disagreeing with the others is a bug a consumer cannot work around.
  //
  // `max` first, because it is the bound `value` is clamped against: a non-positive one
  // would make `Math.min(…, max)` clamp *up to* a negative number, which Radix then
  // rejects as invalid and reports as `indeterminate` — the one state this component
  // promises cannot happen.
  const max =
    typeof maxProp === "number" && Number.isFinite(maxProp) && maxProp > 0 ? maxProp : 100;
  // `typeof` rather than `Number.isFinite` alone, which does not narrow. Everything
  // non-numeric lands on 0, `NaN` included: it would otherwise survive the clamp, reach
  // the DOM as `scaleX(NaN)`, be dropped as invalid CSS, and leave the untransformed
  // full-width fill painting a completed bar for a task at zero.
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const clamped = Math.min(Math.max(numeric, 0), max);
  const percent = (clamped / max) * 100;
  const isComplete = clamped === max;

  // `showLabel` is deliberately not defaulted in the signature: `??` has to be able to
  // tell "not passed" from a passed `false`, so that a `label` can be given for the name
  // alone and so that hiding the row conditionally works.
  const drawLabel = showLabel ?? label != null;

  // Rounded through the middle of the range, but never rounded *into* an endpoint. A bar
  // at 99.6% reading `100%` while it is still `loading` — no `data-[state=complete]`
  // styling, not announced as done — is a bar a user reads as finished and nothing else
  // agrees with; `0%` on a visibly non-empty one is the same error mirrored.
  const labelPercent = isComplete
    ? 100
    : percent === 0
      ? 0
      : Math.min(Math.max(Math.round(percent), 1), 99);

  // A `label` names the bar, in whichever of the two ways is available.
  //
  // Drawn, it is by reference: the row is `aria-hidden`, but an element referenced directly
  // by `aria-labelledby` still contributes its text to the accessible name, so the name is
  // the visible text itself and cannot drift from it. Undrawn there is no element to point
  // at, so a string becomes `aria-label` — which is the whole of "named but bare", and why
  // a non-string label cannot do it: `aria-label` takes text, not nodes.
  //
  // Either way only when the consumer named nothing themselves. `aria-labelledby` beats
  // `aria-label` in the spec, so setting ours regardless would silently override theirs.
  const labelId = React.useId();
  const unnamed = props["aria-label"] == null && props["aria-labelledby"] == null;
  const labelledBy = unnamed && drawLabel && label != null ? labelId : undefined;
  const ariaLabel = unnamed && !drawLabel && typeof label === "string" ? label : undefined;

  const indicatorRef = React.useRef<HTMLDivElement>(null);
  // Held in a ref so a caller passing a fresh closure every render cannot re-run the
  // effect below, which would fire the callback again for the same completion. Synced in
  // an effect rather than assigned during render — mutating a ref mid-render is what
  // `react-hooks/refs` forbids — and declared before that effect, so effect order
  // guarantees the completion below never reads a stale callback.
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  // True only for a bar that arrived complete, and cleared the first time it is not.
  const bornComplete = React.useRef(isComplete);

  React.useEffect(() => {
    if (!isComplete) {
      bornComplete.current = false;
      return;
    }
    if (bornComplete.current) return;

    const element = indicatorRef.current;
    if (!element) return;

    let spent = false;
    const fire = () => {
      if (spent) return;
      spent = true;
      onCompleteRef.current?.();
    };

    // A frame first, so a transition this commit started is registered; then wait on
    // whatever is actually running. `getAnimations()` comes back empty when nothing is —
    // reduced motion, a consumer's `transition-none`, a `display: none` ancestor — and
    // that is the case a `transitionend` listener on its own failed closed on, silently,
    // for anyone gating a flow on this callback. `allSettled` because interrupting a
    // transition rejects its `finished` promise rather than resolving it.
    const frame = requestAnimationFrame(() => {
      const running = element.getAnimations();
      if (running.length === 0) {
        fire();
        return;
      }
      void Promise.allSettled(running.map((animation) => animation.finished)).then(fire);
    });

    return () => {
      spent = true;
      cancelAnimationFrame(frame);
    };
  }, [isComplete]);

  return (
    <ProgressPrimitive.Root
      value={clamped}
      max={max}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      className={cn(root, className)}
      {...props}
    >
      {drawLabel ? (
        // Hidden as a whole, rather than per text: the percentage is already announced as
        // `aria-valuenow` and the label reaches the name by reference above, so there is
        // nothing in here left for a screen reader to add.
        <div aria-hidden="true" data-testid={testIdFor("text")} className={cn(textRow)}>
          {/* Rendered even with no `label`, and not for the sake of the testid: it is the
              first of the two flex children `justify-between` pushes apart, so without it
              a row holding only the percentage would push it to the left edge. */}
          <TypographyCaption
            id={labelId}
            data-testid={testIdFor("label")}
            className="min-w-0 truncate"
          >
            {label}
          </TypographyCaption>
          <TypographyCaption data-testid={testIdFor("value")} className="shrink-0">
            {labelPercent}%
          </TypographyCaption>
        </div>
      ) : null}
      <div data-testid={testIdFor("track")} className={cn(track, trackClassName)}>
        <ProgressPrimitive.Indicator
          ref={indicatorRef}
          data-testid={testIdFor("indicator")}
          className={cn(fill, indicatorClassName)}
          // Bar-width, squashed from the left to the value.
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
