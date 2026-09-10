"use client";

import * as React from "react";

/**
 * Where a floating panel portals to — the element a `Select` menu, a `Popover`,
 * a `DropdownMenu` or a `Tooltip` is appended to when it opens.
 *
 * `null` means `document.body`, which is Radix's own default and what every one
 * of them did before this existed.
 *
 * ## Why a container rather than a bigger z-index
 *
 * A menu portalled to `document.body` is a sibling of whatever modal it was
 * opened from, so which one is on top is decided by a number — and the number it
 * has to beat belongs to the host application, not to this package. Every overlay
 * here is `z-50`; a brand app's own modal at `z-index: 1000` covers the menu, and
 * the only fix available to the product team is to guess a bigger number and keep
 * guessing every time the app's scale changes.
 *
 * Portalling into the dialog's own panel ends the argument instead of winning it:
 * the menu is then *inside* the dialog's stacking context, where it is above the
 * dialog's content for the same reason any later sibling is, no matter what
 * z-index the dialog itself carries in the page.
 *
 * ## What must not read this
 *
 * Only popper-positioned panels — the four named above. A modal of its own
 * (`AlertDialog`, `Sheet`, `Drawer`, a nested `Dialog`) must go on portalling to
 * the body: `DialogContent` is `transform`ed to centre itself, which makes it the
 * containing block for `position: fixed` descendants, so a nested modal's
 * `fixed inset-0` overlay would stretch over the parent panel instead of the
 * viewport. A popper is unaffected because Floating UI measures its offset parent
 * and compensates; a raw `fixed` element has nothing doing that for it.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

/**
 * Publishes the element its subtree's floating panels portal into.
 *
 * Rendered by `DialogContent` around its children with its own panel as the
 * value. Scoped by the tree like any context, so a `Select` in a dialog inside a
 * dialog lands in the inner one without anything keeping track.
 */
const PortalContainerProvider = PortalContainerContext.Provider;

/**
 * The container a floating panel should portal into, or `null` for the body.
 *
 * @returns {HTMLElement | null} The nearest published container, `null` outside one
 */
function usePortalContainer() {
  return React.useContext(PortalContainerContext);
}

export { PortalContainerProvider, usePortalContainer };
