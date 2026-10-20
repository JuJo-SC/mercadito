import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Private listing photos are delivered directly after authorization, never optimized publicly.
  images: { localPatterns: [{ pathname: "/icons/**", search: "" }] },
  async headers() {
    return [
      {
        source: "/api/listings/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      { source: "/perfil", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
