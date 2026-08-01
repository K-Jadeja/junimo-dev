import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outputRoot = path.resolve("artifacts/design-lab");
const variants = ["a", "b", "c"];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

async function warmImages(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    await document.fonts.ready;
    for (const image of document.images) {
      image.scrollIntoView({ block: "center" });
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
  });
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath, args: ["--disable-gpu", "--no-sandbox"] });
const results = [];

for (const variant of variants) {
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
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const prefix = `design-lab-${variant}-${viewport.name}`;
    const result = { variant, viewport: viewport.name, status: "ok", consoleErrors, pageErrors };

    try {
      const response = await page.goto(`${baseUrl}/design-lab?variant=${variant}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await warmImages(page);
      result.httpStatus = response?.status();
      result.title = await page.title();
      result.scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      result.imageCount = await page.locator("img").count();
      result.imagesWithoutDimensions = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.getAttribute("width") && !image.getAttribute("height")).length);
      result.projectCount = await page.locator("text=Remalt").count();
      result.variantSwitchCount = await page.locator(".lab-header__variants a").count();

      await page.screenshot({ path: path.join(outputRoot, `${prefix}-full.png`), fullPage: true, type: "png" });
      if (viewport.name === "desktop") {
        await page.screenshot({ path: path.join(outputRoot, `${prefix}-viewport.png`), fullPage: false, type: "png" });
      }

      const controls = page.locator("button[aria-pressed]");
      result.interactiveControlCount = await controls.count();
      if (result.interactiveControlCount > 1) {
        await controls.nth(1).click();
        result.interactionChanged = await controls.nth(1).getAttribute("aria-pressed") === "true";
      }
    } catch (error) {
      result.status = "error";
      result.error = error instanceof Error ? error.message : String(error);
    } finally {
      await context.close();
    }

    results.push(result);
    console.log(`${result.status.toUpperCase()} ${variant} ${viewport.name}${result.error ? ` - ${result.error}` : ""}`);
  }
}

await browser.close();
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(results, null, 2));
