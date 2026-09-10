import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validateUsage } from "../lib/validate";

const MAX_ATTEMPTS = 5;

const fileInputSchema = z.object({
  path: z.string().describe("Relative file path, e.g. src/components/Card.tsx"),
  content: z.string().describe("Full source code of the file"),
});

const validationErrorSchema = z.object({
  message: z.string().describe("Human-readable description of the violation."),
  suggestedFix: z
    .string()
    .optional()
    .describe(
      "Short, copy-pasteable hint to apply directly. " +
        "Example: 'Replace \"text-red-500\" with text-primary or text-error.'",
    ),
});

const fileResultSchema = z.object({
  path: z.string().describe("The file path that was validated."),
  errors: z
    .array(validationErrorSchema)
    .describe("UIKit violations found in this file. Empty array means the file passed."),
});

export function registerValidateTool(server: McpServer): void {
  server.registerTool(
    "validate_usage",
    {
      title: "Validate UIKit Component and Token Usage",
      description:
        "Validates JSX/TSX files against UIKit conventions (imports, components, design tokens, " +
        "prop values), then optionally runs a lint command in the project root.\n\n" +
        "**BATCHING — call ONCE per task with ALL files in a single `files` array.** " +
        "Do NOT call once per file: `lintCommand` runs on every invocation, so per-file calls " +
        "multiply lint cost by N and waste attempts. Skip JSON and config files.\n\n" +
        "Start with attempt:1 and increment by 1 on each retry.\n\n" +
        "Output flags:\n" +
        "- `valid`: true iff every file passes UIKit checks AND lint passes (no errors at all).\n" +
        "- `lintPassed`: true iff the lint command succeeded (or was not requested). " +
        'Use this together with `valid` to tell "UIKit ok but lint failing" from "UIKit broken".\n' +
        "- `aborted`: true means MAX_ATTEMPTS was reached — STOP calling and report remaining issues.\n" +
        "- `attemptsRemaining`: how many calls you may still make before abort kicks in.\n" +
        "- `files[].errors`: per-file UIKit violations (hardcoded colors, raw text sizes, " +
        "unknown components, wrong imports, invalid prop values). " +
        "Each error has `message` and an optional `suggestedFix` you can apply directly.\n" +
        "- `lintErrors`: raw output lines from the lint command across the project.\n\n" +
        "Workflow: if `valid:false`, apply `suggestedFix` where given, fix every reported error, " +
        "then call again with attempt+1. If `aborted:true`, do NOT call again — report to the user.",
      inputSchema: {
        files: z
          .array(fileInputSchema)
          .describe(
            "ALL JSX/TSX files generated or edited in this task, batched into a single call. " +
              "One entry per file. Do NOT split across multiple invocations.",
          ),
        attempt: z
          .number()
          .int()
          .min(1)
          .describe("Current attempt number, starting at 1. Increment by 1 on each retry."),
        lintCwd: z
          .string()
          .optional()
          .describe(
            "Absolute path to the project root where the lint command should run. " +
              "Omit if files are not yet written to disk.",
          ),
        lintCommand: z
          .string()
          .optional()
          .describe(
            'Lint command to run (default: "pnpm lint"). E.g. "pnpm lint" or "npx eslint src"',
          ),
      },
      outputSchema: {
        valid: z
          .boolean()
          .describe(
            "TRUE only if every file passed UIKit checks AND lint passed. " +
              "When FALSE, fix the reported errors and call again.",
          ),
        lintPassed: z
          .boolean()
          .describe(
            "TRUE if the lint command succeeded or was not requested. " +
              'Lets you distinguish "UIKit clean but lint failing" from "UIKit violations".',
          ),
        aborted: z
          .boolean()
          .describe(
            "TRUE means MAX_ATTEMPTS was reached. STOP calling immediately and report " +
              "remaining issues to the user.",
          ),
        attemptsRemaining: z
          .number()
          .int()
          .describe(
            "How many more calls you may make before `aborted` becomes TRUE. " +
              `MAX_ATTEMPTS is ${MAX_ATTEMPTS}.`,
          ),
        files: z
          .array(fileResultSchema)
          .describe("Per-file UIKit validation results. Files with empty `errors` passed."),
        lintErrors: z
          .array(z.string())
          .describe("Raw output lines from the lint command. Empty array means lint passed."),
      },
    },
    async ({ files, attempt, lintCwd, lintCommand }) => {
      if (attempt > MAX_ATTEMPTS) {
        return {
          content: [
            {
              type: "text",
              text:
                `Validation aborted after ${MAX_ATTEMPTS} attempts. ` +
                `Stop fixing and report the remaining issues to the user.`,
            },
          ],
          structuredContent: {
            valid: false,
            lintPassed: false,
            aborted: true,
            attemptsRemaining: 0,
            files: [],
            lintErrors: [],
          },
        };
      }

      const {
        valid,
        lintPassed,
        files: results,
        lintErrors,
        summary,
      } = await validateUsage(files, lintCwd, lintCommand);

      const attemptsRemaining = MAX_ATTEMPTS - attempt;
      const footer = valid
        ? ""
        : attemptsRemaining > 0
          ? `\n\n${attemptsRemaining} attempt(s) remaining before abort.`
          : `\n\nThis was the last allowed attempt. Stop and report remaining issues to the user.`;

      return {
        content: [{ type: "text", text: summary + footer }],
        structuredContent: {
          valid,
          lintPassed,
          aborted: false,
          attemptsRemaining,
          files: results,
          lintErrors,
        },
      };
    },
  );
}
