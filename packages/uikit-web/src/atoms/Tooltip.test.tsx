import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Button } from "@/atoms/Button";
import {
  Tooltip,
  TooltipContent,
  type TooltipContentProps,
  type TooltipProps,
  TooltipTrigger,
} from "@/atoms/Tooltip";

const TRIGGER = "About this quest";
const CAPTION = "Steps 1 of 5";
const TITLE = "Lovely tooltip title";
const DESCRIPTION = "There are a lot of things you can do in space.";

type Parts = {
  contentProps?: Partial<TooltipContentProps>;
  children?: ReactNode;
};

async function mountTooltip({
  contentProps,
  children = DESCRIPTION,
  ...props
}: Partial<TooltipProps> & Parts = {}) {
  const view = await render(
    // The base every part derives its id from — `hint-trigger`, `hint-content`,
    // `hint-content-title`.
    // `Tooltip` renders no element of its own, so it publishes the base through
    // context rather than placing it.
    <Tooltip data-testid="hint" {...props}>
      <TooltipTrigger>{TRIGGER}</TooltipTrigger>
      <TooltipContent {...contentProps}>{children}</TooltipContent>
    </Tooltip>,
  );

  // Page-level rather than scoped to the render: the panel is portalled out of the
  // container, so a container-scoped locator would never see it. The setup unmounts
  // after every test, so there is only ever one tooltip on the page.
  //
  // The panel is `hint-content` — a part the consumer composes, so it sits flat
  // under the base — while caption, title, description, actions and the arrow are
  // the panel's own internals and nest under it, the way a dialog header's close
  // button is `<base>-header-close`. See `src/lib/testId.ts`.
  const panel = () => page.getByTestId("hint-content");
  const part = (name: string) => page.getByTestId(`hint-content-${name}`);
  const trigger = () => page.getByRole("button", { name: TRIGGER });

  const open = async () => {
    await userEvent.hover(trigger());
    // The panel animates in, so wait for it to be there rather than for a duration.
    await expect.element(panel()).toBeInTheDocument();
  };

  return { panel, part, trigger, open, view };
}

describe("opening and closing it", () => {
  it("shows the panel on hover and takes it away on Escape", async () => {
    const { panel, part, open } = await mountTooltip();

    await expect.element(panel()).not.toBeInTheDocument();

    await open();
    await expect.element(part("description")).toHaveTextContent(DESCRIPTION);

    // Escape rather than moving the pointer off the trigger. Radix keeps a
    // hoverable tooltip open across the gap between trigger and panel — a grace
    // polygon, so that a pointer travelling towards a tooltip with buttons in it
    // does not lose them on the way — and where `unhover` lands the cursor is
    // inside it. Escape is the dismissal that does not depend on geometry.
    await userEvent.keyboard("{Escape}");
    await expect.element(panel()).not.toBeInTheDocument();
  });

  it("shows the panel on keyboard focus, so it is not hover-only", async () => {
    const { part, trigger } = await mountTooltip();

    // `.focus()` rather than a click: a pointer-down focus is the one case Radix
    // deliberately does not open on, and a keyboard user's focus is this one.
    trigger().element().focus();

    await expect.element(part("description")).toHaveTextContent(DESCRIPTION);
  });
});

describe("describing the trigger", () => {
  it("points the trigger's description at the panel's text, in the order it is drawn", async () => {
    const { trigger, open } = await mountTooltip({
      contentProps: { caption: CAPTION, title: TITLE },
    });

    await open();

    await expect
      .element(trigger())
      .toHaveAccessibleDescription(`${CAPTION} ${TITLE} ${DESCRIPTION}`);
  });

  it("renders each part once rather than duplicating it into Radix's hidden copy", async () => {
    // Radix renders `TooltipContent`'s children a second time inside a
    // `VisuallyHidden` span unless it is handed an `aria-label` to put there
    // instead. Without that every id below resolves to two elements and the button
    // in `actions` exists twice, once unreachably — so this is the assertion that
    // the `aria-label` default is doing its job.
    const { panel, part, open } = await mountTooltip({
      contentProps: {
        caption: CAPTION,
        title: TITLE,
        actions: <Button size="sm">Next</Button>,
      },
    });

    await open();

    expect(panel().elements(), "one panel").toHaveLength(1);
    for (const name of ["caption", "title", "description", "actions", "arrow"]) {
      expect(part(name).elements(), `one ${name}`).toHaveLength(1);
    }
    expect(page.getByRole("button", { name: "Next" }).elements()).toHaveLength(1);
  });

  it("falls back to Radix's hidden copy when the panel's text cannot be read", async () => {
    // An icon-only panel: there is no string to build a label out of, so
    // `aria-label` is left unset and Radix duplicates the children instead. The
    // duplication is the documented cost of not passing one.
    const { open } = await mountTooltip({
      children: <svg aria-hidden data-testid="glyph" />,
    });

    await open();

    expect(page.getByTestId("glyph").elements()).toHaveLength(2);
  });
});

