/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");

function resolveFromWorkspace(repoRoot, rel) {
  try {
    return require.resolve(rel, { paths: [repoRoot] });
  } catch {
    return require.resolve(rel, { paths: [path.resolve(repoRoot, "..")] });
  }
}

function copyVendor(repoRoot, sourceRel, destName, pkgName) {
  const src = resolveFromWorkspace(repoRoot, sourceRel);
  const destDir = path.resolve(__dirname, "../resources/vendor");
  const dest = path.join(destDir, destName);

  if (!fs.existsSync(src)) {
    throw new Error(`${pkgName} not found at ${src}. Run pnpm install.`);
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Prepared vendor: ${path.relative(repoRoot, dest)}`);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  copyVendor(
    repoRoot,
    path.join("markdown-it", "dist", "markdown-it.min.js"),
    "markdown-it.min.js",
    "markdown-it",
  );
  copyVendor(
    repoRoot,
    path.join("mermaid", "dist", "mermaid.min.js"),
    "mermaid.min.js",
    "mermaid",
  );
}

main();
