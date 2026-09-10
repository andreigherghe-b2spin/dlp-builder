import React from "react";
import { View } from "react-native";
import { Uniwind, useCSSVariable } from "uniwind";
import type { Preview } from "@storybook/react-native";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  argTypes: {
    brand: {
      description: "Global theme for components",
      options: ["shadcn", "mcluck", "hellomillions", "playfame", "spinblitz"],
      control: { type: "select" },
    },
  },
  args: {
    brand: "shadcn",
  },
  decorators: [
    (Story, context) => {
      const theme = context.args.brand || "shadcn";
      const backgroundColor = (useCSSVariable("--background") || "black") as string;

      React.useEffect(() => {
        Uniwind.setTheme(theme);
      }, [theme]);

      return (
        <View style={{ flex: 1, backgroundColor }}>
          <Story />
        </View>
      );
    },
  ],
};

export default preview;
