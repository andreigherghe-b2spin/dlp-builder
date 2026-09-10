import { useState } from "react";
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@ui/web/InputOTP";
import { TypographyBody } from "@ui/web/Typography";

/**
 * Six boxes at desktop come to 472px — `6 × 72 + 5 × 8` — which is the field's
 * **cap**, not a width to pin it at. Written as `w-full max-w-118` so narrowing
 * the canvas actually narrows the field: a hard `w-118` was 472px whatever the
 * viewport, which put a horizontal scrollbar on the docs page at any width under
 * that and hid the very behaviour these stories exist to show.
 *
 * It needs `layout: "padded"` on the meta to mean anything. Storybook's default
 * `centered` makes the story root a shrink-wrapping flex item, and `w-full`
 * inside one resolves against a width that is itself content-derived — so it
 * lands on max-content, which is the cap again.
 */
const FIELD_WIDTH = "w-full max-w-118";

/**
 * The one story the visual suite photographs gets a hard width instead: a
 * baseline has to be the same size on macOS and on the Linux runner, and
 * Playwright refuses to compare two shots whose dimensions disagree at all. 472px
 * is the design's own full width, so the boxes land on exactly 72×80 there.
 */
const BASELINE_WIDTH = "w-118";

const meta: Meta<typeof InputOTP> = {
  title: "Needs Review/Molecules/InputOTP",
  id: "InputOTP",
  component: InputOTP,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  args: { maxLength: 6, name: "code", "aria-label": "One-time code" },
  parameters: {
    // A block-level story root, which is what an app page gives the field and
    // what lets `w-full` mean the canvas. The repo default is `centered`, whose
    // root shrink-wraps — under that the field measures itself from its own
    // content and stops responding to the canvas entirely.
    layout: "padded",
  },
  argTypes: {
    maxLength: {
      control: { type: "number", min: 1, max: 10 },
      description: "How many characters the code has. Must match the number of slots rendered.",
    },
    invalid: {
      control: "boolean",
      description: "Draw every slot in the negative border, and set `aria-invalid`",
    },
    disabled: {
      control: "boolean",
      description: "Disable the field. Beats `invalid` visually, the way Figma's matrix does.",
    },
    name: {
      control: "text",
      description: "Submitted name, and the base every slot's `data-testid` derives from",
    },
    "aria-label": {
      control: "text",
      description:
        "The field's accessible name. The design draws no label, so every field needs one",
    },
    pattern: {
      control: false,
      description:
        "What may be typed, as a regular-expression source. `REGEXP_ONLY_DIGITS` is re-exported.",
    },
    onComplete: {
      control: false,
      description: "Called once the last slot is filled — this is the submit hook",
    },
  },
};

export default meta;
type Story = StoryObj<typeof InputOTP>;

/**
 * The slots for a field, optionally split into groups of `groupsOf` with a
 * separator between them.
 *
 * Only `Separators` passes `groupsOf` — the design draws no dash, so every other
 * story is the continuous field. It is one helper rather than two because
 * grouping costs nothing to lay out: `InputOTPGroup` renders no box, so both
 * arrangements are the same boxes at the same size.
 */
function Slots({ length = 6, groupsOf }: { length?: number; groupsOf?: number }) {
  const indices = Array.from({ length }, (_, index) => index);

  if (!groupsOf) {
    return indices.map((index) => <InputOTPSlot key={index} index={index} />);
  }

  const chunks: number[][] = [];
  for (let start = 0; start < length; start += groupsOf) {
    chunks.push(indices.slice(start, start + groupsOf));
  }

  return chunks.flatMap((chunk, chunkIndex) => [
    // Between chunks only, so a field never opens or closes on a dash.
    ...(chunkIndex > 0 ? [<InputOTPSeparator key={`separator-${chunkIndex}`} />] : []),
    <InputOTPGroup key={`group-${chunkIndex}`}>
      {chunk.map((index) => (
        <InputOTPSlot key={index} index={index} />
      ))}
    </InputOTPGroup>,
  ]);
}

/** A labelled row, for the sheets that show several fields at once. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <TypographyBody size="s" className="text-foreground-on-page-muted">
        {label}
      </TypographyBody>
      {children}
    </div>
  );
}

/**
 * The field as it ships: six boxes, nothing between them, uncontrolled. Click it
 * and type — the box you are in takes the white border and the caret, and every
 * box you have filled goes green.
 *
 * The green is the design's, not a validity check. Figma draws
 * `Border/Feedback/Positive` on any slot with a character in it, which is why the
 * sheet's `Success` state is nothing more than every slot filled.
 */
export const Default: Story = {
  render: (args) => (
    <div className={FIELD_WIDTH}>
      <InputOTP {...args}>
        <Slots />
      </InputOTP>
    </div>
  ),
};

