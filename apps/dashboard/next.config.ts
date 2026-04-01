import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repoRootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../..", ".env");
loadEnv({ path: repoRootEnv });

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/types", "@repo/db"],
};

export default nextConfig;
