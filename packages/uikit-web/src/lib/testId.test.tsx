import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render, renderHook } from "vitest-browser-react";

import { TestIdProvider, usePartTestId } from "@/lib/testId";

const mount = (part: string, override?: string, base?: string) =>
  renderHook(() => usePartTestId(part, override), {
    wrapper: ({ children }) => <TestIdProvider value={base}>{children}</TestIdProvider>,
  });

describe("naming a part of a compound component", () => {
  it("derives the part's name from the base its root published", async () => {
    const { result } = await mount("content", undefined, "signup");

    expect(result.current.testId).toBe("signup-content");
  });

  it("nests a part's own internals under the part, not under the root", async () => {
    // A header's close button belongs to the header — that is what makes it findable
    // without knowing how the header is laid out inside.
    const { result } = await mount("header", undefined, "signup");

    expect(result.current.testIdFor("close")).toBe("signup-header-close");
  });
});

describe("a component nobody named", () => {
  it("hands out no ids at all", async () => {
    // Not a fallback name: an unnamed component must put nothing test-only into the
    // DOM of a consumer who never asked for it.
    const { result } = await mount("content");

    expect(result.current.testId).toBeUndefined();
    expect(result.current.testIdFor("close")).toBeUndefined();
  });

  it("still honours a name put on the part itself", async () => {
    const { result } = await mount("content", "just-this-one");

    expect(result.current.testId).toBe("just-this-one");
    expect(result.current.testIdFor("body")).toBe("just-this-one-body");
  });
});

describe("overriding a derived name", () => {
  it("replaces the derived name rather than extending it", async () => {
    // The escape hatch for two of the same part in one component: the override is the
    // whole name, so `signup-content` does not become `signup-content-secondary`.
    const { result } = await mount("content", "secondary", "signup");

    expect(result.current.testId).toBe("secondary");
    expect(result.current.testIdFor("body")).toBe("secondary-body");
  });
});

describe("one context serving every compound component at once", () => {
  /** Renders whatever name it resolves to, so a test can read it as text. */
  function Part({ part }: { part: string }) {
    const { testId } = usePartTestId(part);

    return <output>{testId ?? "(unnamed)"}</output>;
  }

  it("lets an inner base govern its own subtree and no more", async () => {
    // This is the whole reason one shared context is enough rather than one per
    // component: a `Select` inside a `Dialog` publishes its own base, its parts read
    // that, and the dialog's other parts go on reading the dialog's. Sharing the
    // context would only be wrong if it did not nest — so that is what is asserted.
    const view = await render(
      <TestIdProvider value="signup">
        <Part part="title" />
        <TestIdProvider value="country">
          <Part part="content" />
        </TestIdProvider>
      </TestIdProvider>,
    );
    const within = page.elementLocator(view.container);
    const [outer, inner] = within.getByRole("status").elements();

    expect(outer.textContent).toBe("signup-title");
    expect(inner.textContent).toBe("country-content");
  });

  it("leaves a part outside any provider unnamed", async () => {
    const view = await render(<Part part="content" />);
    const within = page.elementLocator(view.container);

    await expect.element(within.getByRole("status")).toHaveTextContent("(unnamed)");
  });
});
