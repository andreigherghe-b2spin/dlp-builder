import type { Meta, StoryObj } from "@storybook/react-vite";

import { Img } from "@ui/web/Img";

// Inline SVG, so the stories draw the same thing on every machine and need no network.
const box = (fill: string, label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">
       <rect width="160" height="120" rx="8" fill="${fill}"/>
       <text x="80" y="66" font-family="sans-serif" font-size="14" fill="white"
             text-anchor="middle">${label}</text>
     </svg>`,
  )}`;

const PHOTO = box("#0ea5e9", "photo");
const PLACEHOLDER = box("#64748b", "placeholder");
const MISSING = "/this-image-does-not-exist.jpg";

const meta: Meta<typeof Img> = {
  title: "Verified/Atoms/Img",
  id: "Img",
  component: Img,
  tags: ["autodocs", "status:verified", "level:atoms"],
  argTypes: {
    src: { control: "text", description: "The image to load" },
    fallbackSrc: {
      control: "text",
      description:
        "Loaded instead once `src` fails. There is no built-in default — the placeholder " +
        "belongs to the product's asset host, not to the design system.",
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
type Story = StoryObj<typeof Img>;

/** A source that loads. Nothing else happens. */
export const Default: Story = {
  args: { src: PHOTO, alt: "A photo", className: "w-40 rounded-lg" },
};

/**
 * `src` points at nothing, so the `error` event fires and the fallback takes its place.
 * Note that `alt` still says what the image was *meant* to be — the fallback is a
 * substitute for the picture, not for its description.
 */
export const Fallback: Story = {
  args: {
    src: MISSING,
    fallbackSrc: PLACEHOLDER,
    alt: "Starburst thumbnail",
    className: "w-40 rounded-lg",
  },
};

/**
 * Without a `fallbackSrc` a broken image is simply broken, exactly as a bare `<img>`
 * would be. The component invents no placeholder of its own.
 */
export const BrokenWithNoFallback: Story = {
  args: { src: MISSING, alt: "Starburst thumbnail", className: "w-40 rounded-lg" },
};

/**
 * The two outcomes that end in a picture, side by side — and the only story
 * `playwright/specs/Img.tag.visual.ts` photographs. The right-hand tile is the one
 * doing the work: it was pointed at a missing file and swapped itself.
 *
 * `BrokenWithNoFallback` is deliberately not here. What it draws is the browser's own
 * broken-image glyph, which is Chromium's to change and is not the same on macOS as on
 * the Linux that CI photographs — a baseline over it would fail for a reason that has
 * nothing to do with this component. That case is covered where it can be asserted
 * exactly, in `Img.test.tsx`.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-140 flex flex-wrap gap-6">
      {[
        { caption: "Loads", src: PHOTO, fallbackSrc: PLACEHOLDER },
        { caption: "Falls back", src: MISSING, fallbackSrc: PLACEHOLDER },
      ].map(({ caption, fallbackSrc, src }) => (
        <div className="flex w-40 flex-col gap-2" key={caption}>
          <Img
            alt="Starburst thumbnail"
            className="h-30 w-40 rounded-lg object-cover"
            fallbackSrc={fallbackSrc}
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
