import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Local development only: the browser always calls /api on the same
  // origin. In the Vercel Services deployment, /api/* is routed to FastAPI
  // and this rewrite is not used. Locally, developers run FastAPI separately
  // (http://127.0.0.1:8001 — port 8000 is reserved in this repo's dev env)
  // so copy the request there.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
