import type { NextConfig } from "next";

// API requests are proxied to the Spring Boot backend so the browser never needs CORS.
const backend = process.env.BACKEND_URL ?? "http://localhost:8080";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default config;
