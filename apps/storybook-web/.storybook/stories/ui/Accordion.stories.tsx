import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@ui/web/Accordion";
import { Badge } from "@ui/web/Badge";

// Meta configuration
const meta: Meta<typeof Accordion> = {
  title: "WIP/Molecules/Accordion",
  id: "Accordion",
  component: Accordion,
  tags: ["autodocs", "status:wip", "level:molecules"],
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion className="w-80" type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is an accordion component?</AccordionTrigger>
        <AccordionContent>
          An accordion is a UI component that displays a list of headers that can be clicked to
          reveal or hide their associated content.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does an accordion work?</AccordionTrigger>
        <AccordionContent>
          When a user clicks on an accordion header, it expands to reveal its content. Clicking
          again will collapse it. Accordions can be configured to allow multiple sections open at
          once or only one at a time.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>When should I use an accordion?</AccordionTrigger>
        <AccordionContent>
          Accordions are useful for organizing and presenting content in a limited space. They allow
          users to focus on specific content by hiding other content until it's needed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // First item should be open by default (defaultValue='item-1')
    const firstContent = canvas.getByText(/An accordion is a UI component/);

    // Verify first item is open
    await expect(firstContent).toBeVisible();

    // Click second trigger to open it
    const secondTrigger = canvas.getByRole("button", {
      name: /how does an accordion work/i,
    });
    await userEvent.click(secondTrigger);

    // Verify second content is now visible
    const secondContent = canvas.getByText(/When a user clicks on an accordion header/);
    await waitFor(() => expect(secondContent).toBeVisible());

    // First item should now be closed (single accordion behavior)
    await waitFor(() => expect(firstContent).not.toBeVisible());

    // Click second trigger again to close it (collapsible behavior)
    await userEvent.click(secondTrigger);
    await waitFor(() => expect(secondContent).not.toBeVisible());

    // Click third trigger
    const thirdTrigger = canvas.getByRole("button", {
      name: /when should i use an accordion/i,
    });
    await userEvent.click(thirdTrigger);

    // Verify third content is visible
    const thirdContent = canvas.getByText(/Accordions are useful for organizing/);
    await waitFor(() => expect(thirdContent).toBeVisible());
  },
};

// With specific disabled item
export const DisabledItem: Story = {
  render: () => (
    <Accordion type="single" className="w-100">
      <AccordionItem value="item-1">
        <AccordionTrigger>Regular Item</AccordionTrigger>
        <AccordionContent>This regular item can be opened and closed normally.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger disabled>Disabled Item</AccordionTrigger>
        <AccordionContent>
          This content cannot be accessed because the trigger is disabled.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another Regular Item</AccordionTrigger>
        <AccordionContent>This third item can also be opened and closed normally.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get all triggers
    const regularTrigger = canvas.getByRole("button", {
      name: /^regular item$/i,
    });
    const disabledTrigger = canvas.getByRole("button", {
      name: /disabled item/i,
    });
    const thirdTrigger = canvas.getByRole("button", {
      name: /another regular item/i,
    });

    // Test regular item works - should start closed
    expect(regularTrigger).toHaveAttribute("aria-expanded", "false");
    expect(regularTrigger).toHaveAttribute("data-state", "closed");

    await userEvent.click(regularTrigger);
    await waitFor(() => expect(regularTrigger).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(regularTrigger).toHaveAttribute("data-state", "open"));

    // Test disabled item cannot be clicked
    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveAttribute("aria-expanded", "false");
    expect(disabledTrigger).toHaveAttribute("data-state", "closed");

    // Verify disabled trigger remains in disabled state (cannot click due to pointer-events: none)

    // Regular item should still be open
    expect(regularTrigger).toHaveAttribute("data-state", "open");

    // Small delay before next interaction
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test third item works
    await userEvent.click(thirdTrigger);
    await waitFor(() => expect(thirdTrigger).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(thirdTrigger).toHaveAttribute("data-state", "open"));

    // First item should now be closed (single accordion behavior)
    await waitFor(() => expect(regularTrigger).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() => expect(regularTrigger).toHaveAttribute("data-state", "closed"));

    // Disabled item should remain unchanged throughout all interactions
    expect(disabledTrigger).toHaveAttribute("aria-expanded", "false");
    expect(disabledTrigger).toHaveAttribute("data-state", "closed");
    expect(disabledTrigger).toBeDisabled();
  },
};

// With specific disabled item
export const CollapsibleItems: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-100">
      <AccordionItem value="item-1">
        <AccordionTrigger>Regular Item</AccordionTrigger>
        <AccordionContent>This item can be opened and closed normally.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another Regular Item</AccordionTrigger>
        <AccordionContent>This item can be opened and closed normally.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Nested accordions
