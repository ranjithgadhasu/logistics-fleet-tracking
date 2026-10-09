/**
 * Converts this project to a 100% JavaScript setup.
 *
 *   node scripts/make-pure-js.mjs
 *
 * What it does:
 *  1. Replaces package.json with pure-js-setup/package.json
 *     (removes "typescript", "@types/*" and "vite-plugin-singlefile")
 *  2. Replaces vite.config.ts with pure-js-setup/vite.config.js
 *  3. Deletes any leftover tsconfig*.json files
 *
 * Afterwards run:  npm install   (or: rm -rf node_modules package-lock.json && npm install)
 */
import { copyFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = (f) => path.join(root, "pure-js-setup", f);
const to = (f) => path.join(root, f);

copyFileSync(from("package.json"), to("package.json"));
console.log("✔ package.json replaced (TypeScript packages removed)");

copyFileSync(from("vite.config.js"), to("vite.config.js"));
console.log("✔ vite.config.js created");

if (existsSync(to("vite.config.ts"))) {
  rmSync(to("vite.config.ts"));
  console.log("✔ vite.config.ts deleted");
}

for (const file of readdirSync(root)) {
  if (/^tsconfig.*\.json$/.test(file)) {
    rmSync(to(file));
    console.log(`✔ ${file} deleted`);
  }
}

console.log("\nDone! Now run:\n  rm -rf node_modules package-lock.json\n  npm install\n  npm run dev\n");
