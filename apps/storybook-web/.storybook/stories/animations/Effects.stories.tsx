import { useState } from "react";
import { Description, Stories, Subtitle, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@ui/web/Button";

const meta: Meta = {
  title: "Foundations/Animations/Base Effects",
  id: "Effects",
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

export const SpinEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Continuous spinning animation for loading states or decorative effects. This is basic animation from Tailwind CSS.\n\nTailwind class: `animate-spin`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(!isAnimating);
    };

    return (
      <Button className={isAnimating ? "animate-spin" : ""} onClick={handleClick}>
        {isAnimating ? "Stop Spin" : "Start Spin"}
      </Button>
    );
  },
};

export const PingEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Continuous ping animation with expanding rings for notifications, online status indicators, and attention-grabbing elements. This is basic animation from Tailwind CSS.\n\nTailwind class: `animate-ping`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(!isAnimating);
    };

    return (
      <Button className={`${isAnimating ? "animate-ping" : ""}`} onClick={handleClick}>
        {isAnimating ? "Stop Ping" : "Start Ping"}
      </Button>
    );
  },
};

export const PulseEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Continuous pulse animation with opacity changes for loading states and breathing effects. This is basic animation from Tailwind CSS.\n\nTailwind class: `animate-pulse`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(!isAnimating);
    };

    return (
      <Button className={`${isAnimating ? "animate-pulse" : ""}`} onClick={handleClick}>
        {isAnimating ? "Stop Pulse" : "Start Pulse"}
      </Button>
    );
  },
};

export const BounceBasicEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Continuous basic bounce animation for playful elements and scroll indicators. This is basic animation from Tailwind CSS.\n\nTailwind class: `animate-bounce`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(!isAnimating);
    };

    return (
      <Button className={`${isAnimating ? "animate-bounce" : ""}`} onClick={handleClick}>
        {isAnimating ? "Stop Bounce" : "Start Bounce"}
      </Button>
    );
  },
};

export const BlinkEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Rapid opacity flash for attention-grabbing notifications and alerts.\n\nTailwind class: `animate-blink-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-blink-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const BounceEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Vertical bounce with squash-stretch deformation and tilt for playful feedback.\n\nTailwind class: `animate-bounce-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-bounce-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const FadeInEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Simple opacity transition from invisible to visible for smooth appearances.\n\nTailwind class: `animate-fade-in-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-fade-in-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const FlipEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Y-axis card flip with shadow perspective and scale change during rotation.\n\nTailwind class: `animate-flip-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-flip-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const HeartbeatEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Double-pulse rhythm animation for likes and favorite interactions.\n\nTailwind class: `animate-heartbeat-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-heartbeat-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const JelloEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Wobble deformation with ripple-through effect and bounce for gelatinous motion.\n\nTailwind class: `animate-jello-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-jello-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const PopEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Scale overshoot entrance with rotation twist and motion blur for emphasis.\n\nTailwind class: `animate-pop-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-pop-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const RubberBandEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Elastic stretch with thickness variation and edge vibration for springy motion.\n\nTailwind class: `animate-rubber-band-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`origin-center ${isAnimating ? "animate-rubber-band-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const ScaleEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Clean scale transformation from small to full size without bounce.\n\nTailwind class: `animate-scale-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`origin-center ${isAnimating ? "animate-scale-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const ShakeEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Horizontal shake with rotation wobble and scale compression for error feedback.\n\nTailwind class: `animate-shake-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`origin-center ${isAnimating ? "animate-shake-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const SlideInEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Linear sliding motion from off-screen position for panel entrances.\n\nTailwind class: `animate-slide-in-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`origin-[center-left] ${isAnimating ? "animate-slide-in-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const SqueezeEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Compression effect that squashes element for tactile button feedback.\n\nTailwind class: `animate-squeeze-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`origin-center ${isAnimating ? "animate-squeeze-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const SwingEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Pendulum arc swing with axis rotation and momentum lean for hanging elements.\n\nTailwind class: `animate-swing-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`origin-[center-top] ${isAnimating ? "animate-swing-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const TadaEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Celebration animation combining scale and rotation for success moments.\n\nTailwind class: `animate-tada-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-tada-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const WiggleEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Rotation oscillation with scale breathing and position drift for attention.\n\nTailwind class: `animate-wiggle-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-wiggle-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const JitteryEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Playful button with continuous jittery animation.\n\nTailwind class: `animate-jittery-effect`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-jittery-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};

export const LiquidMorphEffect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Button liquifies and reshapes on click with elastic blob-like deformation.\n\nTailwind class: `animate-button-liquid-morph`",
      },
    },
  },
  render: () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
      setIsAnimating(true);
    };

    return (
      <Button
        className={`${isAnimating ? "animate-liquid-morph-effect" : ""}`}
        onClick={handleClick}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        Click Me!
      </Button>
    );
  },
};
