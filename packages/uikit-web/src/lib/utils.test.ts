import { describe, expect, it } from "vitest";

import { cn, createTestIdFor, fieldBox } from "@/lib/utils";

describe("merging classes", () => {
  it("lets the last of two conflicting utilities win", () => {
    // The whole reason components spread `className` last: a consumer's class has
    // to be able to override the variant's, and `cn` is what makes that true.
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-background-layout-surface-variant1", "bg-transparent")).toBe("bg-transparent");
  });

  it("keeps classes that only look like they conflict", () => {
    expect(cn("px-4", "py-1")).toBe("px-4 py-1");
  });

  it("drops the falsy values a conditional class leaves behind", () => {
    // Annotated rather than inferred, so this reads as the conditional a component
    // actually writes instead of as a constant eslint can fold away.
    const hidden: boolean = false;

    expect(cn("flex", hidden && "hidden", null, undefined, "")).toBe("flex");
  });

  it("takes the array and object forms clsx accepts", () => {
    expect(cn(["flex", "w-full"], { hidden: false, "sr-only": true })).toBe("flex w-full sr-only");
  });
});

describe("deriving a part's test id", () => {
  it("prefixes each part with the base the root was given", () => {
    const testIdFor = createTestIdFor("textfield");

    expect(testIdFor("label")).toBe("textfield-label");
    expect(testIdFor("input")).toBe("textfield-input");
  });

  it("returns undefined for every part when the root was not named", () => {
    // This is the point of the helper rather than a quirk of it: nothing
    // test-only may reach the DOM of a consumer who did not ask for it, and
    // `undefined` is what React drops the attribute for.
    const testIdFor = createTestIdFor(undefined);

    expect(testIdFor("label")).toBeUndefined();
    expect(testIdFor("input")).toBeUndefined();
  });

  it("treats an empty base as a name, not as an absence", () => {
    // `!= null`, not truthiness — `data-testid=""` is a deliberate (if odd)
    // choice a consumer can make, and silently ignoring it would be surprising.
    expect(createTestIdFor("")("label")).toBe("-label");
  });
});

describe("the shared field box", () => {
  it("styles itself from theme variables only", () => {
    // A raw palette class or a hex literal here would ship a colour no brand can
    // retheme, and this string is inherited by every text-shaped control.
    expect(fieldBox).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(fieldBox).not.toMatch(
      /\b(?:bg|text|border)-(?:red|blue|green|gray|zinc|slate)-\d{2,3}\b/,
    );
  });

  it("carries the states a control is expected to have", () => {
    for (const state of ["focus-visible:", "aria-invalid:", "disabled:"]) {
      expect(fieldBox).toContain(state);
    }
  });
});
