import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForTheme(page, target) {
  await page.waitForFunction(
    (expected) => document.documentElement.dataset.theme === expected
      && document.body.dataset.theme === expected
      && document.body.dataset.transitioning === "false",
    target,
    { timeout: 3000 },
  );
}

async function readTheme(page) {
  return page.evaluate(() => ({
    root: document.documentElement.dataset.theme,
    body: document.body.dataset.theme,
    background: getComputedStyle(document.body).backgroundColor,
    stored: window.localStorage.getItem("junimo-theme"),
  }));
}

function assertLightTheme(state, location) {
  assert(state.root === "light", `${location} root theme is ${state.root}`);
  assert(state.body === "light", `${location} body theme is ${state.body}`);
  assert(state.background === "rgb(243, 240, 232)", `${location} background is ${state.background}`);
  assert(state.stored === "light", `${location} stored theme is ${state.stored}`);
}

function assertDarkTheme(state, location) {
  assert(state.root === "dark", `${location} root theme is ${state.root}`);
  assert(state.body === "dark", `${location} body theme is ${state.body}`);
  assert(state.background === "rgb(9, 10, 9)", `${location} background is ${state.background}`);
  assert(state.stored === "dark", `${location} stored theme is ${state.stored}`);
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
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/?theme=dark`, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('.flexible-pixel-bulb[data-entry="settled"]').waitFor({ state: "attached", timeout: 3000 });
  await page.locator(".flexible-pixel-bulb__toggle").click();
  await waitForTheme(page, "light");
  assertLightTheme(await readTheme(page), "homepage after light-mode selection");

  for (const route of ["/remalt", "/greenpost", "/project-doru"]) {
    await page.locator(`a[href="${route}"]`).click();
    await page.waitForURL((url) => url.pathname === route, { timeout: 5000 });
    await page.locator(".case-study").waitFor({ state: "attached", timeout: 3000 });
    assertLightTheme(await readTheme(page), `${route} after internal navigation`);

    if (route === "/remalt") {
      await page.reload({ waitUntil: "networkidle", timeout: 30000 });
      await page.locator(".case-study").waitFor({ state: "attached", timeout: 3000 });
      assertLightTheme(await readTheme(page), `${route} after reload`);
    }

    await page.locator(".case-home-link").click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 5000 });
    await page.locator('.flexible-pixel-bulb[data-entry="settled"]').waitFor({ state: "attached", timeout: 3000 });
    assertLightTheme(await readTheme(page), `homepage after returning from ${route}`);
  }

  await page.locator(".flexible-pixel-bulb__toggle").click();
  await waitForTheme(page, "dark");
  await page.locator('a[href="/remalt"]').click();
  await page.waitForURL((url) => url.pathname === "/remalt", { timeout: 5000 });
  await page.locator(".case-study").waitFor({ state: "attached", timeout: 3000 });
  assertDarkTheme(await readTheme(page), "Remalt after dark-mode selection");

  assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
  await context.close();

  console.log(JSON.stringify({
    status: "ok",
    routes: ["/remalt", "/greenpost", "/project-doru"],
    behavior: "selected theme persists through internal navigation and reload",
  }, null, 2));
} finally {
  await browser.close();
}
