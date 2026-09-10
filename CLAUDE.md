# B2Spin UIKit

pnpm monorepo of React and React Native UI component libraries with multi-brand theming, built for B2Spin products.

## Packages

| Package                 | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `packages/uikit-web`    | React 19 component library (Radix UI, Tailwind CSS v4, CVA) |
| `packages/uikit-native` | React Native component library (rn-primitives, Uniwind)     |
| `packages/uikit-themes` | Multi-brand CSS design tokens                               |
| `apps/storybook-web`    | Web Storybook (Vite, Playwright visual tests)               |
| `apps/storybook-native` | Native Storybook (Expo)                                     |

## Tech stack

- React 19 / React Native 0.83.6 / TypeScript ~5.9.3
- Tailwind CSS v4 (web), Uniwind (native)
- class-variance-authority (CVA) for component variants
- tailwind-merge + clsx for class merging
- Radix UI primitives (web), rn-primitives (native)
- tsup for building packages
- Vitest for unit tests (uikit-web only)
- Playwright for visual regression tests (storybook-web)

## Package manager and commands

```bash
pnpm install          # install all workspace deps
pnpm check            # everything CI checks, in cheapest-first order — run before pushing
pnpm build            # build all packages (Turborepo)
pnpm dev              # start all dev watchers
pnpm test             # run all tests (Turborepo)
pnpm lint             # lint all packages (Turborepo)
pnpm changeset        # create a changeset entry
pnpm publish-versions # publish packages to Google Artifact Registry
```

Run commands for a single package:

```bash
pnpm --filter @ui/web build
pnpm --filter @ui/web test
pnpm --filter storybook-web dev
```

## Component conventions (uikit-web)

- Components live under `packages/uikit-web/src/{atoms,molecules,organisms}/`, one atomic-design
  level per directory. Classify by what a component **renders**, which is the one thing the
  tree actually follows:
  - **Atom** — renders no other uikit component. It may still be compound, portal, and
    publish context: `Select` is a `Verified` atom with ten sub-components, a portalled menu
    and a `TestIdProvider`, and `Tooltip` is the same shape.
  - **Molecule** — renders atoms. `TextField` renders `Input` + `Label` + `Button`.
  - **Organism** — renders molecules (`Form`), or traps focus (`Dialog`, `AlertDialog`,
    `Sheet`, `Drawer`).

  **Borrowing a class builder is not rendering.** `captionVariants`, `labelVariants`,
  `bodyVariants` and `fieldBox` are the type scale and the shared field box, not components,
  so importing them keeps an atom an atom — `Badge`, `Label` and `Tooltip` all do it. That is
  also the rule that keeps "text is styled through Typography" (see CLAUDE.local.md) from
  pushing every styled atom up a level.

  **A portal decides nothing.** Portals are spread across all three levels — `Select` and
  `Tooltip` are atoms, `Popover` and `DropdownMenu` molecules, `Dialog` and `Sheet`
  organisms — so "it portals" is not evidence of anything. Neither is a `lib/` hook:
  `InputOTP`, `Tabs` and `Timer` are molecules with one each. A **focus trap** is the only
  behavioural test that holds — all four modals are organisms, and nothing below is one.

  Import direction is clean and worth keeping that way: nothing imports upward, no molecule
  imports an organism, no atom imports either. There is no lint rule enforcing it.

  Two placements fit none of the above and are history rather than precedent — do not cite
  them: `organisms/Calendar` (a react-day-picker wrapper that renders one atom) and
  `organisms/Table` (part components with no state, no portal and no imports).

- A component is laid out in one of exactly two ways — pick one, do not invent a third:

  | Layout           | Use it when                                            |
  | ---------------- | ------------------------------------------------------ |
  | `foo.tsx`        | The component fits one readable file. Most components. |
  | `foo/` directory | It needs sub-components, a hook or helpers of its own. |

  **An organism is always the directory form**, even one that would fit in a single file
  today. An organism orchestrates state, so it grows a hook; the hook needs a test of its
  own, and that test has to live in a `lib/` beside it. Starting flat means moving the file
  and rewriting its imports the first time either happens.

  The directory form is:

  ```
  foo/
    index.tsx   # the only public surface — re-exports and nothing else
    ui/         # the component and its sub-components
    lib/        # hooks and helper functions used only by this component
  ```

  Inside a component directory a file is named after what it exports, in that export's
  own casing: `ui/FormSelectField.tsx` exports `FormSelectField`, `lib/useFormField.ts`
  exports `useFormField`. Prefer `.ts` for a hook that holds no JSX — most hold none, since the
  provider that renders the context lives with the component — but it is a naming
  preference, not a constraint: it changes nothing about which Vitest runtime the hook's
  _test_ runs in. Nothing outside `foo/` may import deeper than `foo` — what `index.tsx`
  does not export is internal.

  Both layouts, across all three level directories, flatten to the same entry
  name (`components/ui/<basename>`) regardless of level or layout — moving a
  component between levels or between the two layouts never changes `dist/` or
  what consumers import.