describe("the parts it draws", () => {
  it("draws only the description when that is all it was given", async () => {
    const { part, open } = await mountTooltip();

    await open();

    await expect.element(part("description")).toHaveTextContent(DESCRIPTION);
    expect(part("caption").elements()).toHaveLength(0);
    expect(part("title").elements()).toHaveLength(0);
    expect(part("actions").elements()).toHaveLength(0);
  });

  it("draws Figma's full anatomy when every part is given", async () => {
    const { part, open } = await mountTooltip({
      contentProps: {
        caption: CAPTION,
        title: TITLE,
        actions: (
          <>
            <Button size="sm" variant="secondary">
              Skip
            </Button>
            <Button size="sm">Next</Button>
          </>
        ),
      },
    });

    await open();

    await expect.element(part("caption")).toHaveTextContent(CAPTION);
    await expect.element(part("title")).toHaveTextContent(TITLE);
    await expect.element(part("description")).toHaveTextContent(DESCRIPTION);

    // The buttons are the caller's own, so the row only has to hold them — and
    // hold them where a pointer can reach, which is the actions row rather than
    // the hidden copy.
    const actions = page.elementLocator(part("actions").element());
    await expect.element(actions.getByRole("button", { name: "Skip" })).toBeInTheDocument();
    await expect.element(actions.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("draws no box for a part a condition left out", async () => {
    // `{cond && text}` passes `false`, not `null`, when the condition fails — and
    // `false != null`, so a `!= null` guard drew an empty box and still spent the
    // panel's 16px gap on it.
    // Annotated `number` rather than a literal, so this is the `false` a real call
    // site produces from state rather than one the linter can fold away.
    const step: number = 0;

    const { part, open } = await mountTooltip({
      contentProps: { caption: step > 0 && CAPTION, title: TITLE },
      children: "",
    });

    await open();

    await expect.element(part("title")).toHaveTextContent(TITLE);
    expect(part("caption").elements(), "no caption box").toHaveLength(0);
    expect(part("description").elements(), "no description box").toHaveLength(0);
  });

  it("drops the arrow for Figma's `None` position", async () => {
    const { part, open } = await mountTooltip({ contentProps: { showArrow: false } });

    await open();

    expect(part("arrow").elements()).toHaveLength(0);
  });
});

describe("naming its parts", () => {
  it("lets the panel override the id it derived, and re-derives the parts from it", async () => {
    const { panel, trigger } = await mountTooltip({
      contentProps: { "data-testid": "quest-panel", title: TITLE },
    });

    // Not `open()`: that waits for `hint-content`, which is the name this panel
    // no longer has — which is the whole point of the test.
    await userEvent.hover(trigger());

    // The override replaces the derived name rather than extending it, and the
    // parts inside re-derive from the override.
    await expect.element(page.getByTestId("quest-panel-title")).toHaveTextContent(TITLE);
    expect(panel().elements()).toHaveLength(0);
  });

  it("puts no test-only attribute in the DOM when nobody named the tooltip", async () => {
    const view = await render(
      <Tooltip>
        <TooltipTrigger>{TRIGGER}</TooltipTrigger>
        <TooltipContent title={TITLE}>{DESCRIPTION}</TooltipContent>
      </Tooltip>,
    );

    await userEvent.hover(page.elementLocator(view.container).getByRole("button"));
    // By role rather than by text: the panel's text is also in Radix's
    // `role="tooltip"` copy of it, so `getByText` matches two elements — and this
    // tooltip has no testid to disambiguate with, which is what is being asserted.
    await expect.element(page.getByRole("tooltip")).toBeInTheDocument();

    // The browser runner puts `__vitest_*` ids on the harness's own body and
    // container, so those are filtered out rather than counted as the component's.
    const ours = [...document.querySelectorAll("[data-testid]")]
      .map((node) => node.getAttribute("data-testid"))
      .filter((id) => id != null && !id.startsWith("__vitest"));

    expect(ours).toEqual([]);
  });
});

describe("styling it", () => {
  it("composes a caller's classes onto each part after its own", async () => {
    const { panel, part, open } = await mountTooltip({
      contentProps: {
        caption: CAPTION,
        title: TITLE,
        actions: <Button size="sm">Next</Button>,
        className: "w-96",
        classNames: {
          caption: "tracking-wide",
          title: "italic",
          description: "text-left",
          actions: "justify-end",
          arrow: "opacity-50",
        },
      },
    });

    await open();

    await expect.element(panel()).toHaveClass("w-96");
    await expect.element(part("caption")).toHaveClass("tracking-wide");
    await expect.element(part("title")).toHaveClass("italic");
    await expect.element(part("description")).toHaveClass("text-left");
    await expect.element(part("actions")).toHaveClass("justify-end");
    await expect.element(part("arrow")).toHaveClass("opacity-50");
  });
});
