#!/usr/bin/env node
/**
 * API Auditor (Fastify + Zod + Prisma)
 *
 * Purpose:
 * - Perform lightweight, repo-local checks to keep the code aligned with:
 *   - `.gemini/skills/api-auditor/architecture.md`
 *   - `.gemini/skills/api-auditor/typescript.md`
 *
 * Notes:
 * - This is a heuristic linter (regex-based). It intentionally avoids adding deps.
 * - It exits with code 1 when it finds any "error" findings.
 *
 * Usage:
 *   node .gemini/skills/api-auditor/scripts/audit.js
 *   node .gemini/skills/api-auditor/scripts/audit.js --json
 *   node .gemini/skills/api-auditor/scripts/audit.js --root C:\\path\\to\\repo
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

/**
 * @typedef {"error" | "warn"} Severity
 *
 * @typedef Finding
 * @property {string} file
 * @property {string} ruleId
 * @property {Severity} severity
 * @property {string} message
 */

const args = parseArgs({
  options: {
    root: { type: "string" },
    json: { type: "boolean", default: false },
    quiet: { type: "boolean", default: false },
  },
});

const repoRoot = path.resolve(args.values.root ?? process.cwd());

/**
 * @param {string} filepath
 */
const readText = async (filepath) => readFile(filepath, "utf8");

/**
 * Minimal recursive walk limited to `src/`, skipping noisy dirs.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const walk = async (dir) => {
  /** @type {string[]} */
  const results = [];

  // Lazy import to avoid top-level import in case Node is constrained.
  const { readdir } = await import("node:fs/promises");

  /** @type {Array<{ dir: string }>} */
  const stack = [{ dir }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    const entries = await readdir(current.dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      if (entry.name === "dist") continue;
      if (entry.name === "generated") continue;
      if (entry.name.startsWith(".")) continue;

      const full = path.join(current.dir, entry.name);
      if (entry.isDirectory()) {
        stack.push({ dir: full });
        continue;
      }
      results.push(full);
    }
  }
  return results;
};

/**
 * @param {string} filepath
 */
const toRepoRel = (filepath) =>
  path.relative(repoRoot, filepath).replaceAll("\\", "/");

/**
 * @param {Finding[]} findings
 * @param {Finding} finding
 */
const addFinding = (findings, finding) => {
  findings.push({ ...finding, file: finding.file.replaceAll("\\", "/") });
};

/**
 * @param {string} filename
 */
const isKebabCaseTsFile = (filename) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/i.test(filename);

/**
 * @param {string} file
 * @param {string} content
 * @param {Finding[]} findings
 */
const runTypeScriptStyleChecks = (file, content, findings) => {
  if (!file.endsWith(".ts")) return;
  if (file.replaceAll("\\", "/").includes("/src/generated/")) return;

  if (/\bexport\s+default\b/.test(content)) {
    addFinding(findings, {
      file,
      ruleId: "ts.no_default_export",
      severity: "warn",
      message: "Evite `export default`; prefira named exports.",
    });
  }

  if (
    /\bany\b/.test(content) ||
    /\bas\s+any\b/.test(content) ||
    /<\s*any\s*>/.test(content)
  ) {
    addFinding(findings, {
      file,
      ruleId: "ts.no_any",
      severity: "error",
      message: "Encontrado uso de `any` (regra: nunca use `any`).",
    });
  }
};

/**
 * @param {string} file
 * @param {string} content
 * @param {Finding[]} findings
 */
