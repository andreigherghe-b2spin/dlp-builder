import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  type DrawerContentProps,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  type DrawerProps,
  DrawerTitle,
  DrawerTrigger,
} from "@/organisms/Drawer";
import { Button } from "@/atoms/Button";

const TITLE = "Filter games";
const DESCRIPTION = "Only the providers you pick will be shown.";

/**
 * The drawer's own props, minus Vaul's snap-point pair. `DrawerProps` is a union
 * — Vaul takes `snapPoints` with `fadeFromIndex`, or neither — and a `Partial` of
 * a union cannot be spread onto the component: TypeScript has to settle on one
 * branch, and a partial satisfies neither. Dropping the pair collapses the union
 * to the single object type the spread needs.
 */
type MountProps = Partial<Omit<DrawerProps, "snapPoints" | "fadeFromIndex">> & {
  contentProps?: Partial<DrawerContentProps>;
};

/**
 * The panel's contents are written the way a consumer writes them: the three
 * regions carry the scroll contract, and every class that makes them *look* like
 * anything is passed in from here, because that is where it belongs.
 *
 * One `render()` per `it`, always. Two in a single test leave the harness unable
 * to click anything in every test that follows, and the failure surfaces
 * somewhere else entirely.
 */
async function mountDrawer({ contentProps, ...props }: MountProps = {}) {
  const view = await render(
    // The base every part derives its id from — `filters-content`,
    // `filters-title`. `Drawer` renders no element of its own, so it publishes
    // the base through context rather than placing it.
    <Drawer data-testid="filters" {...props}>
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerContent {...contentProps}>
        <DrawerHeader className="p-4">
          <DrawerTitle>{TITLE}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="p-4">
          <DrawerDescription>{DESCRIPTION}</DrawerDescription>
        </DrawerBody>
        <DrawerFooter className="p-4">
          <DrawerClose asChild>
            <Button size="lg" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>,
  );

  // Page-level rather than scoped to the render: the panel is portalled to
  // `document.body`, so a container-scoped locator would never see it.
  const panel = () => page.getByRole("dialog");
  const part = (name: string) => page.getByTestId(`filters-${name}`);
  const count = (testId: string) => page.getByTestId(testId).elements().length;

  const open = async () => {
    await userEvent.click(page.elementLocator(view.container).getByText("Open"));
    await expect.element(panel()).toBeVisible();
  };

  return { view, count, open, panel, part };
}

/**
 * Five cases, and the omissions are the point.
 *
 * Left out is every prop that reaches an element unchanged — `direction`,
 * `showHandle`, `classNames`, `onOpenChange`. A test for one of those restates
 * the JSX a line above it and goes red only when someone deletes that line on
 * purpose; the stories draw them and the visual baselines photograph them in five
 * themes.
 *
 * Kept is what breaks silently: the wiring between parts that are separate
 * components in the caller's JSX, and the one value this component computes
 * rather than forwards.
 */
describe("Drawer", () => {
  it("opens from its trigger, titled and described by its own parts", async () => {
    const drawer = await mountDrawer();

    await expect.element(drawer.panel()).not.toBeInTheDocument();

    await drawer.open();

    // Through the accessible tree, not by testid. This is the whole reason
    // `DrawerTitle` still exists now that the drawer draws no chrome: Radix
    // points the panel's `aria-labelledby` at it, and a plain `<h2>` would not
    // do. If that wiring breaks, nothing else here goes red.
    await expect.element(drawer.panel()).toHaveAccessibleName(TITLE);
    await expect.element(drawer.panel()).toHaveAccessibleDescription(DESCRIPTION);
  });

  it("derives every part's id from the one base on the root", async () => {
    const drawer = await mountDrawer();
    await drawer.open();

    await expect.element(drawer.part("content")).toBeInTheDocument();
    await expect.element(drawer.part("header")).toBeInTheDocument();
    await expect.element(drawer.part("title")).toHaveTextContent(TITLE);
    await expect.element(drawer.part("body")).toBeInTheDocument();
    await expect.element(drawer.part("description")).toHaveTextContent(DESCRIPTION);
    await expect.element(drawer.part("footer")).toBeInTheDocument();
    await expect.element(drawer.part("close")).toBeInTheDocument();
    await expect.element(drawer.part("overlay")).toBeInTheDocument();
  });

  it("puts nothing test-only in the DOM for a drawer nobody named", async () => {
    const drawer = await mountDrawer({ "data-testid": undefined });
    await drawer.open();

    // Scoped to the panel rather than the document: the browser harness puts a
    // `data-testid` of its own on the container it renders into, so a
    // document-wide query can never come back empty and would assert nothing.
    await expect.element(drawer.panel()).toBeVisible();
    const panel = drawer.panel().element();
    expect(panel.hasAttribute("data-testid")).toBe(false);
    expect(panel.querySelectorAll("[data-testid]")).toHaveLength(0);
  });

  it("holds still on a scrim press when disableOverlayClose is set", async () => {
    const drawer = await mountDrawer({ contentProps: { disableOverlayClose: true } });
    await drawer.open();

    // The top-left corner: a bottom drawer occupies the lower part of the screen,
    // so that is the one place a real click cannot land on the panel instead.
    await userEvent.click(drawer.part("overlay"), { position: { x: 4, y: 4 } });

    // A duration rather than a condition, because proving the drawer did *not*
    // close is the one thing with nothing observable to wait for. Comfortably
    // past Vaul's 500ms close animation.
    await new Promise((resolve) => setTimeout(resolve, 700));
    await expect.element(drawer.panel()).toBeVisible();
  });

  it("drops the drag handle at full size", async () => {
    const drawer = await mountDrawer({ contentProps: { size: "full" } });
    await drawer.open();

    // The one value the component computes: `showHandle && size !== "full"`. At
    // full bleed there is no edge to drag from, so the bar is not rendered at all
    // rather than hidden by the group selector.
    expect(drawer.count("filters-content-handle")).toBe(0);
  });
});
