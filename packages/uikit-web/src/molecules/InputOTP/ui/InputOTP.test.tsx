import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
  type InputOTPProps,
} from "@/molecules/InputOTP";

const NAME = "code";
const LENGTH = 6;

/**
 * The field with one slot per character, which is how the design draws it and
 * what every story renders. `name` is the only id passed — a control that
 * submits a value derives its parts' test ids from it, and passing a separate
 * `data-testid` here would hide the ids the app will really have.
 */
async function mountField({
  length = LENGTH,
  ...props
}: Partial<InputOTPProps> & { length?: number } = {}) {
  const view = await render(
    <InputOTP maxLength={length} name={NAME} {...props}>
      {Array.from({ length }, (_, index) => (
        <InputOTPSlot key={index} index={index} />
      ))}
    </InputOTP>,
  );

  const within = page.elementLocator(view.container);

  const input = () => within.getByTestId(NAME);
  const slot = (index: number) => within.getByTestId(`${NAME}-slot-${index}`);
  const slots = () => Array.from({ length }, (_, index) => slot(index));

  /** The five boxes, read off the DOM rather than off the class list. */
  const states = () => slots().map((locator) => locator.element().getAttribute("data-state"));

  const type = async (code: string) => {
    await userEvent.click(input());
    await userEvent.fill(input(), code);
  };

  return { view, within, input, slot, slots, states, type };
}

describe("typing a code", () => {
  it("draws one box per character, empty to begin with", async () => {
    const { slots, states } = await mountField();

    expect(slots()).toHaveLength(LENGTH);
    expect(states()).toEqual(Array(LENGTH).fill("empty"));
  });

  it("puts each character in its own box", async () => {
    const { slot, type } = await mountField();

    await type("1634");

    await expect.element(slot(0)).toHaveTextContent("1");
    await expect.element(slot(1)).toHaveTextContent("6");
    await expect.element(slot(2)).toHaveTextContent("3");
    await expect.element(slot(3)).toHaveTextContent("4");
  });

  it("marks the boxes it has filled, and leaves the rest empty", async () => {
    const { states, type } = await mountField();

    await type("16");

    // Not `every`: the point is that the boundary is where the code ends, and a
    // count that happened to match would pass a component filling the wrong ones.
    await expect.poll(states).toEqual(["filled", "filled", "active", "empty", "empty", "empty"]);
  });

  it("calls onComplete with the whole code once the last box is filled", async () => {
    const onComplete = vi.fn();
    const { type } = await mountField({ onComplete });

    await type("123456");

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith("123456"));
  });

  it("refuses what the pattern does not allow", async () => {
    const { slot, type } = await mountField({ pattern: REGEXP_ONLY_DIGITS });

    // `input-otp` validates the whole incoming value rather than the last
    // character, so a rejected entry leaves the field exactly as it was.
    await type("abcd");
    await expect.element(slot(0)).toHaveTextContent("");

    await type("12");
    await expect.element(slot(0)).toHaveTextContent("1");
    await expect.element(slot(1)).toHaveTextContent("2");
  });

  it("reports the whole code on every keystroke, not an event", async () => {
    const onChange = vi.fn();
    const { type } = await mountField({ onChange, value: "" });

    await type("16");

    // A controlled field pinned at "" — so what is asserted is the argument,
    // which is the whole code as a string rather than a change event.
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith("16"));
  });
});

/**
 * The reason the boxes are a share of the row rather than a fixed size: six at
 * Figma's mobile width plus five gaps is 376px, and a phone is 375px or less.
 * Measured rather than read off a class list — a cap and a ratio are geometry,
 * and geometry is what the browser runtime is here for.
 *
 * The cap and the ratio are read off the rendered box rather than written in,
 * because both step at 1024px and this suite's viewport is 900 wide: hardcoding
 * `56` would pin these tests to that setting, and hardcoding `72` would fail
 * under it. What is asserted is the relationship — capped at the design's
 * number, equal across the row, inside the width it was given, and holding its
 * proportion — which is the same claim at either size.
 */
