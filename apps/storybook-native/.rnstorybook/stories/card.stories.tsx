import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@ui/native/card";
import { Button } from "@ui/native/button";
import { TypographyP } from "@ui/native/typography";

const CardDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card description goes here.</CardDescription>
    </CardHeader>
    <CardContent>
      <TypographyP>This is the card content area where you can place any content.</TypographyP>
    </CardContent>
    <CardFooter>
      <Button variant="outline" size="sm">
        Cancel
      </Button>
      <Button variant="default" size="sm">
        Confirm
      </Button>
    </CardFooter>
  </Card>
);

const CardSimpleDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>Simple Card</CardTitle>
    </CardHeader>
    <CardContent>
      <TypographyP>A card with just a title and content.</TypographyP>
    </CardContent>
  </Card>
);

const meta = {
  title: "UI/Card",
  component: CardDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof CardDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Simple: Story = {
  render: () => <CardSimpleDemo />,
};
