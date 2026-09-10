import * as TabsPrimitive from "@rn-primitives/tabs";
import { type TextProps } from "react-native";

import { Typography, TypographyClassContext } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * A set of layered sections of content that are displayed one at a time.
 *
 * @param {string} value - The controlled value of the tab to activate
 * @param {function} onValueChange - Callback when the active tab changes
 * @param {string} [className] - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 * import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ui/native/tabs';
 *
 * const [tab, setTab] = useState('feedback');
 *
 * <Tabs value={tab} onValueChange={setTab}>
 *   <TabsList>
 *     <TabsTrigger value="feedback">Feedback</TabsTrigger>
 *     <TabsTrigger value="survey">Survey</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="feedback">...</TabsContent>
 *   <TabsContent value="survey">...</TabsContent>
 * </Tabs>
 * ```
 *
 * @cssVariables
 * - `--tabs-list-border-radius`
 * - `--tabs-list-border-width`
 * - `--tabs-list-border-color`
 * - `--tabs-list-background-color`
 * - `--tabs-list-color`
 * - `--tabs-trigger-border-radius`
 * - `--tabs-trigger-border-width`
 * - `--tabs-trigger-border-color`
 * - `--tabs-trigger-background-color`
 * - `--tabs-trigger-color`
 */
function Tabs({
  className,
  ...props
}: TabsPrimitive.RootProps & React.RefAttributes<TabsPrimitive.RootRef>) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} {...props} />;
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.ListProps & React.RefAttributes<TabsPrimitive.ListRef>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "rounded-(--tabs-list-border-radius) border-(length:--tabs-list-border-width) border-(--tabs-list-border-color) bg-(--tabs-list-background-color) text-(--tabs-list-color) mr-auto inline-flex h-10 w-fit flex-row items-center justify-center p-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  ...props
}: Omit<TabsPrimitive.TriggerProps, "children"> &
  React.RefAttributes<TabsPrimitive.TriggerRef> & {
    children: TextProps["children"];
  }) {
  const { value } = TabsPrimitive.useRootContext();
  return (
    <TypographyClassContext.Provider
      value={cn(
        "text-(--tabs-list-color) text-sm font-medium",
        value === props.value && "text-(--tabs-trigger-color)",
      )}
    >
      <TabsPrimitive.Trigger
        className={cn(
          "rounded-(--tabs-trigger-border-radius) flex h-[calc(100%-1px)] flex-row items-center justify-center gap-1.5 border border-transparent px-2 py-1 shadow-none shadow-black/5",
          props.disabled && "opacity-50",
          props.value === value &&
            "border-(length:--tabs-trigger-border-width) border-(--tabs-trigger-border-color) bg-(--tabs-trigger-background-color) shadow-sm",
          className,
        )}
        {...props}
      >
        <Typography
          className={cn(
            "text-(--tabs-list-color) font-sans text-sm font-medium",
            value === props.value && "text-(--tabs-trigger-color)",
          )}
        >
          {children}
        </Typography>
      </TabsPrimitive.Trigger>
    </TypographyClassContext.Provider>
  );
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.ContentProps & React.RefAttributes<TabsPrimitive.ContentRef>) {
  return <TabsPrimitive.Content className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
