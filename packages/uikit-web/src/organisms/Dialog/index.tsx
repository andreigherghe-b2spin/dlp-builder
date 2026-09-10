"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every export below is
// client-only anyway: they render Radix primitives and read React context.

// The dialog's single entry point: `@ui/web/Dialog` resolves here, and nothing
// outside this directory imports any deeper.
//
// What is not re-exported is internal on purpose — `dialogContentVariants` and
// the layout maps behind each part. A consumer restyles the dialog through
// `className`, `classNames` and the `data-testid` each part derives from the
// root's, which name the same parts without pinning the markup that produces them.

export {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  type DialogProps,
  DialogTrigger,
} from "@/organisms/Dialog/ui/Dialog";

export {
  DialogBody,
  DialogContent,
  type DialogContentProps,
} from "@/organisms/Dialog/ui/DialogContent";

export {
  DialogDescription,
  DialogHeader,
  DialogTitle,
  type DialogHeaderProps,
} from "@/organisms/Dialog/ui/DialogHeader";

export { DialogFooter, type DialogFooterProps } from "@/organisms/Dialog/ui/DialogFooter";
