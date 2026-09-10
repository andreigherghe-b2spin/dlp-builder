import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import { Toaster, toast } from "@ui/web/Sonner";

/**
 * The component ships no width — Sonner's own 356px stands until an app says
 * otherwise, and the brand apps size their snackbar between 390 and 590. Set
 * here once, on the meta, so every story below is drawn at the width the design
 * was reviewed at, and so the escape hatch is visible in the source.
 *
 * It has to be `--width` rather than a class: Sonner writes the variable into the
 * list's inline `style`, and an inline style outranks any class.
 */
const LIST_STYLE = { "--width": "590px" } as CSSProperties;

const meta: Meta<typeof Toaster> = {
  title: "Needs Review/Molecules/Sonner",
  id: "Sonner",
  component: Toaster,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  args: { style: LIST_STYLE },
  parameters: {
    // Every toast is `position: fixed`, so rendered inline each story would drop
    // its stack onto the docs page rather than into its own block — and the
    // stacks of two stories would then sit on top of each other in the same
    // corner. An iframe per story is what keeps them apart.
    docs: { story: { inline: false, height: "420px" } },
  },
  argTypes: {
    position: {
      control: "select",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
      description: "Which corner the stack sits in",
    },
    expand: {
      control: "boolean",
      description: "Show the whole stack rather than collapsing it behind the front toast",
    },
    closeButton: {
      control: "boolean",
      description: "Draw the close button on every toast",
    },
    duration: {
      control: "number",
      description: "How long a toast stays, in milliseconds",
    },
    gap: {
      control: "number",
      description: "Space between stacked toasts, in pixels",
    },
    visibleToasts: {
      control: "number",
      description:
        "How many are on screen at once. Defaults to 1 — the snackbar's one-at-a-time, where a new call replaces the message showing. Raise it for Sonner's stack.",
    },
    style: {
      control: false,
      description: "Styles for the list; `--width` is what sizes the snackbar. A class cannot.",
    },
    richColors: {
      control: false,
      description:
        "Inert — the toast is drawn from the design system's feedback tokens in every theme",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toaster>;

/**
 * Figma's four Types, in the order the design sheet draws them. Held at module
 * level so the effect below has a stable dependency, and each carries an `id` so
 * a re-render updates its toast instead of raising a second copy of it.
 */
const VARIANTS = [
  {
    id: "success",
    type: "success",
    title: "Deposit confirmed",
    description: "500 GC and 5 SC have been added to your balance.",
  },
  {
    id: "error",
    type: "error",
    title: "Card declined",
    description: "Your bank turned down the payment. Try another card.",
  },
  {
    id: "warning",
    type: "warning",
    title: "Session expiring",
    description: "You will be signed out in two minutes.",
  },
  {
    id: "info",
    type: "info",
    title: "New tournament open",
    description: "Entries close on Sunday at 9:00 AM.",
  },
] as const;

/** Raises every Type as soon as the story mounts, for the combined shot. */
function ShowEveryType({ withActions = false }: { withActions?: boolean }) {
  useEffect(() => {
    for (const variant of VARIANTS) {
      toast[variant.type](variant.title, {
        id: variant.id,
        description: variant.description,
        duration: Infinity,
        ...(withActions && {
          action: { label: "Primary", onClick: () => undefined },
          cancel: { label: "Secondary", onClick: () => undefined },
        }),
      });
    }
  }, [withActions]);

  return null;
}

/** Every story is a toaster and something to press. */
function Demo({ args, children }: { args: Story["args"]; children: ReactNode }) {
  return (
    <>
      <Toaster {...args} />
      <div className="flex flex-wrap gap-4">{children}</div>
    </>
  );
}

/**
 * A toast with no type takes the neutral surface — there is no feedback meaning
 * to colour it with.
 */
export const Default: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button onClick={() => toast("Your changes have been saved")}>Show toast</Button>
    </Demo>
  ),
};

/**
 * The four Types, each with its own container colour, border and icon — plus the
 * typeless one.
 *
 * This is also where the default behaviour shows: press the buttons in turn and
 * each message **replaces** the one before it, the way `openSnackbar` did.
 * `visibleToasts` turns that back into a stack — see `Stacked`.
 */
export const Types: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button variant="outline" onClick={() => toast("Default notification")}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Deposit confirmed")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Card declined")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Session expiring")}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.info("New tournament open")}>
        Info
      </Button>
    </Demo>
  ),
};

/**
 * The second line under the title. It inherits the toast's own text colour, so it
 * reads at the same contrast on every container.
 */
export const WithDescription: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button
        onClick={() =>
          toast.success("Deposit confirmed", {
            description: "500 GC and 5 SC have been added to your balance.",
          })
        }
      >
        Toast with description
      </Button>
    </Demo>
  ),
};

/**
 * `action` is the primary button and `cancel` the secondary one — Button `xs` in
 * `default` and `secondary`. Both sit under the text rather than beside it, which
 * is what the grid in the component is for. Either can stand alone.
 */
