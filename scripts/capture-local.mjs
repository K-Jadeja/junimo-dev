import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outputRoot = path.resolve("artifacts/local");
const routes = ["/", "/remalt", "/sushi", "/greenpost", "/project-doru"];
const viewports = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "1024", width: 1024, height: 900 },
  { name: "390", width: 390, height: 844 },
  { name: "360", width: 360, height: 780 },
];

const waitForMotion = async (page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(180, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 90));
    }
    for (const image of document.images) {
      image.scrollIntoView({ block: "center" });
      await new Promise((resolve) => window.setTimeout(resolve, 220));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => window.setTimeout(resolve, 240));
  });
};

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath, args: ["--disable-gpu", "--no-sandbox"] });
const results = [];

for (const route of routes) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const safeRoute = route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-|-$/g, "");
    const filename = `${safeRoute}-${viewport.name}.png`;
    const result = { route, viewport: viewport.name, filename, consoleErrors, pageErrors, status: "ok" };

    try {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      if (await page.locator(".flexible-pixel-bulb").count()) {
        await page.locator('.flexible-pixel-bulb[data-renderer="poster-dom"][data-entry="settled"]').waitFor({ state: "attached", timeout: 5000 });
      }
      await waitForMotion(page);
      result.httpStatus = response?.status();
      result.title = await page.title();
      result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      result.imageCount = await page.locator("img").count();
      result.imagesWithoutDimensions = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.getAttribute("width") && !image.getAttribute("height") && !image.getAttribute("style")?.includes("aspect-ratio")).length);
      if (viewport.name === "1440" || viewport.name === "390") {
        await page.screenshot({ path: path.join(outputRoot, `${safeRoute}-${viewport.name}-viewport.png`), fullPage: false, type: "png" });
      }
      await page.screenshot({ path: path.join(outputRoot, filename), fullPage: true, type: "png" });
    } catch (error) {
      result.status = "error";
      result.error = error instanceof Error ? error.message : String(error);
    } finally {
      await context.close();
    }

    results.push(result);
    console.log(`${result.status.toUpperCase()} ${route} ${viewport.name}${result.error ? ` — ${result.error}` : ""}`);
  }
}

await browser.close();
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(results, null, 2));
