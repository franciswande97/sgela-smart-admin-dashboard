// -- /home/navho/.garage/projects/dash-navhocreatives-frontend/app/api/generate-types.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import openapiTS from "openapi-typescript";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Garbage Collection Logic ---
function markSchemas(pathsObj: any, componentsObj: any) {
  const usedSchemas = new Set<string>();

  // Recursively find $refs
  const scan = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.$ref && obj.$ref.startsWith("#/components/schemas/")) {
      usedSchemas.add(obj.$ref.split("/").pop()!);
    }
    Object.values(obj).forEach(scan);
  };

  // Mark all schemas referenced in API paths
  scan(pathsObj);

  // Deep trace: Find schemas referenced by other kept schemas
  let sizeBefore = 0;
  while (usedSchemas.size > sizeBefore) {
    sizeBefore = usedSchemas.size;
    for (const schemaName of Array.from(usedSchemas)) {
      scan(componentsObj.schemas?.[schemaName]);
    }
  }

  return usedSchemas;
}

function sanitizeTypeName(name: string): string {
  // Replace hyphens, spaces, dots, and other invalid characters with underscores
  return name.replace(/[^a-zA-Z0-9_$]/g, "_");
}

function resolveType(schemaObj: any): string {
  if (!schemaObj) return "void";
  if (schemaObj.$ref) {
    const name = schemaObj.$ref.split("/").pop();
    return `Schemas["${name}"]`;
  }
  if (schemaObj.type === "array" && schemaObj.items) {
    return `${resolveType(schemaObj.items)}[]`;
  }
  if (schemaObj.type === "string") return "string";
  if (schemaObj.type === "number" || schemaObj.type === "integer")
    return "number";
  if (schemaObj.type === "boolean") return "boolean";
  return "any";
}

async function main() {
  const baseUrl =
    process.env.VITE_API_BASE_URL || "https://dev-api-dashboard.navho.online";
  const url = `${baseUrl.replace(/\/$/, "")}/openapi.json`;
  const outPath = path.resolve(__dirname, "types.ts");

  console.log(`📡 Fetching schema from ${url}...`);
  const res = await fetch(url);
  const schema = await res.json();

  const originalPaths = schema.paths || {};

  // --- 2. Mark and Sweep (Pruning) ---
  const usedSchemas = markSchemas(originalPaths, schema.components || {});
  console.log(`🧹 Keeping ${usedSchemas.size} schemas. Pruning the rest...`);

  if (schema.components?.schemas) {
    Object.keys(schema.components.schemas).forEach((key) => {
      if (!usedSchemas.has(key)) {
        delete schema.components.schemas[key];
      }
    });
  }

  // Remove paths so the type generator ONLY outputs data models, keeping the file small
  delete schema.paths;

  // --- 3. Generate AST Base Types ---
  const ast = await openapiTS(schema, { exportType: true });
  const printer = ts.createPrinter();
  const sourceFile = ts.createSourceFile(
    "types.ts",
    "",
    ts.ScriptTarget.Latest,
  );

  let output = ast
    .map((node) =>
      printer.printNode(ts.EmitHint.Unspecified, node as any, sourceFile),
    )
    .join("\n");

  // --- 4. Generate SDK Functions ---
  let apiMethods = ``;
  let runtimeMap = `export const operationMap: Record<string, { path: string; method: string }> = {\n`;

  Object.entries(originalPaths).forEach(([pathKey, methods]: [string, any]) => {
    // 🔥 Skip generating fetch functions for WebSocket Server-to-Client payloads
    if (pathKey.startsWith("/socket.io/emit/")) return;

    Object.entries(methods).forEach(([method, op]: [string, any]) => {
      if (!op.operationId) return;
      const opId = op.operationId;

      const reqSchema = op.requestBody?.content?.["application/json"]?.schema;
      const reqType = reqSchema ? resolveType(reqSchema) : "void";

      const resSchema =
        op.responses?.["200"]?.content?.["application/json"]?.schema ||
        op.responses?.["201"]?.content?.["application/json"]?.schema;
      const resType = resSchema ? resolveType(resSchema) : "void";

      runtimeMap += `  "${opId}": { path: "${pathKey}", method: "${method.toUpperCase()}" },\n`;

      // Check if URL has path variables to merge into the payload interface
      const pathMatches = pathKey.match(/\{([^}]+)\}/g);
      let pathKeys: string[] = [];
      if (pathMatches) {
        pathKeys = pathMatches.map((m) => m.replace(/[{}]/g, ""));
      }

      let paramType = "void";
      if (reqType !== "void" && pathKeys.length > 0) {
        const pathTypeStr = `{ ${pathKeys.map((k) => `${k}: string | number`).join("; ")} }`;
        paramType = `(${reqType} & ${pathTypeStr})`;
      } else if (reqType !== "void") {
        paramType = reqType;
      } else if (pathKeys.length > 0) {
        paramType = `{ ${pathKeys.map((k) => `${k}: string | number`).join("; ")} }`;
      }

      // Generate the wrapper function
      if (paramType === "void") {
        apiMethods += `  ${opId}: (params?: undefined, token?: string): Promise<${resType}> => request<${resType}, any>("${opId}", params, token),\n`;
      } else {
        apiMethods += `  ${opId}: (params: ${paramType}, token?: string): Promise<${resType}> => request<${resType}, ${paramType}>("${opId}", params, token),\n`;
      }
    });
  });

  runtimeMap += `};\n`;

  // --- 5. Assemble Final Output ---
  const helperCode = `
/** --- AUTO-GENERATED API CLIENT --- */
export type Schemas = components["schemas"];

${Array.from(usedSchemas)
  .map((name) => `export type ${sanitizeTypeName(name)} = Schemas["${name}"];`)
  .join("\n")}

${runtimeMap}

import { request } from "./api-client";

export const api = {
${apiMethods}
} as const;
`;

  fs.writeFileSync(outPath, output + "\n" + helperCode, "utf-8");
  console.log(`✅ Success: Lean unified-argument client written to ${outPath}`);
}

main().catch(console.error);
