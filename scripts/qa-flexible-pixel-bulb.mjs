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
  assert(await normalPage.locator(".replay, [data-replay]").count() === 0, "prototype replay control is still exposed");
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
      homeOverflowX: getComputedStyle(document.querySelector(".home-page")).overflowX,
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
  assert(normalState.homeOverflowX === "visible", `page still clips the swinging canvas: ${normalState.homeOverflowX}`);
  assert(normalState.highDpi, "v4 canvas did not scale to device pixel ratio");
  assert(!normalState.overflow, "homepage has horizontal overflow");
  assert(await normalPage.locator(".flexible-pixel-bulb__theme-canvas").count() === 1, "theme transition canvas is missing");

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

  await toggle.click();
  await normalPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await normalPage.locator('body[data-theme="light"]').waitFor({ state: "attached", timeout: 3000 });
  const lightThemeState = await normalPage.evaluate(() => ({
    theme: document.body.dataset.theme,
    transitioning: document.body.dataset.transitioning,
    state: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-state"),
    background: getComputedStyle(document.body).backgroundColor,
  }));
  assert(lightThemeState.theme === "light", `light theme did not apply: ${lightThemeState.theme}`);
  assert(lightThemeState.transitioning === "false", "light theme transition did not finish");
  assert(lightThemeState.state === "off", `bulb did not extinguish with light theme: ${lightThemeState.state}`);
  assert(lightThemeState.background === "rgb(243, 240, 232)", `light theme background is ${lightThemeState.background}`);

  await toggle.click();
  await normalPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await normalPage.locator('body[data-theme="dark"]').waitFor({ state: "attached", timeout: 3000 });
  await normalPage.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 3000 });
  const darkThemeState = await normalPage.evaluate(() => ({
    theme: document.body.dataset.theme,
    transitioning: document.body.dataset.transitioning,
    state: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-state"),
    background: getComputedStyle(document.body).backgroundColor,
  }));
  assert(darkThemeState.theme === "dark", `dark theme did not apply: ${darkThemeState.theme}`);
  assert(darkThemeState.transitioning === "false", "dark theme transition did not finish");
  assert(darkThemeState.state === "lit", `bulb did not reignite with dark theme: ${darkThemeState.state}`);
  assert(darkThemeState.background === "rgb(9, 10, 9)", `dark theme background is ${darkThemeState.background}`);

  assert(normalErrors.consoleErrors.length === 0, `normal-motion console errors: ${normalErrors.consoleErrors.join(" | ")}`);
  assert(normalErrors.pageErrors.length === 0, `normal-motion page errors: ${normalErrors.pageErrors.join(" | ")}`);
  await normalContext.close();

  const narrowContext = await browser.newContext({
    viewport: { width: 407, height: 373 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const narrowPage = await narrowContext.newPage();
  const narrowErrors = await collectErrors(narrowPage);
  await narrowPage.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
  await narrowPage.locator('.flexible-pixel-bulb[data-renderer="canvas"]').waitFor({ state: "attached", timeout: 3000 });
  const narrowOverflow = await narrowPage.evaluate(() => ({
    intro: getComputedStyle(document.querySelector(".home-intro")).overflowX,
    home: getComputedStyle(document.querySelector(".home-page")).overflowX,
    viewport: getComputedStyle(document.documentElement).overflowX,
  }));
  assert(narrowOverflow.intro === "visible", `narrow hero still clips the swing: ${narrowOverflow.intro}`);
  assert(narrowOverflow.home === "visible", `narrow page still clips the swing: ${narrowOverflow.home}`);
  assert(narrowOverflow.viewport === "clip", `narrow viewport overflow policy changed: ${narrowOverflow.viewport}`);
  assert(narrowErrors.consoleErrors.length === 0, `narrow-motion console errors: ${narrowErrors.consoleErrors.join(" | ")}`);
  assert(narrowErrors.pageErrors.length === 0, `narrow-motion page errors: ${narrowErrors.pageErrors.join(" | ")}`);
  await narrowContext.close();

  const initialLightContext = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const initialLightPage = await initialLightContext.newPage();
  const initialLightErrors = await collectErrors(initialLightPage);
  await initialLightPage.goto(`${baseUrl}/?theme=light`, { waitUntil: "networkidle", timeout: 30000 });
  await initialLightPage.locator('body[data-theme="light"]').waitFor({ state: "attached", timeout: 3000 });
  await initialLightPage.locator('.flexible-pixel-bulb[data-state="off"]').waitFor({ state: "attached", timeout: 3000 });
  assert(await initialLightPage.locator(".flexible-pixel-bulb__theme-canvas").count() === 1, "initial light theme canvas is missing");
  await initialLightPage.locator(".flexible-pixel-bulb__toggle").click();
  await initialLightPage.locator('body[data-theme="dark"]').waitFor({ state: "attached", timeout: 3000 });
  await initialLightPage.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 3000 });
  assert(initialLightErrors.consoleErrors.length === 0, `initial-light console errors: ${initialLightErrors.consoleErrors.join(" | ")}`);
  assert(initialLightErrors.pageErrors.length === 0, `initial-light page errors: ${initialLightErrors.pageErrors.join(" | ")}`);
  await initialLightContext.close();

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
  const reducedToggle = reducedPage.locator(".flexible-pixel-bulb__toggle");
  await reducedToggle.click();
  await reducedPage.locator('body[data-theme="light"]').waitFor({ state: "attached", timeout: 1000 });
  assert(await reducedPage.locator('.flexible-pixel-bulb[data-state="off"]').count() === 1, "reduced-motion light theme did not turn the bulb off");
  await reducedToggle.click();
  await reducedPage.locator('body[data-theme="dark"]').waitFor({ state: "attached", timeout: 1000 });
  await reducedPage.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 1000 });
  assert(await reducedPage.locator(".flexible-pixel-bulb__theme-canvas").count() === 1, "reduced-motion theme canvas is missing");
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
