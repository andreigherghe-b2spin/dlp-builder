import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { CreditCard, Dices, Gift, Home, Lock, Spade, Sparkles, Trophy, User } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsPanels, TabsTrigger } from "@ui/web/Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Needs Review/Molecules/Tabs",
  id: "Tabs",
  component: Tabs,
  tags: ["autodocs", "status:needs-review", "level:molecules"],
  argTypes: {
    defaultValue: { control: "text" },
    value: { control: "text" },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    onValueChange: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

const panelClass = "text-foreground-on-surface-default text-(length:--typography-font-size-body-m)";

/** The ten game categories a brand bar carries, which is what makes it scroll. */
const categories = [
  { value: "home", label: "Home", Icon: Home },
  { value: "slots", label: "Slots", Icon: Dices },
  { value: "live", label: "Live dealer", Icon: Spade },
  { value: "new", label: "New games", Icon: Sparkles },
  { value: "jackpots", label: "Jackpots", Icon: Trophy },
  { value: "bonus", label: "Bonus buy", Icon: Gift },
  { value: "table", label: "Table games", Icon: Dices },
  { value: "arcade", label: "Arcade", Icon: Spade },
  { value: "slingo", label: "Slingo", Icon: Sparkles },
  { value: "favourites", label: "Favourites", Icon: Trophy },
];

/** What a router-driven bar is given: a route per tab. */
const routes = [
  { href: "/games/slots", label: "Slots" },
  { href: "/games/live", label: "Live dealer" },
  { href: "/games/new", label: "New games" },
];

function CategoryTabs({
  className,
  showArrows,
  ...props
}: React.ComponentProps<typeof Tabs> & { showArrows?: boolean }) {
  return (
    <Tabs defaultValue="home" className={className} {...props}>
      <TabsList showArrows={showArrows}>
        {categories.map(({ value, label, Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon aria-hidden />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsPanels className={panelClass}>
        {categories.map(({ value, label }) => (
          <TabsContent key={value} value={value}>
            {label} — 24 games
          </TabsContent>
        ))}
      </TabsPanels>
    </Tabs>
  );
}

/** Two tabs and their panels. Nothing overflows, so no arrows appear. */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsPanels className={panelClass}>
        <TabsContent value="account">Make changes to your account here.</TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
      </TabsPanels>
    </Tabs>
  ),
};

/** An icon before the label. 16px is the size a tab gives it; the label names it. */
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">
          <User aria-hidden />
          Account
        </TabsTrigger>
        <TabsTrigger value="password">
          <Lock aria-hidden />
          Password
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCard aria-hidden />
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsPanels className={panelClass}>
        <TabsContent value="account">Manage your account preferences here.</TabsContent>
        <TabsContent value="password">Update your password and security settings.</TabsContent>
        <TabsContent value="billing">Manage your billing details and payment methods.</TabsContent>
      </TabsPanels>
    </Tabs>
  ),
};

/**
 * More tabs than fit. The row scrolls with the wheel, a touch drag or the two
 * arrows, and the arrows are only there while there is somewhere to go.
 */
export const Scrollable: Story = {
  render: () => <CategoryTabs className="w-105" />,
};

/** `showArrows={false}` leaves the row scrolling by wheel and touch alone. */
export const ScrollableWithoutArrows: Story = {
  render: () => <CategoryTabs className="w-105" showArrows={false} />,
};

/** A tab that cannot be reached, and keeps its place in the row while it is. */
export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsPanels className={panelClass}>
        <TabsContent value="account">Make changes to your account here.</TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
      </TabsPanels>
    </Tabs>
  ),
};

/**
 * A bar that navigates rather than swapping panels: the trigger becomes the
 * link, the route is the value, and the selected tab comes from the router.
 */
