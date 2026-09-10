import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerComponentTools } from "./tools/components";
import { registerThemeTools } from "./tools/theme";
import { registerValidateTool } from "./tools/validate";

const server = new McpServer({
  name: "uikit-mcp",
  version: "0.0.2",
});

// tools: list_components, get_component_doc, list_typography_variants | resource: uikit://docs/all
registerComponentTools(server);
// tools: get_animations, get_tailwind_theme_classes
registerThemeTools(server);
// tools: validate_usage
registerValidateTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
