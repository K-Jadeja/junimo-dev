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

async function triggerThemeToggle(page) {
  await page.evaluate(() => {
    const toggle = document.querySelector(".flexible-pixel-bulb__toggle");
    if (!(toggle instanceof HTMLButtonElement)) throw new Error("bulb theme toggle is missing");
    toggle.click();
  });
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
    const ambientCanvas = document.querySelector(".flexible-pixel-bulb__theme-canvas");
    const ambientRect = ambientCanvas?.getBoundingClientRect();
    const toggleRect = document.querySelector(".flexible-pixel-bulb__toggle")?.getBoundingClientRect();
    const ambientContext = ambientCanvas instanceof HTMLCanvasElement ? ambientCanvas.getContext("2d") : null;
    const ambientDpr = ambientCanvas instanceof HTMLCanvasElement ? ambientCanvas.width / innerWidth : 1;
    const ambientCenterX = toggleRect ? Math.round((toggleRect.left + toggleRect.width * 0.5) * ambientDpr) : 0;
    const ambientCenterY = toggleRect ? Math.round((toggleRect.top + toggleRect.height * 0.5) * ambientDpr) : 0;
    const ambientFarX = Math.min((ambientCanvas instanceof HTMLCanvasElement ? ambientCanvas.width : 1) - 1, ambientCenterX + Math.round(140 * ambientDpr));
    const ambientCenterPixel = ambientContext ? Array.from(ambientContext.getImageData(ambientCenterX, ambientCenterY, 1, 1).data) : [];
    const ambientFarPixel = ambientContext ? Array.from(ambientContext.getImageData(ambientFarX, ambientCenterY, 1, 1).data) : [];
    return {
      renderer: wrapper.getAttribute("data-renderer"),
      effect: wrapper.getAttribute("data-effect"),
      state: wrapper.getAttribute("data-state"),
      taut: wrapper.getAttribute("data-taut"),
      bulbPalette: wrapper.getAttribute("data-bulb-palette"),
      introOverflowX: getComputedStyle(document.querySelector(".home-intro")).overflowX,
      homeOverflowX: getComputedStyle(document.querySelector(".home-page")).overflowX,
      cssWidth: rect.width,
      cssHeight: rect.height,
      drawingWidth: canvas.width,
      drawingHeight: canvas.height,
      highDpi: canvas.width >= Math.floor(rect.width * 2) && canvas.height >= Math.floor(rect.height * 2),
      ambientCssWidth: ambientRect?.width ?? 0,
      ambientCssHeight: ambientRect?.height ?? 0,
      ambientDrawingWidth: ambientCanvas instanceof HTMLCanvasElement ? ambientCanvas.width : 0,
      ambientDrawingHeight: ambientCanvas instanceof HTMLCanvasElement ? ambientCanvas.height : 0,
      ambientCenterPixel,
      ambientFarPixel,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  assert(normalState.renderer === "canvas", `renderer is ${normalState.renderer}`);
  assert(normalState.effect === "flexible-pixel-v4", `effect is ${normalState.effect}`);
  assert(normalState.state === "lit", `bulb did not settle and ignite: ${normalState.state}`);
  assert(normalState.taut === "true", "rope never reached its taut state");
  assert(Number(normalState.bulbPalette) < 0.01, `settled dark bulb palette is ${normalState.bulbPalette}`);
  assert(normalState.introOverflowX === "visible", `hero still clips the swinging canvas: ${normalState.introOverflowX}`);
  assert(normalState.homeOverflowX === "visible", `page still clips the swinging canvas: ${normalState.homeOverflowX}`);
  assert(normalState.highDpi, "v4 canvas did not scale to device pixel ratio");
  assert(normalState.ambientCssWidth === 1440 && normalState.ambientCssHeight === 1000, `ambient canvas is not viewport-sized: ${normalState.ambientCssWidth}x${normalState.ambientCssHeight}`);
  assert(normalState.ambientDrawingWidth >= 2880 && normalState.ambientDrawingHeight >= 2000, "ambient canvas did not scale to the viewport device pixel ratio");
  assert(normalState.ambientCenterPixel[3] > normalState.ambientFarPixel[3], `ambient light is not centered on the bulb: center=${normalState.ambientCenterPixel} far=${normalState.ambientFarPixel}`);
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

  await triggerThemeToggle(normalPage);
  await normalPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await normalPage.waitForTimeout(90);
  const lightMidTransition = await normalPage.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    transitioning: document.body.dataset.transitioning,
    bulbPalette: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-bulb-palette"),
  }));
  assert(lightMidTransition.transitioning === "true", "light theme transition ended before its mid-frame check");
  assert(
    lightMidTransition.background !== "rgb(9, 10, 9)" && lightMidTransition.background !== "rgb(243, 240, 232)",
    `light theme background jumped instead of interpolating: ${lightMidTransition.background}`,
  );
  assert(Number(lightMidTransition.bulbPalette) > 0.001 && Number(lightMidTransition.bulbPalette) < 0.999, `light bulb palette jumped instead of interpolating: ${lightMidTransition.bulbPalette}`);

  // A second click should reverse from the current color instead of restarting
  // a hard wave or leaving the page in a mismatched theme.
  await triggerThemeToggle(normalPage);
  await normalPage.waitForFunction(
    () => document.body.dataset.theme === "dark" && document.body.dataset.transitioning === "false",
    undefined,
    { timeout: 3000 },
  );
  const reversedThemeState = await normalPage.evaluate(() => ({
    theme: document.body.dataset.theme,
    transitioning: document.body.dataset.transitioning,
    state: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-state"),
    bulbPalette: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-bulb-palette"),
    background: getComputedStyle(document.body).backgroundColor,
  }));
  assert(reversedThemeState.theme === "dark", `reversed transition settled on ${reversedThemeState.theme}`);
  assert(reversedThemeState.transitioning === "false", "reversed theme transition did not finish");
  assert(reversedThemeState.state === "lit", `bulb did not relight after reversing: ${reversedThemeState.state}`);
  assert(reversedThemeState.background === "rgb(9, 10, 9)", `reversed dark background is ${reversedThemeState.background}`);

  await triggerThemeToggle(normalPage);
  await normalPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await normalPage.locator('body[data-theme="light"]').waitFor({ state: "attached", timeout: 3000 });
  const lightThemeState = await normalPage.evaluate(() => ({
    theme: document.body.dataset.theme,
    transitioning: document.body.dataset.transitioning,
    state: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-state"),
    bulbPalette: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-bulb-palette"),
    background: getComputedStyle(document.body).backgroundColor,
  }));
  assert(lightThemeState.theme === "light", `light theme did not apply: ${lightThemeState.theme}`);
  assert(lightThemeState.transitioning === "false", "light theme transition did not finish");
  assert(lightThemeState.state === "off", `bulb did not extinguish with light theme: ${lightThemeState.state}`);
  assert(Number(lightThemeState.bulbPalette) > 0.99, `light bulb palette did not settle: ${lightThemeState.bulbPalette}`);
  assert(lightThemeState.background === "rgb(243, 240, 232)", `light theme background is ${lightThemeState.background}`);

  await triggerThemeToggle(normalPage);
  await normalPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await normalPage.waitForTimeout(90);
  const darkMidTransition = await normalPage.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    transitioning: document.body.dataset.transitioning,
    bulbPalette: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-bulb-palette"),
  }));
  assert(darkMidTransition.transitioning === "true", "dark theme transition ended before its mid-frame check");
  assert(
    darkMidTransition.background !== "rgb(243, 240, 232)" && darkMidTransition.background !== "rgb(9, 10, 9)",
    `dark theme background jumped instead of interpolating: ${darkMidTransition.background}`,
  );
  assert(Number(darkMidTransition.bulbPalette) > 0.001 && Number(darkMidTransition.bulbPalette) < 0.999, `dark bulb palette jumped instead of interpolating: ${darkMidTransition.bulbPalette}`);
  await normalPage.locator('body[data-theme="dark"]').waitFor({ state: "attached", timeout: 3000 });
  await normalPage.locator('.flexible-pixel-bulb[data-state="lit"]').waitFor({ state: "attached", timeout: 3000 });
  const darkThemeState = await normalPage.evaluate(() => ({
    theme: document.body.dataset.theme,
    transitioning: document.body.dataset.transitioning,
    state: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-state"),
    bulbPalette: document.querySelector(".flexible-pixel-bulb")?.getAttribute("data-bulb-palette"),
    background: getComputedStyle(document.body).backgroundColor,
  }));
  assert(darkThemeState.theme === "dark", `dark theme did not apply: ${darkThemeState.theme}`);
  assert(darkThemeState.transitioning === "false", "dark theme transition did not finish");
  assert(darkThemeState.state === "lit", `bulb did not reignite with dark theme: ${darkThemeState.state}`);
  assert(Number(darkThemeState.bulbPalette) < 0.01, `dark bulb palette did not settle: ${darkThemeState.bulbPalette}`);
  assert(darkThemeState.background === "rgb(9, 10, 9)", `dark theme background is ${darkThemeState.background}`);

  assert(normalErrors.consoleErrors.length === 0, `normal-motion console errors: ${normalErrors.consoleErrors.join(" | ")}`);
  assert(normalErrors.pageErrors.length === 0, `normal-motion page errors: ${normalErrors.pageErrors.join(" | ")}`);
  await normalContext.close();

  const narrowContext = await browser.newContext({
    viewport: { width: 376, height: 362 },
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
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    themeCanvas: (() => {
      const canvas = document.querySelector(".flexible-pixel-bulb__theme-canvas");
      const rect = canvas?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, width: rect.width } : null;
    })(),
  }));
  assert(narrowOverflow.intro === "visible", `narrow hero still clips the swing: ${narrowOverflow.intro}`);
  assert(narrowOverflow.home === "visible", `narrow page still clips the swing: ${narrowOverflow.home}`);
  assert(narrowOverflow.viewport === "clip", `narrow viewport overflow policy changed: ${narrowOverflow.viewport}`);
  assert(narrowOverflow.bodyScrollWidth <= narrowOverflow.bodyClientWidth, `narrow bulb still expands the body to ${narrowOverflow.bodyScrollWidth}px for a ${narrowOverflow.bodyClientWidth}px viewport`);
  assert(narrowOverflow.themeCanvas?.left === 0 && narrowOverflow.themeCanvas?.right === 376 && narrowOverflow.themeCanvas?.width === 376, `narrow theme canvas does not cover the exact viewport: ${JSON.stringify(narrowOverflow.themeCanvas)}`);
  const beforeScroll = await narrowPage.evaluate(() => {
    const bulb = document.querySelector(".flexible-pixel-bulb")?.getBoundingClientRect();
    return {
      position: getComputedStyle(document.querySelector(".flexible-pixel-bulb")).position,
      top: bulb?.top ?? null,
      right: bulb?.right ?? null,
    };
  });
  await narrowPage.evaluate(() => window.scrollTo(0, 420));
  await narrowPage.waitForTimeout(60);
  const afterScroll = await narrowPage.evaluate(() => {
    const bulb = document.querySelector(".flexible-pixel-bulb")?.getBoundingClientRect();
    return { top: bulb?.top ?? null, right: bulb?.right ?? null };
  });
  assert(beforeScroll.position === "fixed", `bulb is not viewport-fixed: ${beforeScroll.position}`);
  assert(Math.abs((beforeScroll.top ?? 0) - (afterScroll.top ?? 0)) < 0.5 && Math.abs((beforeScroll.right ?? 0) - (afterScroll.right ?? 0)) < 0.5, `bulb moved during scroll: before=${JSON.stringify(beforeScroll)} after=${JSON.stringify(afterScroll)}`);
  await narrowPage.evaluate(() => window.scrollTo(0, 0));
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
  await triggerThemeToggle(initialLightPage);
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
  await triggerThemeToggle(reducedPage);
  await reducedPage.locator('body[data-theme="light"]').waitFor({ state: "attached", timeout: 1000 });
  assert(await reducedPage.locator('.flexible-pixel-bulb[data-state="off"]').count() === 1, "reduced-motion light theme did not turn the bulb off");
  await triggerThemeToggle(reducedPage);
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
