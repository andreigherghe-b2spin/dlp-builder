"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { formatCountdown } from "@/molecules/Timer/lib/formatCountdown";
import { useCountdown } from "@/molecules/Timer/lib/useCountdown";
import { TypographyLabel } from "@/atoms/Typography";
import { cn, createTestIdFor } from "@/lib/utils";

/**
 * Figma draws the timer as a 69×16 pill: 8px of horizontal padding, `Radius/base`,
 * and a `Border/Neutral/Subtle` hairline that is the same on all three instances. The
 * 69px width is the pill's content plus that padding rather than a fixed measure, so
 * nothing pins it here — the digits size it, and `tabular-nums` is what stops it
 * twitching as they change.
 *
 * `tabular-nums` sits on the pill rather than on each segment because
 * `font-variant-numeric` inherits: one declaration, and every digit inside is fixed
 * width.
 *
 * No type on this element. The design draws five separate text nodes rather than one
 * styled box, and each of them carries the style — see `segmentType` below.
 */
const base = `
  rounded-base
  border-(length:--border-width-border-1)
  border-border-neutral-subtle
  inline-flex h-4 w-fit shrink-0 items-center justify-center
  whitespace-nowrap border-solid px-2 tabular-nums
`;

/**
 * `Label/Small/Medium`, which is what all five text nodes in the design are set in.
 *
 * Spelled once and spread, rather than repeated on five elements or flattened into a
 * `labelVariants()` call on the pill: the component that owns the style is the one
 * that should apply it, and `TypographyLabel` is that component. Reaching for the CVA
 * directly is what [Badge](../../atoms/Badge.tsx) does, and it is right there because
 * a badge *is* one text box; a timer is five, so the type belongs on each.
 */
const segmentType = { size: "s", weight: "medium" } as const;

/**
 * The three instances in Figma (`759:47553`, `47554`, `47555`) are one component in
 * three colourways and differ in nothing else — same size, same padding, same type,
 * same border. So the difference is a `variant`, and each name is the token family it
 * paints rather than a role: there is no `default`/`secondary` pair here the way
 * [Badge](../../badge.tsx) has one, and reusing those words for a set whose first
 * member is a neutral surface would make `default` mean two different colours in two
 * components.
 */
const config = {
  variants: {
    variant: {
      neutral: `
        bg-background-layout-surface-variant1
        text-foreground-on-surface-default
      `,
      accent1: `
        bg-background-brand-accent1container
        text-foreground-brand-on-accent1container
      `,
      accent2: `
        bg-background-brand-accent2container
        text-foreground-brand-on-accent2container
      `,
    },
  },
  defaultVariants: { variant: "neutral" } as const,
};

const timerVariants = cva(base, config);

type TimerProps = Omit<React.ComponentProps<"time">, "dateTime" | "children"> &
  VariantProps<typeof timerVariants> & {
    durationInSeconds: number;
    running?: boolean;
    runId?: string | number;
    onEnd?: () => void;
    "data-testid"?: string;
  };

