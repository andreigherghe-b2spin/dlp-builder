"use client";

import { CircleCheck, Info, Loader2, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { Toaster as ToasterPrimitive, type ToasterProps } from "sonner";

import { buttonVariants } from "@/atoms/Button";
import { bodyVariants } from "@/atoms/Typography";
import { cn } from "@/lib/utils";

/**
 * Everything Sonner draws itself sits behind `[data-sonner-toast][data-styled=true]`
 * — the padding, the background, the border, `display: flex`, and the close button
 * pinned to the corner. That selector is two attributes wide, so no Tailwind class
 * can outrank it; `unstyled` drops the attribute and hands the toast over instead.
 *
 * Only the layout comes back with it. The rest of `[data-sonner-toast]` — the
 * stacking transforms, the swipe, the enter and exit — is unconditional and is
 * left alone.
 *
 * The grid is what puts the actions under the text rather than beside it: Sonner
 * renders them as siblings of `[data-content]`, so a flex row cannot indent them
 * past the icon. Four columns — icon, action, the rest, close — and each part is
 * placed by name:
 *
 * ```
 *   ┌──────┬──────────┬───────────┬───────┐
 *   │ icon │ title + description  │ close │
 *   ├──────┼──────────┼───────────┼───────┤
 *   │      │ action   │ cancel    │       │
 *   └──────┴──────────┴───────────┴───────┘
 * ```
 *
 * Horizontal spacing is margins on the parts, not `gap-x` on the grid: a toast
 * with no icon and no action still has those columns, and a track gap would show
 * as a phantom indent under text that has nothing to its left.
 *
 * The neutral colours sit on the base because the base is the only thing every
 * toast gets. They were `data-[type=default]:` variants, which matched nothing:
 * Sonner reads the type straight through — `const toastType = toast.type` — so a
 * toast raised as a plain `toast()` has no `data-type` attribute at all rather
 * than `data-type="default"`. The card came out transparent, keeping its border
 * and its text over whatever it was floating above. `toast.custom()` and
 * `toast.loading()` are untyped the same way and were transparent too.
 *
 * `background-layout-page` rather than `layout-surface`: Figma draws no neutral
 * toast — the design is the four feedback Types and nothing else — so this
 * colour is the application's rather than the design's, and the page background
 * is the one that cannot be mistaken for a panel that failed to paint.
 */
const toast = `
  grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-y-3
  w-full p-4
  rounded-comfortable border
  font-(family-name:--typography-font-family)

  bg-background-layout-page
  border-border-neutral-default
  text-foreground-on-surface-default

  data-[expanded=false]:data-[front=false]:*:opacity-0
`;

/**
 * Figma's four Types, each overriding the neutral card above.
 *
 * The `data-[type=…]` prefix is redundant as a *selector* — Sonner only puts
 * this string on a toast of that type — and load-bearing as a *specificity*. It
 * joins `classNames.toast` and `classNames[type]` with a plain concat rather
 * than `tw-merge`, so both class lists reach the element intact and only the
 * cascade separates them; at (0,2,0) against the base's (0,1,0) the feedback
 * colour wins wherever Tailwind happens to have emitted the two rules. Written
 * bare, which of them applied would depend on stylesheet order.
 *
 * Not `classNames.default`, which Sonner applies to every toast regardless of
 * its type, and which is why the neutral colours cannot live there either.
 */
const success = `
  data-[type=success]:bg-background-feedback-positive-container
  data-[type=success]:border-border-feedback-positive
  data-[type=success]:text-foreground-feedback-on-positive-container
`;

const error = `
  data-[type=error]:bg-background-feedback-negative-container
  data-[type=error]:border-border-feedback-negative
  data-[type=error]:text-foreground-feedback-on-negative-container
`;

const warning = `
  data-[type=warning]:bg-background-feedback-warning-container
  data-[type=warning]:border-border-feedback-warning
  data-[type=warning]:text-foreground-feedback-on-warning-container
`;

const info = `
  data-[type=info]:bg-background-feedback-informative-container
  data-[type=info]:border-border-feedback-informative
  data-[type=info]:text-foreground-feedback-on-informative-container
`;

/**
 * Figma's icon container: 20×20, sixteen pixels clear of the text. `min-*`
 * rather than a fixed `size-5` so a caller's larger `icons` glyph grows the box
 * instead of spilling out of it.
 *
 * The box has to have a size of its own, and be `relative`, because of the
 * loader. Sonner positions its spinner absolutely — `.sonner-loader { position:
 * absolute; top: 50%; left: 50% }` — and gets away with it because its own
 * `[data-icon]` is `relative` and 16px square. Both of those live behind
 * `[data-styled=true]`, which `unstyled` drops, so the spinner escaped to the
 * toast itself and centred on the whole card. A `loading` toast has nothing but
 * the spinner in this slot, and an absolutely positioned child contributes no
 * size, so the `min-*` is what it centres in.
 *
 * `empty:hidden` because Sonner renders the wrapper for a typeless toast too,
 * with nothing in it — hiding it is what keeps `mr-4` off a toast that has no
 * icon to separate from its text.
 */
const icon = `
  col-start-1 row-start-1 mr-4
  relative flex min-h-5 min-w-5 shrink-0 items-center justify-center
  empty:hidden
  [&_svg:not([class*='size-'])]:size-5
`;

const content = `
  col-start-2 col-span-2 row-start-1
  flex min-w-0 flex-col gap-0.5
`;

/**
 * Figma's `Body/M/Semibold` and `Body/S/Regular`, taken from `bodyVariants`
 * rather than restated — the same way the three buttons come from
 * `buttonVariants`, and the same call `DialogHeader` and `DialogFooter` make for
 * their own description.
 *
 * The size is a token either way, so what this really buys is the line height:
 * Figma keeps it inside the composite text style, where it cannot be emitted as
 * a CSS variable, so `1.46` exists only as a number in `Typography.tsx`. Writing
 * it here too would put a magic number in a second place and let the two drift.
 */
const title = bodyVariants({ size: "m", weight: "semibold" });

const description = bodyVariants({ size: "s", weight: "regular" });

/**
 * Figma names an icon per Type, and gives the glyph the feedback foreground while
 * the text beside it takes the `on-…-container` colour — so the colour is on the
 * element rather than in a descendant selector reaching into `[data-icon]`.
 */
const defaultIcons = {
  success: <CircleCheck aria-hidden className="text-foreground-feedback-positive" />,
  error: <OctagonAlert aria-hidden className="text-foreground-feedback-negative" />,
  warning: <TriangleAlert aria-hidden className="text-foreground-feedback-warning" />,
  info: <Info aria-hidden className="text-foreground-feedback-informative" />,
  close: <X aria-hidden />,
  // The same `Loader2` the Button spins, at the same size as the four feedback
  // glyphs, in the toast's own text colour. Supplying one at all is what keeps
  // Sonner from drawing its default instead: twelve rotating `<div>` bars, sized
  // and coloured by its own stylesheet, which belong to no design here. Passing
  // it also moves the spinner into `[data-icon]`, so it lands where every other
  // icon does rather than in a slot of its own.
  loading: <Loader2 aria-hidden className="animate-spin" />,
};

/**
 * Toast notifications — the design system's **toast**, **toaster** and
 * **snackbar**: one component under three names, and this is it. A brand app
 * moving off `GlobalSnackbar` / `openSnackbar()` comes here, and so does anything
 * that would have reached for a `Toast`. There is no separate `Snackbar` or
 * `Toast` component to look for.
 *
 * Built on Sonner and drawn in the design system's feedback palette.
 *
 * Render one `Toaster` at the root of the app; everything after that is the
 * `toast` function, called from wherever the event happens. Figma's four Types
 * are Sonner's four typed calls — `toast.success`, `toast.error`,
 * `toast.warning`, `toast.info` — each with its own container colour, border and
 * icon. A plain `toast()` has no feedback meaning and so takes the neutral
 * surface.
 *
 * A toast carries a title, an optional description, an optional primary action
 * and an optional secondary one, and the close button. The actions are Button
 * `xs` in `default` and `secondary`; the close is Button `sm` `overlay`.
 *
 * One is on screen at a time, replacing the last, which is how the brand apps'
 * snackbar behaves. `visibleToasts` is what restores Sonner's stack.
 *
 * ## Replacing `openSnackbar` in a brand app
 *
 * **Do not rewrite the call sites.** All ~190 of them import `openSnackbar` from
 * one 15-line module per app (`store/modules/snackbar/actions.ts`). Make that a
 * thunk over `toast` and every `dispatch(openSnackbar({ … }))` keeps working
 * unchanged — the variants already line up, since `SnackbarVariants` is
 * `success | warning | error | info`:
 *
 * ```ts
 * export const openSnackbar =
 *   (o: OpenSnackbarOptionsV2 = {}): TypedThunk =>
 *   () => {
 *     const raise = o.variant ? toast[o.variant] : toast;
 *     raise(o.messageIntl ? t(o.messageIntl) : o.message, {
 *       duration: o.autoHide,
 *       position: o.positionVertical && `${o.positionVertical}-${o.positionHorizontal ?? "center"}`,
 *       action: o.action && { label: o.action.text, onClick: o.action.action },
 *     });
 *   };
 *
 * export const closeSnackbar = () => () => toast.dismiss();
 * ```
 *
 * Then render `<Toaster />` once at the root instead of `<GlobalSnackbar />`, and
 * give it the app's width: `style={{ "--width": "590px" }}`.
 *
 * Rewriting a call site by hand instead — `openSnackbar({ message, variant })`
 * becomes `toast[variant](message)`, and the options rename:
 * `autoHide` → `duration` · `action: { text, action }` → `action: { label, onClick }` ·
 * a second button → `cancel: { label, onClick }` · `positionVertical` +
 * `positionHorizontal` → one `position` · `toastOnTop` → `position: "top-center"` ·
 * `closeSnackbar()` → `toast.dismiss(id?)`.
 *
 * **A component as `message` keeps working.** The message is a `ReactNode`, so a
 * call site passing a whole `ConfirmationMessageContent` hands it to `toast`
 * unchanged and `componentProps` becomes that component's own props — it renders
 * inside the card, with the icon, the palette, both actions and the close button
 * around it. It lands in the title slot, which carries `body/m` at semibold, so a
 * component that wants its own type sets it. Do **not** reach for `toast.custom`
 * here: that treats what it is given as the whole toast and drops the icon and
 * the close button with it.
 *
 * Dropped, and handled at the call site: `messageIntl` (translate first),
 * `errorReasonCode` / `errorDetails` / `dynamicValues` (build the string),
 * `messageAlign` and `buttonOptions` (the design has one layout), `showAsToast`
 * (every toast is one now), `closeWhenPathChanged` (`toast.dismiss()` in the
 * route effect).
 *
 * **Not covered:** `isModalLike` and `isFailedTransaction` are the snackbar's
 * *other* mode — a centred message rather than a toast — and this component does
 * not replace it. `customSuccess` is a background image, not a token.
 *
 * @alias Snackbar
 * @alias GlobalSnackbar
 * @alias Toast
 * @alias Sonner
 *
 * @param {('top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right')} [position='bottom-right'] - Which corner the stack sits in
 * @param {boolean} [expand=false] - Show the whole stack rather than collapsing it behind the front toast
 * @param {boolean} [closeButton=false] - Draw the close button on every toast
 * @param {number} [duration=4000] - How long a toast stays, in milliseconds
 * @param {number} [gap=14] - Space between stacked toasts, in pixels
 * @param {number} [visibleToasts=1] - How many are on screen at once; `1` is the snackbar's one-at-a-time
 * @param {object} [icons] - Replaces the icon for one or more types
 * @param {object} [toastOptions] - Defaults for every toast; `classNames` extends the design system's rather than replacing it
 * @param {string} [className] - Additional CSS classes for the list element
 * @param {React.CSSProperties} [style] - Additional styles for the list element; `--width` is what sizes the snackbar
 *
 * @example
 * ```tsx
 * // Once, at the root of the app
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster closeButton />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Anywhere after that
 * import { toast } from "@ui/web/Sonner";
 *
 * toast.success("Deposit confirmed");
 * toast.error("Card declined", { description: "Try another payment method." });
 * ```
 *
 * @example
 * ```tsx
 * // Figma's full anatomy: icon, title, description and both actions
 * toast.warning("Session expiring", {
 *   description: "You will be signed out in two minutes.",
 *   action: { label: "Stay signed in", onClick: () => renew() },
 *   cancel: { label: "Sign out", onClick: () => signOut() },
 * });
 * ```
 *
 * @remarks
 * **The width is the caller's.** This component sets none, so Sonner's own 356px
 * stands until an app says otherwise — the brand apps size their snackbar
 * between 390 and 590, and that is a layout decision, not something to bake in
 * here. Set it with `--width`:
 *
 * ```tsx
 * <Toaster style={{ "--width": "590px" } as React.CSSProperties} />
 * ```
 *
 * A class will not do it: Sonner writes `--width` into the list's inline
 * `style`, and an inline style outranks any class, so `className="w-[590px]"`
 * is silently ignored. `className` still reaches the list for everything else.
 *
 * `richColors` is inert: the toast is drawn from the design system's feedback
 * tokens in every theme, which is what that prop exists to switch on elsewhere.
 *
 * Requires `@ui/themes/config.css` for the `button-base` utility behind the
 * action and close buttons — already every brand app's one required import.
 *
 * @cssVariables
 * Radius and typography:
 * - `--radius-comfortable`
 * - `--components-button-border`
 * - `--components-button-radius`
 * - `--typography-font-family`
 * - `--typography-font-size-body-m`
 * - `--typography-font-size-body-s`
 * - `--typography-font-size-label-m`
 * - `--typography-font-size-label-s`
 * - `--typography-font-weight-regular`
 * - `--typography-font-weight-semibold`
 * - `--typography-font-weight-bold`
 *
 * Semantic colors:
 * - `--color-background-brand-primary-container`
 * - `--color-background-brand-secondary-container`
 * - `--color-background-feedback-informative-container`
 * - `--color-background-feedback-negative-container`
 * - `--color-background-feedback-positive-container`
 * - `--color-background-feedback-warning-container`
 * - `--color-background-layout-page`
 * - `--color-background-layout-surface-overlay`
 * - `--color-border-feedback-informative`
 * - `--color-border-feedback-negative`
 * - `--color-border-feedback-positive`
 * - `--color-border-feedback-warning`
 * - `--color-border-neutral-default`
 * - `--color-foreground-brand-on-primary-container`
 * - `--color-foreground-brand-on-secondary-container`
 * - `--color-foreground-feedback-informative`
 * - `--color-foreground-feedback-negative`
 * - `--color-foreground-feedback-on-informative-container`
 * - `--color-foreground-feedback-on-negative-container`
 * - `--color-foreground-feedback-on-positive-container`
 * - `--color-foreground-feedback-on-warning-container`
 * - `--color-foreground-feedback-positive`
 * - `--color-foreground-feedback-warning`
 * - `--color-foreground-on-surface-default`
 *
 * @see [Reference](https://sonner.emilkowal.ski/getting-started)
 * @see [Documentation](https://ui.shadcn.com/docs/components/sonner)
 */
function Toaster({ icons, toastOptions, visibleToasts = 1, ...props }: ToasterProps) {
  // Sonner has no slot to hand a part's `className` to, only this map — so the
  // `cn(base, classNames?.part)` that would sit on each element is gathered here
  // instead. Consumer classes still extend rather than replace: `rounded-none`
  // on `toast` wins the radius and keeps the grid.
  const { classNames, unstyled = true, ...options } = toastOptions ?? {};

  return (
    <ToasterPrimitive
      icons={{ ...defaultIcons, ...icons }}
      // One on screen at a time, which is how the brand apps' snackbar behaves
      // and what the products' 188 call sites were written against. Sonner's own
      // default is three, stacked. Raise it to get the stack back.
      //
      // Sonner keeps the older toast mounted and merely hides it, so a toast
      // given a longer `duration` than the one that replaced it comes back when
      // that one expires. That is the right outcome — a message meant to persist
      // should outlive a transient one — but it is the one case where two calls
      // do not read as a plain replacement.
      visibleToasts={visibleToasts}
      toastOptions={{
        ...options,
        // Still overridable, for a caller who wants Sonner's own chrome back;
        // `true` is what these classes are written against.
        unstyled,
        classNames: {
          // Spread first so the parts this component does not dress — `loader`,
          // `loading`, `default` — reach Sonner untouched.
          ...classNames,
          toast: cn(toast, classNames?.toast),
          success: cn(success, classNames?.success),
          error: cn(error, classNames?.error),
          warning: cn(warning, classNames?.warning),
          info: cn(info, classNames?.info),
          icon: cn(icon, classNames?.icon),
          content: cn(content, classNames?.content),
          title: cn(title, classNames?.title),
          description: cn(description, classNames?.description),
          // Figma draws all three as Buttons: `xs` `default` and `xs` `secondary`
          // for the actions, `sm` `overlay` `icon` for the close. The classes come
          // from `buttonVariants` rather than being restated, so they move with the
          // real Button on the next token pass.
          actionButton: cn(
            buttonVariants({ size: "xs" }),
            "col-start-2 row-start-2 mr-2",
            classNames?.actionButton,
          ),
          cancelButton: cn(
            buttonVariants({ variant: "secondary", size: "xs" }),
            "col-start-3 row-start-2 justify-self-start",
            classNames?.cancelButton,
          ),
          closeButton: cn(
            buttonVariants({ variant: "overlay", size: "sm", icon: true }),
            "col-start-4 row-start-1 ml-4",
            classNames?.closeButton,
          ),
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
