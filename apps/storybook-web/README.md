# storybook-web

Storybook app for the UI kit. Hosts component stories across all themes and serves as the target for visual regression testing.

## Project structure

- `.storybook/` — Storybook config and all component/animation stories
- `playwright/` — Playwright visual regression tests (specs, snapshots, reports, scripts)

Stories use components from `@ui/web` and themes from `@ui/themes` — both are internal workspace packages.

---

## Getting started

Install dependencies from the repo root:

```bash
pnpm install
```

### Run Storybook (dev)

```bash
pnpm dev
```

Opens at [http://localhost:6006](http://localhost:6006).

### Build Storybook (static)

```bash
pnpm build
```

Output goes to `storybook-static/`.

---

# Visual Testing

Playwright photographs every combined story in every theme and compares the
result against a committed baseline image. A test fails when the pixels move.

**This gates merges.** `.github/workflows/ci.yml` runs `pnpm visual` on
`ubuntu-latest` for every pull request and every push to `master`.

## The one thing to know first

A screenshot is a photograph of a font renderer, and macOS and Linux disagree
about hinting and subpixel placement. The same component on the same commit
produces different bytes on two machines.

The `prod` baselines are **committed** — all of `playwright/snapshots/prod/` is
tracked — and `ubuntu-latest` is what compares against them. Whatever machine
writes them therefore has to be that runner, which means `pnpm visual:update` on
a developer machine is not a way to refresh the shared set: it overwrites the
baselines with macOS glyph rasterisation and turns the whole suite red at once,
with no component change behind it.

Run the **Visual Baselines** workflow instead
(`.github/workflows/visual-baselines.yml`, Actions → Run workflow). It does the
update on `ubuntu-latest` and hands back the PNGs as an artifact to unpack over
your tree and stage by hand — it does not commit, so the diff still gets looked
at. Its `specs` input takes the same spec-file filter as the local command, for
when one component moved rather than all of them.

Locally, use a **named tag** instead (see [Tags](#tags) below). A tag is your own
directory of baselines, and comparing your before against your after on one machine
is exactly the question local runs can answer.

## Everyday commands

Run these from the repo root.

| Command              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `pnpm visual`        | Build and compare                                    |
| `pnpm visual:update` | Same, but write the screenshots instead of comparing |
| `pnpm visual:report` | Open the HTML report from the last run               |

Each of these runs against the Storybook **dev server** (`pnpm dev`), which Playwright
starts automatically and reuses if one is already running on port 6006. If you already
have a dev server open from earlier work, kill it first — Storybook doesn't hot-reload
`.storybook/main.ts` or pick up files moved out from under a live watch, so a stale
server photographs stale output with no warning.

Reviewing your own change looks like this:

```bash
pnpm visual:update   # before your change, on a clean tree
# ...make the change...
pnpm visual          # after
pnpm visual:report   # side-by-side diffs for anything that moved
```

Once you have looked at a diff and accepted it, `pnpm visual:update` makes it
your new point of reference.

### Running less than everything

A hundred screenshots for one button is a waste. Filter by spec file:

```bash
pnpm visual Button.tag.visual
pnpm visual Button.tag.visual Checkbox.tag.visual
```

or by test name:

```bash
pnpm visual --grep "spinblitz"
pnpm visual --grep "Button.*Loading"
```

`--ui` opens Playwright's UI mode, which reruns a single test on click:

```bash
pnpm --filter storybook-web test:visual --ui
```

### Tags

A tag is one directory of baselines under `playwright/snapshots/`. Without
`--tag` everything uses `prod`, which is why the commands above carry none.

Name one when you want a second set to compare against — to hold `master` still
while you work on a branch:

```bash
git switch master && pnpm visual:update --tag=before
git switch -                            # back to your branch
pnpm visual --tag=before                # red == differs from master
```

Tags are just directories, so forking one is `cp -R` and dropping one is
`rm -rf`.

They are **untracked, not ignored** — `.gitignore` lists `playwright/reports`, not
`playwright/snapshots/<tag>`, and there is no rule that could: excluding
`snapshots/*` to allowlist `prod` also hides every genuinely new `prod` baseline,
because git cannot re-include a path whose parent directory an earlier pattern
excluded. So a tagged run leaves its tree in `git status`, and `git add -A` will
stage it. Stage the paths you mean, or delete the tag directory when you are done.

## Adding a component

One spec per component in `playwright/specs/`, named `<component>.tag.visual.ts`.
Copy an existing one — they are all the same shape:

```ts
import { test } from "@playwright/test";

import { THEME_VALUES } from "../../.storybook/themes";
import { testStoryWithTheme } from "./utils/testHelpers";

const stories = [{ name: "Default", id: "avatar--default" }];

test.describe("Tag Avatar Snapshots", () => {
  for (const story of stories) {
    for (const theme of THEME_VALUES) {
      test(`Avatar ${story.name} - ${theme} theme`, async ({ page }) => {
        await testStoryWithTheme(page, "Avatar", story.name, story.id, theme);
      });
    }
  }
});
```

`id` is the Storybook story id: every story pins `id: "<component-basename>"` in its
meta (e.g. `avatar`), so the id is `<basename>--<export-name-in-kebab-case>` —
`avatar--default`, `inputotp--different-lengths`.

Note the run-together `inputotp`: basenames are camelCase (`InputOTP.stories.tsx` pins
`id: "inputOtp"`), and Storybook lowercases an id for the URL without putting a separator
back. So the meta says `inputOtp` and the spec says `inputotp--…`, and that mismatch is
correct — copy the id out of `storybook-static/index.json` rather than camelCasing it by
hand. This is deliberately **not** derived
from the title. Titles encode `Status/Level/Component` (e.g. `Needs Review/Atoms/Button`)
and change often as components get reclassified or promoted; if ids tracked titles, every
one of those moves would silently break every spec referencing that component. The full
list of ids the current build has is in `storybook-static/index.json` after
`pnpm --filter storybook-web build`.

**Keep the ids current.** `apps/storybook-web/guards/storyMetadata.test.ts`
(`pnpm --filter storybook-web test`) parses every story and spec file and fails if a spec
references an id with no matching story — this is how 50 of them were once found dead at
once, when seven components moved from `Components/*` to `WIP/*` and every spec still
said `components-*`. `setupStoryPage` also fails with
`Storybook has no story with id "..." — the spec is out of date` at test time rather than
with a screenshot diff, so the message names the problem — but the guard test catches it
before you even run the suite.

### Components that need more than a screenshot

Overlays (Dialog, Drawer, Sheet, Popover, AlertDialog, DropdownMenu, Tooltip)
are portalled onto `document.body` and start closed, so framing
`#storybook-root` photographs their trigger button and passes forever no matter
what the overlay does. Pass a fifth argument to open them and widen the frame:

```ts
await testStoryWithTheme(page, "Dialog", story.name, story.id, theme, {
  capture: "viewport",
  interaction: "click", // or "hover", for Tooltip
});
```

### What is deliberately not covered

`Animations/*` — those stories exist to move, and `animations: "disabled"`
freezes a CSS animation at its final frame, so a baseline would capture the end
state of an effect whose whole point is the path it takes to get there.

`Progress/Indeterminate` — repaints from a 50ms `setInterval`. Playwright shoots
twice and compares before accepting a screenshot, so a story that never stops
changing times out instead of failing on a diff; there is no still frame to
record.

## Images

**Stories must not load images from the internet.** They used to —
`placecats.com` and `images.unsplash.com` across five files — and it cost two
AspectRatio failures with 64% of pixels different and no code change behind
them: the CDN re-encodes, so one run's cat is not the next run's cat. It also
meant Storybook needed the network to look right and the suite needed egress to
pass.

Use `.storybook/public/placeholders/` instead, served at `/placeholders/`:

| File                                         | Intrinsic size | For                           |
| -------------------------------------------- | -------------- | ----------------------------- |
| `16-9.svg`, `21-9.svg`, `7-4.svg`, `4-3.svg` | landscape      | media, hero                   |
| `1-1.svg`                                    | 1000×1000      | avatars, thumbnails           |
| `2-3.svg`                                    | 800×1200       | portrait                      |
| `art-1.svg` … `art-5.svg`                    | 600×600        | lists that should look varied |

Pick by intrinsic aspect ratio, not display size — that is what decides how
`object-cover` and `aspect-ratio` crop. They are flat SVG, rectangles only: no
gradient, filter or text, so every renderer agrees on the pixels.

As a backstop, `setupStoryPage` answers any off-origin image request from memory
with a checkerboard at the size the URL asked for. That keeps one forgotten
remote URL from turning into a flaky suite — but it is a net, not the rule. Add
the file.

## Fonts

Bundled through `@fontsource` in `.storybook/preview.ts`, not fetched from
Google. Over the network the font arrives after first paint — `display=swap`
means a screenshot can catch either the fallback or the real face — and the file
Google serves for a family changes over time, which would invalidate every
baseline at once with no code change behind it.

`Menlo` (shadcn) is a system font with no package to pin, so it resolves to
whatever the rendering machine has — one more reason baselines do not travel
between machines.

## Themes

Every story is shot in all of `THEME_VALUES` — currently `white-label`,
`mcluck`, `hellomillions`, `playfame` and `spinblitz`. Uncommenting a brand in
`.storybook/themes.ts` adds it to the suite, and needs a fresh
`pnpm visual:update`.

That update has to run on the pinned CI runner, not a developer machine. A
baseline carries the host platform's font rasterisation, so one taken on macOS
fails on Linux for every shot at once — see the font notes above.

## Coverage today

45 specs exist, 26 of which the suite actually shoots — the rest cover components still
tagged `status:wip`, which it skips, so no baseline is kept for them (see "One combined story
is what the visual suite photographs" in the root CLAUDE.md for why).

Those 26 come to **33 shots per theme**. Twenty are a single combined story. Six carry more:
Form has three (`Default`, `Invalid`, `CustomLayout`); Button, Input and Stepper have two
combined stories each (`VariantsGroup`/`SizesGroup`, `AllStates`/`WithAdornments`,
`AllStates`/`AllVariations`); and Select and SelectField have their combined story plus the
extra open-panel entry an overlay earns. Dialog needs no second entry — its `Default` story
renders `defaultOpen`, so the one shot already has the panel up.

Across five themes that is **165 baselines when the set is complete**. How many are on disk
is deliberately not written here — `find playwright/snapshots/prod -name '*.png' | wc -l` is
the count that cannot go stale, and the number that used to sit in this paragraph is exactly
the kind that goes wrong silently. What the runner owes at any moment is the difference
between the two, and it is owed whenever a theme or a spec is added: `hellomillions` and
`Picture` are both new and neither has been through a runner pass.

## Layout

```
playwright/
├── playwright.tag.config.ts       # config; starts Storybook, pins viewport/locale/timezone
├── scripts/
│   ├── run-tag-tests.js           # runner; resolves the tag, defaults to `prod`
│   └── show-latest-report.js      # opens the last HTML report
├── specs/                         # one file per component
├── snapshots/prod/                # the shared baseline, committed
└── reports/                       # gitignored run output
```
