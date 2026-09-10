# @ui/web

## 0.0.8

### Minor Changes

- 56f71a0: Add `Link`, migrate `DropdownMenu`, and rebuild `Breadcrumb` and `Pagination` on DS v2 out of
  those and `Button`.

  Both were still on legacy per-component variables — `--breadcrumbs-link-default-color`,
  `--breadcrumbs-separator-size` and friends, half of which no brand file has ever defined, so
  the trail rendered with `text-muted-foreground` and no colour at all. They are now on the
  Figma semantic tokens, and the parts Figma draws as existing components are those components:

  - **`Link` is new**, and every crumb is one. Its type comes from `Typography`'s
    `labelVariants` — Figma's link is `Label - Underline/Large/Bold`, which that family already
    draws — and what it adds is the half Typography deliberately has no opinion about: the
    colour, the hover, the pressed state, the focus ring and the disabled tone.
  - **Back, Next and every page number are `Button`** — `variant="outline" size="sm"` for the
    two controls, which is the `Button / Variant=Outline, Size=sm` node Figma points at, and
    `variant="ghost" size="sm" icon` for a page. Only two things in Figma differ from a ghost
    button and only those two are overridden: `--radius-comfortable` rather than the button's
    pill, and `Label/Small/Medium` rather than 14px bold. The brand apps agree —
    `apps/platform/src/components/Pagination/styles.module.scss` draws the same 32px square at
    `calc(var(--radius-sm) * 2)`.
  - The chevrons shadcn ships are gone in favour of `ArrowLeft` / `ArrowRight`, and so is the
    `mx-auto ... justify-center` row, replaced by the `justify-between` row Figma measures.
  - **`DropdownMenu` is migrated too**, which is what the collapsed breadcrumb hangs off. It
    carries its own panel and row classes rather than sharing `Select`'s, even though the two
    are the same rectangle today: `Select` is a signed-off primitive three brands already ship,
    and the dropdown has not been drawn as its own Figma component yet, so sharing would mean
    the first dropdown-only change moves every select row in every brand. The duplication goes
    when there is a design to point at — and it goes by this file changing, not `Select`.
    `BreadcrumbMenu` used to hand the panel and the rows a set of DS v2 classes to overlay
    shadcn's `bg-popover` / `rounded-md` / `text-sm` defaults; those are gone, because there is
    nothing left to correct. `Select` is untouched by this release.
  - `DropdownMenu` also gains the test-id contract the rest of the kit has: name the menu and
    every part derives its own — `-trigger`, `-content`, `-label` — and one per row, named by
    the new `value` prop rather than by position or by state. `DropdownMenuCheckboxItem` takes
    `value` too: Radix gives a checkbox row none of its own, and naming it from `checked` meant
    two unticked rows collided on one id and a row's id moved the moment it was ticked. A
    separator carries no test id unless it is handed one — a menu has one per group and none of
    them stands for anything, so a derived name only gave a locator four elements to choose
    between.
  - `inset` reaches the DOM as `data-inset={inset || undefined}`, not `data-inset={inset}`.
    React serialises a `data-*` boolean rather than dropping it, and `data-inset:` matches on
    the attribute being present — so `inset={false}` used to indent the row it was told not to.
  - **`Link` decides the current-page treatment in JS**, from the `aria-current` value, rather
    than through an `aria-[current]:` variant. Tailwind's _arbitrary_ aria variants match on the
    attribute being present, and React serialises `aria-*` booleans instead of dropping them, so
    `aria-current={item.href === pathname}` writes `aria-current="false"` onto every other link
    in a list and the presence selector styled all of them as current. Every token value and
    `true` count; `false` and the absent attribute do not.
  - **`aria-disabled` on a `Link` now drops the `href` and the tab stop.** `pointer-events-none`
    only ever stopped the mouse — an `<a href>` marked `aria-disabled` stayed in the tab order
    and Enter still followed it — and the focus ring was hidden on top of that, leaving a
    reachable element with no indicator. The ring is back and the link is genuinely unreachable.
  - **The current crumb is a `Link` too**, marked `aria-current="page"` and rendered as a
    `<span>`, in place of the `<span role="link" aria-disabled>` shadcn ships with a
    hand-written `labelVariants()` call beside it. That shape faked both halves: it announced a
    link the user could not follow, and it restated the type scale in a second place. `Link` now
    styles `aria-current` itself — a link to where you already are has nowhere to go, so it
    loses the pointer and the underline animation and takes the muted foreground — which means
    the attribute a screen reader reads and the treatment the eye sees cannot disagree. The
    crumb also picks up the same 8px either side the other crumbs have; it had none before.
  - **Type comes from `labelVariants`** on the current page, the page numbers and the menu rows,
    so none of them can drift from the scale.
  - The breadcrumb separator is the design's dot, not a chevron; a page number is a 32px square
    at `--radius-comfortable` that fills with `--color-background-state-selected` when current.

  **`as` / `linkAs` is what makes any of this usable in a brand app.** Nothing in
  `ui-b2spin-monorepo` navigates through a bare `<a>`: every brand has a `components/Link`
  wrapping `next/link` that resolves the locale into the href, starts the NProgress bar and
  swaps external links for a delayed redirect that keeps INP down. So the element is a prop —
  `as` on `Link`, `PaginationLink`, `PaginationPrevious` and `PaginationNext`, and `linkAs` on
  the two data forms, which hands it to every slot at once.

  Both grew the form their consumers were hand-writing:

  ```tsx
  <Breadcrumb items={crumbs} maxItems={3} linkAs={BrandLink} />
  <Pagination total={10} page={page} onPageChange={setPage} />
  <Pagination total={10} page={page} hrefFor={(p) => `?page=${p}`} linkAs={BrandLink} />
  <Pagination total={10} page={page} onPageChange={setPage} icon />
  ```

  `items` derives the separators, the `aria-current` and the test ids from the data, and
  `maxItems` folds the middle into a `…` that opens a menu of what it hid — the `Lenght=more
links` state. `total` computes the range through `getPaginationRange`, which is exported on
  its own: unlike `getPageRage` in `shared/core-components` it keeps the row the same width at
  every page, so Back does not walk left as you page. The composed parts are unchanged in
  spirit and still there for a trail or a row the data form cannot describe.

  `data-slot` is gone from both, replaced by `data-testid` derived from the root — a crumb is
  named after where it goes (`/slots` → `<base>-slots`) and a page after the page it goes to
  (`<base>-page-4`), never after position. The names are computed over the trail in order and
  ride on the crumb through the collapse, rather than being looked up in a `Map` keyed on the
  crumb object: a caller may legitimately pass the same object twice — `items={[home, section,
home]}` — and identity keys collapsed those two positions onto one name, which is the
  duplicate key and duplicate test id the naming exists to prevent.

  Breaking, on top of the visual change:

  - `PaginationLink` no longer takes `icon` or `size`. A page number is one fixed 32px square.
  - `BreadcrumbPage` is no longer a `role="link"`, so a test or a query that counted it among
    the trail's links will come up one short. It is addressed by its text, its `aria-current` or
    its derived `data-testid`.
  - `PaginationPrevious` / `PaginationNext` render a `<button type="button">` unless given
    `href` or `as`, so an `onClick` row needs no anchor and a disabled control is never a link.
    The explicit `type` matters: a `<button>` without one defaults to `submit`, and a row inside
    a filter form would submit it on every page change. They also take `icon`, which draws the
    arrow alone and leaves the `aria-label` to name it.
  - **`Button` takes `as` instead of `asChild`**, and so do `BreadcrumbLink` and the pagination
    controls. It is the trade `Typography` made first: one prop instead of a wrapper element
    that can quietly lose a `className` or a handler, and the rendered element's own props typed
    at the call site rather than on a child nobody checks.

    ```tsx
    <Button asChild variant="link"><a href="/about">About</a></Button>   // before
    <Button as="a" variant="link" href="/about">About</Button>            // after
    <Button as={BrandLink} href="/promotions">Promotions</Button>         // what a brand app writes
    ```

    `Button` kept `asChild` longer than the others because it renders a spinner beside its
    children — but that was never a reason: `as` names the element, and what goes inside it stays
    the component's business either way. The `Slottable` that existed to interleave the two is
    gone with it.

    **Radix triggers are unaffected.** `<DialogTrigger asChild><Button /></DialogTrigger>` is the
    trigger's `asChild`, not the button's, and it goes on working. `asChild` stays wherever the
    _consumer_ supplies the element rather than names it — `Badge`, `Label`, the compound parts.

    `Badge` and `CollapsibleLabel` take `as` too — they were the only other two components in the
    kit that owned an `asChild` prop of their own, so there is now none left. What looks like
    `asChild` elsewhere is either a Radix primitive's own prop passed through (`DropdownMenuTrigger`,
    `CollapsibleTrigger`, every `*Trigger` and `*Close`) or an internal `<Slot>` dressing a node the
    consumer handed over as a prop (`TextField`, `SelectField`, `DialogHeader`, `DialogFooter`,
    `FormControl`) — neither is a prop anyone can pass, and neither is a question `as` answers.

    `ButtonProps` is exported for a component wrapping one: `React.ComponentProps<typeof Button>`
    no longer resolves usefully now that `Button` is generic, and every wrapper in the kit
    (`CarouselPrevious`, `CollapsibleToggle`, the tabs arrows) moved to it.

  - Given both `hrefFor` and `onPageChange`, a plain click is now intercepted with
    `preventDefault()` and the handler is called — previously the browser followed the href and
    the state update was lost to a full page load, which is not what the two together promised.
    Cmd-, ctrl-, shift- and alt-clicks are left to the browser, so the href still opens in a new
    tab.
  - `BreadcrumbEllipsis` is a `<button>` reading `…`, not a `<span>` with a `MoreHorizontal`
    icon — it opens a menu, and a control has to be reachable by keyboard.
  - Both are laid out as directories now. `@ui/web/Breadcrumb` and `@ui/web/Pagination` are
    unchanged; nothing imported deeper.

  `DropdownMenu` moves to the directory layout — `ui/` one file per part, `lib/utils.ts` for every
  class it wears, the same shape `Collapsible` and `Tabs` already have. `@ui/web/DropdownMenu` is
  unchanged; nothing imported deeper.

  Two latent bugs in the tooling surfaced along the way, both fixed here.

  `scripts/reindex-uikit-docs.js` only ended a JSDoc block on a line _starting_ with `*/`, so a
  single-line `/** … */` opened a comment that never closed — every component after one in the same
  file went unrecorded and its documentation silently vanished from `ai-docs.json`. There are ~158
  one-line JSDoc comments in `src/`, so this was eating far more than the two entries that happened
  to expose it.

  And the build itself: tsup's `@/` alias plugin probed an empty
  extension first, and `statSync` succeeds on a directory — so `@/molecules/DropdownMenu` resolved to
  the directory itself and esbuild failed with "Cannot read file: is a directory". It had never
  fired because no directory-form component had been imported by another component; a component's own
  test importing its barrel does not reach tsup. The plugin now falls through to `index.tsx`, so any
  component may import any other by its barrel whichever layout it uses.

  `Breadcrumb`, `Pagination` and `DropdownMenu` are promoted out of WIP to `Needs Review`, so
  their combined stories enter the visual suite and need first baselines. `Breadcrumb` takes a
  second spec entry for the open menu and `DropdownMenu`'s only entry is its open panel — Radix
  portals both outside `#storybook-root`, so they are framed to the viewport. `Link` stays WIP:
  its Figma node has not been checked, so keeping a baseline for it would only mean re-taking
  one.

