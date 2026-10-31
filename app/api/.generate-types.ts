// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/api/generate-types.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import openapiTS from "openapi-typescript";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const url = "http://localhost:5463/openapi.json";
  const outPath = path.resolve(__dirname, "types.ts");

  console.log(`📡 Fetching schema from ${url}...`);

  const res = await fetch(url);
  const schema = await res.json();

  const ast = await openapiTS(schema, { exportType: true });
  const printer = ts.createPrinter();
  const sourceFile = ts.createSourceFile(
    "types.ts",
    "",
    ts.ScriptTarget.Latest,
  );

  let output = ast
    .map((node) => printer.printNode(ts.EmitHint.Unspecified, node, sourceFile))
    .join("\n");

  // Build the API proxy methods safely
  const apiMethods = Object.entries(schema.paths || {})
    .map(([pathKey, methods]: [string, any]) => {
      return Object.entries(methods)
        .map(([method, op]: [string, any]) => {
          if (!op.operationId) return "";
          const opId = op.operationId;
          // body: if it exists in schema, use it; otherwise use 'any' to allow 'undefined' for GET-like POSTs
          return (
            "  " +
            opId +
            ": (body: any, token?: string) => baseApi('" +
            pathKey +
            "', '" +
            method +
            "', body, token),"
          );
        })
        .join("\n");
    })
    .join("\n");

  const helperCode = `
/** * --- AUTO-GENERATED API CLIENT --- */
export type Schemas = components["schemas"];

${Object.keys(schema.components?.schemas || {})
  .map((name) => "export type " + name + " = Schemas['" + name + "'];")
  .join("\n")}

import { api as baseApi } from "./api-client";

export const api = {
${apiMethods}
} as const;
`;

  fs.writeFileSync(outPath, output + helperCode, "utf-8");
  console.log(`✅ Success: Token-aware client written to ${outPath}`);
}

main().catch(console.error);
