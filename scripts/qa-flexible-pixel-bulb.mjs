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

async function readBulbState(page) {
  return page.evaluate(() => {
    const hero = document.querySelector(".flexible-pixel-bulb");
    const assembly = document.querySelector(".flexible-pixel-bulb__assembly");
    const wire = document.querySelector(".flexible-pixel-bulb__wire");
    const toggle = document.querySelector(".flexible-pixel-bulb__toggle");
    const asset = document.querySelector(".flexible-pixel-bulb__asset");
    if (!hero || !assembly || !wire || !(toggle instanceof HTMLElement) || !(asset instanceof HTMLImageElement)) {
      throw new Error("poster bulb DOM is incomplete");
    }

    const assemblyRect = assembly.getBoundingClientRect();
    const wireRect = wire.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const computedAssembly = getComputedStyle(assembly);
    const computedWire = getComputedStyle(wire);
    const computedToggle = getComputedStyle(toggle);
    return {
      renderer: hero.getAttribute("data-renderer"),
      effect: hero.getAttribute("data-effect"),
      motion: hero.getAttribute("data-motion"),
      physics: hero.getAttribute("data-physics"),
      entry: hero.getAttribute("data-entry"),
      state: hero.getAttribute("data-state"),
      theme: document.body.dataset.theme,
      transitioning: document.body.dataset.transitioning,
      light: hero.getAttribute("data-light"),
      bulbPalette: hero.getAttribute("data-bulb-palette"),
      assemblyPosition: computedAssembly.position,
      assemblyAnimation: computedAssembly.animationName,
      assemblyTransform: computedAssembly.transform,
      assemblyRect: { top: assemblyRect.top, left: assemblyRect.left, width: assemblyRect.width, height: assemblyRect.height },
      wireRect: { top: wireRect.top, bottom: wireRect.bottom, left: wireRect.left, width: wireRect.width },
      wireColor: computedWire.backgroundColor,
      toggleRect: { top: toggleRect.top, left: toggleRect.left, right: toggleRect.right, width: toggleRect.width, height: toggleRect.height },
      toggleCursor: computedToggle.cursor,
      assetLoaded: asset.complete && asset.naturalWidth > 0 && asset.naturalHeight > 0,
      lightAssetOpacity: getComputedStyle(document.querySelector(".flexible-pixel-bulb__asset--light")).opacity,
      darkAssetOpacity: getComputedStyle(document.querySelector(".flexible-pixel-bulb__asset--dark")).opacity,
      background: getComputedStyle(document.body).backgroundColor,
      bulbLightProgress: getComputedStyle(document.body).getPropertyValue("--bulb-light-progress").trim(),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
    };
  });
}

async function waitForSettledEntry(page, timeout = 3000) {
  await page.locator('.flexible-pixel-bulb[data-entry="settled"]').waitFor({ state: "attached", timeout });
}