### Minor Changes

- 71eb82c: feat(textarea): rebuild `Textarea` on DS v2 and add `TextareaField`

  `Textarea` moves off its legacy `--textarea-*` variables and onto the design's
  own box (Figma node 3176:5907): it now shares `fieldBox` with `Input` and
  `Select`, so the border, focus, invalid and disabled treatments are one
  definition rather than three. What a multi-line box changes is its height
  (`min-h-16` as a floor, not a fixed value), its padding (`py-3`) and its type
  (Body/M Medium).

  **Two behaviours are gone, because Figma draws neither**: the box no longer grows
  with its content (`field-sizing-content` is off) and it no longer offers a grab
  handle (`resize-none`) — text past the bottom scrolls inside the box instead.
  Both are one class away for a screen that wants them:
  `className="field-sizing-content"` and `className="resize-y"`.

  `data-slot` is gone, and so are the legacy `--textarea-*` variables;
  `data-testid` defaults to `name`.

  New alongside it:

  - `TextareaField` — the labelled field: label row with an optional action link,
    the box, and one line of helper or error text that recolours instead of
    doubling up. Every part is addressable from `name` (`message-label`,
    `message-textarea`, `message-description`).
  - `FormTextareaField`, exported from `@ui/web/Form` — the same field bound to
    react-hook-form.

