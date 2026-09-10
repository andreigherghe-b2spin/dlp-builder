# MCP Server

`@ui/web` ships a built-in [MCP](https://modelcontextprotocol.io/) server that exposes component documentation to AI coding assistants (Cursor, Claude Desktop, etc.).

## Tools

| Tool                         | Description                                                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_components`            | Lists all available UIKit components with one-line descriptions                                                                                                                                                                                |
| `get_component_doc`          | Returns full documentation, props, and usage examples for a specific component. `componentName` ignores casing and separators — `ScrollArea`, `scrollArea` and `scroll-area` all resolve — and the answer leads with the canonical import line |
| `list_typography_variants`   | Returns all `Typography*` components with description, props list, and usage example each. Use this instead of calling `get_component_doc` for every typography component individually                                                         |
| `get_animations`             | Returns all available keyframe animations (use as `animate-{name}`) and custom utilities: `animation-delay-{ms}`, `animation-count-{n\|infinite}`                                                                                              |
| `get_tailwind_theme_classes` | Returns all custom Tailwind classes from the UIKit theme (`config.css`): colors, fonts, radii, and utilities. Call this before writing classNames — never hard-code colours, radii, or fonts                                                   |
| `validate_usage`             | Validates generated `.tsx/.jsx` files against UIKit conventions (unknown components, invalid prop values, hardcoded tokens) and optionally runs a lint command. Pass `attempt` starting at 1; the tool aborts after 5 failed attempts          |

## Resource

| URI                | Description                                   |
| ------------------ | --------------------------------------------- |
| `uikit://docs/all` | Full JSON dump of all component documentation |

## Connecting to Cursor

Add the following to `.cursor/mcp.json` (project-level) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "patrianna-uikit": {
      "command": "node",
      "args": ["./node_modules/@ui/web/dist/mcp-server/server.js"]
    }
  }
}
```

## Connecting to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "patrianna-uikit": {
      "command": "node",
      "args": ["/absolute/path/to/node_modules/@ui/web/dist/mcp-server/server.js"]
    }
  }
}
```

## Running locally (dev)

```sh
pnpm -F @ui/web mcp:start        # run the server directly via tsx
pnpm -F @ui/web mcp:debug        # open MCP Inspector in the browser
```
