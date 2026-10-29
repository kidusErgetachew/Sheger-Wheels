import { resolve as pathResolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentURL = context.parentURL;
    if (parentURL && parentURL.startsWith("file:")) {
      const parentDir = pathResolve(fileURLToPath(parentURL), "..");
      const resolvedPath = pathResolve(parentDir, specifier);
      const candidates = [
        resolvedPath,
        resolvedPath + ".ts",
        resolvedPath + ".tsx",
        resolvedPath + ".js",
        resolvedPath + ".mjs",
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return {
            url: pathToFileURL(candidate).href,
            shortCircuit: true,
          };
        }
      }
    }
  }
  return nextResolve(specifier, context);
}
