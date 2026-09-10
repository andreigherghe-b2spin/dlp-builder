import type * as React from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { renderHook } from "vitest-browser-react";

import { InputOTP, InputOTPSlot, type InputOTPProps } from "@/molecules/InputOTP";
import { useInputOTPSlot } from "@/molecules/InputOTP/lib/useInputOTPSlot";

const NAME = "code";

/**
 * The hook reads two contexts — `input-otp`'s and the field's — so it is mounted
 * inside a real `InputOTP` rather than behind a hand-rolled provider. A stub
 * would let `isActive` and `char` be whatever the test says they are, and those
 * are exactly the two facts the library owns.
 *
 * The wrapper renders the real slots alongside the probe, and not only because
 * it is the arrangement that ships: `input-otp` stretches its `<input>` across
 * the container, so a field with nothing in it is a 0×0 box holding an element
 * Playwright will not click — every focus and hover case times out against a
 * bare wrapper.
 *
 * `onChange` is supplied on every mount, the static cases included: a controlled
 * `value` with no handler is React's read-only warning, and the fixed states come
 * from the value itself rather than from the absence of a handler.
 */
function mount(index: number, props: Partial<InputOTPProps> = {}) {
  const length = props.maxLength ?? 6;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <InputOTP maxLength={length} name={NAME} onChange={() => undefined} {...props}>
      {Array.from({ length }, (_, slot) => (
        <InputOTPSlot key={slot} index={slot} />
      ))}
      {children}
    </InputOTP>
  );

  return renderHook(() => useInputOTPSlot(index), { wrapper });
}

/** The field's own input, which is what a click has to land in to focus a slot. */
const field = () => page.getByTestId(NAME);

describe("which of Figma's boxes a slot draws", () => {
  it("is empty when the field has nothing in it", async () => {
    const { result } = await mount(0);

    expect(result.current.state).toBe("empty");
    expect(result.current.char).toBeNull();
  });

  it("is filled, and carries its character, once one has been typed", async () => {
    const { result } = await mount(1, { value: "16" });

    expect(result.current.state).toBe("filled");
    expect(result.current.char).toBe("6");
  });

  it("is active while the field holds focus at that position", async () => {
    const { result } = await mount(0);

    await userEvent.click(field());

    await expect.poll(() => result.current.state).toBe("active");
  });

  it("draws the caret on an active slot with nothing in it", async () => {
    const { result } = await mount(0);

    await userEvent.click(field());

    await expect.poll(() => result.current.caret).toBe(true);
  });

  it("is invalid rather than active, so an error survives being focused", async () => {
    const { result } = await mount(0, { invalid: true });

    await userEvent.click(field());

    // Polled rather than asserted straight away for the same reason the active
    // case is: focus is what would have moved it, and this proves it did not.
    await expect.poll(() => result.current.state).toBe("invalid");
  });

  it("is invalid rather than filled", async () => {
    const { result } = await mount(0, { value: "16", invalid: true });

    expect(result.current.state).toBe("invalid");
    // Still carries the character — only the box changed.
    expect(result.current.char).toBe("1");
  });

  it("is disabled rather than invalid, which is the design's own precedence", async () => {
    const { result } = await mount(0, { value: "16", invalid: true, disabled: true });

    expect(result.current.state).toBe("disabled");
  });
});

describe("hover, which belongs to the field rather than to one slot", () => {
  // The pointer's position is the browser's, not the render's — it stays where
  // the last test left it, so "hovered is false on mount" is not a claim about
  // the component and fails whenever a preceding file happened to leave the
  // cursor here. Both directions in one test instead, which is the real contract
  // and depends on nothing outside it.
  it("comes on when the field is hovered, and off again when the pointer leaves", async () => {
    const { result } = await mount(0);

    await userEvent.hover(field());
    await expect.poll(() => result.current.hovered).toBe(true);

    await userEvent.unhover(field());
    await expect.poll(() => result.current.hovered).toBe(false);
  });

  it("comes on for the last slot too — it is the field's, not one box's", async () => {
    const { result } = await mount(5);

    await userEvent.hover(field());

    await expect.poll(() => result.current.hovered).toBe(true);
  });

  // Not tested by pointing at a disabled field: `input-otp` gives its container
  // `pointer-events: none` and drives hover from the one `<input>` inside it, so
  // there is nothing a disabled field can be hovered *by* — Playwright refuses
  // the action rather than reporting `false`. The gate here is the library's
  // (`isHovering: !disabled && …`); the *box* is separately immune because
  // `InputOTPSlot` drops the overlay for a `disabled` state, which is the case a
  // pinned `state="disabled"` can otherwise reach.
  it("is off on a disabled field", async () => {
    const { result } = await mount(0, { disabled: true });

    expect(result.current.hovered).toBe(false);
  });
});

describe("a slot the field does not have", () => {
  it("draws an empty box rather than throwing", async () => {
    // Nine slots written under a `maxLength={4}` is a mistake a consumer can
    // make, and it should be visible rather than fatal.
    const { result } = await mount(9, { maxLength: 4 });

    expect(result.current.state).toBe("empty");
    expect(result.current.char).toBeNull();
    expect(result.current.caret).toBe(false);
  });
});
