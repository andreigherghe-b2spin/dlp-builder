import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyTag,
  TypographyBlockquote,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
} from "@ui/native/typography";

const TypographyShowcase = () => (
  <View style={{ gap: 12 }}>
    <TypographyH1>Heading 1</TypographyH1>
    <TypographyH2>Heading 2</TypographyH2>
    <TypographyH3>Heading 3</TypographyH3>
    <TypographyH4>Heading 4</TypographyH4>
    <TypographyLead>Lead text for introductions</TypographyLead>
    <TypographyLarge>Large text for emphasis</TypographyLarge>
    <TypographyP>Regular paragraph text. The quick brown fox jumps over the lazy dog.</TypographyP>
    <TypographySmall>Small text for captions</TypographySmall>
    <TypographyMuted>Muted text for secondary content</TypographyMuted>
    <TypographyBlockquote>
      After all, the best part of a holiday is perhaps not so much to be resting yourself.
    </TypographyBlockquote>
    <TypographyTag>Tag Label</TypographyTag>
  </View>
);

const TypographyPDemo = ({
  variant,
  weight,
  decoration,
}: {
  variant?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "normal" | "medium";
  decoration?: "none" | "underline";
}) => (
  <TypographyP variant={variant} weight={weight} decoration={decoration}>
    The quick brown fox jumps over the lazy dog.
  </TypographyP>
);

const meta = {
  title: "UI/Typography",
  component: TypographyShowcase,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof TypographyShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {};

export const ParagraphVariants: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      {(["xxs", "xs", "sm", "md", "lg", "xl"] as const).map((variant) => (
        <TypographyPDemo key={variant} variant={variant} />
      ))}
    </View>
  ),
};

export const ParagraphWeights: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <TypographyPDemo weight="normal" />
      <TypographyPDemo weight="medium" />
    </View>
  ),
};

export const TagVariants: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <TypographyTag variant="xxs">Extra small tag</TypographyTag>
      <TypographyTag variant="xs">Extra small tag</TypographyTag>
      <TypographyTag variant="sm">Small tag (default)</TypographyTag>
    </View>
  ),
};
