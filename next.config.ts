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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.digitalax.xyz",
        pathname: "/ipfs/**",
      },
    ],

    unoptimized: true,
  },
  trailingSlash: true,
  async headers() {
    let headersConfig: any[] = [];

    const allowedOrigins = ["https://cdn.digitalax.xyz"];
    allowedOrigins.forEach((origin) => {
      headersConfig.push({
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: origin,
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Origin, X-Requested-With, Content-Type, Accept, Authorization",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
        ],
      });
    });

    return headersConfig;
  },
};

export default nextConfig;
