import type { ControllerFieldState } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { acceptMatcher, errorMessage, validationFor } from "@/organisms/Form/lib/utils";

function fieldState(state: Partial<ControllerFieldState> = {}): ControllerFieldState {
  return { invalid: false, isDirty: false, isTouched: false, isValidating: false, ...state };
}

describe("the message a field shows", () => {
  it("passes the validation message through", () => {
    expect(errorMessage(fieldState({ error: { type: "required", message: "Required" } }))).toBe(
      "Required",
    );
  });

  it("has no message when the field is valid", () => {
    expect(errorMessage(fieldState())).toBeUndefined();
  });

  it("treats an empty message as no message", () => {
    // `required: true` instead of `required: 'message'` fails with an empty
    // string. Passing it on would replace the helper text with an empty
    // `role="alert"` — the invalid state travels through `invalid` instead.
    expect(
      errorMessage(fieldState({ invalid: true, error: { type: "required", message: "" } })),
    ).toBeUndefined();
    expect(
      errorMessage(fieldState({ invalid: true, error: { type: "required" } })),
    ).toBeUndefined();
  });
});

describe("the rule that decides which keystrokes are accepted", () => {
  it("has no matcher when there is no rule", () => {
    expect(acceptMatcher(undefined)).toBeNull();
  });

  it("answers the same way twice for the same value", () => {
    // A sticky or global expression advances `lastIndex` on every `test`, so the
    // original would accept and reject the same keystroke on alternate presses.
    const matcher = acceptMatcher(/\d+/g)!;

    expect(matcher.test("123")).toBe(true);
    expect(matcher.test("123")).toBe(true);
    expect(matcher.lastIndex).toBe(0);
  });

  it("drops only the sticky and global flags, keeping the rest", () => {
    const matcher = acceptMatcher(/ab/giy)!;

    expect(matcher.flags).toBe("i");
    expect(matcher.test("AB")).toBe(true);
  });
});

describe("which validation glyph the field draws", () => {
  it("obeys an explicit validation whatever the field state says", () => {
    const touchedAndInvalid = fieldState({ isTouched: true, invalid: true });

    expect(validationFor({ validation: "positive", fieldState: touchedAndInvalid })).toBe(
      "positive",
    );
    expect(validationFor({ validation: "negative", fieldState: fieldState() })).toBe("negative");
  });

  it("draws nothing until the field has been touched", () => {
    // A form should not open covered in crosses.
    expect(
      validationFor({ showValidation: true, fieldState: fieldState({ invalid: true }) }),
    ).toBeUndefined();
  });

  it("draws nothing at all unless asked to show validation", () => {
    expect(
      validationFor({ fieldState: fieldState({ isTouched: true, invalid: true }) }),
    ).toBeUndefined();
  });

  it("follows the field state once touched and asked", () => {
    expect(
      validationFor({
        showValidation: true,
        fieldState: fieldState({ isTouched: true, invalid: true }),
      }),
    ).toBe("negative");
    expect(
      validationFor({ showValidation: true, fieldState: fieldState({ isTouched: true }) }),
    ).toBe("positive");
  });
});
