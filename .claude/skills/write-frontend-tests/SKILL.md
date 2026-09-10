---
name: write-frontend-tests
description: Writes, extends or reviews Vitest tests in packages/uikit-web — component tests, hook unit tests, lib/ helper tests. Use whenever a test file is being added or changed, when a component is promoted out of WIP and needs coverage, when the src/**/lib/** coverage threshold fails, when deciding what may be mocked, or when asked which components still lack tests. Use it before writing the first line of any test in this repo.
---

# Write frontend tests

`packages/uikit-web` is the only package with a real test setup. Everything here is about it.
`storybook-web` has one thing — the story metadata guard in `guards/` — and `uikit-native` has none.

## The two runtimes, picked by the test's extension

| Extension    | Project   | Environment                | For                                                       |
| ------------ | --------- | -------------------------- | --------------------------------------------------------- |
| `*.test.ts`  | `node`    | node                       | pure functions: `lib/utils.ts`, resolvers, class builders |
| `*.test.tsx` | `browser` | real Chromium (Playwright) | anything that mounts React — components **and** hooks     |

Nothing is configured per file; `vitest.config.ts` splits on the glob.

### Naming a file so it lands in the right runtime

Two separate questions, and only one of them has a rule behind it. Keep them apart.

#### The rule: a test's extension follows the runtime it needs

Mechanical, and something actually enforces it, so apply it rather than guessing:

> Does the test import from `vitest-browser-react` or `vitest/browser`?
> **Yes → `.test.tsx`. No → `.test.ts`.**

Anything calling `render` or `renderHook` imports one of those, and both throw on import outside
browser mode — a file in the wrong project does not merely run slowly, it fails to load:

```
Error: vitest/browser can be imported only inside the Browser Mode.
Your test is running in forks pool.
```

Note what this rule is _not_ keyed on. **A JSX-free test can still need the browser.**
`useStepper.test.tsx` contains not one angle bracket and cannot run in node, because `renderHook`
needs a document to mount the hook into. So do not reach for "is there JSX in it" here; ask what it
imports. And nothing will move such a test to node: there is no jsdom in this package.

The pay-off is real — a `.test.ts` runs in a node worker in milliseconds, a `.test.tsx` starts
Chromium. So put every pure function in a `.test.ts` and keep the browser for what genuinely needs a
DOM, which is most of why a component's logic is worth extracting into `lib/` at all.

#### The recommendation: name a source file `.ts` when it holds no JSX

A preference, not a rule. Nothing enforces it and nothing breaks if you ignore it: a `.tsx` with no
JSX in it compiles and runs exactly the same, and — this is the part worth being clear about —
renaming it changes **nothing** about which runtime its test lands in. That is decided entirely by
the rule above.

Worth doing anyway, because the extension is a claim about the file. Most hooks here hold state and
arithmetic while the provider that _renders_ a context lives with the component, so they have no JSX
at all: `useStepper.ts`, `useFormField.ts`, `useCarousel.ts` and `useDialogTestId.ts` are all plain
`.ts`. A `.tsx` among them is a file saying it renders something it does not. Check when you create
one; leave an existing one alone unless you are already editing it.

There is no jsdom here and none is coming. These components are laid out by CSS and then _measured_ —
Embla measures the carousel's slides, Radix measures a popper before it places it. A simulated DOM has
neither layout nor measurement, so a test written against one asserts on a component that never
happened: every slide auto-width, the whole track on screen, and a carousel that cannot scroll passing
its scroll tests by doing nothing.

Globals are off. Import what you use:

```tsx
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render, renderHook } from "vitest-browser-react";
```

## Where a test lives

**Beside the file it tests, in the same directory.** Never a `__tests__/`, never a `test/`, never a
mirrored tree under a top-level `tests/`. One test file per source file, named after it.

```
atoms/Badge.tsx
atoms/Badge.test.tsx                 flat component -> flat test

organisms/Stepper/
  index.tsx
  ui/Stepper.tsx
  ui/Stepper.test.tsx                the UI test, beside the component in ui/
  lib/useStepper.ts                  no JSX in it, so .ts
  lib/useStepper.test.tsx            its unit test still mounts, so .test.tsx
  lib/utils.ts
  lib/utils.test.ts                  pure -> .ts -> node
```

A test file next to a component does not reach `dist/`: tsup discovers entries as "a `.tsx` file, or a
directory with an `index.tsx`", and the package publishes `files: ["dist"]` only. There is no reason to
move tests away from the code to keep them out of the build.

## What has to be covered

**Every molecule and organism at `Needs Review` or `Verified`.** The status is the first segment of
the story title (`Verified/Molecules/TextField`) and its matching `status:*` tag.

Two exemptions, for different reasons. **WIP** is exempt because its shape is still moving and a test
written against it is a test rewritten next week. **Atoms are exempt at every status**: an atom
renders one semantic element out of props and CVA branches, and between its stories and its visual
baseline in three themes, a Vitest file over it would mostly restate the class list. What that leaves
uncovered is real but cheap to catch; what molecules and organisms leave uncovered is composition,
and composition fails silently — a prop stops being forwarded, an id stops matching a label, a testid
stops being derived, and nothing turns red. That is where the requirement is pointed.

Writing one for an atom anyway is fine when it earns its place — `Select.test.tsx` exists because
`Select` publishes a testid base through context and that is a mechanism, not a class list. It is
simply not owed.

**Both halves of a component laid out as a directory: the UI _and_ every hook in its `lib/`.** These
are two different contracts. A UI test drives the hook through the component and proves they work
together; it does not pin the hook's own behaviour, and the hook is a thing a consumer can import and
use on its own. `useStepper` deciding that `nextStep()` fills a sub-step before it leaves the step is
the hook's contract, and it belongs in `useStepper.test.tsx` where it can be read.

**`src/**/lib/**` to 85%** — lines, functions, branches and statements. Enforced, not advisory: the
test command fails under it, and so does CI. See [Coverage](#coverage-one-command-does-both).

**Components carry no numeric threshold**, deliberately. A component here is already covered by three
suites at once — this one, its Storybook stories, and the Playwright visual baselines — and a
percentage measured over JSX would mostly report how many CVA branches a test happened to render.

**Leave the genuinely expensive cases out.** A case that needs a faked `ResizeObserver`, a stubbed
frame budget and forty lines of setup to assert one class is a case to skip, and to say you skipped in
the PR. The 85% is a floor under `lib/`, not a score to chase: a test whose only purpose is a
percentage is worse than the gap it fills, because it will be maintained forever and assert nothing.

## Addressing the DOM

Preference order, strictly:

1. **Accessible queries** for anything a person perceives — `getByRole`, `getByLabelText`,
   `toHaveAccessibleName`, `toBeDisabled`, `toHaveAttribute("aria-current")`. This is a design system;
   the accessible name of a button _is_ part of its contract, so testing through it tests two things at
   once. Prefer these over a testid whenever both would work.
2. **`data-testid`** for structural parts a user cannot name: the track a carousel translates, the
   connector between two steps, the indicator row, the wrapper a class lands on.
3. **Nothing else.** No CSS class selectors, no tag-name paths like `div > span:first-child`. They
   break on a wrapper nobody remembers adding, and they fail in a way that reads as a component bug.

**Never `data-slot`.** It is being removed from `src/` — from the attributes _and_ from every style
selector that reads one. A test that finds a part by `data-slot` pins an attribute on its way out.
`browser.locators.testIdAttribute` stays at its default `data-testid`; do not alias it, do not add a
`getBySlot`. A part you cannot reach by testid means the component has not been migrated yet — migrate
it, do not route around it.

A component derives its parts' ids from the `data-testid` it was given, via `createTestIdFor` from
`src/lib/utils.ts`. So a test names the root once and every part follows from it:

```tsx
const view = await render(<Stepper data-testid="stepper" steps={steps} />);
// Scoped to this render: page.getByTestId searches the whole document, and the
// page is shared by every test in the file even though the setup unmounts.
const within = page.elementLocator(view.container);

await expect
  .element(within.getByTestId("stepper-item-two"))
  .toHaveAttribute("data-state", "current");
```

Pass the root testid in the test even when a consumer would not. `createTestIdFor` returns `undefined`
for every part when the root was not named, so an unnamed root makes the whole component unaddressable
— that is the design, and it is why the mount helper always supplies one.

**A form control is already named, so do not pass one.** `textfield`, `selectfield`, `checkboxfield`
and `switchfield` require `name` and default the testid base to it, so `<TextField name="email" />` is
addressable as `email`, `email-label`, `email-input` and `email-description` with nothing added. Use
those. Passing a separate `data-testid` to a field in a test only hides the id the app will really
have.

## What may be mocked

| Thing                                             | Mock it?                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| Another uikit component                           | **Never** — see below                                                    |
| `src/lib/utils.ts`, or the component's own `lib/` | **Never** — that is the code under test                                  |
| Network, `fetch`, an API client                   | Yes                                                                      |
| State: a store, a context provider, form state    | Yes — hand the component the state the case needs                        |
| Time: `vi.useFakeTimers()`, `vi.setSystemTime()`  | Yes                                                                      |
| A third-party library                             | Only when it genuinely cannot run in the test, with a comment saying why |

**The rule that matters: a uikit component is never mocked, not even when it is a dependency rather
than the subject.** `SelectField` renders a real `Select`, a real `Label` and real `Typography`.
Mocking `Select` out of it converts the test into "SelectField calls a function", which keeps passing
after the composition breaks — a prop stops being forwarded, an id stops matching a label, a testid
stops being derived. Composition _is_ most of what a design system does, and the seams between
components are precisely where it fails. Render the real thing.

Mocking an external library is a last resort and needs a reason in the file. `react-day-picker` or
`embla-carousel` running for real is the point of the browser runtime; reach for a mock only when the
library needs something the test environment cannot give it.

Fake timers deserve one caution: `userEvent` and Playwright's own waiting run on real timers, so
installing fake ones around an interaction can deadlock the test. Fake time for a hook or a helper that
reads the clock; for a component that animates, wait for the condition instead.

## The shape of a test

- **`describe` names a behaviour, not an export.** `describe("moving it with the arrows")`, not
  `describe("Carousel")` — the file already says which component this is. Nest by behaviour when a file
  covers several.
- **`it` reads as a sentence about the component**, in the present tense, and covers one behaviour:
  `it("steps to the next slide and back again")`.
- **One mount helper per file**, returning named accessors for the parts and the assertions the file
  repeats. This is what keeps twenty tests from each rebuilding the same locators — see
  `organisms/Carousel/ui/Carousel.test.tsx` for the reference.
- **Assert the user-visible outcome, twice over where a single check would pass a half-broken
  component.** The carousel checks where the slides physically are _and_ which dot is marked, because
  either alone passes a carousel with a broken indicator.
- **`expect.element(locator)` retries** until it matches; `locator.element()` takes a snapshot right
  now. Use the first for anything that settles, the second when you are about to measure geometry.
- **No snapshot tests of markup.** A `toMatchSnapshot` over rendered HTML fails on every class change
  and describes no behaviour. Pixels are the visual suite's job, not Vitest's.

A hook test renders the hook and drives its returned functions:

```tsx
const { result } = await renderHook(() => useStepper({ steps }));

expect(result.current.activeStep).toBe("email");
await act(() => result.current.nextStep());
expect(result.current.activeStep).toBe("profile");
```

Every state update has to survive being run twice — StrictMode double-invokes — so assert the outcome
of an action, never a call count on a setter.

## Async: wait for the condition, never for a duration

A `setTimeout` in a test is a guess about the slowest machine on its worst day. Wait for the thing you
actually mean:

- `await expect.element(...)` — retries the assertion.
- `await vi.waitFor(() => expect(...))` — for a condition that is not a single locator.
- A **settle** loop when geometry is what you are asserting: an animated component approaches its
  resting place asymptotically and passes through the right-looking position on the way there.
  `Carousel.test.tsx` waits until the transform stops moving by more than half a pixel for 100ms, and
  measures milliseconds rather than frames because the headless frame rate is not 60.

The one legitimate sleep is proving that something _did not_ happen — a paused autoplay that must hold
still — and even then it belongs in a named helper (`expectStill`) so it reads as an assertion.

## Coverage: one command does both

```bash
pnpm --filter @ui/web test     # the tests and the coverage gate, one run
pnpm coverage                  # an alias for exactly that, from the repo root
```

There is no separate coverage step, locally or in CI, and there must not be one. `test` _is_
`vitest run --coverage`: a single run produces both the results and the percentages, so a green `test`
means the tests passed and the thresholds held, with no second pass to keep in sync and no chance of
the two disagreeing about which files exist.

Reporting is Vitest's too, deliberately. The `text` reporter prints a per-file and per-directory table
in the terminal and in the CI log, and a missed threshold prints the gated number and the metric that
missed it:

```
ERROR: Coverage for branches (81.7%) does not meet "**/lib/**" threshold (85%)
```

Resist adding a script that reformats any of that. One existed here and was deleted: to print "the
gated number" it had to know the threshold, so it hardcoded `85` a second time, next to a config that
owns it — two places to change one number, and no way to notice when they disagreed. CI uploads the
`html` report as an artifact for anyone who wants to click through the lines.

If the gate fails, the report names the file and the uncovered lines. Fix it by testing the branch, not
by adding the file to `coverage.exclude` — an exclusion is a change to what the project promises and
needs saying out loud.

Both CI jobs are required to merge and to release: **Unit Tests** and **Visual Tests**.

## Checklist

Copy this into the task and tick it off:

```
- [ ] Test sits beside its source, named `<source>.test.ts(x)`
- [ ] Extension matches the runtime: .ts for pure functions, .tsx for anything that renders
- [ ] Molecule or organism at Needs Review/Verified has a UI test (atoms exempt)
- [ ] Every hook in the component's lib/ has its own unit test
- [ ] Parts addressed by role/label first, `data-testid` second, never `data-slot`
- [ ] No uikit component mocked; every mock that exists says why
- [ ] Waits are conditions, not durations
- [ ] `pnpm --filter @ui/web test` green, including the 85% lib/ gate
- [ ] Skipped cases named in the PR description
```
