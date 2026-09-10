import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import {
  CollapsibleProvider,
  useCollapsible,
  useSizedFor,
} from "@/molecules/Collapsible/lib/context";

// `.test.tsx` and so the browser runtime, because `renderHook` mounts the hook into a
// real document — the extension follows what the test imports, not whether it holds JSX.

/** What a root publishes, so a test states only the part it is about. */
const published = (value: Partial<Parameters<typeof CollapsibleProvider>[0]["value"]> = {}) => ({
  size: "default" as const,
  disabled: false,
  labelId: "label-1",
  hasRoot: true,
  ...value,
});

describe("reading the size a collapsible was set to", () => {
  it("falls back to the compact size when there is no root above it", async () => {
    // A part rendered on its own is a composition error the types do not catch. It
    // draws the default size rather than throwing: a design system crashing a page
    // over a missing wrapper is worse than one drawing the smaller of two rows.
    const { result } = await renderHook(() => useCollapsible());

    expect(result.current).toEqual({
      size: "default",
      disabled: false,
      labelId: undefined,
      // The one thing the fallback says about itself: nobody chose this size, so the
      // composition check below has nothing to disagree with.
      hasRoot: false,
    });
  });

  it("reports what the nearest root published", async () => {
    const { result } = await renderHook(() => useCollapsible(), {
      wrapper: ({ children }) => (
        <CollapsibleProvider value={published({ size: "large", disabled: true })}>
          {children}
        </CollapsibleProvider>
      ),
    });

    expect(result.current).toMatchObject({ size: "large", disabled: true, labelId: "label-1" });
  });

  it("gives a nested collapsible its own answer rather than its parent's", async () => {
    // The panel of a large collapsible is a place a compact one can go, and the inner
    // parts have to read the inner size. Context is already scoped by the tree, so this
    // needs nothing keeping track — the test is here to prove nothing was added that
    // does.
    const { result } = await renderHook(() => useCollapsible(), {
      wrapper: ({ children }) => (
        <CollapsibleProvider value={published({ size: "large", disabled: true })}>
          <CollapsibleProvider value={published({ labelId: "inner" })}>
            {children}
          </CollapsibleProvider>
        </CollapsibleProvider>
      ),
    });

    expect(result.current).toMatchObject({ size: "default", disabled: false, labelId: "inner" });
  });
});

describe("checking a part is the one this size is composed from", () => {
  /** Mounts `useSizedFor` under a root of `size`, capturing what it warned. */
  async function check(expected: "default" | "large", size: "default" | "large") {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = await renderHook(() => useSizedFor(expected, "CollapsibleTrigger"), {
      wrapper: ({ children }) => (
        <CollapsibleProvider value={published({ size })}>{children}</CollapsibleProvider>
      ),
    });

    const messages = warn.mock.calls.map(([message]) => String(message));
    warn.mockRestore();

    return { messages, size: result.current };
  }

  it("says nothing when the part matches the size", async () => {
    const { messages, size } = await check("default", "default");

    expect(messages).toEqual([]);
    // It reports the size either way — the check rides along on the read rather than
    // being a second hook every part has to remember.
    expect(size).toBe("default");
  });

  it("names the part and the size it was found under", async () => {
    const { messages } = await check("default", "large");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("CollapsibleTrigger");
    expect(messages[0]).toContain('size="large"');
    // And says what to do instead, which is the half a warning usually leaves out.
    expect(messages[0]).toContain("CollapsibleHeader");
  });

  it("points a misplaced large part back at the compact one", async () => {
    const { messages } = await check("large", "default");

    expect(messages[0]).toContain("CollapsibleTrigger");
  });

  it("says nothing for a part rendered with no root above it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // A story showing one row on its own. The fallback size is not a decision anybody
    // made, so there is nothing for the part to disagree with.
    await renderHook(() => useSizedFor("large", "CollapsibleHeader"));

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