async function waitForTheme(page, target) {
  await page.waitForFunction(
    (expected) => document.body.dataset.theme === expected && document.body.dataset.transitioning === "false",
    target,
    { timeout: 3000 },
  );
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

  const bulb = normalPage.locator('.flexible-pixel-bulb[data-renderer="poster-dom"]');
  await bulb.waitFor({ state: "attached", timeout: 3000 });
  const initialState = await readBulbState(normalPage);
  assert(initialState.renderer === "poster-dom", `renderer is ${initialState.renderer}`);
  assert(initialState.effect === "omori-poster-bulb", `effect is ${initialState.effect}`);
  assert(initialState.motion === "drop-in-v1", `motion contract is ${initialState.motion}`);
  assert(initialState.physics === "none", `physics contract is ${initialState.physics}`);
  assert(initialState.assetLoaded, "processed bulb asset did not load");
  assert(await normalPage.locator(".flexible-pixel-bulb__hint").count() === 0, "instructional bulb hint remains visible");
  assert(initialState.assemblyPosition === "absolute", `bulb assembly positioning is ${initialState.assemblyPosition}`);
  assert(initialState.assemblyAnimation === "bulb-drop-in", `bulb entrance animation is ${initialState.assemblyAnimation}`);
  assert(await normalPage.locator(".flexible-pixel-bulb__canvas").count() === 0, "legacy physics canvas remains");
  assert(await normalPage.locator(".flexible-pixel-bulb__toggle[data-dragging]").count() === 0, "drag interaction remains enabled");

  await waitForSettledEntry(normalPage);
  const settledState = await readBulbState(normalPage);
  assert(settledState.state === "lit", `dark bulb did not settle lit: ${settledState.state}`);
  assert(settledState.entry === "settled", `bulb entrance did not settle: ${settledState.entry}`);
  assert(settledState.toggleCursor === "pointer", `bulb is not clickable: ${settledState.toggleCursor}`);
  assert(Math.abs((settledState.wireRect.left + settledState.wireRect.width / 2) - (settledState.assemblyRect.left + settledState.assemblyRect.width * 0.507)) < 0.75, "wire is not aligned to the bulb socket");
  assert(Math.abs(settledState.wireRect.bottom - settledState.toggleRect.top) < 3, `wire does not meet the socket: wire=${settledState.wireRect.bottom}, bulb=${settledState.toggleRect.top}`);
  assert(settledState.wireRect.top < -1, `poster wire end is visible: ${settledState.wireRect.top}`);
  assert(settledState.wireRect.width >= 2.5 && settledState.wireRect.width <= 3.5, `poster wire weight is wrong: ${settledState.wireRect.width}`);
  assert(!settledState.overflow, "homepage has horizontal overflow");
  assert(settledState.bodyScrollWidth <= settledState.bodyClientWidth, "bulb expanded the document width");

  const settledTransform = settledState.assemblyTransform;
  assert(settledTransform === "none" || settledTransform.endsWith(", 0, 0)"), `bulb did not finish at its pinned position: ${settledTransform}`);

  const toggle = normalPage.locator(".flexible-pixel-bulb__toggle");
  await toggle.click();
  await normalPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await normalPage.waitForTimeout(90);
  const lightMidTransition = await readBulbState(normalPage);
  assert(lightMidTransition.transitioning === "true", "light theme transition did not start");
  assert(lightMidTransition.background !== "rgb(9, 10, 9)" && lightMidTransition.background !== "rgb(243, 240, 232)", `light background jumped: ${lightMidTransition.background}`);
  assert(Number(lightMidTransition.bulbLightProgress) > 0.001 && Number(lightMidTransition.bulbLightProgress) < 0.999, `bulb palette jumped: ${lightMidTransition.bulbLightProgress}`);
  assert(Number(lightMidTransition.lightAssetOpacity) > 0 && Number(lightMidTransition.lightAssetOpacity) < 1, `light asset did not crossfade: ${lightMidTransition.lightAssetOpacity}`);

  await toggle.click();
  await waitForTheme(normalPage, "dark");
  const reversedState = await readBulbState(normalPage);
  assert(reversedState.state === "lit", `reversed dark bulb state is ${reversedState.state}`);
  assert(reversedState.background === "rgb(9, 10, 9)", `reversed dark background is ${reversedState.background}`);
  assert(reversedState.darkAssetOpacity === "1", `dark asset did not settle visible: ${reversedState.darkAssetOpacity}`);
  assert(reversedState.lightAssetOpacity === "0", `light asset did not settle hidden: ${reversedState.lightAssetOpacity}`);

  await toggle.click();
  await waitForTheme(normalPage, "light");
  const lightState = await readBulbState(normalPage);
  assert(lightState.state === "off", `light bulb state is ${lightState.state}`);
  assert(lightState.background === "rgb(243, 240, 232)", `light background is ${lightState.background}`);
  assert(lightState.lightAssetOpacity === "1", `light asset did not settle visible: ${lightState.lightAssetOpacity}`);
  assert(lightState.darkAssetOpacity === "0", `dark asset did not settle hidden: ${lightState.darkAssetOpacity}`);

  await toggle.click();
  await waitForTheme(normalPage, "dark");
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
  await narrowPage.locator('.flexible-pixel-bulb[data-renderer="poster-dom"]').waitFor({ state: "attached", timeout: 3000 });
  await waitForSettledEntry(narrowPage);
  const narrowStateBeforeScroll = await readBulbState(narrowPage);
  assert(!narrowStateBeforeScroll.overflow, "narrow viewport has horizontal overflow");
  assert(narrowStateBeforeScroll.assemblyRect.left >= 0, `narrow bulb leaves the left viewport edge: ${narrowStateBeforeScroll.assemblyRect.left}`);
  assert(narrowStateBeforeScroll.toggleRect.right <= 376.5, `narrow bulb leaves the right viewport edge: ${narrowStateBeforeScroll.toggleRect.right}`);
  assert(narrowStateBeforeScroll.wireRect.top < -1, `narrow poster wire end is visible: ${narrowStateBeforeScroll.wireRect.top}`);
  assert(narrowStateBeforeScroll.wireRect.width >= 2.5 && narrowStateBeforeScroll.wireRect.width <= 3.5, `narrow poster wire weight is wrong: ${narrowStateBeforeScroll.wireRect.width}`);
  await narrowPage.evaluate(() => window.scrollTo(0, 420));
  await narrowPage.waitForTimeout(60);
  const narrowStateAfterScroll = await readBulbState(narrowPage);
  assert(Math.abs(narrowStateBeforeScroll.toggleRect.top - narrowStateAfterScroll.toggleRect.top) < 0.5, "bulb moved during scroll");
  assert(Math.abs(narrowStateBeforeScroll.toggleRect.left - narrowStateAfterScroll.toggleRect.left) < 0.5, "bulb shifted horizontally during scroll");
  assert(Math.abs(narrowStateBeforeScroll.wireRect.top - narrowStateAfterScroll.wireRect.top) < 0.5, "wire moved during scroll");
  assert(Math.abs(narrowStateBeforeScroll.wireRect.bottom - narrowStateAfterScroll.wireRect.bottom) < 0.5, "wire socket moved during scroll");
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
  await initialLightPage.locator('.flexible-pixel-bulb[data-renderer="poster-dom"][data-state="off"]').waitFor({ state: "attached", timeout: 3000 });
  await waitForSettledEntry(initialLightPage);
  const initialLightState = await readBulbState(initialLightPage);
  assert(initialLightState.lightAssetOpacity === "1", "initial light theme did not use the dark poster asset");
  await initialLightPage.locator(".flexible-pixel-bulb__toggle").click();
  await initialLightPage.waitForFunction(() => document.body.dataset.transitioning === "true", undefined, { timeout: 1000 });
  await initialLightPage.waitForTimeout(80);
  const lightToDarkStart = await readBulbState(initialLightPage);
  assert(Number(lightToDarkStart.lightAssetOpacity) > Number(lightToDarkStart.darkAssetOpacity), `light-to-dark transition started with the warm layer dominant: light=${lightToDarkStart.lightAssetOpacity}, dark=${lightToDarkStart.darkAssetOpacity}`);
  await waitForTheme(initialLightPage, "dark");
  assert((await readBulbState(initialLightPage)).darkAssetOpacity === "1", "initial light theme could not switch to the warm bulb");
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
  const reducedBulb = reducedPage.locator('.flexible-pixel-bulb[data-renderer="poster-dom"][data-entry="settled"]');
  await reducedBulb.waitFor({ state: "attached", timeout: 3000 });
  const reducedState = await readBulbState(reducedPage);
  assert(reducedState.physics === "none", "reduced-motion bulb still reports physics");
  assert(reducedState.assemblyTransform === "none" || reducedState.assemblyTransform.endsWith(", 0, 0)"), `reduced-motion bulb moved: ${reducedState.assemblyTransform}`);
  await reducedPage.locator(".flexible-pixel-bulb__toggle").click();
  await waitForTheme(reducedPage, "light");
  await reducedPage.locator(".flexible-pixel-bulb__toggle").click();
  await waitForTheme(reducedPage, "dark");
  assert(reducedErrors.consoleErrors.length === 0, `reduced-motion console errors: ${reducedErrors.consoleErrors.join(" | ")}`);
  assert(reducedErrors.pageErrors.length === 0, `reduced-motion page errors: ${reducedErrors.pageErrors.join(" | ")}`);
  await reducedContext.close();

  console.log(JSON.stringify({
    status: "ok",
    renderer: "poster-dom",
    motion: "vertical-drop-only",
    interaction: "click-to-toggle-theme",
  }, null, 2));
} finally {
  await browser.close();
}
