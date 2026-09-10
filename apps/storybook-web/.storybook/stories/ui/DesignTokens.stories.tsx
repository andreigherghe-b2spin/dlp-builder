import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  id: "DesignTokens",
  title: "Theme/Tokens",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const colorGroups = {
  Background: [
    "background-backdrop",
    "background-brand-accent1container",
    "background-brand-accent2container",
    "background-brand-gold-coins-container",
    "background-brand-primary-container",
    "background-brand-secondary-container",
    "background-brand-sweepstakes-coins-container",
    "background-feedback-informative-container",
    "background-feedback-negative-container",
    "background-feedback-positive-container",
    "background-feedback-warning-container",
    "background-layout-inverted",
    "background-layout-page",
    "background-layout-surface",
    "background-layout-surface-overlay",
    "background-layout-surface-variant1",
    "background-state-disabled",
    "background-state-hover",
    "background-state-pressed",
    "background-state-selected",
  ],
  Foreground: [
    "foreground-brand-accent1",
    "foreground-brand-accent2",
    "foreground-brand-gold-coins",
    "foreground-brand-on-accent1container",
    "foreground-brand-on-accent2container",
    "foreground-brand-on-gold-coins-container",
    "foreground-brand-on-primary-container",
    "foreground-brand-on-secondary-container",
    "foreground-brand-on-sweepstakes-coins-container",
    "foreground-brand-primary",
    "foreground-brand-secondary",
    "foreground-brand-sweepstakes-coins",
    "foreground-feedback-informative",
    "foreground-feedback-negative",
    "foreground-feedback-on-informative-container",
    "foreground-feedback-on-negative-container",
    "foreground-feedback-on-positive-container",
    "foreground-feedback-on-warning-container",
    "foreground-feedback-positive",
    "foreground-feedback-warning",
    "foreground-on-inverted-default",
    "foreground-on-inverted-muted",
    "foreground-on-page-default",
    "foreground-on-page-muted",
    "foreground-on-surface-default",
    "foreground-on-surface-muted",
    "foreground-state-active",
    "foreground-state-disabled",
  ],
  Border: [
    "border-brand-accent1",
    "border-brand-accent2",
    "border-brand-gold-coins",
    "border-brand-on-accent1container",
    "border-brand-on-accent2container",
    "border-brand-on-gold-coins-container",
    "border-brand-on-primary-container",
    "border-brand-on-secondary-container",
    "border-brand-on-sweepstakes-coins-container",
    "border-brand-primary",
    "border-brand-secondary",
    "border-brand-sweepstakes-coins",
    "border-feedback-informative",
    "border-feedback-negative",
    "border-feedback-positive",
    "border-feedback-warning",
    "border-neutral-default",
    "border-neutral-strong",
    "border-neutral-subtle",
    "border-state-active",
    "border-state-focus",
  ],
  Jackpot: [
    "jackpot-gold-coins",
    "jackpot-grand",
    "jackpot-major",
    "jackpot-mini",
    "jackpot-minor",
    "jackpot-sweepstakes-coins",
  ],
} as const;

const radiusScale = [
  "--radius-none",
  "--radius-compact",
  "--radius-comfortable",
  "--radius-base",
  "--radius-offset4",
  "--radius-offset8",
  "--radius-offset12",
  "--radius-offset16",
  "--radius-offset24",
] as const;

const componentTokens = [
  "--components-badge-radius",
  "--components-button-border",
  "--components-button-radius",
  "--components-card-border",
  "--components-card-radius",
  "--components-textfield-border",
  "--components-textfield-radius",
] as const;

