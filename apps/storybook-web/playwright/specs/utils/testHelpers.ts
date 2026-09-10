import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEMES, type Theme, type ThemeName } from "../../../.storybook/themes";

/**
 * Common test utilities for tag-based snapshot regression testing.
 * These helpers standardize the test patterns across all component files.
 */

/**
 * What the camera points at.
 *
 * `root` frames `#storybook-root`, which is the story and nothing else — the
 * right choice for anything that renders in place.
 *
 * `viewport` frames the whole window. Overlays are portalled to `document.body`
 * and so fall outside `#storybook-root` entirely: framed on the root, a Dialog
 * story photographs its trigger button and quietly passes forever, whatever the
 * dialog does.
 */
export type CaptureTarget = "root" | "viewport";

/**
 * What to do before the shutter. Overlays start closed, so a screenshot of an
 * untouched Dialog story shows a button; `click` and `hover` are what put the
 * component being tested on screen.
 */
export type StoryInteraction = "none" | "click" | "hover";

export interface StorySnapshotOptions {
  capture?: CaptureTarget;
  interaction?: StoryInteraction;
  /**
   * Overrides the suite's `maxDiffPixelRatio` for one story. Reach for it only
   * when a shot is dense with text: the noise floor of glyph antialiasing scales
   * with how much text is drawn, not with the image's area, so a narrow column of
   * many rows can sit above the suite limit while every other shot is far below
   * it. Say what was measured, so the number can be re-checked rather than
   * inherited.
   */
  maxDiffPixelRatio?: number;
}

/**
 * Radix renders overlay content into a portal, marks it `data-state="open"` and
 * gives it a role. Any one of these appearing means the overlay is mounted and
 * the animation has been started.
 */
const OVERLAY_SELECTOR = [
  "[data-radix-popper-content-wrapper]",
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[role="tooltip"]',
].join(", ");

/**
 * Wait until the theme's own face is loaded, not merely until nothing is
 * pending.
 *
 * `document.fonts.ready` answers "no font load is outstanding", and early on a
 * dev server that is true because the stylesheet declaring `@font-face` has not
 * arrived yet — vite injects it asynchronously. Resolving there photographs the
 * fallback, whose metrics are different, so text lands at a different height
 * and a whole accordion shifts by 36k pixels. Wait for the family the theme
 * actually names instead.
 */
async function waitForFonts(page: Page): Promise<void> {
  // An empty token means the theme's stylesheet has not landed, so there is
  // nothing to ask for yet.
  await page.waitForFunction(
    () =>
      getComputedStyle(document.documentElement).getPropertyValue("--typography-font-family").trim()
        .length > 0,
    { timeout: 15000 },
  );

  await page.evaluate(async () => {
    const root = getComputedStyle(document.documentElement);
    const family = root.getPropertyValue("--typography-font-family").trim();

    // Every weight the theme declares, not just the default one.
    //
    // A face is loaded per weight, and `load("16px Ubuntu")` asks for 400 only.
    // The Accordion trigger is `font-medium`, so its 500 face was still in
    // flight when the shutter went — the heading came out in the fallback while
    // the body text beside it was already Ubuntu, which is the horizontal smear
    // in the diff. Anything the theme can ask for has to be in before the shot.
    const weights = ["regular", "medium", "semibold", "bold"]
      .map((name) => root.getPropertyValue(`--typography-font-weight-${name}`).trim())
      .filter(Boolean);

    // `load()`, not `check()`. `check()` only reports whether a face is already
    // usable and never starts a fetch, so polling it waits forever for anything
    // the page has not itself requested yet. `load()` asks for the face and
    // resolves once it is in — or resolves anyway if the family is a system font
    // with no `@font-face` behind it, which is what we want for `Menlo`.
    await Promise.all(
      [...new Set(weights.length ? weights : ["400"])].map((weight) =>
        document.fonts.load(`${weight} 16px "${family}"`),
      ),
    );
    await document.fonts.ready;
  });
}

/**
 * A checkerboard at the size the story asked for. Rectangles only — a diagonal
 * would put the renderer's antialiasing into the baseline for no benefit — and
 * the real intrinsic dimensions, so `object-cover` and `aspect-ratio` crop the
 * stub exactly as they cropped the photograph.
 */