### Patch Changes

- fix(link): bring `Link` to its own Figma node and promote it to Needs Review

  `Link` was built before it had a design of its own — it borrowed the focus ring
  from `button-base` and took its states from `Button / Variant=Link`. The `Link`
  component set now exists (`🔵 DS Components` 3370:17133, 5 states × 5 sizes), and
  three things in it disagreed with what shipped:

  - **`Visited` is new.** A followed link goes
    `--color-foreground-on-surface-muted` and keeps its underline. It is the real
    `:visited` pseudo-class rather than a prop: the browser is the only thing that
    knows the user's history, so there is nothing for a consumer to pass. Two
    consequences, neither a defect — browsers restrict `:visited` to colour
    properties, and colour is all this state changes; and `getComputedStyle` reports
    the unvisited value, so it is the one state with no unit test and no screenshot.
  - **Focus drops the underline**, the way hover already did. The underline marks a
    link at rest, so both ways of engaging one remove it and `active` puts it back
    while the link is held down.
  - **The focus ring moved 1px in**, to the `inset: -4px` this node draws, so the
    4px band sits flush against the text instead of a pixel off it.

  No API change: no new prop, no renamed variant, no moved export. The defaults are
  still the node's own default variant — `<Link href="…">` is
  `Label - Underline/Large/Bold` with nothing passed.

  **A link in running text must take the paragraph's step of the scale**, which is
  now documented on the component rather than left to be rediscovered: the Body and
  Label scales share their px values, so `TypographyBody` `l`/`m`/`s` pair with
  `size` `"l"`/`"m"`/`"s"` — and `"l"` is the default, so the common case passes
  nothing. Get the pairing wrong and the link reads as having slipped down the line
  while measuring perfect, because `vertical-align: baseline` aligns the baselines
  regardless and what the eye catches is the smaller cap height. The
  `InRunningText` story was itself an instance of that bug — it put a 14px link in
  a 16px paragraph — and is fixed.

  **Sizes are unchanged, and the node explains why.** Its five size variants are
  four styles: `Size=lg` and `Size=Default` are both `Label/Large`, and its `sm` /
  `xs` are this scale's `m` / `s`. All four `--typography-font-size-label-*` tokens
  are in use, so there is no fifth size to build.

  `Breadcrumb` inherits all of it without a line of code — every crumb is a `Link`
  already, in all three shapes (crumb, current page, and the `…` that opens the
  collapsed menu). Its baselines are unmoved.

  Promoted from `WIP` to `Needs Review`, so it now has
  `playwright/specs/Link.tag.visual.ts` and a baseline in all five themes.

- e781b0d: Migrate `Tooltip` to Design System v2 and Figma's tooltip anatomy.

  The panel is now the inverted container the design draws — `--color-background-layout-inverted`,
  `--radius-comfortable`, 16px padding — and `TooltipContent` grew the three frames Figma puts
  in it, all optional:

  - `caption` — the uppercase line above the title (`Caption/Bold - Uppercase`)
  - `title` — the line the panel leads with (`Body/Large/SemiBold`)
  - `actions` — the row of buttons under the text
  - `showArrow` — Figma's `position: None`

  `children` stays the description, so the one-line case is unchanged:
  `<TooltipContent>Add to library</TooltipContent>`. Figma's nine `position` variants are
  Radix's `side` and `align`, which is what also lets the panel flip when it would leave the
  viewport.

  Also:

  - The arrow is Figma's 24×12 shape with its rounded tip, rather than a rotated square.
  - `data-testid` on `Tooltip` names the whole thing; every part derives from it —
    `<base>-trigger`, `<base>-content`, `<base>-content-title`. The `data-slot` attributes
    are gone.
  - `TooltipContent` defaults `aria-label` to its own text, so the panel's markup is no
    longer duplicated into Radix's screen-reader copy — which is what made every part's
    `data-testid` resolve to two elements and every button in `actions` exist twice.
  - `TypographyCaption` and `captionVariants` take a `weight`; `medium` stays the default, so
    nothing that used them changes.

  The legacy `--tooltip-background-color`, `--tooltip-color` and `--tooltip-border-radius`
  variables are no longer read. Nothing in the themes declared them, so there is nothing to
  remove there — but a brand app setting them will find they no longer have an effect.

