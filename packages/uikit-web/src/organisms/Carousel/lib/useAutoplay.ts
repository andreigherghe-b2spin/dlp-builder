"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import type {
  CarouselApi,
  CarouselAutoplayOptions,
  CarouselPlugin,
} from "@/organisms/Carousel/lib/useCarousel";
import { IN_VIEW_THRESHOLD, isSeen, resolveAutoplayOptions } from "@/organisms/Carousel/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** On the server, assume motion is fine — the common case, and hydration corrects it. */
function readReducedMotionOnServer() {
  return false;
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  );
}

/**
 * Builds the plugin list for `useEmblaCarousel`, with Autoplay in front of
 * whatever the consumer passed.
 *
 * Reduced motion decides whether the plugin exists at all rather than whether
 * the gate below lets it run. It has to: with `stopOnInteraction: false` the
 * plugin registers its own `mouseleave`, `pointerUp` and `focusout` handlers
 * that call its private `startAutoplay()` directly, so a gate that only calls
 * `stop()` would be undone the moment the pointer left the carousel.
 */
function useAutoplayPlugins(
  autoplay: boolean | CarouselAutoplayOptions | undefined,
  plugins: CarouselPlugin,
): CarouselPlugin {
  const prefersReducedMotion = usePrefersReducedMotion();
  const enabled = Boolean(autoplay) && !prefersReducedMotion;
  const { delay, stopOnInteraction, stopOnMouseEnter } = resolveAutoplayOptions(autoplay);

  // Not memoised, and the `plugins` prop asks for nothing in return:
  // `useEmblaCarousel` compares plugin lists with `arePluginsEqual`, which maps
  // each plugin to its `options` and deep-compares those. A fresh array holding
  // the same options is equal and does nothing; a genuinely different one calls
  // `reInit`, which keeps the current slide.
  //
  // That comparison is why `rootNode` below is written inline and captures
  // nothing: a function-valued option is compared by its *source text*
  // (`` `${a}` === `${b}` ``), so an inline arrow is equal to itself across
  // renders and costs no `reInit` — while one that closed over a prop would read
  // as unchanged to Embla however much the captured value moved. Neither re-creates the carousel.
  //
  // `playOnInit: false` because the gate owns when it may start.
  //
  // `rootNode` moves the plugin's own hover handling from the box Embla measures
  // — the clipped viewport — up to the carousel root. The controls are outside
  // that viewport: the arrows are positioned at `-left-2` / `-right-2` and the
  // indicator sits in a different grid row, so with the default root, sliding
  // the pointer from a slide onto an arrow fires `mouseleave` and the plugin
  // advances the carousel out from under the click. The root is the viewport's
  // parent and contains all three. The plugin falls back to its own root if this
  // returns nothing, so a detached node needs no guard here.
  const autoplayPlugins = enabled
    ? [
        Autoplay({
          delay,
          stopOnInteraction,
          stopOnMouseEnter,
          playOnInit: false,
          rootNode: (emblaRoot) => emblaRoot.parentElement,
        }),
      ]
    : [];

  return [...autoplayPlugins, ...(plugins ?? [])];
}

/**
 * Starts and stops autoplay from the one thing the plugin cannot see for
 * itself: whether the carousel is on screen.
 *
 * The tab being in the background is the plugin's own business — it listens for
 * `visibilitychange` and guards `startAutoplay` on `documentIsHidden()` — and
 * reduced motion is handled a level up, by not building the plugin at all.
 */
function useAutoplayGate(
  api: CarouselApi,
  autoplay: boolean | CarouselAutoplayOptions | undefined,
) {
  const enabled = Boolean(autoplay);
  const { playOnlyInView } = resolveAutoplayOptions(autoplay);

  React.useEffect(() => {
    if (!enabled || !api) return;

    const root = api.rootNode();
    let isInView = !playOnlyInView;
    let cancelled = false;

    // The plugin and the snap count are read on every call rather than closed
    // over, because `reInit` re-runs the plugin's own `init` underneath us and
    // the slide count can change with it.
    const sync = () => {
      const plugin = api.plugins().autoplay;

      // At a single scroll snap the plugin returns from `init` before it ever
      // assigns its delay. It stays registered, so it looks available — and
      // `play()` would then index a delay that does not exist and throw. There
      // is nothing to advance at one snap anyway.
      if (!plugin || api.scrollSnapList().length < 2) return;

      // Off screen, `stop()` runs unconditionally rather than only when the
      // plugin looks to be playing. With `stopOnInteraction: false` the plugin
      // owns `mouseleave`, `pointerUp` and `focusout` handlers that call its
      // private `startAutoplay()` directly, so "already stopped" is a state it
      // can leave on its own: a carousel that scrolled out of view under a
      // resting pointer gets a `mouseleave` immediately afterwards and would
      // advance off-screen for the rest of the page's life, since no further
      // intersection callback is coming to correct it.
      if (!isInView) {
        plugin.stop();

        return;
      }

      // In view, the guard stays: `play()` clears and re-arms the timer, so it is
      // not idempotent, and a slow scroll that keeps the carousel crossing the
      // threshold would reset the countdown every time — the carousel would sit
      // in view without ever advancing.
      if (plugin.isPlaying()) return;

      plugin.play();
    };

    const stopOutOfViewSoon = () =>
      queueMicrotask(() => {
        if (cancelled || isInView) return;

        api.plugins().autoplay?.stop();
      });

    const observer = playOnlyInView
      ? new IntersectionObserver(
          (entries) => {
            isInView = isSeen(entries[entries.length - 1]);
            sync();
          },
          // Both ends of the range: at `IN_VIEW_THRESHOLD` alone nothing fires
          // for a carousel bigger than the viewport, whose ratio may never reach
          // it, and `isSeen`'s escape hatch would never be consulted.
          { threshold: [0, IN_VIEW_THRESHOLD] },
        )
      : null;

    observer?.observe(root);
    // `reInit` fires on resize and whenever the slides change, and it destroys
    // and re-initialises the plugin. With `playOnInit: false` that leaves
    // autoplay stopped for good unless something starts it again — one window
    // resize would otherwise kill it for the life of the page.
    api.on("reInit", sync);
    // The gate cannot be a one-way valve, because the plugin starts itself from
    // its own `mouseleave`, `pointerUp` and `focusout` handlers. `autoplay:play`
    // is the moment it did, and this is what takes that start back when the
    // carousel is off screen.
    //
    // One microtask later rather than in the event, and neither half of that is
    // cosmetic. The plugin emits `autoplay:play` from inside `startAutoplay`,
    // *before* it arms the timer and sets the flag `isPlaying()` reads — so a
    // `stop()` from inside the event sees "not playing", does nothing, and the
    // timer arms anyway, while running the full `sync` there would call `play()`
    // into a `startAutoplay` whose flag is still unset and recurse until the
    // stack ran out. Deferring lets the plugin finish first, and `stopOutOfView`
    // is deliberately not `sync`: this handler must never start anything.
    api.on("autoplay:play", stopOutOfViewSoon);
    sync();

    return () => {
      cancelled = true;
      observer?.disconnect();
      api.off("reInit", sync);
      api.off("autoplay:play", stopOutOfViewSoon);
      api.plugins().autoplay?.stop();
    };
  }, [api, enabled, playOnlyInView]);
}

export { useAutoplayGate, useAutoplayPlugins };
