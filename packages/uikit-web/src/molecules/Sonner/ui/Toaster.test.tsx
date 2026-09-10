import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Toaster, toast, type ToasterProps } from "@/molecules/Sonner";

const TITLE = "Deposit confirmed";
const DESCRIPTION = "500 GC and 5 SC have been added to your balance.";
const TRIGGER = "Show toast";

// The toast state is a module-level singleton, not something the render owns, so
// `cleanup` unmounting the toaster does not empty it. A toast left standing is a
// toast the next test can find and assert on.
afterEach(() => {
  toast.dismiss();
});

/**
 * Renders a toaster and a button that raises the toast, rather than calling
 * `toast()` straight from the test body: a call before the toaster has
 * subscribed reaches no one, and a press is what a consumer actually does.
 */
async function mountToaster({
  show,
  ...props
}: Partial<ToasterProps> & { show: () => void; children?: never }) {
  await render(
    <>
      <Toaster {...props} />
      <button type="button" onClick={show}>
        {TRIGGER}
      </button>
    </>,
  );

  // Page-level rather than scoped to the render: the toaster is `position: fixed`
  // and the setup unmounts after every test, so there is only ever one on screen.
  const notification = () => page.getByRole("listitem");
  const action = (name: string) => page.getByRole("button", { name });

  // Sonner prepends, so index 0 is the newest and the one it replaced follows.
  const notifications = () => notification().elements() as HTMLElement[];

  const raise = async () => {
    await userEvent.click(action(TRIGGER));
    await expect.element(page.getByText(TITLE)).toBeVisible();
  };

  return { action, notification, notifications, raise };
}

/** The Figma anatomy in full — icon, title, description, both actions. */
function showFullToast(handlers: { onAction?: () => void; onCancel?: () => void } = {}) {
  return () =>
    toast.success(TITLE, {
      description: DESCRIPTION,
      // The toast is dismissed by the assertions, never by the clock: a toast
      // that expires mid-test looks exactly like a button that dismissed it.
      duration: Infinity,
      action: { label: "Primary", onClick: handlers.onAction ?? (() => undefined) },
      cancel: { label: "Secondary", onClick: handlers.onCancel ?? (() => undefined) },
    });
}

describe("the parts of a toast", () => {
  it("draws the title, the description and both actions", async () => {
    const { action, raise } = await mountToaster({ show: showFullToast() });

    await raise();

    await expect.element(page.getByText(DESCRIPTION)).toBeVisible();
    await expect.element(action("Primary")).toBeVisible();
    await expect.element(action("Secondary")).toBeVisible();
  });

  it("draws the close button once the toaster asks for one", async () => {
    const { action, raise } = await mountToaster({ closeButton: true, show: showFullToast() });

    await raise();

    await expect.element(action("Close toast")).toBeVisible();
  });

  it("leaves the close button off by default", async () => {
    const { action, raise } = await mountToaster({ show: showFullToast() });

    await raise();

    await expect.element(action("Close toast")).not.toBeInTheDocument();
  });
});

describe("dismissing a toast", () => {
  it("runs the primary action and takes the toast away", async () => {
    const onAction = vi.fn();
    const { action, raise } = await mountToaster({ show: showFullToast({ onAction }) });

    await raise();
    await userEvent.click(action("Primary"));

    expect(onAction).toHaveBeenCalled();
    await expect.element(page.getByText(TITLE)).not.toBeInTheDocument();
  });

  it("runs the secondary action and takes the toast away", async () => {
    const onCancel = vi.fn();
    const { action, raise } = await mountToaster({ show: showFullToast({ onCancel }) });

    await raise();
    await userEvent.click(action("Secondary"));

    expect(onCancel).toHaveBeenCalled();
    await expect.element(page.getByText(TITLE)).not.toBeInTheDocument();
  });

  it("takes the toast away from the close button", async () => {
    const { action, raise } = await mountToaster({ closeButton: true, show: showFullToast() });

    await raise();
    await userEvent.click(action("Close toast"));

    await expect.element(page.getByText(TITLE)).not.toBeInTheDocument();
  });

  /**
   * The state that made the button dead in an app while every other assertion
   * about it passed.
   *
   * `button-base` disables by attribute as well as by property, because `asChild`
   * turns a Button into an `<a>` that `:disabled` never matches. Sonner writes
   * `data-disabled={false}` on its close button, and React renders a `data-*`
   * boolean as the *string* — so a presence selector read `"false"` as disabled
   * and put `pointer-events: none` on the one element whose entire job is to be
   * clicked. The pointer went through the X to the toast underneath.
   *
   * The attribute is asserted alongside the style because it is Sonner's to
   * write: if a version stops emitting it, this test should say so rather than
   * quietly go on passing against a button that no longer proves anything.
   */
  it("leaves the close button able to receive the pointer", async () => {
    const { action, raise } = await mountToaster({ closeButton: true, show: showFullToast() });

    await raise();
    const close = action("Close toast").element();

    expect(close).toHaveAttribute("data-disabled", "false");
    expect(getComputedStyle(close).pointerEvents).not.toBe("none");
  });
});