## 0.0.5

### Patch Changes

- d16acd2: Add `Picture`, a `<picture>` molecule for format negotiation, art direction and resolution.

  `sources` maps 1:1 onto `<source>` — `type` gates the format, `media` gates the crop,
  and the order is the preference order the browser walks. Each source's `srcSet` takes a
  structured form that cannot express an invalid candidate list: `{ densities: { 1, 2 } }`
  for DPI or `{ widths: { 400, 800 } }` with `sizes` for a fluid box, never the two mixed.
  A raw `srcset` string stays accepted for lists that arrive already assembled.

  `fallbackSrc` works as it does on `Img`, and has more to do: source selection ignores
  whether a file exists, so a matched source that 404s fails the image outright. The swap
  therefore removes every `<source>` before setting `src`, since one left in place goes on
  being chosen and the fallback would sit on an attribute nothing reads.

  The image element is `Img` rather than a bare `<img>` — one `<img>` renderer in the
  design system — which is what puts this in `molecules/`. `@ui/web/Picture` is unaffected
  by the level. What it deliberately does not delegate is the swap itself: `Img` keys its
  own fallback on `src`, which under-identifies a `<picture>` whose resource came from a
  source, so the decision is made here and the `Img` inside is given no `fallbackSrc`.

  The `<picture>` is `display: contents`, so an `Img` can be replaced by a `Picture`
  without its classes resolving against a new box.

  `playwright/specs/Picture.tag.visual.ts` photographs the combined `AllStates` story, which
  takes the suite to 33 shots per theme. Its first baselines are owed from the CI runner —
  `Densities` is deliberately not in it, since the device pixel ratio decides what that story
  draws and the runner's is pinned to 1.

## 0.0.4

### Major Changes

- 9dde200: Every component is now a PascalCase file, and its published subpath follows. This moves
  all 45 subpaths, so it is breaking.

  ```diff
  - import { Button } from "@ui/web/button";
  - import { AlertDialog } from "@ui/web/alert-dialog";
  - import { TextField } from "@ui/web/textfield";
  - import { InputOTP } from "@ui/web/input-otp";
  + import { Button } from "@ui/web/Button";
  + import { AlertDialog } from "@ui/web/AlertDialog";
  + import { TextField } from "@ui/web/TextField";
  + import { InputOTP } from "@ui/web/InputOTP";
  ```

  The exported names are untouched — only the path they are imported from moves, and it
  moves to the name you are already importing. `@ui/web/<Component>` is now spelled exactly
  like the component: no second convention to remember, and nothing to look up when writing
  an import. Subpaths were a mix of kebab-case (`alert-dialog`) and run-together lowercase
  (`textfield` for `TextField`), which is the guesswork this removes.

  The rule behind it: **a file is named after what it exports.** A component is PascalCase,
  a hook stays camelCase (`useCountdown.ts`), and a plain module stays camelCase
  (`utils.ts`, `testId.ts`). `InputOTP.tsx` rather than `InputOtp.tsx` falls out of that —
  the export is `InputOTP`.

  Not moved, and no edit needed for any of them: `@ui/web/utils`, `@ui/web/ai-docs.json`,
  `@ui/web/mcp-server/*` (so an existing `.mcp.json` is fine), and everything under a
  `scripts/` directory.

  **Migrating.** The new subpath is the name inside the braces, so the edit is mechanical:
  `import { X } from "@ui/web/…"` becomes `import { X } from "@ui/web/X"` — for a
  multi-export line, whichever component that file lives in. A search for `@ui/web/[a-z]`
  finds every line still to change, and once none are left the migration is done.

  The MCP server answers for anything ambiguous: `get_component_doc` takes any spelling
  (`ScrollArea`, `scrollArea`, `scroll-area`, `scroll_area`) and replies with the canonical
  import line, and `validate_usage` reports a subpath that is right except for its spelling
  as exactly that, naming the published one.

  Also in this release:

  - `mcp-server/lib/__tests__/validate.test.ts` moves beside its subject as
    `mcp-server/lib/validate.test.ts`, per the "no `__tests__/` directories" rule.
  - The legacy flat-layout fallback (`src/components/ui/`) is dropped from entry discovery
    and from doc codegen. Components have lived in `src/{atoms,molecules,organisms}/` for a
    while; the fallback only kept a dead path alive and made `level` nullable downstream.
  - Storybook story ids follow the file, so a spec references the lowercased form Storybook
    actually mints: `Button` → `button--default`, `AlertDialog` → `alertdialog--default`.

### Minor Changes

- a45f551: Button: `icon` becomes its own axis, and `size="icon"` is gone.

  **Breaking.** `size="icon"` no longer exists. It was never a size — it was a shape wearing a
  size's slot, and it cost the only two things a size is for:

  - **You could not pick a size.** `size="icon"` _was_ the size, fixed at 40×40, so an icon button
    in a 32px toolbar or a 56px hero row had to be talked out of it with a `className`.
    `Collapsible.stories.tsx` did exactly that — `<Button size="icon" className="size-8">`.
  - **It read as a seventh size in every dropdown, tooltip and generated doc**, next to `xs`…`xl`,
    which are dimensions. It is not one. `icon` is orthogonal to both the colour variant and the
    dimension, the same way `isLoading` is, and it is now declared that way.

  ```diff
  - <Button size="icon" variant="ghost">
  + <Button icon variant="ghost" aria-label="Close">
  ```

  `icon` composes with all five sizes and all seven variants: 24, 32, 40, 48 and 56px squares in
  any variant, where before there was one 40px square. `size` keeps its own default, so
  `<Button icon>` is the 40×40 that `size="icon"` used to draw — pixel for pixel, including the
  `link` variant, which gets one compound entry so an icon-only link does not keep the inline
  padding the shape had just taken off.

  There is nothing per-size in the new axis, and that is the point: `aspect-square` takes the width
  from the height the chosen size already set, so a size added later is square for free.

  Migration is mechanical — `size="icon"` → `icon`, and drop any `className` that was fighting the
  fixed 40px, since a real `size` now covers it. Give each one an `aria-label`: an icon-only button
  has no text to name it, and this is the moment the compiler makes you look at every one of them.

  Migrated in this repo: `CollapsibleToggle`, `PaginationLink` (and `PaginationPrevious`/`Next`,
  which carry a label and so pass `icon={false}`), the `TextField` and `Collapsible` doc examples,
  and Button's own stories. `SizesGroup` — the story the visual suite photographs — now draws the
  five sizes twice, labelled and icon-only, so the new axis is covered by the existing shot rather
  than a new one.

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

