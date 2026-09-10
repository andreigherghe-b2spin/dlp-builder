# @uikit/themes

## 0.0.5

### Patch Changes

- f41a582: Add the Hello Millions brand.

  `dist/hellomillions.css` joins mcluck, playfame, spinblitz and white-label with the same
  119 variables in the same order — the five brand files stay interchangeable line for line,
  so a token added to one is visibly missing from the others.

  The values come from the Figma DS v2 per-brand export (`Hello Millions.tokens.json`). Each
  semantic token in that export carries the primitive it aliases in
  `$extensions["com.figma.aliasData"].targetVariableName`, so the file references the
  primitive layer (`var(--color-purple-600)`) instead of inlining a resolved hex, the same
  way the other four do. The 75 colour tokens the derivation produced were diffed against
  `playfame.css`: identical name for identical name, in the same order, with nothing added
  and nothing missing.

  What is specific to this brand:

  - **Square corners, everywhere.** All nine radius steps alias `radius/rounded-none`, so
    `--radius-compact` through `--radius-offset24` are 0. No other brand has a flat scale —
    spinblitz steps 4→36, mcluck 4→40, playfame 4→48. Button, Card, Badge and TextField all
    come out square under this theme, and that is what the export says.
  - **Three primitives rather than a ramp** — `--color-custom-hello-millions-main-300`
    (`#dcf254`), `-complementary-500` (`#fe494a`) and `-complementary-950` (`#561415`),
    added to `foundation/config.css`. A per-brand export carries only the values its own
    tokens resolve to, and these three are every step Hello Millions references.
    `complementary-500` is used once, as the focus ring.
  - **Ubuntu**, already bundled in `apps/storybook-web` and named in `preview.ts` — the same
    face mcluck uses, and it ships all four weights the brand asks for, so unlike playfame
    nothing collapses.
  - **`Radius/rounded-full` is in the export and is deliberately not in the file.** Its name
    derives to `--radius-rounded-full`, which is already a primitive in `config.css`; a brand
    file setting it would read `--radius-rounded-full: var(--radius-rounded-full)`, a
    self-reference CSS treats as invalid, and `rounded-full` would stop resolving under this
    theme. The primitive already holds the value the token aliases.

  Two values have no source in a per-brand export and follow the existing convention:
  `--components-badge-radius` is `var(--radius-compact)` from the `🔵 DS Components` frame
  (and for this brand that is the same 0 as `--radius-none`, so it cannot render wrong either
  way), and the `--typography-font-size-*` scale plus its `min-width: 1024px` overrides are
  copied from the other four, which are identical to each other — the export carries only
  `FontFamily` and the four `FontWeight` steps.

  Storybook gains the brand too: `HELLO_MILLIONS` is uncommented in `.storybook/themes.ts`
  and `@custom-variant hellomillions` added to `.storybook/global.css`. That puts a fifth
  theme in `THEME_VALUES`, which every visual spec iterates, so the suite needs one
  `pnpm visual:update` on the CI runner to take its first baselines. The PNGs currently in
  `playwright/snapshots/prod` for this theme are not those: they were written by a local run on
  macOS, and a baseline carries the host's font rasterisation, so they fail on Linux for every
  shot at once. They have to be replaced by the runner's, not committed.

## 0.0.4

### Minor Changes

