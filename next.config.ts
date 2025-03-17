import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.externals = [...(config.externals || []), {
      'playwright-core': 'commonjs playwright-core',
    }];
    return config;
  },
};

export default nextConfig;