export const AsNavigation: Story = {
  render: function AsNavigationStory() {
    const [route, setRoute] = React.useState(routes[0].href);

    return (
      <Tabs value={route} className="w-96">
        <TabsList>
          {routes.map(({ href, label }) => (
            <TabsTrigger key={href} value={href} asChild>
              <a
                href={href}
                onClick={(event) => {
                  event.preventDefault();
                  setRoute(href);
                }}
              >
                {label}
              </a>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className={panelClass}>
          {routes.map(({ href, label }) => (
            <TabsContent key={href} value={href}>
              {label} — what the router would render at {href}.
            </TabsContent>
          ))}
        </TabsPanels>
      </Tabs>
    );
  },
};

/**
 * `orientation="vertical"` turns the whole thing on its side: the bar becomes a
 * column beside the panels, the up and down keys move between tabs, and the
 * scroll arrows — when there are more tabs than fit — move to the top and bottom
 * edges.
 *
 * A vertical bar is as tall as the layout makes it, the way a horizontal one is
 * as wide, so the two sizes worth setting are a height on the tabs and a width
 * on the bar. Without a height there is nothing for the column to scroll inside
 * and it simply grows to fit every tab, which is the right answer for a short
 * bar like this one.
 */
export const Vertical: Story = {
  render: () => (
    <Tabs orientation="vertical" defaultValue="account" className="w-120">
      <TabsList className="w-40">
        <TabsTrigger value="account">
          <User aria-hidden />
          Account
        </TabsTrigger>
        <TabsTrigger value="password">
          <Lock aria-hidden />
          Password
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCard aria-hidden />
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsPanels className={panelClass}>
        <TabsContent value="account">Manage your account preferences here.</TabsContent>
        <TabsContent value="password">Update your password and security settings.</TabsContent>
        <TabsContent value="billing">Manage your billing details and payment methods.</TabsContent>
      </TabsPanels>
    </Tabs>
  ),
};

/**
 * The same ten categories in a column too short for them: the bar scrolls up and
 * down, and the arrows sit on the top and bottom edges rather than the sides.
 */
export const VerticalScrollable: Story = {
  render: () => (
    <Tabs orientation="vertical" defaultValue="jackpots" className="w-120 h-40">
      <TabsList className="w-40">
        {categories.map(({ value, label, Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon aria-hidden />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsPanels className={panelClass}>
        {categories.map(({ value, label }) => (
          <TabsContent key={value} value={value}>
            {label} — 24 games
          </TabsContent>
        ))}
      </TabsPanels>
    </Tabs>
  ),
};

/**
 * The fullest tab bar there is, and the only story the visual suite
 * photographs: ten categories with icons in a bar too small for them, one of
 * them disabled, a selected one in the middle so both arrows are on screen, and
 * the panel beside or below it — once running along a row, once down a column.
 * A state that is not in here is covered by nothing.
 *
 * Selected in the middle rather than at either end because that is the only
 * position both arrows appear in. It costs the shot its anchor to an edge — the
 * bar rests wherever centring the fifth pill puts it — which is fine while the
 * type is the brand webfont on every platform, and the thing to suspect first
 * if the baselines ever drift by a few pixels.
 *
 * Every box here is an explicit size, the vertical one's height included: it is
 * what decides that the column overflows at all, and a height left to the
 * content would photograph ten tabs and no arrows.
 *
 * The short bar at the top is here because the other two cannot show it: both
 * overflow by construction, so without it the appearance of a bar that simply
 * fits — no arrows, nothing clipped, no scroll — was covered by no snapshot on
 * any brand, and a regression that put arrows on a two-tab bar would have
 * shipped green.
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-120 flex flex-col gap-8">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <User aria-hidden />
            Account
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock aria-hidden />
            Password
          </TabsTrigger>
          <TabsTrigger value="billing" disabled>
            <CreditCard aria-hidden />
            Billing
          </TabsTrigger>
        </TabsList>
        <TabsPanels className={panelClass}>
          <TabsContent value="account">Three tabs, and room for all of them.</TabsContent>
          <TabsContent value="password">Change your password here.</TabsContent>
        </TabsPanels>
      </Tabs>
      <Tabs defaultValue="jackpots">
        <TabsList>
          {categories.map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value} disabled={value === "bonus"}>
              <Icon aria-hidden />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className={panelClass}>
          {categories.map(({ value, label }) => (
            <TabsContent key={value} value={value}>
              {label} — 24 games
            </TabsContent>
          ))}
        </TabsPanels>
      </Tabs>
      <Tabs orientation="vertical" defaultValue="jackpots" className="h-40">
        <TabsList className="w-40">
          {categories.map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value} disabled={value === "bonus"}>
              <Icon aria-hidden />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className={panelClass}>
          {categories.map(({ value, label }) => (
            <TabsContent key={value} value={value}>
              {label} — 24 games
            </TabsContent>
          ))}
        </TabsPanels>
      </Tabs>
    </div>
  ),
};
