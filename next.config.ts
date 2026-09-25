import type { NextConfig } from "next";

const lan = ["192.168.1.84", "192.168.*.*", "10.*.*.*", "172.*.*.*"];

const nextConfig: NextConfig = {
  allowedDevOrigins: lan,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: lan,
    },
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
