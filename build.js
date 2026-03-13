#!/usr/bin/env node

import { execSync } from "child_process";

console.log("🔨 Starting build process...");
console.log("Node version:", process.version);

try {
  console.log("\n📦 Installing dependencies...");
  execSync("npm install --legacy-peer-deps", { stdio: "inherit" });

  console.log("\n🏗️  Building application...");
  execSync("npm run build", { stdio: "inherit" });

  console.log("\n✅ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Build failed:", error.message);
  process.exit(1);
}
