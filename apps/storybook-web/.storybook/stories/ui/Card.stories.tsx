import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@ui/web/Button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@ui/web/Card";
import { Input } from "@ui/web/Input";
const meta: Meta<typeof Card> = {
  title: "WIP/Molecules/Card",
  id: "Card",
  component: Card,
  tags: ["autodocs", "status:wip", "level:molecules"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

// Default story
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text</CardDescription>
      </CardHeader>
      <div className="px-6">
        <p>Card content goes here...</p>
      </div>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

// Basic card without footer
export const Basic: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
        <CardDescription>This is a basic card without footer</CardDescription>
      </CardHeader>
      <div className="px-6">
        <p>Some content here...</p>
      </div>
    </Card>
  ),
};

// Card with multiple buttons in footer
export const WithMultipleActions: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences</CardDescription>
      </CardHeader>
      <div className="px-6">
        <p>Configure your account settings below.</p>
      </div>
      <CardFooter className="justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  ),
};

// Card with long content
export const LongContent: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Article Preview</CardTitle>
        <CardDescription>Read the full article below</CardDescription>
      </CardHeader>
      <div className="space-y-4 px-6">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur. Excepteur sint occaecat cupidatat non proident.
        </p>
      </div>
      <CardFooter>
        <Button variant="outline">Read More</Button>
      </CardFooter>
    </Card>
  ),
};

// Card with form elements
export const WithForm: Story = {
  render: () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Form</CardTitle>
          <CardDescription>Fill out the form below to get in touch</CardDescription>
        </CardHeader>
        <div className="space-y-4 px-6">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              className="mt-1 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              className="mt-1 w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        </div>
        <CardFooter>
          <Button>Submit</Button>
        </CardFooter>
      </Card>
    );
  },
};

// Group of cards
export const CardGroup: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Feature 1</CardTitle>
          <CardDescription>Description of the first feature</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline">Learn More</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feature 2</CardTitle>
          <CardDescription>Description of the second feature</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline">Learn More</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feature 3</CardTitle>
          <CardDescription>Description of the third feature</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline">Learn More</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};