const typographySizes = [
  "body-xs",
  "body-l",
  "body-m",
  "body-s",
  "caption-m",
  "display-xl",
  "display-l",
  "display-m",
  "display-s",
  "heading-xl",
  "heading-l",
  "heading-m",
  "heading-s",
  "heading-xs",
  "label-xl",
  "label-l",
  "label-m",
  "label-s",
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-border-neutral-default text-(length:--typography-font-size-heading-l) font-(--typography-font-weight-bold) border-b pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({ token }: { token: string }) {
  const variable = `--color-${token}`;

  return (
    <div className="bg-background-layout-surface border-border-neutral-default rounded-(--components-card-radius) border-(length:--components-card-border) p-3">
      <div
        className="border-border-neutral-subtle rounded-(--components-card-radius) h-16 border"
        style={{ backgroundColor: `var(${variable})` }}
      />
      <p className="text-(length:--typography-font-size-body-s) text-foreground-on-surface-default wrap-break-word mt-2">
        {token}
      </p>
      <code className="text-(length:--typography-font-size-caption-m) text-foreground-on-surface-muted">
        {variable}
      </code>
    </div>
  );
}

// Each sheet is defined once and rendered both by its own story, for browsing one
// family of tokens, and by `AllTokens`, which is the one the visual suite
// photographs. The page shell is shared so the combined story is one `<main>`
// rather than three nested ones.
const TokensPage = ({ children }: { children: ReactNode }) => (
  <main className="bg-background-layout-page font-(family-name:--typography-font-family) text-foreground-on-page-default min-h-screen p-8">
    {children}
  </main>
);

const SemanticColorsSheet = () => (
  <div className="mx-auto max-w-7xl space-y-12">
    <header className="space-y-2">
      <h1 className="text-(length:--typography-font-size-display-s) font-(--typography-font-weight-bold)">
        DS v2 tokens
      </h1>
      <p className="text-(length:--typography-font-size-body-l) text-foreground-on-page-muted">
        Semantic colors supplied by every supported brand.
      </p>
    </header>

    {Object.entries(colorGroups).map(([group, tokens]) => (
      <Section key={group} title={group}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {tokens.map((token) => (
            <ColorSwatch key={token} token={token} />
          ))}
        </div>
      </Section>
    ))}
  </div>
);

const ComponentTokensSheet = () => (
  <div className="mx-auto max-w-5xl space-y-12">
    <Section title="Radius scale">
      <p className="text-(length:--typography-font-size-body-m) text-foreground-on-page-muted">
        Bridged into Tailwind as <code>rounded-base</code>, <code>rounded-offset4</code>, …
      </p>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {radiusScale.map((token) => (
          <div key={token} className="space-y-2">
            <div
              className="bg-background-layout-surface border-border-neutral-default flex h-24 items-center justify-center border"
              style={{ borderRadius: `var(${token})` }}
            >
              <span className="text-(length:--typography-font-size-label-s)">Preview</span>
            </div>
            <code className="text-(length:--typography-font-size-caption-m) text-foreground-on-page-muted wrap-break-word block">
              {token}
            </code>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Component aliases">
      <p className="text-(length:--typography-font-size-body-m) text-foreground-on-page-muted">
        Thin aliases onto <code>--radius-*</code> / <code>--border-*</code> for existing components.
      </p>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {componentTokens.map((token) => (
          <div key={token} className="space-y-2">
            <div
              className="bg-background-layout-surface border-border-neutral-default flex h-24 items-center justify-center border"
              style={{
                borderRadius: token.endsWith("radius") ? `var(${token})` : undefined,
                borderWidth: token.endsWith("border") ? `var(${token})` : undefined,
              }}
            >
              <span className="text-(length:--typography-font-size-label-s)">Preview</span>
            </div>
            <code className="text-(length:--typography-font-size-caption-m) text-foreground-on-page-muted wrap-break-word block">
              {token}
            </code>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

const TypographySheet = () => (
  <div className="mx-auto max-w-5xl">
    <Section title="Responsive typography">
      <div className="space-y-6">
        {typographySizes.map((size) => {
          const variable = `--typography-font-size-${size}`;

          return (
            <div
              key={size}
              className="border-border-neutral-subtle grid items-baseline gap-4 border-b pb-4 md:grid-cols-[12rem_1fr]"
            >
              <code className="text-(length:--typography-font-size-caption-m) text-foreground-on-page-muted">
                {variable}
              </code>
              <p style={{ fontSize: `var(${variable})` }}>The quick brown fox</p>
            </div>
          );
        })}
      </div>
    </Section>
  </div>
);

export const SemanticColors: Story = {
  render: () => (
    <TokensPage>
      <SemanticColorsSheet />
    </TokensPage>
  ),
};

export const ComponentTokens: Story = {
  render: () => (
    <TokensPage>
      <ComponentTokensSheet />
    </TokensPage>
  ),
};

export const Typography: Story = {
  render: () => (
    <TokensPage>
      <TypographySheet />
    </TokensPage>
  ),
};