export const WithActions: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Session expiring", {
            description: "You will be signed out in two minutes.",
            action: { label: "Stay signed in", onClick: () => undefined },
          })
        }
      >
        Primary only
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Session expiring", {
            description: "You will be signed out in two minutes.",
            cancel: { label: "Sign out", onClick: () => undefined },
          })
        }
      >
        Secondary only
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Session expiring", {
            description: "You will be signed out in two minutes.",
            action: { label: "Stay signed in", onClick: () => undefined },
            cancel: { label: "Sign out", onClick: () => undefined },
          })
        }
      >
        Both
      </Button>
    </Demo>
  ),
};

/**
 * The close button is Button `sm` `overlay`, drawn on every toast once
 * `closeButton` is set on the toaster. A toast is also dismissible by swiping it.
 */
export const WithCloseButton: Story = {
  args: { closeButton: true },
  render: (args) => (
    <Demo args={args}>
      <Button
        onClick={() =>
          toast.info("New tournament open", {
            description: "Entries close on Sunday at 9:00 AM.",
          })
        }
      >
        Dismissible toast
      </Button>
    </Demo>
  ),
};

/**
 * `duration` per call, in milliseconds — the brand apps' `autoHide`. `Infinity`
 * is the one that stays until it is dismissed.
 */
export const Durations: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button variant="outline" onClick={() => toast("Gone in a second", { duration: 1000 })}>
        1s
      </Button>
      <Button variant="outline" onClick={() => toast("The default", { duration: 4000 })}>
        4s — the default
      </Button>
      <Button variant="outline" onClick={() => toast("Ten seconds", { duration: 10000 })}>
        10s
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Here until dismissed", { duration: Infinity, closeButton: true })
        }
      >
        Infinity
      </Button>
    </Demo>
  ),
};

/**
 * `toast.loading` holds the neutral surface with a spinner, and `toast.promise`
 * turns it into the success or error container once the promise settles — one
 * toast throughout, not three.
 *
 * The spinner is the design system's own `Loader2`, in the icon slot, at the
 * size the four feedback glyphs get. Sonner's default is twelve rotating `<div>`
 * bars drawn by its own stylesheet, and it centred them on the whole card rather
 * than in the slot; both are fixed, and both are pinned by tests.
 *
 * Deliberately not in `AllVariants`, which is the only story the visual suite
 * photographs: a spinning icon has no resting frame, so a baseline of it would
 * be a picture of whichever rotation the screenshot caught.
 */
export const LoadingAndPromise: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button
        variant="outline"
        onClick={() => toast.loading("Processing deposit…", { duration: 3000 })}
      >
        Loading
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const settles = new Promise<{ amount: string }>((resolve) =>
            setTimeout(() => resolve({ amount: "500 GC" }), 2000),
          );

          toast.promise(settles, {
            loading: "Processing deposit…",
            success: (data) => `${data.amount} added to your balance`,
            error: "The deposit did not go through",
          });
        }}
      >
        Promise — resolves
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const fails = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Card declined")), 2000),
          );

          toast.promise(fails, {
            loading: "Processing deposit…",
            success: "Done",
            error: (error: Error) => error.message,
          });
        }}
      >
        Promise — rejects
      </Button>
    </Demo>
  ),
};

/**
 * `toast.dismiss(id)` closes one, `toast.dismiss()` closes everything — the brand
 * apps' `closeSnackbar()`, and what a route change should call.
 */
export const DismissFromCode: Story = {
  args: { visibleToasts: 3, expand: true },
  render: (args) => (
    <Demo args={args}>
      <Button
        variant="outline"
        onClick={() => toast.info("I can be closed by id", { id: "pinned", duration: Infinity })}
      >
        Raise (id: pinned)
      </Button>
      <Button variant="outline" onClick={() => toast.dismiss("pinned")}>
        Dismiss that one
      </Button>
      <Button variant="outline" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
    </Demo>
  ),
};

/**
 * `icons` replaces the glyph for one or more Types. Anything is accepted — a
 * different lucide icon, an emoji, a brand mark.
 */
export const CustomIcons: Story = {
  args: {
    icons: {
      success: <span aria-hidden>🎉</span>,
      error: <span aria-hidden>💀</span>,
    },
  },
  render: (args) => (
    <Demo args={args}>
      <Button variant="outline" onClick={() => toast.success("Deposit confirmed")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Card declined")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Untouched")}>
        Warning — still the design system's
      </Button>
    </Demo>
  ),
};

/**
 * **The message is a `ReactNode`, not a string** — which is how the brand apps
 * already use `SnackbarContent`, passing a whole `ConfirmationMessageContent`
 * with children of its own. Such a call site keeps its shape: hand the component
 * to `toast` and it renders inside the design system's card, with the icon, the
 * palette, both actions and the close button still around it. `componentProps`
 * becomes the component's own props.
 *
 * One thing to know: it lands in the title slot, which carries `body/m` at
 * semibold. A component that wants its own type sets it — the classes here are
 * inherited, not enforced.
 */