describe("fitting the width it is given", () => {
  const GAP = 8;

  const renderInWidth = async (width: number) => {
    const view = await render(
      <div style={{ width: `${width}px` }}>
        <InputOTP maxLength={LENGTH} name={NAME}>
          {Array.from({ length: LENGTH }, (_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTP>
      </div>,
    );

    const elements = [...view.container.querySelectorAll("[data-state]")] as HTMLElement[];

    return {
      rects: elements.map((el) => el.getBoundingClientRect()),
      // The `max-w-*` the breakpoint settled on: 56px below 1024, 72px above.
      cap: parseFloat(getComputedStyle(elements[0]).maxWidth),
      ratio: getComputedStyle(elements[0]).aspectRatio,
    };
  };

  it("draws the design's exact box once the row is wide enough for it", async () => {
    const { cap } = await renderInWidth(0);
    // The design's own width for this breakpoint, so nothing is capped and
    // nothing is shrunk — 6 boxes and 5 gaps, which is 376 or 472.
    const { rects } = await renderInWidth(LENGTH * cap + (LENGTH - 1) * GAP);

    expect(Math.round(rects[0].width)).toBe(cap);
    // 56 wide is 64 tall and 72 wide is 80 tall — Figma's two boxes exactly,
    // which is what the cap plus the fixed height buy over an approximation.
    expect(Math.round(rects[0].height)).toBe(cap === 56 ? 64 : 80);
  });

  it("never exceeds the cap, however wide the row is", async () => {
    const { rects, cap } = await renderInWidth(1200);

    for (const rect of rects) expect(Math.round(rect.width)).toBe(cap);
  });

  it("fits a 320px screen, which the fixed size did not", async () => {
    const { rects, cap } = await renderInWidth(320);
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));

    // The whole row, gaps included, inside the box it was given.
    expect(right - left).toBeLessThanOrEqual(320);
    // And genuinely shrunk rather than clipped: what is left of 320 once the
    // five gaps are taken out, over six. Computed rather than written, so the
    // test says where the number comes from and cannot drift from the gap.
    expect(Math.round(rects[0].width)).toBe(Math.round((320 - (LENGTH - 1) * GAP) / LENGTH));
    expect(rects[0].width).toBeLessThan(cap);
  });

  it("narrows at a constant height rather than shrinking in both directions", async () => {
    const { rects, cap } = await renderInWidth(320);

    // Deliberate: the height is set, not derived from the width by an
    // `aspect-ratio`. A ratio made the box's width depend on its height and the
    // height on its content, which is what collapsed the field to 2px in a
    // content-sized parent — and it had to be floored by a `min-h` anyway, which
    // produced this same constant height. See the note on `base`.
    for (const rect of rects) {
      expect(Math.round(rect.height)).toBe(cap === 56 ? 64 : 80);
      expect(rect.width).toBeLessThan(cap);
    }
  });

  it("gives every box the same width, so the row reads as one field", async () => {
    const { rects } = await renderInWidth(333);
    const widths = new Set(rects.map((rect) => Math.round(rect.width)));

    expect(widths.size).toBe(1);
  });
});

describe("the field's states", () => {
  it("paints every box invalid, and announces it, when invalid is set", async () => {
    const { input, states } = await mountField({ invalid: true, value: "16" });

    expect(states()).toEqual(Array(LENGTH).fill("invalid"));
    await expect.element(input()).toHaveAttribute("aria-invalid", "true");
  });

  it("takes aria-invalid as the same instruction, for a form that already sets it", async () => {
    const { states } = await mountField({ "aria-invalid": true, value: "16" });

    expect(states()).toEqual(Array(LENGTH).fill("invalid"));
  });

  it('ignores aria-invalid="false", which is a form saying the field is fine', async () => {
    const { input, states } = await mountField({ "aria-invalid": "false", value: "16" });

    expect(states()).toEqual(["filled", "filled", "empty", "empty", "empty", "empty"]);
    // And it reaches the input rather than being dropped: a form toggling between
    // the two literals is saying something in both directions.
    await expect.element(input()).toHaveAttribute("aria-invalid", "false");
  });

  it("forwards aria-invalid as it was passed, error types included", async () => {
    const { input, states } = await mountField({ "aria-invalid": "spelling", value: "16" });

    // `grammar` and `spelling` say *what* is wrong rather than that something is,
    // so collapsing them to `"true"` drops the only part a screen reader adds.
    await expect.element(input()).toHaveAttribute("aria-invalid", "spelling");
    expect(states()).toEqual(Array(LENGTH).fill("invalid"));
  });

  it("disables the input and paints every box disabled", async () => {
    const { input, states } = await mountField({ disabled: true, value: "16" });

    await expect.element(input()).toBeDisabled();
    expect(states()).toEqual(Array(LENGTH).fill("disabled"));
  });

  it("draws disabled rather than invalid when both are set", async () => {
    // Figma's own precedence: the `Error=True, Disabled` nodes drop the red
    // border. A field nobody can edit is not asking to be corrected.
    const { states } = await mountField({ disabled: true, invalid: true, value: "16" });

    expect(states()).toEqual(Array(LENGTH).fill("disabled"));
  });
});

describe("naming the field and its parts", () => {
  it("derives every slot's id from the field's name", async () => {
    const { input, slot } = await mountField();

    await expect.element(input()).toBeInTheDocument();
    await expect.element(slot(0)).toBeInTheDocument();
    await expect.element(slot(LENGTH - 1)).toBeInTheDocument();
  });

  it("lets data-testid override the base, and the slots follow it", async () => {
    const view = await render(
      <InputOTP maxLength={2} name={NAME} data-testid="verification">
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTP>,
    );
    const within = page.elementLocator(view.container);

    await expect.element(within.getByTestId("verification")).toBeInTheDocument();
    await expect.element(within.getByTestId("verification-slot-1")).toBeInTheDocument();
  });

  it("lets one slot override its own id without moving the others", async () => {
    const view = await render(
      <InputOTP maxLength={2} name={NAME}>
        <InputOTPSlot index={0} data-testid="first-box" />
        <InputOTPSlot index={1} />
      </InputOTP>,
    );
    const within = page.elementLocator(view.container);

    await expect.element(within.getByTestId("first-box")).toBeInTheDocument();
    await expect.element(within.getByTestId(`${NAME}-slot-1`)).toBeInTheDocument();
  });
});

describe("grouping, which the design does not use but the component still offers", () => {
  it("keeps the slots working across a separator", async () => {
    const view = await render(
      <InputOTP maxLength={4} name={NAME}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>,
    );
    const within = page.elementLocator(view.container);

    await userEvent.click(within.getByTestId(NAME));
    await userEvent.fill(within.getByTestId(NAME), "1234");

    // The last box is across the separator, so a group that broke the indexing
    // would leave it empty while the first two filled.
    await expect.element(within.getByTestId(`${NAME}-slot-3`)).toHaveTextContent("4");
    await expect.element(within.getByRole("separator")).toBeInTheDocument();
  });

  it("lays a grouped field out exactly like an ungrouped one", async () => {
    // The defect this replaced: a group was a nested flex container, so it took
    // half the row and its slots capped before spending it — 108px of slack on
    // the group's trailing edge at a 600px row, which put the dash 108px from
    // one group and 8px from the other. `display: contents` removes the group's
    // box, so there is one flex context and the arithmetic happens once.
    const view = await render(
      <div style={{ width: 600 }}>
        <InputOTP maxLength={6} name={NAME}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>,
    );
    const within = page.elementLocator(view.container);

    const slots = [...view.container.querySelectorAll("[data-state]")].map((el) =>
      el.getBoundingClientRect(),
    );
    const separator = within.getByRole("separator").element().getBoundingClientRect();

    // Equidistant, which is the thing that was visibly wrong.
    expect(Math.round(separator.left - slots[2].right)).toBe(
      Math.round(slots[3].left - separator.right),
    );

    // And every box the same width across the group boundary, so a grouped field
    // is the ungrouped one with a dash in it rather than a different layout.
    expect(new Set(slots.map((rect) => Math.round(rect.width))).size).toBe(1);
  });

  it("leaves the separator unnamed, so two of them are not one locator", async () => {
    const view = await render(
      <InputOTP maxLength={4} name={NAME}>
        <InputOTPSlot index={0} />
        <InputOTPSeparator />
        <InputOTPSlot index={1} />
        <InputOTPSeparator data-testid={`${NAME}-second-dash`} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTP>,
    );
    const within = page.elementLocator(view.container);

    // A `12-34-56` field draws two dashes, so a name derived from the field's
    // would be the same string on both — the role is what addresses them.
    const dashes = within.getByRole("separator").elements();
    expect(dashes).toHaveLength(2);
    expect(dashes[0]).not.toHaveAttribute("data-testid");

    // What a consumer passes still lands, which is how one of two is singled out.
    await expect.element(within.getByTestId(`${NAME}-second-dash`)).toBeInTheDocument();
  });
});

describe("pinning a box's appearance", () => {
  it("draws the state it was given rather than the one it is in", async () => {
    // What the visual sheet uses for `active`, which a still frame cannot hold
    // focus for. An app should never pass this.
    const view = await render(
      <InputOTP maxLength={2} name={NAME}>
        <InputOTPSlot index={0} state="active" />
        <InputOTPSlot index={1} />
      </InputOTP>,
    );
    const within = page.elementLocator(view.container);

    await expect
      .element(within.getByTestId(`${NAME}-slot-0`))
      .toHaveAttribute("data-state", "active");
    await expect
      .element(within.getByTestId(`${NAME}-slot-1`))
      .toHaveAttribute("data-state", "empty");
  });
});