describe("what the design system takes over", () => {
  /**
   * The linchpin of the whole component. Everything Sonner draws itself hangs off
   * `[data-sonner-toast][data-styled=true]`, a selector no class can outrank — so
   * if this attribute ever comes back true, every design system class is silently
   * outranked and the toast reverts to Sonner's own chrome. Nothing else in any
   * suite would notice but a screenshot.
   */
  it("hands the toast over rather than layering classes on Sonner's own", async () => {
    const { notification, raise } = await mountToaster({ show: showFullToast() });

    await raise();

    await expect.element(notification()).toHaveAttribute("data-styled", "false");
  });

  it("gives the toast back when a caller asks for Sonner's chrome", async () => {
    const { notification, raise } = await mountToaster({
      show: showFullToast(),
      toastOptions: { unstyled: false },
    });

    await raise();

    await expect.element(notification()).toHaveAttribute("data-styled", "true");
  });

  it("lets a caller's classes extend the design system's rather than replace them", async () => {
    const { notification, raise } = await mountToaster({
      show: showFullToast(),
      toastOptions: { classNames: { toast: "rounded-none" } },
    });

    await raise();

    // Both, and that is the point: the caller wins the radius they named, and the
    // grid that places the icon, the text and the two actions survives it.
    await expect.element(notification()).toHaveClass(/rounded-none/);
    await expect.element(notification()).toHaveClass(/grid/);
  });

  it("lets a caller's icon replace the one the type carries", async () => {
    const { raise } = await mountToaster({
      show: showFullToast(),
      icons: { success: <span>Custom icon</span> },
    });

    await raise();

    await expect.element(page.getByText("Custom icon")).toBeVisible();
  });
});

describe("one at a time", () => {
  const REPLACED = "Card declined";

  /** A different snackbar on each press, so the two can be told apart. */
  function showTwo() {
    let raised = 0;

    return () => {
      raised += 1;
      if (raised === 1) toast.error(REPLACED, { duration: Infinity });
      else toast.success(TITLE, { duration: Infinity });
    };
  }

  /**
   * Opacity rather than `toBeVisible`: the snackbar it replaced is still mounted
   * — that is how Sonner animates one away — and Playwright counts a
   * zero-opacity element with a box as visible. What a person sees is the
   * opacity, so that is what is asserted.
   */
  async function expectOpacities(notifications: () => HTMLElement[], expected: string[]) {
    await vi.waitFor(() => {
      expect(notifications().map((el) => getComputedStyle(el).opacity)).toEqual(expected);
    });
  }

  async function raiseBoth(action: (name: string) => ReturnType<typeof page.getByRole>) {
    await userEvent.click(action(TRIGGER));
    await expect.element(page.getByText(REPLACED)).toBeVisible();
    await userEvent.click(action(TRIGGER));
    await expect.element(page.getByText(TITLE)).toBeVisible();
  }

  it("replaces the snackbar on screen rather than stacking a second one", async () => {
    const { action, notifications } = await mountToaster({ show: showTwo() });

    await raiseBoth(action);

    await expectOpacities(notifications, ["1", "0"]);
  });

  it("stacks them when a caller asks for more", async () => {
    const { action, notifications } = await mountToaster({
      show: showTwo(),
      visibleToasts: 2,
      expand: true,
    });

    await raiseBoth(action);

    await expectOpacities(notifications, ["1", "1"]);
  });
});

describe("sizing", () => {
  /** The `<ol data-sonner-toaster>` the toast is absolutely positioned inside. */
  const listOf = (notification: () => { element: () => Element }) =>
    notification().element().parentElement as HTMLElement;

  it("takes its width from the caller's `--width`", async () => {
    const { notification, raise } = await mountToaster({
      show: showFullToast(),
      style: { "--width": "590px" } as React.CSSProperties,
    });

    await raise();

    expect(getComputedStyle(listOf(notification)).width).toBe("590px");
  });

  it("is not sized by a plain width class", async () => {
    const { notification, raise } = await mountToaster({
      show: showFullToast(),
      className: "w-[590px]",
    });

    await raise();

    expect(getComputedStyle(listOf(notification)).width).toBe("356px");
  });
});