- a45f551: Add `Img`, `Timer` and `Page` — three primitives lifted out of `apps/platform`, so the
  app can drop its local copies and import them instead.

  All three ship at `Needs Review`: engineering-complete and matched against Figma, waiting
  on design sign-off. That means the visual suite photographs them, so their baselines have
  to be taken before the Visual Tests job can pass.

  **`Img`** (atom, `@ui/web/Img`) — an `<img>` that swaps to a fallback on `error`. Two
  defects from the app version are fixed rather than carried over: the placeholder is now a
  `fallbackSrc` prop instead of `process.env.IMG_ORIGIN`, and `alt` is a required prop
  instead of being set to the image's own URL. It also retries when pointed at a new `src`,
  which the original never did.

  **`Timer`** (molecule, `@ui/web/Timer`) — the `HH:MM:SS` countdown pill from Figma
  `759:47553-47555`, in the three colourways those instances differ by (`neutral`,
  `accent1`, `accent2`). Counts down on its own and calls `onEnd` once at zero. A molecule
  rather than an atom because the design draws five separate text nodes and each one is a
  `TypographyLabel`. The app's legacy class component only knew `00:SS` and had no
  consumers, so this follows the design instead.

  It **counts a deadline down rather than its own ticks**. `setInterval` drifts, and a
  browser throttles it to roughly once a minute in a hidden tab, so a pill that subtracted
  one per tick would come back from a backgrounded tab minutes slow and fire `onEnd` late.
  Each tick recomputes what is left from the deadline instead, which is right on the first
  tick after the tab is shown again.

  `running` and `runId` are what a caller drives it with. `running={false}` pauses it
  where it is, and mounting at `false` is the delayed start — the pill holds its full
  duration until an event flips it, staying on screen at its real size rather than
  appearing when the round does. Resuming continues from the exact remainder, so pausing
  repeatedly does not hand seconds back. `runId` starts a countdown over, including at the
  duration it is already counting: passing the same `durationInSeconds` is deliberately
  not a restart, since a parent re-rendering every second would otherwise freeze the
  countdown at its start.

  Its accessible name is the caller's `aria-label` **with the remaining time appended** —
  `Bonus expires in 00:01:30`. `role="timer"` takes its name from the author alone, so a
  label on its own would tell a screen-reader user what is ending and never how long is
  left; the digits go in rather than a humanised phrase, since "1 hour 2 minutes" would be
  English hard-coded into a library every brand app translates.

  **`Page`** (molecule, `@ui/web/Page`) — the padded surface band, merging the two
  near-identical `Page` components in the app (18 + 1 call sites). `children`, `className`,
  `rootClassName` and `sticky` keep their meanings, so those call sites are an import swap.
  The Material `mt-paper` class and the legacy `--sidebar-accent` token are gone; the
  surface is `--color-background-layout-surface`, and the header offset a `sticky` page
  pins at is `--page-sticky-top`, which the consumer sets.

  Its spacing is the design's rather than the app's. The surface is padded 24px vertically
  at every width and 12px horizontally, stepping to 48px from `lg` (1024px) — `DS App
Templates` draws two device variants per page and the Mobile one carries a
  `Max Width: 1023`, so 1024px is the width the design switches at. The app's stylesheet
  used 16px/32px and switched at 933px.

  The design's mobile block has no top padding at all, because that one screen puts a
  search field flush under the app bar; a page block is symmetrical, so this uses 24px on
  both edges.

  **The band's `margin: 16px auto` is gone.** The 24px of vertical space now lives in the
  surface's padding, and a margin on top of it would make the gap under the app bar 40px
  where the design draws 24px. Stacked `Page`s therefore touch — space them from the
  parent with `flex flex-col gap-6` instead of relying on collapsing margins.

  Prop mapping for the app-side swaps:

  | App                    | `@ui/web`               |
  | ---------------------- | ----------------------- |
  | `Img` `fallbackImg`    | `fallbackSrc`           |
  | `Img` (no alt)         | `alt` — now required    |
  | `Page` `className`     | unchanged (the surface) |
  | `Page` `rootClassName` | unchanged (the band)    |

