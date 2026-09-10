import type { Meta, StoryObj } from "@storybook/react-vite";

import { Picture } from "@ui/web/Picture";

// Inline SVG, so the stories draw the same thing on every machine and need no network.
const box = (fill: string, label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">
       <rect width="160" height="120" rx="8" fill="${fill}"/>
       <text x="80" y="66" font-family="sans-serif" font-size="13" fill="white"
             text-anchor="middle">${label}</text>
     </svg>`,
  )}`;

// The formats a browser really negotiates over cannot be drawn inline — there is no way
// to write AVIF bytes into a data URI here — so the stories negotiate over a type no
// browser claims and one every browser takes. Which tile you see is a real answer from
// the source-selection algorithm rather than a mock of it, and the same answer in every
// browser: naming a *real* format we cannot supply the bytes for would have the browser
// accept the offer and then fail to decode it.
const DECLINED = box("#dc2626", "unsupported type");
const CHOSEN = box("#16a34a", "image/svg+xml");
const UNDERNEATH = box("#64748b", "src (JPEG)");
const WIDE = box("#7c3aed", "wide crop");
const TALL = box("#0ea5e9", "tall crop");
const PLACEHOLDER = box("#64748b", "placeholder");
const MISSING = "/this-image-does-not-exist.jpg";

const FORMAT_SOURCES = [
  { type: "image/x-imaginary", srcSet: DECLINED },
  { type: "image/svg+xml", srcSet: CHOSEN },
];

const meta: Meta<typeof Picture> = {
  title: "Verified/Molecules/Picture",
  id: "Picture",
  component: Picture,
  tags: ["autodocs", "status:verified", "level:molecules"],
  argTypes: {
    sources: {
      control: "object",
      description:
        "The offers, best first. The browser takes the **first** whose `media` matches and " +
        "whose `type` it can decode, and never looks further — so the order is the API.",
    },
    src: {
      control: "text",
      description:
        "The `<img>`'s own URL: the last resort, in the format every browser can decode.",
    },
    srcSet: {
      control: "object",
      description:
        "Candidates for `src`'s format — `{ densities: { 1: …, 2: … } }` for DPI, " +
        "`{ widths: { 400: …, 800: … } }` with `sizes` for a fluid box, or a raw string.",
    },
    fallbackSrc: {
      control: "text",
      description:
        "Loaded once the chosen resource fails, with every source removed so it can be " +
        "reached at all. There is no built-in default — the placeholder belongs to the " +
        "product's asset host, not to the design system.",
    },
    alt: {
      control: "text",
      description:
        "Required. The text a screen reader announces, so it cannot be derived from the " +
        'URL. Pass `""` to mark the image decorative.',
    },
    className: { control: "text", description: "Classes for the `<img>` itself" },
  },
};

export default meta;
type Story = StoryObj<typeof Picture>;

/**
 * Format negotiation, which is what most images need `<picture>` for. Three offers are
 * on the table and the browser picks the first it can decode — the red tile is offered
 * first and skipped without being fetched, the grey `src` underneath is never reached.
 */
export const Default: Story = {
  args: {
    sources: FORMAT_SOURCES,
    src: UNDERNEATH,
    alt: "A photo",
    className: "w-40 rounded-lg",
  },
};

/**
 * `media` picks a different *picture*, not a smaller copy of the same one — a wide crop
 * from 900px up, a tall one below it. Resize the canvas to see it swap.
 *
 * Note the order: both offers use `min-width`, and `(min-width: 900px)` comes first
 * because the browser stops at the first match. Written the other way round the tall
 * crop would match every viewport and the wide one would be dead.
 */
export const ArtDirection: Story = {
  args: {
    sources: [{ media: "(min-width: 900px)", srcSet: WIDE }, { srcSet: TALL }],
    src: UNDERNEATH,
    alt: "Weekly tournament",
    className: "w-40 rounded-lg",
  },
};

/**
 * Resolution, the third axis: one offer, two files, and the browser fetches whichever
 * suits the screen it is on. `{ densities: { 1: …, 2: … } }` becomes
 * `srcset="… 1x, … 2x"`, so **what this tile shows depends on the device pixel ratio of
 * the machine you are reading it on** — 2x on a retina display, 1x otherwise.
 *
 * That is also why it is not in `AllStates`: a story whose pixels depend on the display
 * cannot have a baseline, since the machine taking it and the machine checking it
 * disagree by definition. The same rule sends a `widths` map here rather than there.
 */
export const Densities: Story = {
  args: {
    sources: [
      {
        type: "image/svg+xml",
        srcSet: { densities: { 1: box("#0369a1", "1x"), 2: box("#0ea5e9", "2x") } },
      },
    ],
    src: UNDERNEATH,
    alt: "A photo",
    className: "w-40 rounded-lg",
  },
};

/**
 * Source selection asks only *can you decode this* and *does this match your viewport*.
 * Whether the file is there is never part of it, so a matched source that 404s fails the
 * image outright rather than falling through to the next one. `fallbackSrc` is the
 * recovery: it drops every source and then swaps `src`.
 *
 * `alt` still says what the image was *meant* to be — the fallback substitutes for the
 * picture, not for its description.
 */
export const Fallback: Story = {
  args: {
    sources: [{ type: "image/svg+xml", srcSet: MISSING }],
    src: MISSING,
    fallbackSrc: PLACEHOLDER,
    alt: "Starburst thumbnail",
    className: "w-40 rounded-lg",
  },
};

/**
 * The three outcomes that end in a picture, side by side — the combined story, and the
 * only one `playwright/specs/Picture.tag.visual.ts` photographs once that spec exists
 * and its baselines have been taken.
 *
 * `Densities` is deliberately absent: what it draws is decided by the reader's device
 * pixel ratio, so a baseline over it would fail for a reason that has nothing to do with
 * this component. It is covered where it can be asserted exactly, in
 * `lib/toSrcSet.test.ts`.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-140 flex flex-wrap gap-6">
      {[
        { caption: "Picks a format", sources: FORMAT_SOURCES, src: UNDERNEATH },
        {
          caption: "Picks a crop",
          sources: [{ media: "(min-width: 900px)", srcSet: WIDE }, { srcSet: TALL }],
          src: UNDERNEATH,
        },
        {
          caption: "Falls back",
          sources: [{ type: "image/svg+xml", srcSet: MISSING }],
          src: MISSING,
          fallbackSrc: PLACEHOLDER,
        },
      ].map(({ caption, fallbackSrc, sources, src }) => (
        <div className="flex w-40 flex-col gap-2" key={caption}>
          <Picture
            alt="Starburst thumbnail"
            className="h-30 w-40 rounded-lg object-cover"
            fallbackSrc={fallbackSrc}
            sources={sources}
            src={src}
          />
          <span className="text-foreground-on-page-muted text-(length:--typography-font-size-body-s)">
            {caption}
          </span>
        </div>
      ))}
    </div>
  ),
};
