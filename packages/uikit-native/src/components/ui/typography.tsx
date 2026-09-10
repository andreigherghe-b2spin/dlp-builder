import { cn } from "@/lib/utils";
import { Slot } from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Text as RNText, View } from "react-native";

const TypographyClassContext = React.createContext<string | undefined>(undefined);

type TypographyTextProps = React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> & {
    asChild?: boolean;
  };

type TypographyViewProps = React.ComponentProps<typeof View> &
  React.RefAttributes<View> & {
    asChild?: boolean;
  };

type TypographyPProps = TypographyTextProps & VariantProps<typeof typographyPVariants>;

type TypographyTagProps = TypographyTextProps & VariantProps<typeof typographyTagVariants>;

/**
 * Base typography component. A drop-in replacement for `react-native`'s `Text`
 * that consumes `TypographyClassContext`, so parent components can theme
 * nested text without each child knowing about it.
 *
 * Use this when you just need plain text without picking a semantic variant
 * (heading, paragraph size, etc.). For semantic variants prefer
 * `TypographyP`, `TypographyH1`, `TypographySmall`, and friends.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { Typography, TypographyClassContext } from '@ui/native/typography'
 *
 * <Typography>Plain text</Typography>
 *
 * <TypographyClassContext.Provider value="text-destructive text-sm">
 *   <Typography>Inherits color and size from context</Typography>
 * </TypographyClassContext.Provider>
 * ```
 */
function Typography({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component className={cn("text-foreground text-base", typographyClass, className)} {...props} />
  );
}

/**
 * Large heading component with customizable typography styles.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyH1 } from '@ui/native/typography'
 *
 * <TypographyH1>Heading</TypographyH1>
 * <TypographyH1 asChild><Link>Heading</Link></TypographyH1>
 * ```
 *
 * @cssVariables
 * - `--typography-components-h1-font-family`
 * - `--typography-components-h1-font-size`
 * - `--typography-components-h1-font-size-lg`
 * - `--typography-components-h1-font-weight`
 * - `--typography-components-h1-letter-spacing`
 * - `--typography-components-h1-line-height`
 */
