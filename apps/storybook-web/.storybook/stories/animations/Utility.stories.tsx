import { useState } from "react";
import { Description, Stories, Subtitle, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@ui/web/Button";

const meta: Meta = {
  title: "Foundations/Animations/Utility Classes",
  id: "Utility",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          <Stories />
        </>
      ),
    },
  },

  decorators: [
    (Story) => (
      <div className="flex flex-col items-center gap-12">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const AnimationDuration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Controls how long the animation takes to complete.\n\nUsage: `animation-duration-[value]`\n\n- `animation-duration-300` — 0.3 seconds\n- `animation-duration-1000` — 1 second\n- `animation-duration-2000` — 2 seconds\n- `animation-duration-3000` — 3 seconds",
      },
    },
  },
  render: () => {
    const [animatingButton, setAnimatingButton] = useState<string | null>(null);

    const handleClick = (buttonId: string) => {
      setAnimatingButton(buttonId);
    };

    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          className={`animation-duration-300 ${animatingButton === "btn1" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn1")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          300ms
        </Button>
        <Button
          className={`animation-duration-1000 ${animatingButton === "btn2" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn2")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          1s
        </Button>
        <Button
          className={`animation-duration-2000 ${animatingButton === "btn3" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn3")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          2s
        </Button>
        <Button
          className={`animation-duration-3000 ${animatingButton === "btn4" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn4")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          3s
        </Button>
      </div>
    );
  },
};

export const AnimationDelay: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Adds a delay before the animation starts.\n\nUsage: `animation-delay-[value]`\n\n- No class — animation starts immediately\n- `animation-delay-500` — 0.5 second delay\n- `animation-delay-1000` — 1 second delay\n- `animation-delay-2000` — 2 seconds delay",
      },
    },
  },
  render: () => {
    const [animatingButton, setAnimatingButton] = useState<string | null>(null);

    const handleClick = (buttonId: string) => {
      setAnimatingButton(buttonId);
    };

    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          className={`${animatingButton === "btn1" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn1")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          No delay
        </Button>
        <Button
          className={`animation-delay-500 ${animatingButton === "btn2" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn2")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          500ms delay
        </Button>
        <Button
          className={`animation-delay-1000 ${animatingButton === "btn3" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn3")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          1s delay
        </Button>
        <Button
          className={`animation-delay-2000 ${animatingButton === "btn4" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn4")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          2s delay
        </Button>
      </div>
    );
  },
};

export const AnimationIterationCount: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Controls how many times the animation repeats.\n\nUsage: `animation-count-[value]`\n\n- `animation-count-1` — plays once (default)\n- `animation-count-2` — plays 2 times\n- `animation-count-3` — plays 3 times\n- `animation-count-infinite` — loops infinitely",
      },
    },
  },
  render: () => {
    const [animatingButton, setAnimatingButton] = useState<string | null>(null);

    const handleClick = (buttonId: string) => {
      if (animatingButton === buttonId) {
        setAnimatingButton(null);
      } else {
        setAnimatingButton(buttonId);
      }
    };

    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          className={`animation-count-1 ${animatingButton === "btn1" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn1")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          1 time
        </Button>
        <Button
          className={`animation-count-2 ${animatingButton === "btn2" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn2")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          2 times
        </Button>
        <Button
          className={`animation-count-3 ${animatingButton === "btn3" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn3")}
          onAnimationEnd={() => setAnimatingButton(null)}
        >
          3 times
        </Button>
        <Button
          className={`animation-count-infinite ${animatingButton === "btn4" ? "animate-jello-effect" : ""}`}
          onClick={() => handleClick("btn4")}
        >
          {animatingButton === "btn4" ? "Stop" : "Infinite"}
        </Button>
      </div>
    );
  },
};
