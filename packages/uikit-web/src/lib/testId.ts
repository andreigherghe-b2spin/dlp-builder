"use client";

import * as React from "react";

import { createTestIdFor } from "@/lib/utils";

/**
 * The `data-testid` base shared by the parts of a compound component.
 *
 * For a component the consumer assembles — `Dialog`, `Select` — there is nowhere to
 * hang the base and no prop chain to thread it down: the root frequently renders no
 * element at all (`DialogPrimitive.Root`, `SelectPrimitive.Root`) and the parts are
 * siblings in the caller's JSX rather than children the component passes props to.
 * So the root publishes the base and each part reads it.
 *
 * One context serves every such component rather than one per component, because
 * context is already scoped by the tree: a `Select` inside a `Dialog` publishes its
 * own base for its own subtree, its parts read that, and the dialog's other parts go
 * on reading the dialog's. Nesting comes out right without anything keeping track.
 *
 * Not in `lib/utils.ts` despite being shared: that file is published as
 * `@ui/web/utils` for `cn()`, and putting a context in it would make every consumer
 * of `cn` pull in React and a client boundary.
 */
const TestIdContext = React.createContext<string | undefined>(undefined);

/**
 * Publishes the base its subtree derives from. Render it around a compound
 * component's parts; `undefined` is the value for a component nobody named, which is
 * what keeps test-only attributes out of a consumer's DOM.
 */
const TestIdProvider = TestIdContext.Provider;

/**
 * A part's own `data-testid`, and a deriver for whatever it renders inside.
 *
 * Parts the consumer composes sit flat under the base — `<base>-content`,
 * `<base>-title` — because that is the order they are written in. A part's *own*
 * internals nest under the part instead, so a header's close button is
 * `<base>-header-close`: it belongs to the header rather than to the dialog.
 *
 * @param {string} part - What this part appends to the base, e.g. `"header"`
 * @param {string} [override] - A `data-testid` put on this part directly. Replaces the
 * derived name rather than extending it, which is the escape hatch for two of the same
 * part in one component.
 * @returns {{ testId?: string, testIdFor: (part: string) => string | undefined }}
 */
function usePartTestId(part: string, override?: string) {
  const base = React.useContext(TestIdContext);
  const testId = override ?? createTestIdFor(base)(part);

  return { testId, testIdFor: createTestIdFor(testId) };
}

export { TestIdProvider, usePartTestId };
