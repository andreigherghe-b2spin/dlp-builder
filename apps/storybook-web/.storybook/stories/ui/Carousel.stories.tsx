import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselIndicator,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@ui/web/Carousel";

const meta: Meta<typeof Carousel> = {
  title: "Verified/Organisms/Carousel",
  id: "Carousel",
  component: Carousel,
  tags: ["autodocs", "status:verified", "level:organisms"],
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    showArrows: { control: "boolean" },
    showPagination: { control: "boolean" },
    infiniteLoop: { control: "boolean" },
    initialSlide: { control: "number" },
    peek: { control: { type: "range", min: 0, max: 50, step: 0.5 } },
    wheelGestures: { control: "boolean" },
    autoplay: { control: false, description: "`true`, or `{ delay, playOnlyInView, … }`" },
    opts: { control: false, description: "Embla options — `align`, `slidesToScroll`, …" },
    plugins: { control: false, description: "Extra Embla plugins" },
    classNames: { control: false, description: "Classes for the parts the root renders itself" },
    setApi: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof Carousel>;

const captionClass = "text-foreground-on-page-muted text-(length:--typography-font-size-body-s)";

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background-brand-primary-container text-foreground-brand-on-primary-container flex h-full min-h-28 items-center justify-center rounded-lg">
      <span className="text-(length:--typography-font-size-label-l) font-(--typography-font-weight-bold)">
        {children}
      </span>
    </div>
  );
}

function slides(count: number) {
  return Array.from({ length: count }, (_, index) => index + 1);
}

