import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getAllComponentsDocs,
  getComponentDoc,
  getComponentDocsByPrefix,
  getPackageName,
  normalizeComponentKey,
  parseDocEntry,
  resolveComponentName,
} from "../lib/componentDocs";

const componentEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  props: z.array(z.string()),
  example: z.string(),
});

export function registerComponentTools(server: McpServer): void {
  server.registerResource(
    "all-uikit-docs",
    "uikit://docs/all",
    {
      title: "All Component Documentation",
      description: "Full JSON dump of all UIKit component documentation",
      mimeType: "application/json",
    },
    async (uri) => {
      const docs = await getAllComponentsDocs();
      return {
        contents: [
          { uri: uri.href, mimeType: "application/json", text: JSON.stringify(docs, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List all components in the B2Spin UIKit library",
      description: "List all available UI components that have documentation",
      inputSchema: {},
      outputSchema: { components: z.array(componentEntrySchema) },
    },
    async () => {
      const docs = await getAllComponentsDocs();
      const components = Object.entries(docs).map(([name, doc]) => parseDocEntry(name, doc));
      return {
        content: [{ type: "text", text: JSON.stringify(components, null, 2) }],
        structuredContent: { components },
      };
    },
  );

  server.registerTool(
    "get_component_doc",
    {
      title: "Get Patrianna UIKit Component Documentation",
      description:
        "Get documentation, props, and usage examples for a specific UI component from Patrianna UIKit library",
      inputSchema: {
        componentName: z
          .string()
          .describe(
            "The name of the component. Casing and separators are ignored, so " +
              "'ScrollArea', 'scrollArea' and 'scroll-area' all work.",
          ),
      },
      outputSchema: {
        documentation: z.string(),
        // Additive: `documentation` keeps meaning exactly what it did. These two say
        // which component was matched and how to import it, which is the second half
        // of the answer for a caller who did not know its exact spelling.
        componentName: z.string().optional(),
        importPath: z.string().optional(),
      },
    },
    async ({ componentName }) => {
      const resolved = await resolveComponentName(componentName);
      const doc = resolved ? await getComponentDoc(resolved.name) : null;

      if (resolved && doc) {
        const pkg = await getPackageName();
        const importPath = resolved.subpath ? `${pkg}/${resolved.subpath}` : undefined;

        // The import line leads, because the subpath is camelCase while the export is
        // PascalCase: a caller who had to be met halfway on the name cannot be expected
        // to guess the path either, and that path is the one thing here that has to be
        // spelled exactly right.
        const header = importPath ? `import { ${resolved.name} } from '${importPath}'\n\n` : "";

        return {
          content: [{ type: "text", text: header + doc }],
          structuredContent: { documentation: doc, componentName: resolved.name, importPath },
        };
      }

      const docs = await getAllComponentsDocs();
      const available = Object.keys(docs).filter((k) => docs[k]);

      // Substring matching over the normalised forms, so a near miss ("header",
      // "scroll_ar") lands on something rather than on an arbitrary first ten.
      const wanted = normalizeComponentKey(componentName);
      const near = available.filter((k) => {
        const key = normalizeComponentKey(k);
        return wanted.length > 0 && (key.includes(wanted) || wanted.includes(key));
      });

      const suggestion =
        near.length > 0
          ? `Did you mean: ${near.slice(0, 10).join(", ")}?`
          : `Available components: ${available.slice(0, 10).join(", ")}...`;

      return {
        content: [
          {
            type: "text",
            text:
              `Documentation for component '${componentName}' not found. ` +
              `Casing and separators are ignored, so this is not a spelling problem. ` +
              suggestion,
          },
        ],
        isError: true,
      };
    },
  );

  server.registerTool(
    "list_typography_variants",
    {
      title: "List All Typography Components",
      description:
        "Returns all Typography* components from the Patrianna UIKit with a short description each. Use this instead of calling get_component_doc for every typography component individually.",
      inputSchema: {},
      outputSchema: { components: z.array(componentEntrySchema) },
    },
    async () => {
      const components = await getComponentDocsByPrefix("Typography");
      return {
        content: [{ type: "text", text: JSON.stringify(components, null, 2) }],
        structuredContent: { components },
      };
    },
  );
}