- a45f551: Typography: replace `asChild` with a polymorphic `as` prop on all five families.

  **Breaking.** `asChild` is gone from `TypographyDisplay`, `TypographyHeading`, `TypographyBody`,
  `TypographyLabel` and `TypographyCaption`. Every other component keeps it — this is a Typography
  change, not a repo-wide one.

  - `as` sets the rendered element directly: `<TypographyHeading size="xs" as="h2">Results</…>`.
    Each family is now generic in the element it renders, so the props follow it — `as="a"` asks
    for `href`, `as="h2"` refuses it, and `ref` is typed for the element that actually comes out.
    The defaults are unchanged (`div` / `div` / `p` / `span` / `span`) and only move when a call
    site passes `as`, so nothing that omits the prop renders or types differently.
  - Motivation is the silent case: `Display` and `Heading` render a `<div>`, so
    `<TypographyHeading>Results</TypographyHeading>` drops the title out of the document outline
    with nothing looking wrong. `asChild` always fixed that, at the cost of a wrapper element that
    is easy to forget.
  - `as` takes a component as readily as a tag, which is the case `asChild` existed for:
    `<TypographyBody as={Link} href="/terms">` replaces `<TypographyBody asChild><Link href="/terms">`.
    One prop instead of a wrapper, and no prop-merge step between the two.
  - `as` affects the tag and nothing else. No tag-to-scale mapping: `as="h2"` implies no `size`,
    and a `size` implies no level — how deep a heading sits is the page's decision, how big it is
    drawn is the design's.

  **Migration** — mechanical in both shapes:

  ```tsx
  // before
  <TypographyHeading size="l" asChild>
    <h2 className="mt-4">Today's winners</h2>
  </TypographyHeading>
  <TypographyBody asChild>
    <a href="/terms">Terms</a>
  </TypographyBody>

  // after
  <TypographyHeading size="l" as="h2" className="mt-4">
    Today's winners
  </TypographyHeading>
  <TypographyBody as="a" href="/terms">
    Terms
  </TypographyBody>
  ```

  New `src/atoms/Typography.test.tsx` covers the default element per family, `as` with a tag and
  with a component, className merging, an anchor's own props, size/weight/underline staying
  independent of `as`, and ref forwarding in both modes.

### Patch Changes

- a45f551: Carousel: say `icon` on the arrows instead of relying on `button-base` squaring them.

  `CarouselArrow` rendered `<Button variant="secondary" size="sm">` around a lone svg and
  got its 32×32 shape from the `:has(> svg:only-child) { aspect-ratio: 1 }` rule in
  `button-base`. Since `Button` grew an explicit `icon` axis there are two mechanisms for
  one intent, and the implicit one is the fragile half: retire it as redundant and the
  arrows silently stop being square, with only a visual baseline to notice.

  Visually identical — verified, not assumed. The button box stays 32×32 and the glyph
  stays 16×16 at the same coordinates; only the side padding goes 8px → 0, which was
  already doing nothing because `aspect-ratio` had fixed the width and `justify-center`
  puts a 16px glyph in the same place either way. Screenshots of `AllStates`, `Default`
  and `CustomArrows` are byte-identical before and after, so no baseline moves.

  `icon` is defaulted rather than hardcoded, so an arrow given a text label instead of an
  icon can pass `icon={false}` and get its padding back.

- c8a1a5e: Four fixes from a review of the Collapsible/Img/Timer branch.

  **`<CollapsibleTrigger asChild>` no longer crashes.** The trigger always renders two
  children — yours and the chevron — and `asChild` puts both into Radix's `Slot`, which
  requires exactly one and threw `React.Children.only expected to receive a single React
element child`, taking the tree down rather than rendering. The chevron is now composed
  into the element you pass, so `<CollapsibleTrigger asChild><a href="/order/4189">…</a>`
  works and the whole row stays one click target.

  `Slottable` — the usual answer, and what `Button` uses for its spinner — is deliberately
  not the fix here. Radix recognises it by a `Symbol("radix.slottable")` created once per
  copy of `@radix-ui/react-slot`, and this tree has two: the one `@ui/web` depends on and
  the one nested under `react-collapsible`'s own `react-primitive`. A `Slottable` imported
  from the first is an unrecognised child in the second, so the trigger threw exactly as it
  did without one. `Button` is unaffected because it owns its `Slot` too, from the same copy.

  **`Img` clears `srcSet` and `sizes` when it falls back.** A browser picks its candidate
  from `srcset` and ignores `src` entirely whenever there is one, so a consumer passing
  responsive candidates got a fallback written to an attribute nothing reads — the image
  stayed broken while the component believed it had recovered. Both attributes now drop with
  the swap, since the fallback is a single URL with no responsive variants.

  **`Timer`'s resync guidance was wrong.** The docstring said changing `durationInSeconds`
  is how you resync against a refetched server time. It is not sufficient: an endpoint that
  buckets or rounds returns the same `secondsLeft` on two consecutive polls, `useCountdown`
  correctly treats that as no change, and the pill goes on drifting — the drift the resync
  existed to correct. The docs now say to pass the fetch as `runId`, with an example. No
  behaviour changed; `useCountdown` already documents and tests the no-op.

  **`validate_usage`'s casing-mismatch message compares like with like.** It named the full
  specifier under the label "Subpath" — `Subpath "@ui/web/scroll-area" … the published file
is "scrollArea"` — asking the reader to strip the scope off one side of the comparison the
  message exists to make obvious. It now names the bare subpath.

  Tests: `asChild` on the compact row (renders, keeps the chevron inside, still opens),
  `Img`'s fallback with and without candidates, and the message's two spellings. One more
  was added while verifying a fifth report that turned out not to be a defect — a floating
  panel already open when a dialog first renders does land in the dialog's panel, and there
  is now a test pinning that.

  `Timer` gained component-level coverage of its three lifecycle moves, which existed only
  against `useCountdown` until now: a delayed start that holds at its full duration and then
  runs through to `onEnd`; a pause that withholds `onEnd` short of zero and freezes the
  `dateTime` along with the digits; and a restart that resets a _paused_ countdown to the top
  without starting it, and re-arms `onEnd` for the second run.