/**
 * `pattern` restricts what may be typed. `REGEXP_ONLY_DIGITS` is re-exported
 * from `@ui/web/InputOTP`, so a numeric code needs no second dependency — and
 * `inputMode="numeric"` is what brings up the number pad on a phone.
 *
 * `autoComplete="one-time-code"` is the one that matters on mobile: it is what
 * lets iOS and Android offer the code straight from the SMS.
 */
export const DigitsOnly: Story = {
  args: {
    pattern: REGEXP_ONLY_DIGITS,
    inputMode: "numeric",
    autoComplete: "one-time-code",
  },
  render: (args) => (
    <div className={FIELD_WIDTH}>
      <InputOTP {...args}>
        <Slots />
      </InputOTP>
    </div>
  ),
};

/**
 * The verifying field, at module scope rather than declared inside a story's
 * `render`: a function created during render is a new component type on every
 * pass, so React unmounts and remounts it — typing a code and then touching the
 * theme toolbar would silently clear the field.
 */
function VerifyingField() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "rejected">("idle");

  return (
    <div className={`${FIELD_WIDTH} flex flex-col gap-3`}>
      <InputOTP
        maxLength={6}
        name="code"
        aria-label="One-time code"
        value={code}
        pattern={REGEXP_ONLY_DIGITS}
        invalid={status === "rejected"}
        onChange={(value) => {
          setCode(value);
          // Back to neutral the moment they start correcting it — an error that
          // survives the next keystroke reads as a broken field.
          setStatus("idle");
        }}
        onComplete={(value: string) => setStatus(value === "123456" ? "ok" : "rejected")}
      >
        <Slots />
      </InputOTP>

      <TypographyBody
        size="s"
        className={
          status === "rejected"
            ? "text-foreground-feedback-negative"
            : "text-foreground-on-page-muted"
        }
      >
        {status === "ok"
          ? "Code accepted."
          : status === "rejected"
            ? "That code is not right. Try again."
            : "Enter the six-digit code — 123456 is the one that works."}
      </TypographyBody>
    </div>
  );
}

/**
 * `onComplete` fires when the last box is filled. There is no submit button in
 * the design, so this is the submit: verify here, and turn the field red with
 * `invalid` if the code is wrong.
 *
 * Type `123456` to see it accepted; anything else is rejected.
 */
export const Verifying: Story = {
  parameters: { controls: { disable: true } },
  render: () => <VerifyingField />,
};

/**
 * `invalid` repaints all six boxes in the negative border, at 2px, and sets
 * `aria-invalid` on the input so the field announces itself as well as showing
 * it. A form that already drives `aria-invalid` from its validation state gets
 * the same styling without passing anything extra.
 */
export const Invalid: Story = {
  args: { invalid: true, value: "456781", onChange: () => undefined },
  render: (args) => (
    <div className={FIELD_WIDTH}>
      <InputOTP {...args}>
        <Slots />
      </InputOTP>
    </div>
  ),
};

/**
 * Disabled beats invalid, which is Figma's own precedence: the
 * `Error=True, Disabled` nodes drop the red border. A field nobody can edit is
 * not asking to be corrected — the second field below is `disabled` *and*
 * `invalid`, and draws as disabled.
 *
 * The two carry different `name`s because `name` is what every slot's
 * `data-testid` derives from; sharing one would put two `code-slot-0` elements on
 * the page and make any locator ambiguous.
 */
export const Disabled: Story = {
  args: { disabled: true, value: "456781", onChange: () => undefined },
  render: (args) => (
    <div className={`${FIELD_WIDTH} flex flex-col gap-6`}>
      <InputOTP {...args} name="disabled">
        <Slots />
      </InputOTP>
      <InputOTP {...args} name="disabled-invalid" invalid>
        <Slots />
      </InputOTP>
    </div>
  ),
};

/**
 * **Figma's box size is a ceiling, not a width.** Six mobile boxes at 56px plus
 * five gaps come to 376px — wider than a 375px phone before the page's own
 * padding, and 60px too wide for a 320px one. So each box takes an equal share of
 * the row and caps at the design's number.
 *
 * The three widths below are the same field. At 472px the boxes are exactly the
 * 72×80 Figma draws; the two narrow ones are the phone widths that used to
 * overflow, and the digits stay centred in boxes that shrink evenly.
 *
 * Resize the canvas and the top row follows it — which is the point: the field
 * takes the width it is given, and there is nothing to pass for that to work.
 */