export const Nested: Story = {
  render: () => (
    <Accordion type="single" className="w-100">
      <AccordionItem value="item-1">
        <AccordionTrigger>Main Category</AccordionTrigger>
        <AccordionContent>
          <p className="pb-4">Here's some content about the main category.</p>
          <Accordion type="single">
            <AccordionItem value="nested-1">
              <AccordionTrigger className="px-4">Subcategory 1</AccordionTrigger>
              <AccordionContent className="px-4">Content for subcategory 1.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="nested-2">
              <AccordionTrigger className="px-4">Subcategory 2</AccordionTrigger>
              <AccordionContent className="px-4">Content for subcategory 2.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Another Category</AccordionTrigger>
        <AccordionContent>This is just a regular accordion item without nesting.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Single/Multiple behavior depends on props passed to the Radix Accordion
// This story shows passing Radix-specific props
export const SingleAccordion: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-2" className="w-100">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>
          In a single accordion, only one item can be open at a time, unless the collapsible prop is
          true.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Expanded by Default Section 2</AccordionTrigger>
        <AccordionContent>
          Clicking this will close the other section if it's open.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Section 3</AccordionTrigger>
        <AccordionContent>With collapsible=true, you can close all sections.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get all triggers
    const trigger1 = canvas.getByRole("button", { name: /section 1/i });
    const trigger2 = canvas.getByRole("button", {
      name: /expanded by default section 2/i,
    });
    const trigger3 = canvas.getByRole("button", { name: /section 3/i });

    // Verify item-2 is open by default using ARIA attributes
    await expect(trigger2).toHaveAttribute("aria-expanded", "true");
    await expect(trigger2).toHaveAttribute("data-state", "open");

    // Verify other items are closed using ARIA attributes
    expect(trigger1).toHaveAttribute("aria-expanded", "false");
    expect(trigger1).toHaveAttribute("data-state", "closed");
    expect(trigger3).toHaveAttribute("aria-expanded", "false");
    expect(trigger3).toHaveAttribute("data-state", "closed");

    // Click section 1 to open it
    await userEvent.click(trigger1);

    // Verify section 1 is now open and section 2 is closed (single behavior)
    await waitFor(() => expect(trigger1).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(trigger1).toHaveAttribute("data-state", "open"));
    await waitFor(() => expect(trigger2).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() => expect(trigger2).toHaveAttribute("data-state", "closed"));

    // Small delay before next interaction to prevent AbortError
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click section 1 again to close it (collapsible behavior)
    await userEvent.click(trigger1);
    await waitFor(() => expect(trigger1).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() => expect(trigger1).toHaveAttribute("data-state", "closed"));

    // All sections should now be closed
    expect(trigger1).toHaveAttribute("data-state", "closed");
    expect(trigger2).toHaveAttribute("data-state", "closed");
    expect(trigger3).toHaveAttribute("data-state", "closed");

    // Small delay before next interaction
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Open section 3
    await userEvent.click(trigger3);

    await waitFor(() => expect(trigger3).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(trigger3).toHaveAttribute("data-state", "open"));
    expect(trigger1).toHaveAttribute("data-state", "closed");
    expect(trigger2).toHaveAttribute("data-state", "closed");
  },
};

export const MultipleAccordion: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["item-2", "item-3"]} className="w-100">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex gap-4">
            Section 1 <Badge variant="negative">new</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          In a multiple accordion, multiple items can be open at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Expanded by Default Section 2 </AccordionTrigger>
        <AccordionContent>Try opening this while section 1 is still open.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Expanded by Default Section 3</AccordionTrigger>
        <AccordionContent>All sections can be open simultaneously.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get all triggers
    const trigger1 = canvas.getByRole("button", { name: /section 1/i });
    const trigger2 = canvas.getByRole("button", {
      name: /expanded by default section 2/i,
    });
    const trigger3 = canvas.getByRole("button", {
      name: /expanded by default section 3/i,
    });

    // Verify items 2 and 3 are open by default using ARIA attributes
    await expect(trigger2).toHaveAttribute("aria-expanded", "true");
    await expect(trigger2).toHaveAttribute("data-state", "open");
    await expect(trigger3).toHaveAttribute("aria-expanded", "true");
    await expect(trigger3).toHaveAttribute("data-state", "open");

    // Verify item 1 is closed
    expect(trigger1).toHaveAttribute("aria-expanded", "false");
    expect(trigger1).toHaveAttribute("data-state", "closed");

    // Open first item while others remain open (multiple accordion behavior)
    await userEvent.click(trigger1);
    await waitFor(() => expect(trigger1).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(trigger1).toHaveAttribute("data-state", "open"));

    // Verify all three are now open (multiple accordion behavior)
    expect(trigger1).toHaveAttribute("data-state", "open");
    expect(trigger2).toHaveAttribute("data-state", "open");
    expect(trigger3).toHaveAttribute("data-state", "open");

    // Small delay before next interaction to prevent AbortError
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Close one item while others remain open
    await userEvent.click(trigger2);
    await waitFor(() => expect(trigger2).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() => expect(trigger2).toHaveAttribute("data-state", "closed"));

    // Other items should still be open
    expect(trigger1).toHaveAttribute("data-state", "open");
    expect(trigger3).toHaveAttribute("data-state", "open");

    // Small delay before re-opening
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-open the closed item
    await userEvent.click(trigger2);
    await waitFor(() => expect(trigger2).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(trigger2).toHaveAttribute("data-state", "open"));

    // All should be open again
    expect(trigger1).toHaveAttribute("data-state", "open");
    expect(trigger2).toHaveAttribute("data-state", "open");
    expect(trigger3).toHaveAttribute("data-state", "open");
  },
};