function TypographyH1({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      role="heading"
      aria-level="1"
      className={cn(
        "font-(family-name:--typography-components-h1-font-family)",
        "text-(length:--typography-components-h1-font-size)",
        "font-(--typography-components-h1-font-weight)",
        "tracking-(--typography-components-h1-letter-spacing)",
        "leading-(--typography-components-h1-line-height)",
        "text-foreground",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Secondary heading component with bottom border styling.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyH2 } from '@ui/native/typography'
 *
 * <TypographyH2>Subheading</TypographyH2>
 * <TypographyH2 asChild><Link>Subheading</Link></TypographyH2>
 * ```
 *
 * @cssVariables
 * - `--typography-components-h2-font-family`
 * - `--typography-components-h2-font-size`
 * - `--typography-components-h2-font-weight`
 * - `--typography-components-h2-letter-spacing`
 * - `--typography-components-h2-line-height`
 */
function TypographyH2({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      role="heading"
      aria-level="2"
      className={cn(
        "font-(family-name:--typography-components-h2-font-family)",
        "text-(length:--typography-components-h2-font-size)",
        "font-(--typography-components-h2-font-weight)",
        "tracking-(--typography-components-h2-letter-spacing)",
        "leading-(--typography-components-h2-line-height)",
        "border-border text-foreground border-b pb-2",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Tertiary heading component for section titles.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyH3 } from '@ui/native/typography'
 *
 * <TypographyH3>Section Title</TypographyH3>
 * <TypographyH3 asChild><Link>Section Title</Link></TypographyH3>
 * ```
 *
 * @cssVariables
 * - `--typography-components-h3-font-family`
 * - `--typography-components-h3-font-size`
 * - `--typography-components-h3-font-weight`
 * - `--typography-components-h3-letter-spacing`
 * - `--typography-components-h3-line-height`
 */
function TypographyH3({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      role="heading"
      aria-level="3"
      className={cn(
        "font-(family-name:--typography-components-h3-font-family)",
        "text-(length:--typography-components-h3-font-size)",
        "font-(--typography-components-h3-font-weight)",
        "tracking-(--typography-components-h3-letter-spacing)",
        "leading-(--typography-components-h3-line-height)",
        "text-foreground",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Quaternary heading component for subsection titles.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyH4 } from '@ui/native/typography'
 *
 * <TypographyH4>Subsection</TypographyH4>
 * <TypographyH4 asChild><Link>Subsection</Link></TypographyH4>
 * ```
 *
 * @cssVariables
 * - `--typography-components-h4-font-family`
 * - `--typography-components-h4-font-size`
 * - `--typography-components-h4-font-weight`
 * - `--typography-components-h4-letter-spacing`
 * - `--typography-components-h4-line-height`
 */
function TypographyH4({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      role="heading"
      aria-level="4"
      className={cn(
        "font-(family-name:--typography-components-h4-font-family)",
        "text-(length:--typography-components-h4-font-size)",
        "font-(--typography-components-h4-font-weight)",
        "tracking-(--typography-components-h4-letter-spacing)",
        "leading-(--typography-components-h4-line-height)",
        "text-foreground",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

const typographyPVariants = cva("text-foreground", {
  variants: {
    variant: {
      xxs: "text-[10px] leading-3",
      xs: "text-xs leading-4",
      sm: "text-sm leading-5",
      md: "text-base leading-6",
      lg: "text-lg leading-7",
      xl: "text-xl leading-7",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      bold: "font-bold",
    },
    decoration: {
      none: "no-underline",
      underline: "underline",
    },
  },
  defaultVariants: {
    variant: "md",
    weight: "normal",
    decoration: "none",
  },
});

const typographyTagVariants = cva("text-foreground font-bold uppercase", {
  variants: {
    variant: {
      xxs: "text-[10px] leading-none",
      xs: "text-xs leading-none",
      sm: "text-sm leading-none",
    },
  },
  defaultVariants: {
    variant: "sm",
  },
});

/**
 * Tag component for labels and badges with size variants.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 * @param variant{'xxs' | 'xs' | 'sm'} - The size variant of the tag text.
 *
 * @example
 * ```tsx
 * import { TypographyTag } from '@ui/native/typography'
 *
 * <TypographyTag>Tag text</TypographyTag>
 * <TypographyTag variant="xxs">Extra small tag</TypographyTag>
 * <TypographyTag variant="xs">Small tag</TypographyTag>
 * <TypographyTag variant="sm">Small tag (default)</TypographyTag>
 * <TypographyTag asChild><Pressable><Text>Tag</Text></Pressable></TypographyTag>
 * ```
 */
function TypographyTag({ asChild = false, className, variant, ...props }: TypographyTagProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(typographyTagVariants({ variant }), typographyClass, className)}
      {...props}
    />
  );
}

/**
 * Paragraph component for body text content with size variants.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 * @param variant{'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'} - The size variant of the paragraph text.
 * @param weight{'normal' | 'medium' | 'bold'} - The font weight of the paragraph text.
 * @param decoration{'none' | 'underline'} - The text decoration of the paragraph text.
 *
 * @example
 * ```tsx
 * import { TypographyP } from '@ui/native/typography'
 *
 * <TypographyP>Body text content</TypographyP>
 * <TypographyP variant="lg" weight="medium">Large medium weight text</TypographyP>
 * <TypographyP variant="sm" weight="medium" decoration="underline">Small underlined medium weight text</TypographyP>
 * <TypographyP asChild><Pressable><Text>Body text</Text></Pressable></TypographyP>
 * ```
 *
 * @note Do not use className to assign text size, weight, or decoration styles.
 * Use the proper props (variant, weight, decoration) instead for consistent styling.
 */
function TypographyP({
  asChild = false,
  className,
  variant,
  weight,
  decoration,
  ...props
}: TypographyPProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        typographyPVariants({ variant, weight, decoration }),
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Blockquote component for quoted text with left border.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyBlockquote } from '@ui/native/typography'
 *
 * <TypographyBlockquote>Quote text</TypographyBlockquote>
 * <TypographyBlockquote asChild><Text>Quote</Text></TypographyBlockquote>
 * ```
 *
 * @cssVariables
 * - `--typography-components-blockquote-font-family`
 * - `--typography-components-blockquote-font-size`
 * - `--typography-components-blockquote-font-weight`
 * - `--typography-components-blockquote-letter-spacing`
 * - `--typography-components-blockquote-line-height`
 * - `--typography-components-blockquote-font-style`
 */
function TypographyBlockquote({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        "font-(family-name:--typography-components-blockquote-font-family)",
        "text-(length:--typography-components-blockquote-font-size)",
        "font-(--typography-components-blockquote-font-weight)",
        "tracking-(--typography-components-blockquote-letter-spacing)",
        "leading-(--typography-components-blockquote-line-height)",
        "[font-style:var(--typography-components-blockquote-font-style)]",
        "border-border text-foreground border-l-2 pl-6 italic",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Unordered list container with bullet-style spacing.
 *
 * @param children{React.ReactNode} - The content of the component (e.g. `TypographyP` items).
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyList } from '@ui/native/typography'
 * import { TypographyP } from '@ui/native/typography'
 *
 * <TypographyList>
 *   <TypographyP>Item 1</TypographyP>
 *   <TypographyP>Item 2</TypographyP>
 * </TypographyList>
 * ```
 *
 * @cssVariables
 * - `--typography-components-list-font-family`
 * - `--typography-components-list-font-size`
 * - `--typography-components-list-font-weight`
 * - `--typography-components-list-letter-spacing`
 * - `--typography-components-list-line-height`
 */
function TypographyList({ asChild = false, className, ...props }: TypographyViewProps) {
  const Component = asChild ? Slot : View;
  return (
    <TypographyClassContext.Provider
      value={cn(
        "font-(family-name:--typography-components-list-font-family)",
        "text-(length:--typography-components-list-font-size)",
        "font-(--typography-components-list-font-weight)",
        "tracking-(--typography-components-list-letter-spacing)",
        "leading-(--typography-components-list-line-height)",
        "text-foreground",
      )}
    >
      <Component className={cn("ml-6 gap-2", className)} {...props} />
    </TypographyClassContext.Provider>
  );
}

/**
 * Inline code component with background highlighting.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyInlineCode } from '@ui/native/typography'
 *
 * <TypographyInlineCode>const value = 'code'</TypographyInlineCode>
 * <TypographyInlineCode asChild><Text>Ctrl+C</Text></TypographyInlineCode>
 * ```
 *
 * @cssVariables
 * - `--typography-components-inline-code-font-family`
 * - `--typography-components-inline-code-font-size`
 * - `--typography-components-inline-code-font-weight`
 * - `--typography-components-inline-code-letter-spacing`
 * - `--typography-components-inline-code-line-height`
 */
function TypographyInlineCode({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        "font-(family-name:--typography-components-inline-code-font-family)",
        "text-(length:--typography-components-inline-code-font-size)",
        "font-(--typography-components-inline-code-font-weight)",
        "tracking-(--typography-components-inline-code-letter-spacing)",
        "leading-(--typography-components-inline-code-line-height)",
        "bg-muted text-foreground relative rounded px-[0.3rem] py-[0.2rem]",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Lead text component for introductory content.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyLead } from '@ui/native/typography'
 *
 * <TypographyLead>This is an introductory paragraph.</TypographyLead>
 * <TypographyLead asChild><Text>Lead text</Text></TypographyLead>
 * ```
 *
 * @cssVariables
 * - `--typography-components-lead-font-family`
 * - `--typography-components-lead-font-size`
 * - `--typography-components-lead-font-weight`
 * - `--typography-components-lead-letter-spacing`
 * - `--typography-components-lead-line-height`
 */
function TypographyLead({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        "font-(family-name:--typography-components-lead-font-family)",
        "text-(length:--typography-components-lead-font-size)",
        "font-(--typography-components-lead-font-weight)",
        "tracking-(--typography-components-lead-letter-spacing)",
        "leading-(--typography-components-lead-line-height)",
        "text-muted-foreground",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Extra large text component for regular text.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyXLarge } from '@ui/native/typography'
 *
 * <TypographyXLarge>Extra large text</TypographyXLarge>
 * <TypographyXLarge asChild><Text>Caption</Text></TypographyXLarge>
 * ```
 */
function TypographyXLarge({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn("text-foreground text-xl font-bold leading-5", typographyClass, className)}
      {...props}
    />
  );
}

/**
 * Large text component for emphasized content.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyLarge } from '@ui/native/typography'
 *
 * <TypographyLarge>Important information</TypographyLarge>
 * <TypographyLarge asChild><Text>Emphasized text</Text></TypographyLarge>
 * ```
 *
 * @cssVariables
 * - `--typography-components-large-font-family`
 * - `--typography-components-large-font-size`
 * - `--typography-components-large-font-weight`
 * - `--typography-components-large-letter-spacing`
 * - `--typography-components-large-line-height`
 */
function TypographyLarge({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        "font-(family-name:--typography-components-large-font-family)",
        "text-(length:--typography-components-large-font-size)",
        "font-(--typography-components-large-font-weight)",
        "tracking-(--typography-components-large-letter-spacing)",
        "leading-(--typography-components-large-line-height)",
        "text-foreground",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Medium text component for regular text.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyMedium } from '@ui/native/typography'
 *
 * <TypographyMedium>Medium text</TypographyMedium>
 * <TypographyMedium asChild><Text>Caption</Text></TypographyMedium>
 * ```
 */
function TypographyMedium({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        "text-foreground text-base font-semibold leading-4",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Small text component for fine print or captions.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographySmall } from '@ui/native/typography'
 *
 * <TypographySmall>© 2024 Company Name</TypographySmall>
 * <TypographySmall asChild><Text>Caption</Text></TypographySmall>
 * ```
 *
 * @cssVariables
 * - `--typography-components-small-font-family`
 * - `--typography-components-small-font-size`
 * - `--typography-components-small-font-weight`
 * - `--typography-components-small-letter-spacing`
 * - `--typography-components-small-line-height`
 */
function TypographySmall({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(
        "font-(family-name:--typography-components-small-font-family)",
        "text-(length:--typography-components-small-font-size)",
        "font-(--typography-components-small-font-weight)",
        "tracking-(--typography-components-small-letter-spacing)",
        "leading-(--typography-components-small-line-height)",
        "text-foreground",
        typographyClass,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Extra small text component for fine print or captions.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyXSmall } from '@ui/native/typography'
 *
 * <TypographyXSmall>© 2024 Company Name</TypographyXSmall>
 * <TypographyXSmall asChild><Text>Caption</Text></TypographyXSmall>
 * ```
 */
function TypographyXSmall({ asChild = false, className, ...props }: TypographyTextProps) {
  const typographyClass = React.useContext(TypographyClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn("text-foreground text-xs font-medium leading-3", typographyClass, className)}
      {...props}
    />
  );
}

/**
 * Muted text component with reduced opacity for secondary content.
 *
 * @param asChild{boolean} - If true, the component will be rendered as a child of the parent component.
 * @param children{React.ReactNode} - The content of the component.
 * @param className{string} - The class name of the component.
 *
 * @example
 * ```tsx
 * import { TypographyMuted } from '@ui/native/typography'
 *
 * <TypographyMuted>Optional field</TypographyMuted>
 * <TypographyMuted asChild><Text>Helper text</Text></TypographyMuted>
 * ```
 *
 * @cssVariables
 * - Inherits all variables from `TypographySmall`
 */
function TypographyMuted({ className, ...props }: TypographyTextProps) {
  return <TypographySmall className={cn("text-muted-foreground", className)} {...props} />;
}

export {
  Typography,
  TypographyBlockquote,
  TypographyClassContext,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMedium,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTag,
  TypographyXLarge,
  TypographyXSmall,
};
