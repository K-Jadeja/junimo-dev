import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputRoot = path.resolve("artifacts/bulb-v4");

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
  await page.locator('.flexible-pixel-bulb[data-renderer="canvas"]').waitFor({ state: "attached", timeout: 3000 });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  return { context, page, bulb: page.locator(".flexible-pixel-bulb") };
}

async function capture(page, name) {
  const filename = `${name}.png`;
  await page.screenshot({ path: path.join(outputRoot, filename), fullPage: false, type: "png" });
  console.log(filename);
}

async function waitForBulbState(page, state, timeout = 10000) {
  await page.waitForFunction(
    (expected) => document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-state") === expected,
    state,
    { timeout },
  );
}

const desktop = await openPage({ width: 1440, height: 1000 });
await capture(desktop.page, "desktop-first-frame");
await desktop.page.waitForTimeout(180);
await capture(desktop.page, "desktop-slack-cord-180ms");
await desktop.page.locator('.flexible-pixel-bulb[data-taut="true"]').waitFor({ state: "attached", timeout: 10000 });
await capture(desktop.page, "desktop-taut-swing");
await waitForBulbState(desktop.page, "igniting");
await capture(desktop.page, "desktop-ignition");
await desktop.page.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 10000 });
await capture(desktop.page, "desktop-final-lit");
await desktop.page.locator(".flexible-pixel-bulb__toggle").click();
await desktop.page.waitForTimeout(240);
await capture(desktop.page, "desktop-dark-to-light-transition");
await desktop.page.locator('body[data-theme="light"]').waitFor({ state: "attached", timeout: 3000 });
await capture(desktop.page, "desktop-final-light-theme");
await desktop.page.locator(".flexible-pixel-bulb__toggle").click();
await desktop.page.waitForTimeout(240);
await capture(desktop.page, "desktop-light-to-dark-transition");
await desktop.page.locator('body[data-theme="dark"]').waitFor({ state: "attached", timeout: 3000 });
await desktop.page.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 3000 });
await capture(desktop.page, "desktop-final-dark-theme");
await desktop.context.close();

const mobile = await openPage({ width: 390, height: 844 });
await mobile.page.waitForTimeout(180);
await capture(mobile.page, "mobile-slack-cord-180ms");
await mobile.page.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 10000 });
await capture(mobile.page, "mobile-final-lit");
await mobile.context.close();

const reduced = await openPage({ width: 390, height: 844 }, "reduce");
await reduced.page.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 3000 });
await capture(reduced.page, "mobile-reduced-motion-final-lit");
await reduced.context.close();

await browser.close();