describe("a component as the message", () => {
  const NESTED = "Referred a friend";

  function RichMessage() {
    return (
      <div>
        <strong>{TITLE}</strong>
        <span>{NESTED}</span>
      </div>
    );
  }

  /**
   * The brand apps pass whole components to `SnackbarContent`'s `message`, so
   * this is the shape a migrated call site keeps. It lands in `[data-title]`,
   * inside the design system's card — the icon, the palette, the actions and the
   * close button are all still the component's.
   */
  it("renders a component in the card, with the card's own parts around it", async () => {
    const { action, raise } = await mountToaster({
      closeButton: true,
      show: () =>
        toast.success(<RichMessage />, {
          duration: Infinity,
          action: { label: "Primary", onClick: () => undefined },
        }),
    });

    await raise();

    await expect.element(page.getByText(NESTED)).toBeVisible();
    await expect.element(action("Primary")).toBeVisible();
    await expect.element(action("Close toast")).toBeVisible();
  });

  /**
   * `toast.custom` is the other one, and it is not the same thing: Sonner treats
   * it as the whole toast, so it drops the icon and the close button. The card's
   * own classes still land on the element — the grid, the padding, the border —
   * but no type colour, because a custom toast carries no type.
   */
  it("gives up the icon and the close button under `toast.custom`", async () => {
    const { action, raise } = await mountToaster({
      closeButton: true,
      show: () => toast.custom(() => <RichMessage />, { duration: Infinity }),
    });

    await raise();

    await expect.element(page.getByText(NESTED)).toBeVisible();
    await expect.element(action("Close toast")).not.toBeInTheDocument();
  });
});

describe("the loading spinner", () => {
  const LOADING = "Processing deposit…";

  /** Sonner's own attribute. It forwards no testid to the icon slot. */
  const iconSlotOf = (toastEl: Element) => toastEl.querySelector("[data-icon]") as HTMLElement;

  async function raiseLoading() {
    const mounted = await mountToaster({ show: () => toast.loading(LOADING) });

    await userEvent.click(mounted.action(TRIGGER));
    await expect.element(page.getByText(LOADING)).toBeVisible();

    return mounted.notification().element();
  }

  /**
   * Sonner's default spinner is twelve rotating `<div>` bars sized and coloured
   * by its own stylesheet — a spinner belonging to no design here, and the one
   * thing `unstyled` cannot reach, since `.sonner-loading-bar` is not gated on
   * `[data-styled]`. Supplying `icons.loading` is what replaces it, with the
   * same `Loader2` the Button spins.
   */
  it("is the design system's spinner rather than Sonner's bars", async () => {
    const toastEl = await raiseLoading();

    expect(toastEl.querySelector(".sonner-loading-wrapper")).toBeNull();
    expect(iconSlotOf(toastEl).querySelector("svg.animate-spin")).not.toBeNull();
  });

  /**
   * The half that actually looked broken. `.sonner-loader` is `position:
   * absolute; top: 50%; left: 50%`, and the `[data-icon]` it means to centre
   * inside is only `relative`, and only 16px square, behind `[data-styled=true]`
   * — which `unstyled` drops. With no positioned ancestor left the spinner
   * centred on the whole card, across the title.
   *
   * So the slot has to carry both halves itself: `relative`, and a size an
   * absolutely positioned only child would otherwise leave at zero.
   */
  it("centres in the icon slot rather than across the card", async () => {
    const toastEl = await raiseLoading();
    const slotEl = iconSlotOf(toastEl);

    const slot = slotEl.getBoundingClientRect();
    const spinner = slotEl.querySelector("svg")!.getBoundingClientRect();

    // Figma's icon container, and the same box the four feedback glyphs get.
    expect(slot.width).toBe(20);
    expect(slot.height).toBe(20);

    expect(spinner.left).toBeGreaterThanOrEqual(slot.left - 0.5);
    expect(spinner.right).toBeLessThanOrEqual(slot.right + 0.5);
    expect(spinner.top).toBeGreaterThanOrEqual(slot.top - 0.5);
    expect(spinner.bottom).toBeLessThanOrEqual(slot.bottom + 0.5);
  });
});

describe("the toast with no feedback type", () => {
  /**
   * A plain `toast()` carries no `type` at all — Sonner reads `toast.type`
   * straight through, so React omits the attribute rather than writing
   * `data-type="default"`. That is the whole trap: the card's neutral colours
   * were hung on `data-[type=default]`, which matches nothing, and the toast came
   * out transparent — its border and its text over whatever it floated above.
   *
   * The attribute is what these two pin, because the attribute is what the
   * selectors depend on. What the card is *painted* is the visual suite's:
   * `Sonner`'s `AllVariants` baseline photographs every type in four themes, and
   * a `getComputedStyle().backgroundColor` here would only prove that the token
   * bridge had been imported into this runtime.
   */
  it("renders no data-type, so nothing may be selected on one", async () => {
    const { notification, raise } = await mountToaster({
      show: () => toast(TITLE, { duration: Infinity }),
    });

    await raise();

    await expect.element(notification()).not.toHaveAttribute("data-type");
  });

  it("names the type when there is one", async () => {
    const { notification, raise } = await mountToaster({ show: showFullToast() });

    await raise();

    await expect.element(notification()).toHaveAttribute("data-type", "success");
  });
});