const runRouteChecks = (file, content, findings) => {
  if (!file.endsWith(".ts")) return;

  const posixFile = file.replaceAll("\\", "/");
  const isRoutesDir = posixFile.includes("/src/routes/");
  const isIndex = posixFile.endsWith("/src/index.ts");
  if (!isRoutesDir && !isIndex) return;

  const base = path.basename(file);
  if (isRoutesDir && !isKebabCaseTsFile(base)) {
    addFinding(findings, {
      file,
      ruleId: "route.filename_kebab_case",
      severity: "warn",
      message: `Nome de arquivo fora de kebab-case: \`${base}\`.`,
    });
  }

  const hasRouteDefinition = /\.route\s*\(\s*{/.test(content);
  if (!hasRouteDefinition) return;

  if (isIndex) {
    addFinding(findings, {
      file,
      ruleId: "route.location",
      severity: "warn",
      message:
        "Evite definir rotas diretamente em `src/index.ts`; mova para `src/routes/*` e registre no app.",
    });
  }

  const hasTypeProvider = /withTypeProvider\s*<\s*ZodTypeProvider\s*>/.test(
    content,
  );
  if (!hasTypeProvider) {
    addFinding(findings, {
      file,
      ruleId: "route.zod_type_provider",
      severity: "error",
      message: "Rota não usa `withTypeProvider<ZodTypeProvider>()`.",
    });
  }

  const hasSchema = /\bschema\s*:\s*{/.test(content);
  if (!hasSchema) {
    addFinding(findings, {
      file,
      ruleId: "route.schema_present",
      severity: "error",
      message: "Rota sem `schema` (Swagger/OpenAPI + validação).",
    });
    return;
  }

  const hasHideTrue = /\bhide\s*:\s*true\b/.test(content);
  const hasTags = /\btags\s*:\s*\[/.test(content);
  const hasSummary = /\bsummary\s*:\s*["'`]/.test(content);
  if (!hasHideTrue && (!hasTags || !hasSummary)) {
    addFinding(findings, {
      file,
      ruleId: "route.swagger_tags_summary",
      severity: "error",
      message:
        "Schema da rota deve incluir `tags` e `summary` para documentação.",
    });
  }

  if (isRoutesDir) {
    const importsUsecase = /from\s+["']\.\.\/usecases\//.test(content);
    const callsExecute = /\.execute\s*\(/.test(content);
    if (!importsUsecase || !callsExecute) {
      addFinding(findings, {
        file,
        ruleId: "route.calls_usecase",
        severity: "warn",
        message:
          "Rota deveria instanciar e chamar um use case (ex.: `new X().execute(...)`).",
      });
    }

    const hasTryCatch = /\btry\s*{[\s\S]*}\s*catch\s*\(/.test(content);
    if (!hasTryCatch) {
      addFinding(findings, {
        file,
        ruleId: "route.handles_errors",
        severity: "warn",
        message: "Rota deveria tratar erros do use case com `try/catch`.",
      });
    }
  }

  // Common bug: send 404 then fall through and also send 500.
  const hasNotFoundBranchWithoutReturn =
    /if\s*\(\s*error\s+instanceof\s+NotFoundError\s*\)\s*{[\s\S]*?reply\.status\s*\(\s*404\s*\)\.send\s*\([\s\S]*?}\s*[\r\n]+\s*reply\.status\s*\(\s*500\s*\)\.send\s*\(/m.test(
      content,
    );
  if (hasNotFoundBranchWithoutReturn) {
    addFinding(findings, {
      file,
      ruleId: "route.not_found_return",
      severity: "warn",
      message:
        "No `catch`, após responder 404 para `NotFoundError`, faça `return` para não cair no 500.",
    });
  }

  const usesSession = /auth\.api\.getSession\s*\(/.test(content);
  if (usesSession) {
    const usesFromNodeHeaders =
      /fromNodeHeaders\s*\(\s*request\.headers\s*\)/.test(content);
    if (!usesFromNodeHeaders) {
      addFinding(findings, {
        file,
        ruleId: "route.auth_from_node_headers",
        severity: "error",
        message:
          "Ao usar `auth.api.getSession`, use `fromNodeHeaders(request.headers)`.",
      });
    }
  }
};

/**
 * @param {string} file
 * @param {string} content
 * @param {Finding[]} findings
 */
const runUseCaseChecks = (file, content, findings) => {
  if (!file.replaceAll("\\", "/").includes("/src/usecases/")) return;
  if (!file.endsWith(".ts")) return;

  const hasClass = /\bclass\s+[A-Z][A-Za-z0-9]*\b/.test(content);
  const hasExecute = /\bexecute\s*\(/.test(content);
  if (!hasClass || !hasExecute) {
    addFinding(findings, {
      file,
      ruleId: "usecase.class_execute",
      severity: "error",
      message: "Use case deve ser uma classe com método `execute`.",
    });
  }

  const exportsClassDirectly = /\bexport\s+class\s+[A-Z][A-Za-z0-9]*\b/.test(
    content,
  );
  if (!exportsClassDirectly) {
    addFinding(findings, {
      file,
      ruleId: "usecase.export_class",
      severity: "warn",
      message: "Prefira `export class X` (named export direto) para use cases.",
    });
  }

  const hasInputDto = /\binterface\s+InputDto\b/.test(content);
  const hasOutputDto = /\binterface\s+OutputDto\b/.test(content);
  if (!hasInputDto || !hasOutputDto) {
    addFinding(findings, {
      file,
      ruleId: "usecase.dtos",
      severity: "error",
      message:
        "Use case deve declarar `interface InputDto` e `interface OutputDto` no mesmo arquivo.",
    });
  }

  const executeTyped =
    /\bexecute\s*\(\s*\w+\s*:\s*InputDto\s*\)\s*:\s*Promise\s*<\s*OutputDto\s*>/m.test(
      content,
    );
  if (!executeTyped) {
    addFinding(findings, {
      file,
      ruleId: "usecase.execute_typed",
      severity: "warn",
      message:
        "Tipar `execute(dto: InputDto): Promise<OutputDto>` (evita retorno do Prisma model).",
    });
  }

  if (/\bcatch\s*\(/.test(content)) {
    addFinding(findings, {
      file,
      ruleId: "usecase.no_error_handling",
      severity: "warn",
      message:
        "Use case não deve tratar erros com `try/catch`; a rota é responsável.",
    });
  }

  if (/\bthrow\s+new\s+Error\s*\(/.test(content)) {
    addFinding(findings, {
      file,
      ruleId: "usecase.custom_errors",
      severity: "warn",
      message:
        "Prefira lançar erros customizados de `src/errors/index.ts` em vez de `new Error(...)`.",
    });
  }

  const returnsPrismaDirectly =
    /\breturn\s+prisma\.\w+/.test(content) ||
    /\breturn\s+tx\.\w+/.test(content);
  if (returnsPrismaDirectly) {
    addFinding(findings, {
      file,
      ruleId: "usecase.no_prisma_return",
      severity: "warn",
      message:
        "Use case não deve retornar Prisma model diretamente; mapeie para `OutputDto`.",
    });
  }

  // Heuristic: `const result = await prisma/tx...` followed by `return result;`
  const resultIsPrisma =
    /\bconst\s+result\s*=\s*await\s+(?:prisma|tx)\.\w+/m.test(content) &&
    /\breturn\s+result\s*;/m.test(content);
  if (resultIsPrisma) {
    addFinding(findings, {
      file,
      ruleId: "usecase.no_prisma_result_return",
      severity: "warn",
      message:
        "Evite `return result;` quando `result` vem do Prisma; mapeie para `OutputDto`.",
    });
  }
};

/**
 * @param {string} file
 * @param {string} content
 * @param {Finding[]} findings
 */
const runSchemaChecks = (file, content, findings) => {
  const rel = toRepoRel(file);
  if (rel !== "src/schemas/index.ts") return;

  if (!/\bexport\s+const\s+ErrorSchema\b/.test(content)) {
    addFinding(findings, {
      file,
      ruleId: "schema.error_schema",
      severity: "warn",
      message:
        "Esperado `export const ErrorSchema = ...` para respostas de erro.",
    });
  }

  // Architecture.md suggests using `z.enum(WeekDay)` imported from generated enums.
  const hasEnum = /\bz\.enum\s*\(/.test(content);
  if (hasEnum && /\bWeekday\b/.test(content) && !/\bWeekDay\b/.test(content)) {
    addFinding(findings, {
      file,
      ruleId: "schema.weekday_enum_name",
      severity: "warn",
      message:
        "Confira enum de dia da semana: arquitetura sugere `WeekDay` (evite divergência como `Weekday`).",
    });
  }
};

/**
 * @param {string} content
 */
const getLineCounts = (content) => content.split(/\r?\n/).length;

const main = async () => {
  const srcDir = path.join(repoRoot, "src");
  /** @type {Finding[]} */
  const findings = [];

  let files = [];
  try {
    files = await walk(srcDir);
  } catch (error) {
    if (!args.values.quiet) {
      console.error(`Failed to scan src/: ${String(error)}`);
    }
    process.exitCode = 2;
    return;
  }

  for (const file of files) {
    if (!file.endsWith(".ts")) continue;

    const content = await readText(file);
    if (getLineCounts(content) > 25_000) continue;

    runTypeScriptStyleChecks(file, content, findings);
    runRouteChecks(file, content, findings);
    runUseCaseChecks(file, content, findings);
    runSchemaChecks(file, content, findings);
  }

  const errors = findings.filter((f) => f.severity === "error");

  if (args.values.json) {
    console.log(JSON.stringify({ root: repoRoot, findings }, null, 2));
  } else if (!args.values.quiet) {
    const grouped = new Map();
    for (const finding of findings) {
      const key = toRepoRel(finding.file);
      const list = grouped.get(key) ?? [];
      list.push(finding);
      grouped.set(key, list);
    }

    console.log(`API Auditor (${toRepoRel(repoRoot) || "."})`);

    console.log(
      `Findings: ${findings.length} (errors: ${errors.length}, warnings: ${findings.length - errors.length})`,
    );

    for (const [file, list] of [...grouped.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      console.log(`\n- ${file}`);
      for (const f of list.sort((x, y) => x.ruleId.localeCompare(y.ruleId))) {
        console.log(`  - [${f.severity}] ${f.ruleId}: ${f.message}`);
      }
    }
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
};

await main();
