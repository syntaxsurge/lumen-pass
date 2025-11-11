#!/usr/bin/env node
/*
 * CI-friendly build script.
 * - If the `stellar` CLI is available, builds Soroban contracts (nice to have locally).
 * - If not available (e.g. in GitHub Actions), skips contract build and proceeds to web build.
 */

const { spawnSync } = require("node:child_process");

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

// Allow opting out via env var
const skipContracts = process.env.SKIP_CONTRACTS === "1";

if (!skipContracts) {
  const which = spawnSync("sh", ["-lc", "command -v stellar >/dev/null 2>&1"]);
  if (which.status === 0) {
    console.log("==> Building Soroban contracts (stellar scaffold build)");
    run("stellar", ["scaffold", "build"]);
  } else {
    console.log("==> Skipping Soroban contracts build (stellar CLI not found)");
  }
}

console.log("==> Building web app (@lumen-pass/web)");
run("npm", ["run", "build", "--workspace=@lumen-pass/web"]);
