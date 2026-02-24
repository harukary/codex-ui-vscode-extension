"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const distNodeModules = path.join(distRoot, "node_modules");

const runtimeDeps = ["@iarna/toml", "shell-quote"];

function copyDependency(pkgName) {
  const pkgJsonPath = require.resolve(`${pkgName}/package.json`, {
    paths: [projectRoot],
  });
  const sourceDir = path.dirname(fs.realpathSync(pkgJsonPath));
  const targetDir = path.join(distNodeModules, pkgName);

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function main() {
  fs.mkdirSync(distNodeModules, { recursive: true });

  for (const dep of runtimeDeps) {
    copyDependency(dep);
  }

  console.log(
    `[vendor-runtime-deps] copied runtime deps into ${path.relative(projectRoot, distNodeModules)}`,
  );
}

main();
