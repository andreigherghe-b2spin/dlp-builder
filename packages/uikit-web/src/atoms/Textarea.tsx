import * as React from "react";

import { bodyVariants } from "@/atoms/Typography";
import { cn, fieldBox } from "@/lib/utils";

/**
 * The same rectangle every text-shaped control in the design is drawn from
 * (`fieldBox`), with the four things a multi-line box changes:
 *
 * | Property | `Input` | Figma's Textarea     |
 * | -------- | ------- | -------------------- |
 * | height   | `h-12`  | `min-h-16` floor     |
 * | padding  | `py-1`  | `py-3` (`spacing/3`) |
 * | type     | Label/M | Body/M Medium, 1.46  |
 * | resize   | —       | no handle drawn      |
 *
 * Height is a floor rather than a value: node 3176:5934 is `min-h-[64px]` inside
 * a frame that gives it the rest of the room, so how tall the box actually is
 * belongs to the consumer — `rows`, or a `min-h-*` in `className`.
 *
 * **It does not grow with its content, and it has no grab handle.** Figma draws
 * neither: every one of the eighteen variants is a fixed box, and text past the
 * bottom scrolls inside it. Both are one class away when a screen wants them —
 * `className="field-sizing-content"` to grow, `className="resize-y"` to let the
 * user drag — and they are the consumer's call rather than the design system's,
 * because a box that changes height reflows everything under it.
 *
 * Figma splits Focus and Pressed into two variants — Pressed taking a
 * `state/pressed` overlay, Focus a 2px `state/active` border. For a text box
 * those are one state, so `:active` takes the focus visual and the pressed
 * overlay is never drawn, exactly as `Input` resolves it. The 2px border is 1px
 * plus a 1px inset shadow here, so the box's own size never moves when it is
 * focused.
 */
const base = `
  ${fieldBox}
  ${bodyVariants({ size: "m", weight: "medium" })}

  h-auto min-h-16 py-3
  min-w-0
  resize-none
  cursor-text
  placeholder:text-foreground-on-surface-muted

  not-active:not-focus-visible:hover:bg-linear-[0deg,var(--color-background-state-hover)_0%,var(--color-background-state-hover)_100%]

  active:border-border-state-active
  active:shadow-[inset_0_0_0_1px_var(--color-border-state-active)]

  aria-invalid:active:border-border-feedback-negative
  aria-invalid:active:shadow-[inset_0_0_0_1px_var(--color-border-feedback-negative)]

  disabled:placeholder:text-foreground-state-disabled

  [[readonly]]:cursor-default
  [[readonly]]:not-active:not-focus-visible:hover:bg-linear-[0deg,transparent_0%,transparent_100%]
`;

type TextareaProps = React.ComponentProps<"textarea"> & {
  /**
   * Lands on the `<textarea>`. Defaults to `name`, which is already the string
   * the form, the label and the validation message are keyed on — a field named
   * `message` answers to `message` without anyone naming it twice.
   */
  "data-testid"?: string;
};

/**
 * The multi-line field box, and nothing around it. It is the bare control — for
 * the labelled field with helper or error text, reach for
 * [TextareaField](../molecules/TextareaField.tsx), which composes this.
 *
 * Unlike [Input](./Input.tsx) there is no wrapper: a textarea holds no
 * adornments in the design, so `className` lands on the box itself and `w-*`,
 * `min-h-*` and `rows` all work where you would expect them to.
 *
 * `rows` sets the visible height and the box never goes below `min-h-16`.
 * `data-testid` defaults to `name`, so a field is addressable without being
 * named twice.
 *
 * @param {string} [className] - Additional CSS classes for the `<textarea>`
 * @param {React.ComponentProps<'textarea'>} props - Props for the textarea element
 *
 * @example
 * ```tsx
 * // The bare box
 * <Textarea name="message" placeholder="Type your message here." />
 *
 * // Taller, and resizable by the user
 * <Textarea name="bio" rows={6} className="resize-y" />
 *
 * // Growing with what is typed into it, instead of scrolling
 * <Textarea name="bio" className="field-sizing-content" />
 *
 * // Invalid, which is what recolours the border
 * <Textarea name="message" aria-invalid placeholder="Type your message here." />
 * ```
 *
 * @cssVariables
 * Component and typography:
 * - `--components-textfield-border`
 * - `--components-textfield-radius`
 * - `--typography-font-family`
 * - `--typography-font-size-body-m`
 * - `--typography-font-weight-medium`
 *
 * Semantic colors:
 * - `--color-background-layout-surface-variant1`
 * - `--color-background-state-disabled`
 * - `--color-background-state-hover`
 * - `--color-border-feedback-negative`
 * - `--color-border-neutral-default`
 * - `--color-border-neutral-subtle`
 * - `--color-border-state-active`
 * - `--color-foreground-on-surface-default`
 * - `--color-foreground-on-surface-muted`
 * - `--color-foreground-state-disabled`
 *
 * @see [Documentation](https://ui.shadcn.com/docs/components/textarea)
 */
function Textarea({ className, "data-testid": testIdProp, ...props }: TextareaProps) {
  return (
    <textarea
      // Destructured and placed by hand rather than left to the spread, because
      // what is emitted is not what was passed: a form control falls back to the
      // name it already carries.
      data-testid={testIdProp ?? props.name}
      className={cn(base, className)}
      {...props}
    />
  );
}

export { Textarea, type TextareaProps };
