"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every export below is
// client-only anyway: they render Vaul's primitives and read React context.

// The drawer's single entry point: `@ui/web/Drawer` resolves here, and nothing
// outside this directory imports any deeper.
//
// Everything here is mechanics. `DrawerHeader`, `DrawerBody` and `DrawerFooter`
// are the flex contract that makes a fixed-height panel behave — one region
// scrolls, two hold their size — and not a top bar, a content area and a button
// row. They draw no padding, no rule and no type; `DrawerTitle` draws none
// either, and exists because Radix needs it to name the panel. Everything
// visible is the caller's.
//
// `drawerContentVariants` stays internal. A consumer restyles the drawer through
// `className`, `classNames` and the `data-testid` each part derives from the
// root's, which name the same parts without pinning the markup behind them.

export {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  type DrawerProps,
  DrawerTitle,
  DrawerTrigger,
} from "@/organisms/Drawer/ui/Drawer";

export {
  DrawerBody,
  DrawerContent,
  type DrawerContentProps,
  DrawerFooter,
  DrawerHeader,
} from "@/organisms/Drawer/ui/DrawerContent";
