import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function collectErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

try {
  const normalContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });
  const normalPage = await normalContext.newPage();
  const normalErrors = await collectErrors(normalPage);
  await normalPage.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });

  const bulb = normalPage.locator('.flexible-pixel-bulb[data-renderer="canvas"]');
  await bulb.waitFor({ state: "attached", timeout: 3000 });
  const earlyState = await bulb.getAttribute("data-state");
  assert(["waiting", "igniting", "lit"].includes(earlyState ?? ""), `unexpected initial bulb state: ${earlyState}`);
  assert(await normalPage.locator(".flexible-pixel-bulb__canvas").count() === 1, "v4 canvas is missing");
  assert(await normalPage.locator(".flexible-pixel-bulb__dots, .flexible-pixel-bulb__assembly").count() === 0, "legacy bulb DOM remains");

  await normalPage.locator('.flexible-pixel-bulb[data-taut="true"]').waitFor({ state: "attached", timeout: 10000 });
  await normalPage.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 10000 });
  const normalState = await normalPage.evaluate(() => {
    const canvas = document.querySelector(".flexible-pixel-bulb__canvas");
    const wrapper = document.querySelector(".flexible-pixel-bulb");
    if (!(canvas instanceof HTMLCanvasElement) || !wrapper) throw new Error("v4 bulb DOM is incomplete");

    const rect = canvas.getBoundingClientRect();
    return {
      renderer: wrapper.getAttribute("data-renderer"),
      effect: wrapper.getAttribute("data-effect"),
      state: wrapper.getAttribute("data-state"),
      taut: wrapper.getAttribute("data-taut"),
      introOverflowX: getComputedStyle(document.querySelector(".home-intro")).overflowX,
      cssWidth: rect.width,
      cssHeight: rect.height,
      drawingWidth: canvas.width,
      drawingHeight: canvas.height,
      highDpi: canvas.width >= Math.floor(rect.width * 2) && canvas.height >= Math.floor(rect.height * 2),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  assert(normalState.renderer === "canvas", `renderer is ${normalState.renderer}`);
  assert(normalState.effect === "flexible-pixel-v4", `effect is ${normalState.effect}`);
  assert(normalState.state === "lit", `bulb did not settle and ignite: ${normalState.state}`);
  assert(normalState.taut === "true", "rope never reached its taut state");
  assert(normalState.introOverflowX === "visible", `hero still clips the swinging canvas: ${normalState.introOverflowX}`);
  assert(normalState.highDpi, "v4 canvas did not scale to device pixel ratio");
  assert(!normalState.overflow, "homepage has horizontal overflow");

  const toggle = normalPage.locator(".flexible-pixel-bulb__toggle");
  const box = await toggle.boundingBox();
  assert(box, "bulb pointer target is missing");
  await normalPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await normalPage.mouse.down();
  await normalPage.mouse.move(box.x + box.width / 2 - 24, box.y + box.height / 2 + 18);
  await normalPage.waitForTimeout(40);
  assert(await toggle.getAttribute("data-dragging") === "true", "bulb drag interaction did not engage");
  await normalPage.mouse.up();
  assert(await toggle.getAttribute("data-dragging") === "false", "bulb drag interaction did not release");

  assert(normalErrors.consoleErrors.length === 0, `normal-motion console errors: ${normalErrors.consoleErrors.join(" | ")}`);
  assert(normalErrors.pageErrors.length === 0, `normal-motion page errors: ${normalErrors.pageErrors.join(" | ")}`);
  await normalContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  const reducedErrors = await collectErrors(reducedPage);
  await reducedPage.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
  const reducedBulb = reducedPage.locator('.flexible-pixel-bulb[data-renderer="canvas"][data-state="lit"]');
  await reducedBulb.waitFor({ state: "attached", timeout: 3000 });
  assert(await reducedPage.locator('.flexible-pixel-bulb[data-taut="false"]').count() === 1, "reduced-motion rope should remain the fixed straight anchor path");
  assert(reducedErrors.consoleErrors.length === 0, `reduced-motion console errors: ${reducedErrors.consoleErrors.join(" | ")}`);
  assert(reducedErrors.pageErrors.length === 0, `reduced-motion page errors: ${reducedErrors.pageErrors.join(" | ")}`);
  await reducedContext.close();

  console.log(JSON.stringify({
    status: "ok",
    normal: normalState,
    pointer: "drag-and-release",
    reducedMotion: "lit-without-physics-drop",
  }, null, 2));
} finally {
  await browser.close();
}