function imageStub(width: number, height: number): string {
  const cell = Math.max(8, Math.round(Math.min(width, height) / 8));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="c" width="${cell * 2}" height="${cell * 2}" patternUnits="userSpaceOnUse">
      <rect width="${cell * 2}" height="${cell * 2}" fill="#d4d4d8"/>
      <rect width="${cell}" height="${cell}" fill="#a1a1aa"/>
      <rect x="${cell}" y="${cell}" width="${cell}" height="${cell}" fill="#a1a1aa"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#c)"/>
</svg>`;
}

/**
 * Serve every off-origin image from memory instead of the internet.
 *
 * The stories illustrate themselves with remote placeholders — `placecats.com`,
 * `images.unsplash.com`. That is fine for a human browsing Storybook and fatal
 * for a screenshot: the CDN re-encodes, and one run's cat is not the next run's
 * cat. It cost two AspectRatio failures with 64% of pixels different and no
 * code change behind them. It would also mean the suite needs egress to pass.
 *
 * Photographs are not what these tests are for — the frame around them is — so
 * the stub keeps the geometry and drops the bytes. It applies to any host but
 * the one under test, so an image added to a story tomorrow is covered without
 * anyone remembering this exists.
 */
async function stubRemoteImages(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const request = route.request();

    if (request.resourceType() !== "image") return route.fallback();

    const url = request.url();
    if (url.startsWith("data:") || /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
      return route.fallback();
    }

    // Most placeholder services put the size in the path (`/neo/800/450`).
    const size = url.match(/\/(\d{2,5})\/(\d{2,5})(?:[/?#]|$)/);
    const width = size ? Number(size[1]) : 1200;
    const height = size ? Number(size[2]) : 800;

    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: imageStub(width, height),
    });
  });
}

/**
 * Wait until the story stops moving, rather than for a fixed number of
 * milliseconds and a hope.
 *
 * A sleep is a guess about the slowest machine on the worst day, and it was
 * wrong roughly twice per thousand shots here: an AspectRatio box photographed
 * at 32×32 before its image gave the container a size, a Checkbox two pixels
 * short, an Accordion caught part-way through its open animation. All three are
 * the same bug — the shutter opened while layout was still settling — and all
 * three are invisible in the pass case, which is what makes them expensive.
 *
 * So watch the geometry instead and shoot once it has held still. Under load
 * this waits longer than the old sleep did; when the page is ready early it
 * waits less.
 */
async function waitForLayoutToSettle(page: Page, selector = "#storybook-root"): Promise<void> {
  const STABLE_POLLS = 5;
  const POLL_MS = 100;

  await page.evaluate(() => {
    delete (window as unknown as Record<string, unknown>).__settle;
  });

  await page.waitForFunction(
    ([stablePolls, target]) => {
      const root = document.querySelector(target);
      if (!root) return false;

      const rect = root.getBoundingClientRect();
      // Height alone would miss a box that is growing sideways, and
      // `scrollHeight` catches content that overflows without resizing it.
      const geometry = `${rect.width}x${rect.height}x${root.scrollHeight}x${root.scrollWidth}`;

      const store = window as unknown as { __settle?: { last: string; count: number } };
      const state = (store.__settle ??= { last: "", count: 0 });

      if (geometry === state.last) state.count += 1;
      else {
        state.last = geometry;
        state.count = 0;
      }

      return state.count >= stablePolls;
    },
    [STABLE_POLLS, selector] as [number, string],
    { timeout: 20000, polling: POLL_MS },
  );
}

/**
 * `<img>` decoding is not covered by `networkidle` or by `fonts.ready`: the
 * bytes can be in and the frame still be blank.
 */
async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }),
        ),
    ).then(() => undefined),
  );
}

/**
 * Turns "this story id is not in the index" into a message that says so.
 *
 * Storybook renders that failure as an ordinary page rather than as an HTTP
 * error, and where it renders it moved between versions — inside
 * `#storybook-root` in some, in a sibling of it in others. Reading the whole
 * document covers both, and costs nothing on the happy path where the text is
 * simply absent.
 */
async function assertStoryExists(page: Page, storyId: string): Promise<void> {
  const text = await page.locator("body").innerText();
  if (/NoStoryMatchError|Couldn't find story matching/i.test(text)) {
    throw new Error(`Storybook has no story with id "${storyId}" — the spec is out of date`);
  }
}

/**
 * A component still being migrated to DS v2 is tagged `status:wip`, and its
 * appearance is expected to keep changing — a baseline for it would be noise
 * that has to be re-taken on every pass, so no PNG is kept and its stories are
 * skipped.
 *
 * The spec files stay. They are what starts running, unchanged, the moment the
 * component is promoted out of WIP: the tag is read at run time, so promoting a
 * story is the only step: no list here to remember to edit.
 */
const WIP_TAG = "status:wip";

/**
 * Storybook's own index, which carries each story's tags — the same ones the
 * story metadata guard checks against the title. Fetched once per worker
 * process, because 860 stories asking separately would dominate the run.
 *
 * Deliberately not tolerant of a failed fetch: falling back to "assume nothing
 * is WIP" would quietly photograph 29 half-migrated components, and falling back
 * to "assume everything is WIP" would quietly photograph none and still report
 * green.
 *
 * Only a *fulfilled* promise is cached. Caching the rejected one turned a single
 * moment of the dev server being unreachable into 345 identical failures: every
 * later test in that worker awaited the same dead promise and could not recover
 * even once the server was answering again.
 */
let storyIndex: Promise<Map<string, string[]>> | undefined;

async function fetchStoryIndex(page: Page): Promise<Map<string, string[]>> {
  const response = await page.request.get("/index.json");

  if (!response.ok()) {
    throw new Error(`Storybook index.json returned HTTP ${response.status()}`);
  }

  const index = (await response.json()) as {
    entries?: Record<string, { tags?: string[] }>;
  };

  if (!index.entries) {
    throw new Error("Storybook index.json has no `entries` — unexpected index format");
  }

  return new Map(Object.entries(index.entries).map(([id, entry]) => [id, entry.tags ?? []]));
}

async function storyTags(page: Page, storyId: string): Promise<string[]> {
  // Held in a local: the catch clears the shared slot, so reading it again after
  // the await could see a different (or absent) promise.
  const pending = (storyIndex ??= fetchStoryIndex(page).catch((error: unknown) => {
    storyIndex = undefined;
    throw error;
  }));

  const tags = (await pending).get(storyId);

  // Not treated as "no tags, so not WIP" — an unknown id is a real problem, and
  // naming both causes saves a debugging round. The second one is easy to hit:
  // `reuseExistingServer` will happily reuse a dev server started before the
  // story existed, and its index does not list it.
  if (!tags) {
    throw new Error(
      `Storybook index has no story with id "${storyId}" — either the spec is out ` +
        `of date, or the dev server on this port was started before the story was added`,
    );
  }

  return tags;
}

/**
 * `withThemeByClassName` selects a theme by its THEMES *key*, while the specs
 * and the snapshot filenames use the className it maps to. Translate here so a
 * theme commented out of THEMES fails as a named error rather than as a
 * screenshot of the wrong brand.
 */
function themeGlobalKey(theme: string): ThemeName {
  const entry = (Object.entries(THEMES) as [ThemeName, Theme][]).find(
    ([, className]) => className === theme,
  );

  if (!entry) {
    throw new Error(`Unknown theme "${theme}" — not a value in .storybook/themes.ts THEMES`);
  }

  return entry[0];
}

/**
 * Standard wait and setup routine for Storybook stories.
 */
export async function setupStoryPage(page: Page, storyId: string, theme: string): Promise<void> {
  await stubRemoteImages(page);

  // The theme goes in the URL as a Storybook global, so `withThemeByClassName`
  // applies it itself.
  //
  // Setting `documentElement.className` from here instead was a race that lost
  // roughly twice per thousand shots: the decorator re-applies its
  // `defaultTheme` on every render, so a re-render landing after our assignment
  // silently reverted the page to spinblitz — and the shot came out as a
  // correctly-named, entirely wrong-brand baseline. Cheap to miss, too: only the
  // background differs, so it reads as noise until the whole diff is red.
  //
  // Going through globals means there is one writer, and it is the one the app
  // itself uses.
  const storyUrl = `/iframe.html?id=${storyId}&viewMode=story&globals=theme:${themeGlobalKey(theme)}`;
  const response = await page.goto(storyUrl, { waitUntil: "domcontentloaded" });

  // Storybook answers 200 with an error page for an id it does not know, so the
  // status alone will not catch a renamed story — but a 404 from the static
  // server would otherwise surface as a confusing selector timeout.
  if (response && !response.ok()) {
    throw new Error(`Story ${storyId} returned HTTP ${response.status()} at ${storyUrl}`);
  }

  await page.waitForLoadState("networkidle");

  try {
    await page.waitForSelector("#storybook-root", { timeout: 15000 });
  } catch (error) {
    // Storybook answers an id it does not know with an error page rendered
    // *outside* `#storybook-root`, leaving the root empty and hidden — so the
    // wait above expires and reports "locator resolved to hidden", which says
    // nothing about the actual cause. Name it before rethrowing.
    await assertStoryExists(page, storyId);
    throw error;
  }

  await page.waitForFunction(
    () => {
      const root = document.querySelector("#storybook-root");
      return root && root.children.length > 0;
    },
    { timeout: 10000 },
  );

  // Some Storybook versions put that same error inside the root instead, where
  // it photographs as a perfectly stable screenshot of a stack trace.
  await assertStoryExists(page, storyId);

  // Confirm the decorator actually landed the theme rather than assuming it did.
  // A wrong theme is not a crash and not a layout change — only the palette
  // moves — so without this the failure mode is a plausible-looking baseline of
  // the wrong brand.
  await page.waitForFunction(
    (expected) => document.documentElement.classList.contains(expected),
    theme,
    { timeout: 10000 },
  );

  await waitForFonts(page);
  await waitForImages(page);
  await waitForLayoutToSettle(page);
}

/**
 * The element a story expects to be operated. Stories that draw several — the
 * Popover alignment story draws three — are photographed with the first one
 * open, which is enough to prove the content renders and is placed.
 */
function overlayTrigger(page: Page): Locator {
  return page
    .locator(
      '#storybook-root button, #storybook-root [role="button"], #storybook-root [aria-haspopup]',
    )
    .first();
}

/**
 * Open whatever the story is really about, and wait until it has stopped
 * moving. Radix animates entry with CSS, which `animations: "disabled"` will
 * fast-forward at capture time, but the popper also positions itself in a
 * layout effect — hence the settle.
 */
async function performInteraction(page: Page, interaction: StoryInteraction): Promise<void> {
  if (interaction === "none") return;

  const trigger = overlayTrigger(page);
  await trigger.waitFor({ state: "visible", timeout: 10000 });

  if (interaction === "click") {
    await trigger.click();
  } else {
    await trigger.hover();
  }

  await page.locator(OVERLAY_SELECTOR).first().waitFor({ state: "visible", timeout: 10000 });

  // Watch the document, not `#storybook-root` — the overlay is portalled onto
  // `body`, so the root's geometry is already still while the popper is still
  // measuring and placing itself.
  await waitForLayoutToSettle(page, "body");
}

/**
 * Take a screenshot using standardized settings for snapshot regression.
 */
export async function takeStorySnapshot(
  page: Page,
  snapshotName: string,
  capture: CaptureTarget = "root",
  maxDiffPixelRatio?: number,
): Promise<void> {
  // Left off the object entirely when unset, so the suite default in
  // `playwright.tag.config.ts` applies — an explicit `undefined` would not.
  const options = {
    animations: "disabled" as const,
    ...(maxDiffPixelRatio && { maxDiffPixelRatio }),
  };

  if (capture === "viewport") {
    await expect(page).toHaveScreenshot(snapshotName, options);
    return;
  }

  await expect(page.locator("#storybook-root")).toHaveScreenshot(snapshotName, options);
}

/**
 * Complete test routine for a story with theme.
 */
export async function testStoryWithTheme(
  page: Page,
  componentName: string,
  storyName: string,
  storyId: string,
  theme: string,
  options: StorySnapshotOptions = {},
): Promise<void> {
  const { capture = "root", interaction = "none", maxDiffPixelRatio } = options;

  // Before `setupStoryPage`, so a WIP story costs one cached index lookup rather
  // than a navigation, a font wait and a settle.
  test.skip(
    (await storyTags(page, storyId)).includes(WIP_TAG),
    `${storyId} is ${WIP_TAG} — no baseline is kept while it is being migrated`,
  );

  await setupStoryPage(page, storyId, theme);
  await performInteraction(page, interaction);
  await takeStorySnapshot(
    page,
    `${componentName}-${theme}-${storyName}.png`,
    capture,
    maxDiffPixelRatio,
  );
}
