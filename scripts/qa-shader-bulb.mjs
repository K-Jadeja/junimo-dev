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

  await normalPage.locator('.light-bulb[data-renderer="webgl"]').waitFor({ state: "attached", timeout: 3000 });
  const earlyState = await normalPage.locator(".light-bulb").getAttribute("data-state");
  assert(earlyState === "dropping" || earlyState === "pendulum" || earlyState === "igniting" || earlyState === "lit", `unexpected initial bulb state: ${earlyState}`);
  assert(await normalPage.locator(".light-bulb__canvas").count() === 1, "shader canvas is missing");
  assert(await normalPage.locator(".light-bulb__dots, .light-bulb__assembly").count() === 0, "legacy DOM bulb nodes remain");

  await normalPage.locator('.light-bulb[data-renderer="webgl"][data-state="pendulum"]').waitFor({ state: "attached", timeout: 5000 });
  await normalPage.locator('.light-bulb[data-renderer="webgl"][data-state="lit"]').waitFor({ state: "attached", timeout: 10000 });
  const normalState = await normalPage.evaluate(() => {
    const canvas = document.querySelector(".light-bulb__canvas");
    const wrapper = document.querySelector(".light-bulb");
    if (!(canvas instanceof HTMLCanvasElement) || !wrapper) throw new Error("shader bulb DOM is incomplete");

    const rect = canvas.getBoundingClientRect();
    return {
      renderer: wrapper.getAttribute("data-renderer"),
      shader: wrapper.getAttribute("data-shader"),
      state: wrapper.getAttribute("data-state"),
      cssWidth: rect.width,
      cssHeight: rect.height,
      drawingWidth: canvas.width,
      drawingHeight: canvas.height,
      highDpi: canvas.width >= rect.width * 2 && canvas.height >= rect.height * 2,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  assert(normalState.renderer === "webgl", `renderer is ${normalState.renderer}`);
  assert(normalState.shader === "pendulum-light-field", `shader effect is ${normalState.shader}`);
  assert(normalState.state === "lit", `bulb did not settle and ignite: ${normalState.state}`);
  assert(normalState.highDpi, "shader canvas did not scale to device pixel ratio");
  assert(!normalState.overflow, "homepage has horizontal overflow");

  await normalPage.getByRole("link", { name: "GreenPost" }).hover();
  const previewAlt = await normalPage.locator(".home-work__desktop-preview img").getAttribute("alt");
  assert(previewAlt?.includes("GreenPost"), "project hover did not update the shared preview");
  assert(normalErrors.consoleErrors.length === 0, `normal-motion console errors: ${normalErrors.consoleErrors.join(" | ")}`);
  assert(normalErrors.pageErrors.length === 0, `normal-motion page errors: ${normalErrors.pageErrors.join(" | ")}`);
  await normalContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  const reducedErrors = await collectErrors(reducedPage);
  await reducedPage.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
  await reducedPage.locator('.light-bulb[data-renderer="webgl"][data-state="lit"]').waitFor({ state: "attached", timeout: 3000 });
  assert(reducedErrors.consoleErrors.length === 0, `reduced-motion console errors: ${reducedErrors.consoleErrors.join(" | ")}`);
  assert(reducedErrors.pageErrors.length === 0, `reduced-motion page errors: ${reducedErrors.pageErrors.join(" | ")}`);
  await reducedContext.close();

  console.log(JSON.stringify({
    status: "ok",
    normal: normalState,
    reducedMotion: "lit-without-drop",
    preview: previewAlt,
  }, null, 2));
} finally {
  await browser.close();
}
