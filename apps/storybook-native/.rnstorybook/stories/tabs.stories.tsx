import React from "react";
import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@ui/native/tabs";
import { TypographyP } from "@ui/native/typography";

const TabsDemo = () => {
  const [tab, setTab] = React.useState("account");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <TypographyP>Make changes to your account here.</TypographyP>
      </TabsContent>
      <TabsContent value="password">
        <TypographyP>Change your password here.</TypographyP>
      </TabsContent>
    </Tabs>
  );
};

const TabsWithDisabledDemo = () => {
  const [tab, setTab] = React.useState("tab1");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" disabled>
          Tab 3
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <TypographyP>Content for Tab 1</TypographyP>
      </TabsContent>
      <TabsContent value="tab2">
        <TypographyP>Content for Tab 2</TypographyP>
      </TabsContent>
    </Tabs>
  );
};

const meta = {
  title: "UI/Tabs",
  component: TabsDemo,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof TabsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDisabledTab: Story = {
  render: () => <TabsWithDisabledDemo />,
};
