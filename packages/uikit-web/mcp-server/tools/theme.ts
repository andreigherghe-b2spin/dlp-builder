import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getAnimationsMeta,
  getThemeClassesMeta,
  formatAnimationsText,
  formatThemeClassesText,
} from "../lib/themeClasses";

export function registerThemeTools(server: McpServer): void {
  server.registerTool(
    "get_animations",
    {
      title: "Get Available CSS Animations",
      description:
        "Returns UIKit keyframe animations (use as animate-{name}) and custom utilities: animation-delay-{ms}, animation-count-{n|infinite}.",
      inputSchema: {},
      outputSchema: {
        keyframes: z.array(z.string()),
        utilities: z.array(z.object({ pattern: z.string(), cssProperty: z.string() })),
      },
    },
    async () => {
      const meta = await getAnimationsMeta();
      return {
        content: [{ type: "text", text: formatAnimationsText(meta) }],
        structuredContent: { keyframes: meta.keyframes, utilities: meta.utilities },
      };
    },
  );

  server.registerTool(
    "get_tailwind_theme_classes",
    {
      title: "Get Design System Tailwind Theme Classes",
      description:
        "Returns all custom Tailwind classes from the UIKit theme (config.css). " +
        "Call this before writing classNames — never hard-code colours, radii, or fonts. " +
        "Colors: bg-{t}/text-{t}/border-{t}/ring-{t}/fill-{t}/etc. Fonts: font-{t}. Radii: rounded-{t}.",
      inputSchema: {},
      outputSchema: {
        colors: z.array(z.string()),
        fonts: z.array(z.string()),
        radii: z.array(z.string()),
        utilities: z.array(z.string()),
      },
    },
    async () => {
      const meta = await getThemeClassesMeta();
      return {
        content: [{ type: "text", text: formatThemeClassesText(meta) }],
        structuredContent: {
          colors: meta.colors,
          fonts: meta.fonts,
          radii: meta.radii,
          utilities: meta.utilities,
        },
      };
    },
  );
}