export const ComponentAsMessage: Story = {
  args: { closeButton: true },
  render: (args) => (
    <Demo args={args}>
      <Button
        onClick={() =>
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-(--typography-font-weight-bold)">Referral confirmed</span>
              <span className="text-(length:--typography-font-size-body-s) font-(--typography-font-weight-regular)">
                A component with children of its own, rendered in the card.
              </span>
            </div>,
            {
              duration: Infinity,
              action: { label: "View friends", onClick: () => undefined },
            },
          )
        }
      >
        Component as message
      </Button>
    </Demo>
  ),
};

/**
 * `toast.custom` is the *other* one, and not the same thing: Sonner treats what
 * it is given as the whole toast, so the icon and the close button go. The card's
 * own classes still land — the grid, the padding, the border — but no type
 * colour, because a custom toast carries no type.
 *
 * Reach for it only when the message should not be in a design system card at
 * all. To keep the card, pass the component as the message — see
 * `ComponentAsMessage`.
 */
export const CustomContent: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button
        variant="outline"
        onClick={() =>
          toast.custom((id) => (
            <div className="bg-background-layout-surface rounded-offset8 flex w-full items-center gap-4 p-4">
              <span className="text-foreground-on-surface-default flex-1">
                A component of your own
              </span>
              <Button size="xs" onClick={() => toast.dismiss(id)}>
                Close
              </Button>
            </div>
          ))
        }
      >
        Custom content
      </Button>
    </Demo>
  ),
};

/**
 * `toastOptions.classNames` extends the design system's rather than replacing
 * them: this changes the radius and keeps the layout, the palette and the button
 * styling.
 */
export const CustomClassNames: Story = {
  args: {
    toastOptions: { classNames: { toast: "rounded-none" } },
  },
  render: (args) => (
    <Demo args={args}>
      <Button onClick={() => toast.success("Square corners, everything else unchanged")}>
        Custom classNames
      </Button>
    </Demo>
  ),
};

/**
 * Sonner's own behaviour, restored by raising `visibleToasts`: several messages on
 * screen together, each with its own timer. `expand` shows them all rather than
 * collapsing the older ones behind the newest — press a few and hover the stack.
 */
export const Stacked: Story = {
  args: { visibleToasts: 3, expand: true },
  render: (args) => (
    <Demo args={args}>
      <Button variant="outline" onClick={() => toast.success("Deposit confirmed")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Card declined")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.info("New tournament open")}>
        Info
      </Button>
    </Demo>
  ),
};

/**
 * Collapsed is the default: only the newest is drawn in full and the rest sit
 * behind it until the stack is hovered.
 */
export const Collapsed: Story = {
  args: { visibleToasts: 3, expand: false },
  render: (args) => (
    <Demo args={args}>
      <Button variant="outline" onClick={() => toast.success("Deposit confirmed")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Card declined")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.info("New tournament open")}>
        Info
      </Button>
    </Demo>
  ),
};

/** Six corners, set on the toaster or per call. */
export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Demo args={args}>
      {(
        [
          "top-left",
          "top-center",
          "top-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ] as const
      ).map((position) => (
        <Button key={position} variant="outline" onClick={() => toast(position, { position })}>
          {position}
        </Button>
      ))}
    </Demo>
  ),
};

/**
 * The width is the app's, not the library's — set `--width` on the toaster. A
 * class cannot do it: Sonner writes the variable into the list's inline `style`,
 * and an inline style outranks any class.
 */
export const Widths: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <Toaster style={{ "--width": "356px" } as CSSProperties} position="top-center" />
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={() =>
            toast.info("356px — Sonner's default, and this component's", {
              description: "Nothing is set by the library.",
            })
          }
        >
          Show at 356px
        </Button>
      </div>
    </>
  ),
};

/** Long text wraps rather than clipping, and the actions stay put beneath it. */
export const LongContent: Story = {
  render: (args) => (
    <Demo args={args}>
      <Button
        onClick={() =>
          toast.warning("Your weekly sweepstakes entry could not be confirmed automatically", {
            description:
              "We were unable to verify your address against our records. Confirm it in account settings, or contact support and we will do it for you. Entries already placed this week are unaffected.",
            action: { label: "Open settings", onClick: () => undefined },
            cancel: { label: "Not now", onClick: () => undefined },
            duration: Infinity,
          })
        }
      >
        Long toast
      </Button>
    </Demo>
  ),
};

/**
 * The combined story, and the only one the visual suite photographs — every Type
 * at once, with a description, both actions and the close button.
 *
 * `duration: Infinity` keeps the stack still for the camera, `expand` shows all
 * four rather than collapsing three of them behind the front one, and
 * `visibleToasts` is raised to match: the component's default of one would leave
 * the other three marked `data-visible="false"`.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  args: {
    position: "top-center",
    expand: true,
    closeButton: true,
    visibleToasts: VARIANTS.length,
  },
  render: (args) => (
    <>
      <Toaster {...args} />
      <ShowEveryType withActions />
    </>
  ),
};
