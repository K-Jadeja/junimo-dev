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

const sushiLabHosts = ["sushi.junimo.dev", "localhost", "127.0.0.1"];

const sushiIsolationHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

const hostCondition = (host) => [{ type: "host", value: host }];

const sushiLabHostRewrites = sushiLabHosts.flatMap((host) => [
  ...sushiBrowserRoutes.flatMap((route) => [
    {
      source: `/${route}`,
      has: hostCondition(host),
      destination: `/sushi/${route}/index.html`,
    },
    {
      source: `/${route}/:path*`,
      has: hostCondition(host),
      destination: `/sushi/${route}/:path*`,
    },
  ]),
  {
    source: "/assets/:path*",
    has: hostCondition(host),
    destination: "/sushi/assets/:path*",
  },
]);

const sushiLabIndexRewrite = {
  source: "/",
  has: hostCondition("sushi.junimo.dev"),
  destination: "/sushi/index.html",
};

const sushiLabIndexHeader = {
  source: "/",
  has: hostCondition("sushi.junimo.dev"),
  headers: sushiIsolationHeaders,
};

const sushiLabHostHeaders = sushiLabHosts.flatMap((host) => [
  {
    source: "/assets/:path*",
    has: hostCondition(host),
    headers: sushiIsolationHeaders,
  },
  ...sushiBrowserRoutes.flatMap((route) => [
    {
      source: `/${route}`,
      has: hostCondition(host),
      headers: sushiIsolationHeaders,
    },
    {
      source: `/${route}/:path*`,
      has: hostCondition(host),
      headers: sushiIsolationHeaders,
    },
  ]),
]);

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [sushiLabIndexRewrite, ...sushiLabHostRewrites],
      afterFiles: [],
      fallback: sushiBrowserRoutes.map((route) => ({
        source: `/sushi/${route}`,
        destination: `/sushi/${route}/index.html`,
      })),
    };
  },
  async headers() {
    return [
      sushiLabIndexHeader,
      ...sushiLabHostHeaders,
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