/**
 * A countdown pill, drawn as `HH:MM:SS`.
 *
 * It owns its own tick: give it a number of seconds and it counts down once a second
 * until it reaches zero, then calls `onEnd` and holds at `00:00:00`. Changing
 * `durationInSeconds` to a *different* number restarts it.
 *
 * **To resync against a refetched server time, change `runId` as well.** A new
 * `durationInSeconds` on its own is not enough: an endpoint that buckets or rounds what
 * it returns hands back the same `3600` on two consecutive polls, and by then the pill
 * is at `3200`. Nothing has changed as far as the countdown can tell, so it keeps
 * drifting — which is the drift the resync existed to correct. Pass the fetch itself as
 * the id (`runId={fetchedAt}`) and every response restarts the countdown, whether or
 * not the number moved.
 *
 * **It counts a deadline down, not its own ticks**, so it does not drift and it
 * survives a background tab — where a browser throttles timers to about once a minute
 * and a pill that subtracted one per tick would come back minutes slow. See
 * [useCountdown](../lib/useCountdown.ts).
 *
 * `running` is the pause, and it is the same prop as the delayed start: a timer
 * mounted at `running={false}` sits at its full duration until something flips it. To
 * replay a duration it is already counting — the same 60 seconds again — change
 * `runId`, since handing it the same `durationInSeconds` is deliberately not a
 * restart.
 *
 * Only the pill is here. Where it sits — a header, a banner, a card corner — is the
 * caller's layout, and nothing in this component assumes one.
 *
 * The root is a `<time>` carrying an ISO 8601 `dateTime`, so the remaining duration is
 * machine-readable and not only three spans of digits. It is also a `role="timer"`,
 * which is what makes the element nameable — a bare `<time>` has no implicit role, so
 * an `aria-label` on one is announced by nothing. `timer` defaults to
 * `aria-live="off"`, so nothing is read out every second either.
 *
 * It has no accessible name of its own, though, because only the caller knows what is
 * ending: pass an `aria-label` saying so. **The digits are appended to it** — the name
 * becomes `Bonus expires in 00:01:30` — because `timer` takes its name from the author
 * alone, so a label on its own would say what is ending and never how long is left.
 *
 * @param {number} durationInSeconds - Seconds to count down from. Changing it to a
 * different value restarts the countdown; handing it the value it is already counting
 * does nothing. Non-finite or negative values are `0`
 * @param {boolean} [running=true] - Whether the countdown is running. `false` pauses it
 * where it is; mounting at `false` is how a timer waits for an event before it starts
 * @param {(string|number)} [runId] - Changing this restarts the countdown, including at
 * the duration it is already counting. This is how the same 60 seconds runs twice, and
 * how a resync against a refetched server time is made reliable
 * @param {() => void} [onEnd] - Called once when a countdown that ran reaches zero. A
 * timer given `0` never ran, so it never calls this. A paused countdown has not reached
 * zero, so it does not call this either
 * @param {('neutral' | 'accent1' | 'accent2')} [variant='neutral'] - The colourway.
 * `neutral` is the surface pill, `accent1` and `accent2` the two brand accents
 * @param {string} [className] - Classes for the pill
 * @param {string} [data-testid] - Names the pill, and derives `-hours`, `-minutes` and
 * `-seconds` for the three segments
 *
 * @example
 * ```tsx
 * // Counts down from an hour and tells the page when it is up
 * <Timer
 *   durationInSeconds={3600}
 *   onEnd={() => refetchPromotion()}
 *   aria-label="Time left in this promotion"
 * />
 *
 * // The accent colourways
 * <Timer durationInSeconds={90} variant="accent1" aria-label="Bonus expires in" />
 * <Timer durationInSeconds={90} variant="accent2" aria-label="Bonus expires in" />
 * ```
 *
 * @example
 * ```tsx
 * // Paused, and started by something else. One prop does both: the pill is on screen
 * // at its full duration the whole time, rather than appearing when the round does.
 * const [running, setRunning] = React.useState(false);
 *
 * <Timer durationInSeconds={60} running={running} aria-label="Round ends in" />
 * <Button onClick={() => setRunning(true)}>Start</Button>
 * <Button onClick={() => setRunning(false)}>Pause</Button>
 * ```
 *
 * @example
 * ```tsx
 * // Running the same duration again. `durationInSeconds` has not changed, so it is
 * // `runId` that says this is a new countdown rather than the one already going.
 * <Timer durationInSeconds={60} runId={attempt} aria-label="Code expires in" />
 * ```
 *
 * @example
 * ```tsx
 * // Resyncing against the server. `runId` is the fetch, not the number: an endpoint
 * // that rounds to the minute returns the same `secondsLeft` twice in a row, and
 * // without the id the second response would be a no-op while the pill drifts.
 * const { data, dataUpdatedAt } = useQuery(promotionQuery);
 *
 * <Timer
 *   durationInSeconds={data.secondsLeft}
 *   runId={dataUpdatedAt}
 *   aria-label="Time left in this promotion"
 * />
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--radius-base`
 * - `--border-width-border-1`
 * - `--typography-font-family`
 * - `--typography-font-size-label-s`
 * - `--typography-font-weight-medium`
 *
 * Semantic colors:
 * - `--color-background-brand-accent1container`
 * - `--color-background-brand-accent2container`
 * - `--color-background-layout-surface-variant1`
 * - `--color-border-neutral-subtle`
 * - `--color-foreground-brand-on-accent1container`
 * - `--color-foreground-brand-on-accent2container`
 * - `--color-foreground-on-surface-default`
 */
function Timer({
  className,
  durationInSeconds,
  onEnd,
  // Destructured, unlike `data-testid` below: neither is an attribute, so `...props`
  // carrying them to the element would put `running="false"` into the consumer's DOM.
  runId,
  running,
  variant,
  ...props
}: TimerProps) {
  const remaining = useCountdown(durationInSeconds, { onEnd, runId, running });
  const { hours, minutes, seconds, dateTime } = formatCountdown(remaining);

  // Read rather than destructured: `...props` still carries it to the root, so one
  // mechanism puts it there instead of two that can disagree.
  const testIdFor = createTestIdFor(props["data-testid"]);

  // `role="timer"` takes its name from the author only — the digits inside are not part
  // of it — and `aria-live` is `off`, so nothing is announced as it runs. Left at the
  // caller's label alone, a screen reader arriving at the pill would say what is ending
  // and never how long is left. Appending the digits to the name is what puts the value
  // where the name is read; digits rather than a humanised phrase, because "1 hour 2
  // minutes" would be English hard-coded into a library every brand app translates.
  const spoken = `${hours}:${minutes}:${seconds}`;
  const label = props["aria-label"];

  return (
    <time
      className={cn(timerVariants({ variant, className }))}
      dateTime={dateTime}
      role="timer"
      {...props}
      aria-label={label == null ? spoken : `${label} ${spoken}`}
    >
      <TypographyLabel {...segmentType} data-testid={testIdFor("hours")}>
        {hours}
      </TypographyLabel>
      <TypographyLabel {...segmentType}>:</TypographyLabel>
      <TypographyLabel {...segmentType} data-testid={testIdFor("minutes")}>
        {minutes}
      </TypographyLabel>
      <TypographyLabel {...segmentType}>:</TypographyLabel>
      <TypographyLabel {...segmentType} data-testid={testIdFor("seconds")}>
        {seconds}
      </TypographyLabel>
    </time>
  );
}

export { Timer, timerVariants };
export type { TimerProps };