- tsup auto-discovers entries (a `.tsx` file, or a directory with an `index.tsx`)
  across the three level directories; no manual registration.
- Use CVA for variant definitions. Use `cn()` from `src/lib/utils.ts` for class merging.
- Helpers shared by more than one component go in `src/lib/utils.ts`, not copied per
  component. Helpers used by one component go in its `lib/`.
- Use `@/` path alias for internal imports (e.g. `@/atoms/Button`).
- After adding a component, run `pnpm --filter @ui/web codegen:docs` to regenerate `ai-docs.json`.
- Exports are defined dynamically via tsup; no manual entry registration needed.

### File naming: a file is named after what it exports

One rule, and the casing follows from it rather than from where the file sits:

| File holds        | Name           | Examples                                              |
| ----------------- | -------------- | ----------------------------------------------------- |
| A React component | **PascalCase** | `AspectRatio.tsx`, `InputOTP.tsx`, `DialogHeader.tsx` |
| A hook            | camelCase      | `useCountdown.ts`, `useFormField.ts`                  |
| Helpers, a module | camelCase      | `utils.ts`, `testId.ts`, `componentDocs.ts`           |

So a component directory reads as `Collapsible/index.tsx`, `Collapsible/ui/CollapsibleTrigger.tsx`,
`Collapsible/lib/useCollapsible.ts` — `ui/` and `lib/` stay lowercase, because they are
structure rather than exports, and so does `index.tsx`, which is a barrel and exports no
one name. Stories and Playwright specs are named after the component they cover, so they
are PascalCase too: `Button.stories.tsx`, `Button.tag.visual.ts`.

`InputOTP.tsx` rather than `InputOtp.tsx` is the rule working, not an exception to it: the
export is `InputOTP`, and the file is named after the export. When in doubt, read the
export, do not transform the old filename.

**Two things outside that are deliberately left kebab-case**, and stay that way in both
directions — do not rename an existing one, and name a new one to match its neighbours:

- **Anything under a `scripts/` directory** — `reindex-uikit-docs.js`,
  `component-entries.ts`, `run-tag-tests.js`, `dev-link.mjs`, `tokens-to-css.js`. None of
  it is React, none of it is published, and a `scripts/` entry reads as the command that
  runs it (`node scripts/dev-link.mjs`), next to the kebab-cased npm script beside it.