- d24ea28: Dialog: document that it replaces `AnimatedOverlay`, rather than wraps in one.

  The JSDoc carried an example showing `DialogContent` nested inside a consumer's own
  `AnimatedOverlay` with `portal={false}` and the scrim hidden. That reads as the
  supported way to migrate, and it is the opposite: the brand apps' `AnimatedOverlay`
  is what `Dialog` exists to retire. Nesting them stacks two scrims and leaves two
  things claiming the close, and the old overlay is a `<div role="button">` with no
  focus trap, no `inert`, no Escape and no ARIA — which is most of what moving onto
  `Dialog` is for.

  The example is replaced by a migration note mapping every `AnimatedOverlay` prop to
  what it becomes here, including the three that become nothing (`mobileDirection`,
  `closeOnSwipe`, `bottomSlot`) and why. `ai-docs.json` is regenerated, so this is
  what the MCP server answers `get_component_doc("Dialog")` with.

  Documentation only — no API or rendered output changed.

- c8a1a5e: Select, Popover, DropdownMenu and Tooltip now portal into the surrounding dialog's panel instead of
  the document body.

  A menu portalled to `document.body` is a sibling of whatever modal it was opened from, so which of
  the two is on top comes down to a z-index this package does not own. Every overlay here is `z-50`; a
  brand app's own modal at `z-index: 1000` covered the menu, and the only fix available to the product
  team was to guess a bigger number — and keep guessing whenever the app's scale moved. A
  `SelectField` inside a `Dialog` inside a form was the case this kept showing up in.

  `DialogContent` now publishes its panel through a `PortalContainer` context, and the four
  popper-positioned panels portal into it when there is one. Inside the panel a menu is above the
  dialog's content for the same reason any later sibling is, whatever z-index the dialog carries in
  the page — so the argument is ended rather than won. Outside a dialog nothing changed: the context
  resolves to `null`, which Radix already reads as `document.body`.

  No public API moved. `DropdownMenuPortal` still takes `container`, and an explicit one wins.

  A modal of its own — `AlertDialog`, `Sheet`, `Drawer`, a nested `Dialog` — deliberately does _not_
  read the context. `DialogContent` centres itself with a transform, which makes it the containing
  block for `position: fixed` descendants, so a nested modal's `fixed inset-0` overlay would stretch
  over the parent panel instead of the viewport. A popper is unaffected because Floating UI measures
  its offset parent and compensates.

- d24ea28: Form: draw the helper text and the error message from the type scale.

  `FormDescription` and `FormMessage` set only a font size —
  `text-(length:--typography-font-size-body-s)` — so the weight and the line height
  were whatever they inherited: 1.5 from the base stylesheet, where the design says
  1.46. Figma gives the text under a field one style, and gives it to both
  components that have one: `Body/Small/Regular` on Input's description (`56:705`),
  on its error (`492:11976`) and on Select's (`531:1917` / `531:1928`) —
  `Font(size: Body/S, weight: Regular, lineHeight: 1.46)`.

  Both now take that from `bodyVariants({ size: "s", weight: "regular" })`, which is
  the call `DialogHeader`, `DialogFooter` and `TextField` already make for the same
  role. The colours were already the design's and do not move —
  `foreground/onpage/muted` for the description, `foreground/feedback/negative` for
  the error.

  The line height is the part that could not have been fixed by hand. Figma keeps it
  inside the composite text style, so it cannot be emitted as a CSS variable and
  exists as a bare `1.46` in `Typography.tsx` alone; writing it out here would put
  the number in a second place. It also has to stay glued to the font size, because
  tailwind-merge reads `text-*` as both a size and a line-height utility
  (`text-base/7` is one class) — so a `text-(length:…)` after a `leading-*` cancels
  it silently. `bodyVariants` keeps the pair together; a colour after it is safe.

  `FormLabel` needed nothing: it renders `Label`, which is already
  `labelVariants()`, and Figma's label above a field is `Label/Medium/Medium`.

  The visual baselines for Form move — 12px of text at 1.46 rather than 1.5.

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

- a45f551: MCP: stop requiring the caller to know a component's exact spelling.

  `get_component_doc` now ignores casing and separators, so `ScrollArea`,
  `scrollArea`, `scroll-area` and `scroll_area` all resolve to the same entry.
  The export is PascalCase and the file it is published as is camelCase, so which of the
  two an agent happens to be holding is an accident of where it read the name — and a
  lookup that answers "not found" for a component that plainly exists is worse than no
  lookup at all. A miss now suggests near matches instead of an arbitrary first ten.

  The answer also leads with the canonical import line
  (`import { ScrollArea } from '@ui/web/ScrollArea'`), since a caller who had to be
  met halfway on the name cannot be expected to guess the subpath either. Structured
  output gains optional `componentName` and `importPath` fields; `documentation` is
  unchanged.

  **Only the input side is loosened.** `validate_usage` still requires the exact published
  subpath, because `dist/` holds one file under one name. It does now single out the most
  likely mistake — writing the component's own name as the subpath — because macOS
  resolves that case-insensitively and Linux does not, so it passes locally and fails in
  CI. That is reported as "the right component spelled the wrong way", with the canonical
  import as the fix.

