// Resolve the application's TypeScript path aliases for maintenance and integration checks.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const path = resolve(specifier.slice(2));
    for (const suffix of [".ts", ".tsx", ".js", "/index.ts"]) if (existsSync(path + suffix)) return nextResolve(pathToFileURL(path + suffix).href, context);
  }
  return nextResolve(specifier, context);
} });
