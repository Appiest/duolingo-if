import type { NextConfig } from "next";

// Set by the GitHub Pages workflow, which serves the deck from appiest.github.io/duolingo-if/present.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The /script page saves through a *.dev.ts route, which a static export cannot serve.
  pageExtensions: basePath ? ["tsx", "ts"] : ["tsx", "ts", "dev.ts"],
  ...(basePath && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
