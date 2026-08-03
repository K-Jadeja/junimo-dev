/** @type {import('next').NextConfig} */
const sushiBrowserRoutes = [
  "llm",
  "tts",
  "llm-tts",
  "stt",
  "stt-llm-tts",
  "astres",
  "classifier",
  "swarm",
];

const sushiIsolationHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return sushiBrowserRoutes.map((route) => ({
      source: `/sushi/${route}`,
      destination: `/sushi/${route}/index.html`,
    }));
  },
  async headers() {
    return [
      {
        source: "/sushi/assets/live2d/:path*",
        headers: sushiIsolationHeaders,
      },
      ...sushiBrowserRoutes.flatMap((route) => [
        {
          source: `/sushi/${route}`,
          headers: sushiIsolationHeaders,
        },
        {
          source: `/sushi/${route}/:path*`,
          headers: sushiIsolationHeaders,
        },
      ]),
    ];
  },
};

export default nextConfig;
