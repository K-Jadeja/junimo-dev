import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputRoot = path.resolve("artifacts/bulb-poster");

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

async function openPage(viewport, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator('.flexible-pixel-bulb[data-renderer="poster-dom"]').waitFor({ state: "attached", timeout: 3000 });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  return { context, page };
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(outputRoot, `${name}.png`), fullPage: false, type: "png" });
  console.log(`${name}.png`);
}

async function waitForEntry(page) {
  await page.locator('.flexible-pixel-bulb[data-entry="settled"]').waitFor({ state: "attached", timeout: 10000 });
}

async function waitForTheme(page, target) {
  await page.waitForFunction(
    (expected) => document.body.dataset.theme === expected && document.body.dataset.transitioning === "false",
    target,
    { timeout: 3000 },
  );
}

const desktop = await openPage({ width: 1440, height: 1000 });
await capture(desktop.page, "desktop-entrance");
await waitForEntry(desktop.page);
await capture(desktop.page, "desktop-final-dark");
await desktop.page.locator(".flexible-pixel-bulb__toggle").click();
await desktop.page.waitForTimeout(240);
await capture(desktop.page, "desktop-dark-to-light-transition");
await waitForTheme(desktop.page, "light");
await capture(desktop.page, "desktop-final-light");
await desktop.page.locator(".flexible-pixel-bulb__toggle").click();
await desktop.page.waitForTimeout(240);
await capture(desktop.page, "desktop-light-to-dark-transition");
await waitForTheme(desktop.page, "dark");
await capture(desktop.page, "desktop-final-dark-again");
await desktop.context.close();

const mobile = await openPage({ width: 390, height: 844 });
await mobile.page.waitForTimeout(180);
await capture(mobile.page, "mobile-entrance");
await waitForEntry(mobile.page);
await capture(mobile.page, "mobile-final-dark");
await mobile.context.close();

const reduced = await openPage({ width: 390, height: 844 }, "reduce");
await waitForEntry(reduced.page);
await capture(reduced.page, "mobile-reduced-motion-final-dark");
await reduced.context.close();

await browser.close();
