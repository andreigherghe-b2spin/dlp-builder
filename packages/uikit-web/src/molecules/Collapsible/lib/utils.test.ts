import { describe, expect, it } from "vitest";

import {
  collapsibleContentVariants,
  collapsibleLabelVariants,
  collapsibleTriggerVariants,
} from "@/molecules/Collapsible/lib/utils";

// What is left here is the handful of decisions **a camera cannot photograph**: a
// specificity race between two overlays, a rule keyed on `[hidden]` rather than on
// `data-state`, and an animation that has to disappear under reduced motion. None of
// those show up in a still frame — one needs two states at once, one is only visible
// mid-exit, one is switched off in every screenshot by `animations: "disabled"`.
//
// What used to be here and is gone: which border, radius, type size, icon size or
// background each variant reaches for. Those are drawn in every one of the three
// themes' visual baselines, which is where a wrong token actually shows; asserting
// them as strings only restated `utils.ts` in a second file, and broke on any token
// rename while proving nothing about the component.
describe("the trigger row", () => {
  it("keeps the selected overlay unprefixed, so hover and pressed still beat it", () => {
    // A pseudo-class carries one specificity class more than a plain one, so
    // `button-base:hover` wins over this regardless of the order the two are emitted
    // in. A `hover:`-prefixed selected overlay would have made that a coin toss.
    expect(collapsibleTriggerVariants({ selected: true })).not.toContain("hover:bg-linear");
  });
});

describe("the label's type", () => {
  it("carries no colour of its own, so the row can recolour it", () => {
    for (const size of ["default", "large"] as const) {
      expect(collapsibleLabelVariants({ size })).not.toContain("text-foreground-");
    }
  });
});

describe("the panel", () => {
  it("hides a closed panel on the attribute Radix sets, not on its state", () => {
    // `data-state="closed"` is on the element for the whole exit animation, so hiding
    // on it would mean the collapse is never seen. `hidden` arrives when Radix is
    // actually done.
    expect(collapsibleContentVariants({})).toContain("[&[hidden]]:hidden");
    expect(collapsibleContentVariants({})).not.toContain("data-[state=closed]:hidden");
  });

  it("animates open and shut, and not at all under reduced motion", () => {
    const panel = collapsibleContentVariants({});

    expect(panel).toContain("data-[state=open]:animate-collapsible-expand");
    expect(panel).toContain("data-[state=closed]:animate-collapsible-collapse");
    expect(panel).toContain("motion-reduce:animate-none");
  });
});
