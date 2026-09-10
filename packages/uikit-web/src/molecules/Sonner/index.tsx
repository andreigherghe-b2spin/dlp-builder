"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the one on `ui/Toaster.tsx` is
// dropped on the way into dist/. So the boundary is declared here, where the
// built consumer actually sees it. `Toaster` renders the toast list, `useSonner`
// is a hook: both are client-only anyway.

/**
 * The toaster's single entry point: `@ui/web/Sonner` resolves here, and nothing
 * outside this directory imports any deeper.
 *
 * ## One component, three names
 *
 * **Toast, toaster and snackbar are all this.** The products have called it all
 * three — `GlobalSnackbar` and `openSnackbar()` in the brand apps, `Toast` in
 * the loyalty feature — and there is no separate `Snackbar` or `Toast` component
 * in the design system to go looking for.
 *
 * The naming is shadcn's, unchanged: the entry is `sonner`
 * (`ui.shadcn.com/docs/components/radix/sonner`), the component it exports is
 * `Toaster`, and the function is `toast`. So: `import { Toaster, toast } from
 * "@ui/web/Sonner"`. The three words are one thing — the *library* is Sonner,
 * the *component you render* is the Toaster, and the *function you call* raises
 * a toast.
 *
 * `Toaster` is rendered once, at the root of the app. Everything after that is
 * `toast`, called from wherever the event happens — it talks to a module-level
 * observer rather than through React, so there is no context to be inside of and
 * no hook to call. `useSonner` is for reading the live list; a component raising
 * a toast does not need it.
 *
 * `toast` and `useSonner` are re-exported from Sonner untouched: they are that
 * observer, not markup, and there is nothing about them to restyle. Importing
 * `toast` from `sonner` directly reaches the same singleton — going through here
 * only saves a second dependency in the app.
 *
 * ## Coming from `GlobalSnackbar`
 *
 * The brand apps have no Sonner today: they have a redux slice and a MUI-style
 * `Snackbar`, so this is a replacement rather than a restyle. **The recipe is on
 * `Toaster`'s own JSDoc**, not here — that is the block `codegen:docs` puts in
 * `ai-docs.json`, which is what the MCP server hands an agent asked to do the
 * migration. One copy, and it is the copy the tooling can read.
 *
 * The short of it: `openSnackbar` is a 15-line module per app, so make it a thunk
 * over `toast` and none of the ~190 call sites has to change. The slice itself
 * goes — `toast()` *is* the state. A snackbar needed a store because the message
 * had to live somewhere between the dispatch and the render; the toast observer
 * is that somewhere.
 *
 * One at a time is preserved: `Toaster` defaults `visibleToasts` to `1`, so a
 * second call replaces the message on screen exactly as `openSnackbar` did.
 * Sonner's own default is three, stacked — pass `visibleToasts={3}` for that.
 *
 * The width is **not** preserved, because it is not this library's to hold. The
 * brand apps size the snackbar themselves (`min-width: 390px; max-width: 590px`
 * in `GlobalSnackbar/Toast/styles.module.scss`), and the component ships no
 * width at all — Sonner's own 356px stands until a caller says otherwise:
 *
 * ```tsx
 * <Toaster style={{ "--width": "590px" } as React.CSSProperties} />
 * ```
 *
 * It has to be `--width` rather than a class. Sonner puts `--width: 356px` in
 * the list's inline `style`, and an inline style outranks any class — so
 * `className="w-[590px]"` is silently ignored. There is a test pinning both
 * halves of that.
 */

export { Toaster } from "@/molecules/Sonner/ui/Toaster";

export {
  toast,
  useSonner,
  type ExternalToast,
  type ToastClassnames,
  type ToasterProps,
} from "sonner";
