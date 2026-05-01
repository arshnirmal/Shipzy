import fs from "node:fs";
import path from "node:path";

describe("Route Hook Order Guard", () => {
  it("does not use onRequest authorize in modules that add preHandler authenticate", () => {
    const modulesDir = path.resolve(process.cwd(), "src/modules");
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

    const violations: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const routeFile = path.join(modulesDir, entry.name, `${entry.name}.routes.ts`);
      if (!fs.existsSync(routeFile)) continue;

      const content = fs.readFileSync(routeFile, "utf8");
      const hasPluginPreHandlerAuth =
        /addHook\(\s*["']preHandler["']\s*,\s*(?:fastify|app)\.authenticate\s*\)/.test(
          content,
        );
      const hasOnRequestAuthorize = /onRequest\s*:\s*\[\s*authorize\(/.test(
        content,
      );

      if (hasPluginPreHandlerAuth && hasOnRequestAuthorize) {
        violations.push(path.relative(process.cwd(), routeFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
