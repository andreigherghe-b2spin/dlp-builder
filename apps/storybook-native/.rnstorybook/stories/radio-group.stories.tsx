import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { RadioGroup, RadioGroupItem } from "@ui/native/radio-group";
import { TypographyP } from "@ui/native/typography";

const RadioGroupDemo = ({ disabled }: { disabled?: boolean }) => {
  const [value, setValue] = React.useState("option-1");
  return (
    <RadioGroup value={value} onValueChange={setValue}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <RadioGroupItem value="option-1" disabled={disabled} />
        <TypographyP>Option 1</TypographyP>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <RadioGroupItem value="option-2" disabled={disabled} />
        <TypographyP>Option 2</TypographyP>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <RadioGroupItem value="option-3" disabled={disabled} />
        <TypographyP>Option 3</TypographyP>
      </View>
    </RadioGroup>
  );
};

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroupDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroupDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