- a45f551: Collapsible: rebuilt to the DS v2 design, as parts you compose rather than three
  unstyled wrappers.

  The old version forwarded props to Radix and set no classes at all, so every call site
  rebuilt the row by hand — a `Button` in a `CollapsibleTrigger asChild`, a
  `TypographyBody` for the label, a `Card` for the panel, and its own guesses about
  padding and colour. Figma draws all of that (`924:1837`), and now the component does.

  **New parts**, on top of the three that were already there:

  | part                | what it is                                           |
  | ------------------- | ---------------------------------------------------- |
  | `CollapsibleLabel`  | the truncating label, at the type its size calls for |
  | `CollapsibleHeader` | the inert header row of the `large` size             |
  | `CollapsibleToggle` | the 40×40 disclosure button that sits in that row    |

  **`size` decides which parts you compose**, because Figma's two sizes disagree about
  what is clickable. At `default` the whole row is the button, so `CollapsibleTrigger`
  takes the icon, the label and a badge as children and draws the chevron itself. At
  `large` the row is inert — that is what lets a badge, a count or a menu sit in it — and
  a `CollapsibleToggle` inside a `CollapsibleHeader` is the disclosure. The size also
  carries the shell's radius and border, the label's type, the icon size and the panel's
  fill, and every part reads it from the root through context, so it is set once.

  `CollapsibleTrigger` gains `selected`, Figma's state for the current row in a list. It
  is orthogonal to `open` and is reflected as `data-selected`.

  All states come from `button-base` in `@ui/themes/config.css` — the same
  `background/state/*` overlays and `border/state/focus` ring every other control uses —
  so a collapsible cannot drift from the rest of the system on the next token move.

  **Breaking in practice, though nothing was removed.** `Collapsible`,
  `CollapsibleTrigger` and `CollapsibleContent` keep their names and their Radix props
  (`open`, `defaultOpen`, `onOpenChange`, `disabled`), and `asChild` still works on the
  trigger. But they now draw a background, a radius and a padding they did not before, so
  a call site that had built its own row will find two rows' worth of chrome. Delete the
  hand-built parts and use these.

  `data-slot` is gone from all three; parts are addressed by `data-testid`, derived from
  the root's — `-trigger`, `-header`, `-toggle`, `-label`, `-content`.

  **The `large` size's toggle names itself from the label beside it.** The root mints one
  id, `CollapsibleLabel` wears it and `CollapsibleToggle` points `aria-labelledby` at it,
  so the icon-only button announces the section it opens with nothing passed. That
  replaces an `aria-label` defaulting to `Toggle section` — a placeholder that reads like a
  real name and so would never show up in an audit, while needing the title written a
  second time and translated in step with the first. An explicit `aria-label` still wins,
  and with no `CollapsibleLabel` in the row the reference resolves to nothing and the
  browser falls back to the old default.

  `CollapsibleLabel` gains `asChild`, for the `large` size where the row is an inert
  `<div>` and a titled section that opens is what a heading is for. It is not useful at
  `default`, where the label sits inside the trigger `<button>`.

  **Composing the wrong part for the size warns in development.** A `CollapsibleTrigger`
  inside a `size="large"` collapsible type-checks, renders, and draws the compact size's
  16px icons and colours inside the large size's bordered card — nearly right, and so easy
  to ship. It warns rather than quietly restyling itself, because making the pairing work
  would contradict the design: at `large` the row is deliberately not a click target.

  The five `cva` builders are exported alongside the parts, the way `badgeVariants` and
  `buttonVariants` are, so a feature that has to draw a row this component does not cover
  reaches for the same class list instead of respelling it.

  **The panel animates**, 200ms of height and padding together. `@ui/themes` gains
  `--animate-collapsible-expand` / `--animate-collapsible-collapse` and their keyframes,
  in `config.css` rather than the optional `animations.css`: this is the component's own
  chrome, like `button-base`, and it must not depend on which stylesheets a consumer
  happened to add. `prefers-reduced-motion` drops it.

  The padding is animated alongside the height because `height: 0` on a border-box element
  is clamped up to its own padding — a plain height animation would start and end with a
  32px block already on screen at the large size.

  Two things this turned up, neither fixed here. `tw-animate-css` ships identically-shaped
  `collapsible-down` / `-up` and `accordion-down` / `-up`, but it is a devDependency of
  Storybook only — so `Accordion.tsx`'s animation works in Storybook and silently does not
  in a brand app. The names added here differ from that package's so there is never a
  question of which definition is running.

### Patch Changes

