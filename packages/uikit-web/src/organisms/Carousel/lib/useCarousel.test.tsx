import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { Carousel, CarouselItem, useCarousel } from "@/organisms/Carousel";

/**
 * The hook reads the carousel from inside it, so the wrapper is a real
 * `<Carousel>` with real slides in it.
 *
 * Not a hand-built `CarouselContext.Provider`: what this hook is for is reaching
 * the live Embla state from a slide's own content, and a provider filled in by the
 * test would only prove that context works.
 */
const mount = () =>
  renderHook(() => useCarousel(), {
    wrapper: ({ children }) => (
      <Carousel aria-label="Offers" data-testid="carousel" style={{ width: 384 }}>
        <CarouselItem>
          <div style={{ height: 120 }}>Slide 1</div>
        </CarouselItem>
        <CarouselItem>
          <div style={{ height: 120 }}>Slide 2</div>
        </CarouselItem>
        <CarouselItem>
          <div style={{ height: 120 }}>Slide 3</div>
        </CarouselItem>
        {children}
      </Carousel>
    ),
  });

describe("reading the carousel from inside it", () => {
  it("reports where the carousel is and how far it can go", async () => {
    const { result } = await mount();

    // Waited for rather than read straight away: the snaps arrive once Embla has
    // measured the slides, which is a layout pass after the first render.
    await vi.waitFor(() => expect(result.current.scrollSnaps).toHaveLength(3));

    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.orientation).toBe("horizontal");
    expect(result.current.canScrollPrev).toBe(false);
    expect(result.current.canScrollNext).toBe(true);
  });

  it("moves the carousel, and reports the move back", async () => {
    const { result } = await mount();

    await vi.waitFor(() => expect(result.current.canScrollNext).toBe(true));

    result.current.scrollTo(2);

    await vi.waitFor(() => expect(result.current.selectedIndex).toBe(2));
    expect(result.current.canScrollNext).toBe(false);
    expect(result.current.canScrollPrev).toBe(true);

    result.current.scrollPrev();

    await vi.waitFor(() => expect(result.current.selectedIndex).toBe(1));

    result.current.scrollNext();

    await vi.waitFor(() => expect(result.current.selectedIndex).toBe(2));
  });
});

describe("calling it from outside a carousel", () => {
  it("says so instead of handing back an empty carousel", async () => {
    // The mistake it catches is a control built as a child of the carousel: an
    // unrecognised child is treated as a slide and put in the clipped track, so a
    // hook that returned `null` here would leave a silently invisible button.
    await expect(renderHook(() => useCarousel())).rejects.toThrowError(
      "useCarousel must be used within a <Carousel />",
    );
  });
});