- 7180a18: Skeleton: rebuild against the DS v2 Figma spec (node 980-754).

  - The fill is `--color-background-layout-inverted` at 10% and the radius is
    `--radius-comfortable`. **Both legacy variables are gone** —
    `--skeleton-background-color` and `--skeleton-border-radius` were never declared in any
    brand file in the current theme line, so a skeleton had no colour at all unless a call
    site set one.
  - No `variant` prop. Figma's `Default`, `Card` and `Text` are three _compositions_ of the
    same block — an avatar beside two lines, a picture above two lines, two lines alone — not
    three appearances of it. All three are in the stories.
  - No longer a client component: it renders one `<div>` out of `className` and uses no
    hooks, so a Next.js consumer no longer pushes its tree to the client for it.
  - `data-slot="skeleton"` removed, per the `data-slot` retirement.
  - Story promoted from `WIP/Atoms/Skeleton` to `Needs Review/Atoms/Skeleton`, which puts its
    combined `AllVariants` story under visual test.

  **Migration for brand apps.** Seven call sites in
  `features/creators-core/.../FollowedCreatorsSwimlane` recolour the block with
  `[--skeleton-background-color:var(--base-10)]`. That variable no longer does anything —
  use a background utility instead, which wins because `cn()` puts `className` last:

  ```diff
  -<Skeleton className='h-55 lg:h-67 [--skeleton-background-color:var(--base-10)]' />
  +<Skeleton className='h-55 lg:h-67 bg-(--base-10)' />
  ```

  Call sites that only pass sizing classes — which is all 20 of the other
  `@uikit/web/skeleton` usages — need no change, and gain a fill they did not have.

- d24ea28: Sonner: rebuild against the DS v2 Figma spec.

  - The toast is drawn from DS v2 semantic tokens instead of the three legacy
    `--sonner-normal-*` variables, which the current theme line never declared — so the
    component was effectively unstyled before. Figma's four Types map onto Sonner's four typed
    calls: `toast.success`, `toast.error`, `toast.warning` and `toast.info` each take their own
    `--color-background-feedback-*-container`, `--color-border-feedback-*` and
    `--color-foreground-feedback-on-*-container`. A plain `toast()` has no feedback meaning and
    takes the neutral card.
  - Each Type carries its Figma icon — `CircleCheck`, `OctagonAlert`, `TriangleAlert`, `Info` —
    in `--color-foreground-feedback-*`, while the text beside it takes the `on-…-container`
    colour. Pass `icons` to replace any of them.
  - The actions and the close button are Figma's own Buttons, and take their classes from
    `buttonVariants` rather than restating them: `xs` `default` for `action`, `xs` `secondary`
    for `cancel`, `sm` `overlay` `icon` for the close. Both actions sit **under** the text, at
    the text's indent, which is what the design draws.
  - **One snackbar at a time.** `visibleToasts` now defaults to `1`, so a second call replaces
    the message on screen exactly as `openSnackbar` did — Sonner's own default is three,
    stacked. Pass `visibleToasts={3}` for the stack; the new `Stacked` story shows it.
  - **The component no longer sets a width, and did not before either.** Sizing a snackbar is
    the app's decision — the brand apps run theirs between 390 and 590 — so nothing is baked in
    and Sonner's own 356px stands until a caller says otherwise. It has to be set as
    `style={{ "--width": "590px" }}`: Sonner writes that variable into the list's inline
    `style`, and an inline style outranks any class, so `className="w-[590px]"` is silently
    ignored. Both halves of that are pinned by tests, and every story sets it once on the meta.
  - `toastOptions.unstyled` now defaults to `true`. Everything Sonner draws itself lives behind
    `[data-sonner-toast][data-styled=true]`, a selector no class can outrank; dropping the
    attribute is what lets the design system's classes apply at all. Pass
    `toastOptions={{ unstyled: false }}` to get Sonner's own chrome back.
  - `toastOptions.classNames` now **extends** the design system's classes rather than replacing
    them — `{ toast: "rounded-none" }` wins the radius and keeps the layout, the palette and the
    button styling. Parts the component does not dress (`loader`, `loading`, `default`) still
    pass straight through.
  - `richColors` is inert: the feedback palette comes from the tokens in every theme.
  - No public name or prop changed: still `import { Toaster, toast } from "@ui/web/Sonner"`, and
    `Toaster` still takes Sonner's `ToasterProps` — the same spelling shadcn uses.
    `ExternalToast`, `ToastClassnames` and `ToasterProps` are now re-exported as types too.
  - Now a **molecule**, in the directory layout (`Sonner/index.tsx` + `ui/`). Both moves leave
    `@ui/web/Sonner` exactly where it was: tsup flattens every level and both layouts to the same
    `components/ui/<basename>` entry, so neither the level nor the shape reaches a consumer. The
    barrel documents that toast, toaster and snackbar are all this one component, and the
    crosswalk from the brand apps' `openSnackbar({ … })` to `toast(…)`.
  - **A migration recipe for the brand apps ships in the docs.** `Toaster`'s JSDoc — which is
    what `codegen:docs` writes into `ai-docs.json` and the MCP server hands to an agent — now
    carries the whole of it: the thunk that makes `openSnackbar` call `toast` so none of the
    ~190 call sites has to change, the option renames for rewriting one by hand, what is dropped
    and handled at the call site, and what this component does **not** replace (`isModalLike` and
    `isFailedTransaction` are the snackbar's other, non-toast mode). The barrel points at it
    rather than restating it, so there is one copy.
  - The MCP server resolves the names the products use — `Snackbar`, `GlobalSnackbar`, `Toast`,
    `Sonner` — to `Toaster`, so an agent told to "replace the snackbar" reaches that recipe
    instead of a "not found". They are `@alias` tags in `Toaster`'s own JSDoc, which
    `codegen:docs` collects into `__aliasMap`; every one of them is a name the design system
    decided not to use.
  - Story promoted from `WIP/Organisms/Sonner` to `Needs Review/Molecules/Sonner`, which puts its
    combined `AllVariants` story under visual test, and the component gains a Vitest file. The
    pinned story `id` stays `Sonner`, so the Playwright spec is untouched by the retitle.

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

### Patch Changes

- Consolidated release of pending DS v2 Figma sync work: Badge, Carousel, Dialog,
  Progress, Switch, Tabs, Select/SelectField, Form restructure, Input hover/background,
  Typography rebuild, Playfame brand tokens, and related fixes accumulated since the
  last publish.
- Initial release
