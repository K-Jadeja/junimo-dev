import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const demos = [
  { route: "/sushi/llm/", heading: "llm" },
  { route: "/sushi/tts/", heading: "text-to-speech" },
  { route: "/sushi/llm-tts/", heading: "llm + tts" },
  { route: "/sushi/stt/", heading: "speech-to-text" },
  { route: "/sushi/stt-llm-tts/", heading: "stt + llm + tts" },
  { route: "/sushi/astres/", heading: "astres" },
  { route: "/sushi/classifier/", heading: "classifier" },
  { route: "/sushi/swarm/", heading: "swarm" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  for (const demo of demos) {
    const response = await page.goto(`${baseUrl}${demo.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    assert(response?.status() === 200, `${demo.route} returned ${response?.status()}`);
    assert((await page.locator("h1").first().textContent())?.trim() === demo.heading, `${demo.route} heading is missing`);
    assert(await page.locator(".sushi-lab-nav").count() === 1, `${demo.route} Junimo lab navigation is missing`);
    assert(await page.locator('a[href="/sushi"]').count() >= 1, `${demo.route} Sushi return link is missing`);
    assert((await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(9, 10, 9)", `${demo.route} is not using the Junimo background`);
    assert(response.headers()["cross-origin-opener-policy"] === "same-origin", `${demo.route} is missing COOP`);
    assert(response.headers()["cross-origin-embedder-policy"] === "credentialless", `${demo.route} is missing COEP`);
  }

  const hostedDemos = [
    { route: "/", marker: "<h1>Sushi browser lab</h1>" },
    { route: "/llm", marker: '<base href="/llm/">' },
    { route: "/tts", marker: '<base href="/tts/">' },
    { route: "/llm-tts", marker: '<base href="/llm-tts/">' },
    { route: "/stt", marker: '<base href="/stt/">' },
    { route: "/stt-llm-tts", marker: '<base href="/stt-llm-tts/">' },
    { route: "/astres", marker: '<base href="/astres/">' },
    { route: "/classifier", marker: '<base href="/classifier/">' },
    { route: "/swarm", marker: '<base href="/swarm/">' },
  ];
  for (const demo of hostedDemos) {
    const response = await context.request.get(`${baseUrl}${demo.route}`, {
      headers: { host: "sushi.junimo.dev" },
    });
    const body = await response.text();
    assert(response.status() === 200, `sushi.junimo.dev${demo.route} returned ${response.status()}`);
    assert(body.includes(demo.marker), `sushi.junimo.dev${demo.route} did not resolve to the lab document`);
    assert(response.headers()["cross-origin-opener-policy"] === "same-origin", `sushi.junimo.dev${demo.route} is missing COOP`);
    assert(response.headers()["cross-origin-embedder-policy"] === "credentialless", `sushi.junimo.dev${demo.route} is missing COEP`);
  }

  const hostedAssetChecks = [
    "/assets/style.css",
    "/assets/junimo-sushi.css",
    "/tts/tts-client.js",
    "/tts/worker.js",
    "/llm-tts/avatar-stage.js",
    "/assets/live2d/avatar-direct.html",
  ];
  for (const asset of hostedAssetChecks) {
    const response = await context.request.get(`${baseUrl}${asset}`, {
      headers: { host: "sushi.junimo.dev" },
    });
    assert(response.status() === 200, `sushi.junimo.dev${asset} returned ${response.status()}`);
  }

  const portfolioRouteResponse = await context.request.get(`${baseUrl}/llm`, {
    headers: { host: "junimo.dev" },
  });
  assert(portfolioRouteResponse.status() === 404, "main junimo.dev must not expose the Sushi lab at /llm");

  const assetChecks = [
    "/sushi/tts/tts-client.js",
    "/sushi/tts/worker.js",
    "/sushi/tts/audio-worklet.js",
    "/sushi/llm/model-provider.js",
    "/sushi/llm/gemma4-runtime/index.html",
    "/sushi/llm-tts/avatar-stage.js",
    "/sushi/assets/live2d/avatar-direct.html",
    "/sushi/stt/stt-client.js",
    "/sushi/stt-llm-tts/joke.wav",
  ];
  for (const asset of assetChecks) {
    const assetResponse = await context.request.get(`${baseUrl}${asset}`);
    assert(assetResponse.status() === 200, `${asset} returned ${assetResponse.status()}`);
  }

  const llmTtsResponse = await page.goto(`${baseUrl}/sushi/llm-tts`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  assert(llmTtsResponse?.status() === 200, `LLM-TTS route returned ${llmTtsResponse?.status()}`);
  await page.waitForTimeout(2500);
  const avatarFrame = page.frames().find((frame) => frame.url().includes("/assets/live2d/avatar-direct.html"));
  assert(avatarFrame, "LLM-TTS Live2D avatar iframe was blocked or did not load");
  assert(await avatarFrame.locator("canvas").count() === 1, "LLM-TTS avatar canvas is missing");

  await context.close();
  console.log(JSON.stringify({
    status: "ok",
    routes: demos.map(({ route }) => route),
    hostedRoutes: hostedDemos.map(({ route }) => `https://sushi.junimo.dev${route}`),
    checks: ["200 responses", "Junimo navigation", "dark branded shell", "COOP/COEP", "TTS and LLM-TTS runtime assets"],
    runtime: "model downloads and microphone/audio inference were not started",
  }, null, 2));
} finally {
  await browser.close();
}
