import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@aztec/bb.js",
    "@noir-lang/noir_js",
    "@semaphore-protocol/core",
    "poseidon-lite",
    "@noble/curves",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