/** Slides as children, arrows and dots from props. Nothing in between. */
export const Default: Story = {
  args: { showArrows: true, showPagination: true },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(5).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** Dots only, for a carousel meant to be swiped rather than clicked. */
export const IndicatorOnly: Story = {
  args: { showPagination: true },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(4).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/**
 * Three slides in view. The dots follow Embla's scroll positions, not the slide
 * count, so there are three of them rather than eight.
 */
export const MultipleSlides: Story = {
  args: { showArrows: true, showPagination: true, opts: { align: "start" } },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(8).map((n) => (
        <CarouselItem key={n} className="basis-1/3">
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/**
 * Advances every 2s. It holds while the pointer is over it, while the tab is in
 * the background, while it is off screen, and entirely under
 * `prefers-reduced-motion`.
 */
export const Autoplay: Story = {
  args: {
    showArrows: true,
    showPagination: true,
    autoplay: { delay: 2000 },
    infiniteLoop: true,
  },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(4).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** With `infiniteLoop`, neither arrow ever disables. */
export const InfiniteLoop: Story = {
  args: { showArrows: true, showPagination: true, infiniteLoop: true },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(4).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** `initialSlide` counts from zero, so this one opens on the third slide. */
export const InitialSlide: Story = {
  args: { showArrows: true, showPagination: true, initialSlide: 2 },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(5).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/**
 * Vertical needs a height, and it goes on the carousel like the width does —
 * one `className`, no second class aimed at an inner part. The arrows move to
 * top and bottom.
 */
export const Vertical: Story = {
  args: { orientation: "vertical", showArrows: true, showPagination: true },
  render: (args) => (
    <Carousel {...args} className="h-46 w-96">
      {slides(4).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/**
 * `peek` leaves part of the next slide showing, as the cue that the carousel
 * scrolls at all. It is the share of the track each slide gives up, and the 8px
 * gutter sits inside the sliver that opens: on this 384px carousel `peek={12}`
 * gives roughly 39px of the next slide, about 31px of it content.
 *
 * That is Figma's proportion — 224px slides and a 24px sliver in a 256px box.
 * Drag the control to tune it against real content; the pixel result moves with
 * the carousel's width, because the gutter does not scale.
 */
export const Peek: Story = {
  args: { showArrows: true, showPagination: true, peek: 12 },
  render: (args) => (
    <Carousel {...args} className="w-96">
      {slides(5).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/**
 * The controls passed as children instead of through the props, which is how an
 * arrow gets a different icon. They are recognised and kept out of the track;
 * the rest of the children are still the slides.
 */
export const CustomArrows: Story = {
  render: () => (
    <Carousel className="h-60 w-96">
      {slides(4).map((n) => (
        <CarouselItem key={n}>
          <Slide>{n}</Slide>
        </CarouselItem>
      ))}
      <CarouselPrevious>
        <ChevronLeft aria-hidden />
      </CarouselPrevious>
      <CarouselNext>
        <ChevronRight aria-hidden />
      </CarouselNext>
      <CarouselIndicator />
    </Carousel>
  ),
};

/**
 * At module scope, not inside `render`. Declared in there it would be a new
 * component type on every render, so React would unmount the old tree instead of
 * updating it — `useEmblaCarousel`'s cleanup destroys the instance, `api` goes
 * back to `undefined` and the carousel jumps to the first slide reading
 * "Slide 1 of 0". Every theme switch and every HMR pass would do it.
 */
function ExternalControlsDemo() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [position, setPosition] = React.useState({ index: 0, count: 0, end: true });

  React.useEffect(() => {
    if (!api) return;

    const sync = () =>
      setPosition({
        index: api.selectedScrollSnap(),
        count: api.scrollSnapList().length,
        end: !api.canScrollNext(),
      });

    sync();
    api.on("reInit", sync);
    api.on("select", sync);

    return () => {
      api.off("reInit", sync);
      api.off("select", sync);
    };
  }, [api]);

  return (
    <div className="flex w-96 flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className={captionClass}>
          Slide {position.index + 1} of {position.count}
        </p>
        <button
          type="button"
          className={captionClass}
          disabled={position.end}
          onClick={() => api?.scrollTo(position.count - 1)}
        >
          Skip to end
        </button>
      </div>

      <Carousel setApi={setApi} showArrows showPagination aria-label="Offers">
        {slides(5).map((n) => (
          <CarouselItem key={n}>
            <Slide>{n}</Slide>
          </CarouselItem>
        ))}
      </Carousel>
    </div>
  );
}

/**
 * Driving the carousel from outside it — a section header's buttons, a "see
 * all" link, a step in a wizard. `setApi` hands over the Embla instance.
 *
 * Note where the button state comes from: `canScrollPrev()` reads the real
 * position, so it stays right after a swipe or a drag. A counter kept in the
 * parent would not.
 */
export const ExternalControls: Story = {
  render: () => <ExternalControlsDemo />,
};

/** A labelled cell of the combined story's grid. */
function Case({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className={captionClass}>{label}</p>
      {children}
    </div>
  );
}

/**
 * One frame with every arrangement at once — the only story the visual suite
 * photographs. A state that is not here is covered by nothing.
 *
 * Five cases in two columns, not eight in one strip, and both halves of that are
 * about the screenshot rather than the docs. `maxDiffPixelRatio` is a ratio, so a
 * wide frame absorbs the glyph-resampling noise a tall narrow one fails on; and
 * every stacked row is another line-height to round differently on Linux than on
 * macOS, which is the drift that made the token sheets unphotographable at
 * 1500–3300px tall. This frame is roughly 800×700 where the strip was 384×1700.
 *
 * What went is what another case already photographs: "indicator only" and
 * "arrows only" are the first case minus a control, and the enabled previous
 * arrow they were the only source of is exactly what the looping case shows —
 * which is why looping is here without an indicator, so the no-dots row keeps its
 * coverage too.
 *
 * Autoplay is deliberately absent: a carousel that moves on its own cannot be
 * photographed twice the same way.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-200 grid grid-cols-2 gap-8">
      <Case label="Arrows and indicator">
        <Carousel showArrows showPagination aria-label="Arrows and indicator">
          {slides(4).map((n) => (
            <CarouselItem key={n}>
              <Slide>{n}</Slide>
            </CarouselItem>
          ))}
        </Carousel>
      </Case>

      <Case label="Looping, arrows only — neither arrow disables, no dot row">
        <Carousel showArrows infiniteLoop aria-label="Looping">
          {slides(4).map((n) => (
            <CarouselItem key={n}>
              <Slide>{n}</Slide>
            </CarouselItem>
          ))}
        </Carousel>
      </Case>

      <Case label="Three slides in view">
        <Carousel showArrows showPagination opts={{ align: "start" }} aria-label="Three in view">
          {slides(8).map((n) => (
            <CarouselItem key={n} className="basis-1/3">
              <Slide>{n}</Slide>
            </CarouselItem>
          ))}
        </Carousel>
      </Case>

      <Case label="Peek — next slide showing through">
        <Carousel showArrows showPagination peek={12} aria-label="Peek">
          {slides(5).map((n) => (
            <CarouselItem key={n}>
              <Slide>{n}</Slide>
            </CarouselItem>
          ))}
        </Carousel>
      </Case>

      <Case label="Vertical">
        <Carousel
          orientation="vertical"
          showArrows
          showPagination
          className="h-46"
          aria-label="Vertical"
        >
          {slides(4).map((n) => (
            <CarouselItem key={n}>
              <Slide>{n}</Slide>
            </CarouselItem>
          ))}
        </Carousel>
      </Case>
    </div>
  ),
};