- **Directories and files that are already a published path** — `mcp-server/` (shipped as
  `@ui/web/mcp-server/*` and named in every consumer's `.mcp.json`) and
  `src/docs/ai-docs.json` (`@ui/web/ai-docs.json`). Renaming a component is worth a major;
  renaming these buys nothing and breaks an agent's config.

The rule is mechanical rather than a matter of taste, because a component's basename is
not just a filename:

```
src/molecules/DropdownMenu.tsx   →   dist/components/ui/DropdownMenu.js
                                 →   @ui/web/DropdownMenu
                                 →   DropdownMenu.stories.tsx  (meta id: "DropdownMenu")
                                 →   DropdownMenu.tag.visual.ts
```

One string spans the source file, the tsup entry, the published subpath, the story file,
the pinned story id and the Playwright spec. `listComponents` in
[scripts/component-entries.ts](packages/uikit-web/scripts/component-entries.ts) is what
derives it, and the story-metadata guard fails if any of them drift apart. So renaming a
component file is a **breaking change for consumers** — it moves `@ui/web/<name>` — and
belongs in a major changeset, never folded into an unrelated fix.

**A rename that differs only in case is invisible to git on macOS.** `core.ignorecase` is
true there, so `git add` matches `TextField.tsx` on disk to `textfield.tsx` in the index
and updates _that_ entry — the commit then carries the new content under the old name, and
Linux CI fails to resolve every import of it. Files take `git mv -f old New`; a directory
takes two hops through a third name, because a case-only directory rename is
`rename(dir, dir)` and returns `EINVAL`. Never stage a rename like this with a bare
`git add`.

What is deliberately **not** ours to rename, and stays as it is:

| Not renamed              | Examples                                                                     |
| ------------------------ | ---------------------------------------------------------------------------- |
| Anything in `scripts/`   | `scripts/reindex-uikit-docs.js`, `playwright/scripts/run-tag-tests.js`       |
| Already a published path | `mcp-server/` → `@ui/web/mcp-server/*`, `src/docs/ai-docs.json`              |
| Names a tool dictates    | `tsup.config.ts`, `vitest.config.ts`, `preview-head.html`, `tsconfig.*.json` |
| Prose documents          | `docs/mcp-server.md`, `README.md`, `CHANGELOG.md`, `.changeset/*.md`         |
| Brand and theme slugs    | `uikit-themes/src/static/white-label.css`, the `white-label` theme value     |
| Data assets              | `.storybook/public/placeholders/16-9.svg`                                    |

A theme slug is the identifier a brand app and a visual baseline are both keyed on
(`Badge-white-label-AllVariants.png`); renaming it would move every snapshot for no
gain. `packages/eslint-config/` is likewise left alone — `expo-app.js` is consumed by the
native app, and half-migrating a package shared with native is worse than not touching it.

### Storybook ids are lowercased, and that is expected

A story's meta `id` is its file basename, so it is PascalCase too — but Storybook
sanitises ids for the URL by lowercasing, without reinserting a separator. `AlertDialog`
therefore appears as `alertdialog--default` in `index.json`, in the iframe URL, and in the
Playwright spec that references it. The meta keeps the PascalCase spelling (that is what
the guard checks against the filename); the spec keeps the lowercase one (that is what
Storybook actually resolves). They are supposed to differ, and a spec with `AlertDialog`
in its id would resolve to nothing.

### Test ids: `data-testid` forward, `data-slot` on the way out

The hook a test or a consumer addresses a part by is **`data-testid`**. `data-slot` was the
old answer, it is still in most of the tree, and it is being retired one component at a time
rather than in a sweep.

**Every component already accepts `data-testid` — `...props` on the root puts it there.** So the
question is never "does this component support it", it is only "does this component need to _look_
at it". Three shapes, and the first is by far the most common:

**1. One element, nothing derived — write no code at all.** `...props` lands the attribute on the
only element there is. Do not declare the prop, do not destructure it, do not re-place it:
destructuring it only to write `data-testid={testId}` back onto the same element produces byte-identical
DOM for four extra lines, and it reads as if something subtle were happening. `Badge.tsx`, `Label.tsx`,
`Separator.tsx` and the `Typography*` family are all this shape and mention `data-testid` nowhere.

**2. More than one element — read the value, do not take it.** Declare `"data-testid"?: string` in the
props type and read it off `props`, leaving `...props` to place it:

```tsx
}: React.ComponentProps<"button"> & { "data-testid"?: string }) {
  // Read, not destructured: `...props` still carries it to the root, so there is one
  // mechanism putting it there rather than two that can disagree.
  const testIdFor = createTestIdFor(props["data-testid"]);
  ...
  <Comp className={cn(...)} {...props}>
    {isLoading ? <Loader2 data-testid={testIdFor("spinner")} /> : null}
```

`button`, `stepper` and `carousel` are this shape. The type declaration is what makes the index
access legal — that is its job, not documentation.

**3. The emitted value differs from the passed one — then destructure it.** Only here, and it must then
place the result by hand, because the result is not what `...props` is holding. Two cases:

- **A form control defaults the base to `name`** — `input`, `checkbox`, `switch`, `select` and the four
  `*field` molecules. See the rule below.
- **A part derives its name from a base published through context**, so what a consumer passes is an
  _override_ rather than the value — every `Dialog` part, and `Select`'s trigger, value, menu and
  items.

`createTestIdFor` returns `undefined` for every part when no base was passed, so a component
nobody named puts nothing test-only into the DOM.

**A form control is the deliberate exception to that, and it is a rule rather than a lapse.** Anything
that submits a value defaults its base to `name`:

| Control                                                    | `name`   | Result of `name="email"`                                   |
| ---------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `textfield`, `selectfield`, `checkboxfield`, `switchfield` | required | always addressable — `email`, `email-label`, `email-input` |
| `input`, `checkbox`, `switch`, `select`                    | optional | addressable when a `name` was given, silent otherwise      |

The name a control already carries is the most predictable id it could have. It is the same string the
form, the validation message and the label are keyed on, so a test should not have to invent a second
one, and a product team gets working locators without touching the design system.

`select` needs one extra step to honour this, and the next compound control will need it too: `name` is
a prop of `Select`, which renders **no element** — the trigger and the menu are separate components the
consumer composes, so there is nothing to hang the base on and no prop chain to thread it down. The
root publishes the base and each part reads it, through the one shared helper in
[src/lib/testId.ts](packages/uikit-web/src/lib/testId.ts):

```tsx
<TestIdProvider value={testId ?? props.name}>   // in the root that renders nothing
const { testId, testIdFor } = usePartTestId("content", override);   // in each part
```

`Dialog` and `Select` use the same context, not one each: context is already scoped by the tree, so a
`Select` inside a `Dialog` publishes its own base for its own subtree and the dialog's other parts go
on reading the dialog's. Reach for this only for a component the consumer assembles — a component that
renders its own subtree should pass `createTestIdFor` down as a prop, the way `Stepper` does.

An item is named by the value it stands for (`email-item-us`), not by position, because position
reorders with the data.

`SelectField` therefore hands its base to `Select` rather than only to the trigger. Handing it to the
trigger alone was the bug this replaced: a field given its own `data-testid` named the trigger from
that and the menu from `name`, and the two silently disagreed.

Everywhere that is not a form control, no base means no attribute.

The rules around that:

- **Rewriting a component is when its `data-slot`s go.** Not before, not in a separate
  cleanup pass. If you are already inside the file, the attributes leave with the rewrite.
- **Untouched components keep their `data-slot`.** Do not migrate a component you were not
  asked to change, and do not add `data-testid` to one either — a half-migrated component
  that answers to both is worse than one that answers to the old name.
- **No mapping, no alias.** `browser.locators.testIdAttribute` stays at its default
  (`data-testid`); no `getBySlot`, no second attribute, nothing that makes `getByTestId`
  find a `data-slot`. A test that cannot find a part is telling you the component has not
  been migrated yet — that is the signal, and hiding it removes the only pressure that
  finishes this.
- The end state is `data-testid` everywhere and no `data-slot` in `src/`.

**No style may select on `data-slot` either.** The attribute is not a styling contract to be
preserved — it is going, so a selector that reads one is a blocker to be fixed, not a reason to
keep it. Two ways out, in this order:

1. **Pass the class down.** The parent already renders the child, so give it the `className` it
   needs instead of reaching into it with `[&_[data-slot=…]]` from outside.
2. **A purpose-named data attribute**, when the child is composed by a consumer and the parent
   cannot hand it a class — `data-accordion-item`, not `data-slot="accordion-item"`. Named for
   the one thing it does, so it cannot drift back into being a general-purpose hook.

`data-testid` is not an option here: it is `undefined` unless a consumer passes one, so styling
through it breaks for everyone who does not.

**The visual suite must be moved off it in the same change.**
`playwright/specs/utils/testHelpers.ts` finds a panel via `[data-slot$="content"][data-state="open"]`
and a trigger via `[data-slot$="trigger"]`, generically, for every component. Radix's own
attributes cover the same ground — `role="dialog"`/`"menu"`/`"listbox"`/`"tooltip"`,
`[data-radix-popper-content-wrapper]`, `aria-haspopup` on a trigger — so the selectors move to
those rather than to a replacement of ours. Migrating an overlay without updating them leaves its
overlay spec photographing a closed panel and passing forever.

### Storybook status taxonomy (storybook-web)

Story titles follow `Status/Level/Component` (e.g. `Needs Review/Atoms/Button`), plus matching
`status:*`/`level:*` tags — both enforced by `apps/storybook-web/guards/storyMetadata.test.ts`.

- **WIP** — not yet ready for design review.
- **Needs Review** — engineering-complete, awaiting design sign-off against Figma.
- **Verified** — a designer has confirmed it matches Figma.

Every story pins `id: "<basename>"` in its meta so promoting a component between statuses (a title
change) never breaks a Playwright spec — specs reference the pinned id, not the title-derived one.

### One combined story is what the visual suite photographs

Every new or migrated component gets, on top of its per-case stories, a single story showing
everything at once — `AllStates` for a component whose cases are states, `AllVariants` /
`AllVariations` where they are variants and sizes (Button uses `VariantsGroup` + `SizesGroup`). That
combined story is the **only** one listed in `apps/storybook-web/playwright/specs/<name>.tag.visual.ts`.

Per-case stories stay: they are the docs page, and they are how you work on one case in isolation.
They are simply not photographed. Each was a separate navigation, font wait and settle for a shot the
combined story already contains, and every theme multiplied that — 42 specs came to 860 screenshots,
of which the combined stories carry the same coverage in 163.

Consequences worth knowing:

- Adding a state to the combined story puts it under test. Adding a new per-case story does not, and
  should not.
- A component still tagged `status:wip` is skipped entirely by the visual suite, which reads the tag
  from Storybook's `index.json` at run time. No baseline is kept for it — its appearance is still
  changing, so a baseline would only need re-taking on every pass.
- Promoting a component out of WIP is therefore the whole switch: its spec starts running, and
  `pnpm visual:update` takes the first baselines. Give it a combined story before you promote it.
- **A small story is the worst thing to photograph, not the safest.** `maxDiffPixelRatio` is a
  ratio, so the same ~60-pixel noise floor of glyph and edge resampling is 2% of a 52×58 shot and
  0.06% of a 480×328 one. `Checkbox`'s `Default` — a bare, textless checkbox — failed on Linux for
  that reason alone, and its height moved 2px on top of it, because an inline-level control sits on a
  text baseline and the brand font's descent decides where that baseline is. Do not add a short
  per-case story to a spec to "cover the simple case"; the combined story is big enough for the same
  noise to be a rounding error.
- **A photographed story must have a deterministic box.** Give the outermost element an explicit
  width — `w-96`, not `w-full max-w-sm`. `preview.ts` sets `layout: "centered"`, so the story root
  shrink-wraps its content, and under that `w-full` resolves to max-content: the widest text run
  decides the width, measured in the host platform's font metrics. Form's shots came out 220px on
  Linux against 302px on macOS, and Playwright refuses to compare pixels at all once the sizes
  disagree — no threshold can absorb it. The same applies to any height that depends on text
  wrapping.
- **The token and typography sheets are not photographed.** They are documentation pages, not
  components: every glyph is drawn at its real size and nothing may be scaled to fit, so the shots
  ran 1500–3300px tall and their height drifted 1–6px between macOS and Linux from accumulated
  line-height rounding — 13 unfixable size mismatches out of 30 tests. A token change is visible in
  every component's own shot anyway, which is the coverage that matters. Keep the stories; do not add
  a spec for them.
- An overlay component (Dialog, Select's menu, Tooltip) earns a **second** spec entry, for the panel
  open, with `capture: "viewport", interaction: "click"`. Radix portals the panel outside
  `#storybook-root`, so a root-framed shot catches only the trigger; and the open shot cannot come
  from the combined story, because the helper clicks the first trigger it finds and only one panel
  can be open at a time. Point it at whichever story's panel carries the most — `Select` uses
  `WithGroups`, whose menu has group labels and separators.

## Theming

- CSS token files live in `packages/uikit-themes/src/`.
- `foundation/` holds shared base tokens; `static/` holds per-brand overrides.
- Themes are built with a custom Node script (`packages/uikit-themes/scripts/build.js`).

## Local dev against a brand app

`pnpm dev:web:link [path-to-brand-repo]` builds `@ui/web` + `@ui/themes`, syncs their `dist/` into the target repo's root `node_modules/@ui/*` (defaults to sibling `../ui-b2spin-monorepo`), then watches `src/` in both packages and re-syncs on every successful rebuild. Run it alongside a normal `pnpm local:<brand>` in the brand repo — since that repo uses `nodeLinker: hoisted`, one sync serves every brand app.

See [docs/dev-web-link.md](docs/dev-web-link.md) for flags (`--dts`, `--once`, `--touch`, `--verbose`), the brand → app mapping, and troubleshooting.

## Git conventions

Branch, commit and PR each carry their Jira issue key, so the work shows up in the ticket's
development panel:

```
branch   <type>/<KEY-123>-<kebab-slug>       feat/TECH-123-button-focus-ring
commit   [KEY-123] <type>(<scope>)?: <what>   [TECH-123] feat(button): add focus ring
PR title [KEY-123] <type>(<scope>)?: <what>   [TECH-123] feat(button): add focus ring
```

Husky enforces both halves: `commit-msg` checks the subject and prepends the key from the
branch when the subject omits it, `pre-push` checks the branch name before `pnpm check`
runs. Ticketless work goes on a `no-ticket/<slug>` branch. Full rules, escape hatches and
the rename-after-the-fact cases: [.claude/skills/git-conventions/SKILL.md](.claude/skills/git-conventions/SKILL.md).

## Release workflow

1. Make changes and commit.
2. Run `pnpm changeset` to describe the change and bump type.
3. Commit the generated changeset file.
4. Merge to main; CI applies versions and publishes via `pnpm publish-versions`.

## Testing

**Invoke the `write-frontend-tests` skill before writing or changing any test in this repo.** Not
as background reading — it is the rule set, and it holds the parts that are easy to get wrong here:
which of the two Vitest runtimes a file lands in, where the test file goes, what may and may not be
mocked, and how a part is addressed. `.claude/skills/write-frontend-tests/SKILL.md`.

| Suite                | Command                            | Blocks merge |
| -------------------- | ---------------------------------- | ------------ |
| Unit + coverage      | `pnpm --filter @ui/web test`       | yes          |
| Story metadata guard | `pnpm --filter storybook-web test` | yes          |
| Visual regression    | `pnpm visual`                      | yes          |

- **Unit tests live beside the code they test** — `Badge.tsx` next to `Badge.test.tsx`,
  `lib/useStepper.ts` next to `lib/useStepper.test.tsx`. No `__tests__/` directories.
- **Two runtimes, split by extension.** `*.test.ts` runs in node and is for pure functions;
  `*.test.tsx` runs in a real Chromium and is for anything that renders — components _and_ hooks.
- **A molecule or organism at `Needs Review` or `Verified` must have tests**: the UI, plus a unit
  test for each hook in its `lib/`. WIP is exempt while its shape is still moving, and so is
  every **atom**, at any status. An atom renders one semantic element out of props and CVA
  branches — its stories draw it, its visual baseline photographs it in three themes, and a
  Vitest file over it would mostly restate the class list. The seams _between_ components are
  where a design system actually breaks: a prop that stops being forwarded, an id that stops
  matching a label, a testid that stops being derived. Those live in molecules and organisms,
  which is where the requirement is pointed.
- **`src/**/lib/**` must stay at 85%** lines/functions/branches/statements. The threshold is
  enforced by the same run that executes the tests — there is no separate coverage command to
  forget. `pnpm coverage` from the root is an alias for that same run, not a second pass.
- **Address parts by `data-testid`** (or, better, by role and accessible name). Never by `data-slot`;
  see "Test ids" above.
- Story metadata guard checks story titles/ids/tags against `src/{atoms,molecules,organisms}/` and
  the Playwright specs.
- Native package has no test setup yet.

### What CI requires

`.github/workflows/ci.yml` runs four jobs on every pull request and every push to `master`. Three
of them are release gates and must be green before anything is published:

| Job               | Gate                                | What a failure means                                     |
| ----------------- | ----------------------------------- | -------------------------------------------------------- |
| Lint & Format     | yes                                 | Prettier or ESLint                                       |
| Unit Tests        | yes                                 | a failing test **or** `src/**/lib/**` below 85%          |
| Visual Tests      | yes                                 | a component's rendered pixels moved against its baseline |
| Build & Typecheck | build blocks, typecheck is advisory | see `continue-on-error` on that step                     |

Tests and coverage are deliberately one job running one command. Two jobs would mean building and
running the browser suite twice for the same information, and would let a coverage report describe a
different commit than the tests that produced it.

A moved visual baseline is a result to show and explain, never a snapshot to update so the build
goes green.

## Claude-specific files

Store all project-specific Claude files (memory, PRDs, plans, notes) locally under `.claude/memory/`. This directory is gitignored — do not commit it.

## Do not

- Do not add new npm dependencies without explicit approval.
- Do not edit `dist/` files directly — they are generated.
- Do not publish packages manually. Use the changeset workflow.
- Do not modify `pnpm-lock.yaml` manually.