- 7180a18: InputOTP: rebuild against the DS v2 Figma spec (nodes 968-2660, 970-3085).

  - **Every legacy `--input-otp-*` variable is gone**, replaced by DS v2 semantic tokens. All
    five were dead: none of `--input-otp-background-color`, `--input-otp-color`,
    `--input-otp-border-color`, `--input-otp-border-radius` or `--input-otp-border-width` is
    declared in any brand file in the current theme line, so every slot was drawing a
    transparent, borderless, unstyled box.
  - **The design's five slot states**, decided by the component rather than by the caller:
    `empty` (subtle border), `filled` (positive border — Figma draws a slot green from the
    first keystroke, which is why the sheet's `Success` state is just every slot filled),
    `active` (2px active border and a caret), `invalid` (2px negative border) and `disabled`.
    Precedence is Figma's: disabled beats invalid, invalid beats active, active beats filled.
    Each box carries `data-state`.
  - **`InputOTPGroup` renders no box** (`display: contents`), so a grouped field is laid out
    identically to an ungrouped one and the separator sits exactly `spacing/2` from the box
    on either side. As a nested flex row it claimed half the width through `grow` while its
    slots capped at the design's size before spending it, leaving the difference as slack on
    its trailing edge — 108px at a 600px row, which pushed the dash off centre. Consequences:
    the group takes no space and paints nothing, so `className` on it can only pass inherited
    values; and it no longer derives a `data-testid`, since there is nothing to select and
    three groups would have emitted the same id three times. `InputOTPGroupProps` is gone —
    it is `React.ComponentProps<"div">`. Groups may be any size and any number: 3+3, 2+2+2
    and 2+2 are all in the stories.
  - **The separator is a definite 16px square** rather than a box sized by the glyph inside
    it, so its own rounding cannot move the gaps around it. Like the group it derives no
    `data-testid` — a `12-34-56` field draws two dashes, and a name taken from the field's
    would be one locator matching both — so it is addressed by `role="separator"`, and a
    `data-testid` passed to it still lands. `InputOTPSeparatorProps` is gone with it; it is
    `React.ComponentProps<"div">`.
  - **Slots no longer share a border.** The design draws six separate rounded boxes with
    `spacing/2` between them, so `first:rounded-l` / `border-r`-only is gone and
    `InputOTPGroup` no longer joins its children into one box — it only marks where an
    `InputOTPSeparator` goes. Both stay exported; the design uses neither.
  - **The box is responsive rather than a prop, and its size is a ceiling rather than a
    width.** The breakpoint is Figma's own: `Size=Mobile|Desktop` are the same variable modes
    the type scale switches on, so the cap steps from 56×64 to 72×80 at 1024px and the digit
    needs no breakpoint of its own — `heading/xl` is already 28px on one side and 32px on the
    other.

    Taken literally those numbers overflow a phone: six mobile boxes and five gaps come to
    376px, against a 375px viewport before the page's own padding, and a 320px screen is 60px
    short. So each box is an equal share of the row (`flex-1` from a zero basis), capped at
    the design's number and holding the design's proportion — 7/8 on mobile, 9/10 on desktop.
    Both ratios are whole, so a row at the design width reproduces Figma to the pixel, and a
    narrower one shrinks evenly instead of clipping. Five measured tests pin it.

    **The field now takes the width of its parent** rather than shrink-wrapping its boxes. Cap
    it with `containerClassName="max-w-118"` where a layout wants the desktop size held.

    Known limitation: in a parent that sizes itself to its content — `inline-block`,
    `inline-flex`, `w-fit`, or Storybook's default `layout: "centered"` — the row measures at
    ~52px and draws as slivers. Any definite width on an ancestor avoids it. Not yet diagnosed.

  - New `invalid` prop, and `aria-invalid` is honoured as the same instruction so a form that
    already drives it gets the styling for free. What the caller passed is what is emitted:
    `aria-invalid="spelling"` reaches the input as `spelling` rather than being flattened to
    `true`, and an explicit `"false"` stays on the element instead of disappearing. `invalid`
    only fills the attribute in when nothing was passed.
  - **The field has no label of its own, so it needs `aria-label`.** Figma draws six boxes and
    nothing else, and `name` is not an accessible name — without one a screen reader announces
    an unnamed textbox. Every example and every story passes it, and `aria-describedby` is what
    links the error message that explains an `invalid` field.
  - `data-testid` now derives from `name`, the rule every control that submits a value
    follows here: a field named `code` is `code`, and its slots `code-slot-0` … `code-slot-5`.
  - `REGEXP_ONLY_DIGITS`, `REGEXP_ONLY_CHARS` and `REGEXP_ONLY_DIGITS_AND_CHARS` are
    re-exported from `@ui/web/InputOTP`, so a numeric field does not need `input-otp` in the
    consumer's `package.json`.
  - Moved to the directory layout (`molecules/InputOTP/{index,ui,lib}`) with tests for the UI
    and for `lib/useInputOTPSlot`. Story promoted from `WIP/Molecules/InputOTP` to
    `Needs Review/Molecules/InputOTP`, which puts its combined `AllStates` story under visual
    test.
  - `@ui/themes` gains `--animate-caret-blink` and its `@keyframes`. The component referenced
    `animate-caret-blink` with nothing behind the name, so the caret never blinked.

  `@ui/web/InputOTP` has no consumers in the brand monorepo, so nothing had to be aliased.

- d24ea28: Fix a dead close button on every Button, paint the toast that has no feedback type,
  and give the loading state the design system's spinner.

  **`button-base` read `data-disabled="false"` as disabled.** The utility disables by
  attribute as well as by property — `asChild` turns a Button into an `<a>`, which
  `:disabled` never matches — but `[data-disabled]` tests only for the attribute's
  presence. Radix writes it when it means it and omits it otherwise, so nothing in
  the library noticed; a third-party component passing `data-disabled={someBoolean}`
  renders the string `"false"`, and the selector read that as disabled. Sonner's
  close button is exactly that shape, so the `X` on a toast got
  `pointer-events: none` and the pointer went straight through it to the toast
  underneath — the button rendered, hovered as if fine, and did nothing. Now
  `[data-disabled]:not([data-disabled="false"])`, in `button-base` and in `tab-base`,
  which had the same selector.

  **The loading spinner is `Loader2`, in the icon slot.** Sonner draws twelve
  rotating `<div>` bars by default, sized and coloured by its own stylesheet, and
  positions them `absolute; top: 50%; left: 50%` — centred inside its own
  `[data-icon]`, which is `relative` only behind `[data-styled=true]`. `unstyled`
  drops that, so the spinner escaped its slot and centred on the whole card, across
  the title. `icons.loading` now supplies the same spinner the Button spins, and the
  icon slot carries the `relative` and the 20×20 box Figma draws, which an
  absolutely positioned only child would otherwise leave at zero. `toast.loading`
  and both `toast.promise` outcomes are affected.

## 0.0.3

### Major Changes

- Initial release

### Patch Changes

- Consolidated release of pending DS v2 Figma sync work: Badge, Carousel, Dialog,
  Progress, Switch, Tabs, Select/SelectField, Form restructure, Input hover/background,
  Typography rebuild, Playfame brand tokens, and related fixes accumulated since the
  last publish.