export const FitsItsContainer: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {(
        [
          ["Up to 472px — the design's full width, boxes at their 72px cap", FIELD_WIDTH],
          ["375px — an iPhone, where a fixed 376px used to overflow", "w-full max-w-[375px]"],
          ["320px — the narrowest the type scale is drawn for", "w-full max-w-80"],
        ] as const
      ).map(([label, width], index) => (
        <Row key={label} label={label}>
          <div className={width}>
            <InputOTP
              maxLength={6}
              name={`fit-${index}`}
              aria-label={`One-time code, ${label}`}
              value="456781"
              onChange={() => undefined}
            >
              <Slots />
            </InputOTP>
          </div>
        </Row>
      ))}
    </div>
  ),
};

/**
 * `maxLength` sets the length, and the slots have to match it. Four is the other
 * length the products use.
 */
export const Lengths: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className={`${FIELD_WIDTH} flex flex-col gap-6`}>
      <Row label="Four">
        <InputOTP maxLength={4} name="pin" aria-label="Four-digit PIN">
          <Slots length={4} />
        </InputOTP>
      </Row>
      <Row label="Six — the design's">
        <InputOTP maxLength={6} name="six" aria-label="Six-digit code">
          <Slots />
        </InputOTP>
      </Row>
    </div>
  ),
};

/**
 * **The design does not draw a separator**, which is why this is the only story
 * that shows one. Figma's field is six equal boxes with nothing between, so reach
 * for groups only when the code is genuinely read in parts, the way a `123-456`
 * is.
 *
 * Any arrangement works, and the groups need not be the same size: the rows below
 * are 3+3, 2+2+2, 2+2 and 1+5.
 *
 * The separator sits exactly `spacing/2` from the box on either side of it, and a
 * grouped field is laid out identically to an ungrouped one. Neither was true
 * before: a group was a nested flex row, so it claimed half the width through
 * `grow` while its slots capped at the design's size before spending it, and the
 * difference stayed as slack on the group's trailing edge — 108px of it at a
 * 600px row, which is what pushed the dash off centre. The group now renders no
 * box at all (`display: contents`), so there is one flex context for the whole
 * field and the arithmetic happens once.
 */
export const Separators: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className={`${FIELD_WIDTH} flex flex-col gap-6`}>
      <Row label="Three and three — 123-456">
        <InputOTP maxLength={6} name="threes" aria-label="Code in two groups of three">
          <Slots groupsOf={3} />
        </InputOTP>
      </Row>
      <Row label="Two, two and two — 12-34-56">
        <InputOTP maxLength={6} name="twos" aria-label="Code in three groups of two">
          <Slots groupsOf={2} />
        </InputOTP>
      </Row>
      <Row label="Two and two — a four-digit code">
        <InputOTP maxLength={4} name="pairs" aria-label="Code in two pairs">
          <Slots length={4} groupsOf={2} />
        </InputOTP>
      </Row>
      <Row label="Uneven groups — one, then five">
        <InputOTP maxLength={6} name="uneven" aria-label="Code in groups of one and five">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {[1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </Row>
    </div>
  ),
};

/**
 * Figma's states. `name` doubles as each field's `data-testid` base, so every row
 * carries its own.
 */
const STATES = [
  { label: "Empty", name: "empty", value: "" },
  { label: "Partly filled", name: "typing", value: "16" },
  { label: "Complete", name: "complete", value: "456781" },
  { label: "Invalid", name: "invalid", value: "456781", invalid: true },
  { label: "Disabled", name: "disabled", value: "456781", disabled: true },
] as const;

/**
 * The combined sheet, and the only story the visual suite photographs.
 *
 * Five of the six rows are the real thing — a live field given a value, an
 * `invalid`, a `disabled` — so what is drawn is what the component derives, not a
 * picture of the CVA. The sixth cannot be: a box is `active` only while the field
 * holds focus, and a screenshot cannot hold focus and stay still, so that row
 * pins `state` on one slot. That is what the prop is for.
 *
 * Two things are deliberately absent. Hover, because it is an overlay over
 * whichever box is showing rather than a state of its own, so a row of it would
 * say less than the five real ones already do. And the separator layout, because
 * the design does not draw one — `Separators` is the story for it, and grouping
 * changes no state, only where the boxes sit.
 */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className={`${BASELINE_WIDTH} flex flex-col gap-6`}>
      {STATES.map((entry) => (
        <Row key={entry.name} label={entry.label}>
          <InputOTP
            maxLength={6}
            name={entry.name}
            aria-label={`One-time code, ${entry.label.toLowerCase()}`}
            value={entry.value}
            onChange={() => undefined}
            invalid={"invalid" in entry ? entry.invalid : undefined}
            disabled={"disabled" in entry ? entry.disabled : undefined}
          >
            <Slots />
          </InputOTP>
        </Row>
      ))}

      <Row label="Focused — the box being typed into">
        <InputOTP
          maxLength={6}
          name="focused"
          aria-label="One-time code, focused"
          value="16"
          onChange={() => undefined}
        >
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} state="active" />
          {[3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTP>
      </Row>
    </div>
  ),
};
