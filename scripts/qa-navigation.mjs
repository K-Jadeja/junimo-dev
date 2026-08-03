import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readShell(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, width: rect.width, viewport: window.innerWidth };
  });
}

function expectedShellWidth(viewport) {
  return Math.min(viewport - 48, 640);
}

function assertPacoShell(shell, label) {
  assert(Math.abs(shell.width - expectedShellWidth(shell.viewport)) < 2, `${label} shell width is ${shell.width}`);
  assert(Math.abs(shell.left - (shell.viewport - shell.width) / 2) < 2, `${label} shell left edge is ${shell.left}`);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    const nativeStartViewTransition = document.startViewTransition?.bind(document);
    let calls = 0;
    window.__junimoViewTransitionCalls = () => calls;

    if (nativeStartViewTransition) {
      document.startViewTransition = (updateCallback) => {
        calls += 1;
        return nativeStartViewTransition(updateCallback);
      };
      return;
    }

    document.startViewTransition = (updateCallback) => {
      calls += 1;
      const updateCallbackDone = Promise.resolve().then(updateCallback);
      return {
        updateCallbackDone,
        ready: Promise.resolve(),
        finished: updateCallbackDone,
        skipTransition() {},
      };
    };
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator(".home-shell").waitFor({ state: "attached", timeout: 3000 });
  const homeShell = await readShell(page, ".home-shell");
  assertPacoShell(homeShell, "homepage");
  const desktopHeaderTop = await page.locator(".home-header h1").evaluate((element) => element.getBoundingClientRect().top);
  assert(Math.abs(desktopHeaderTop - 128) < 2, `desktop header top is ${desktopHeaderTop}`);

  assert(await page.locator('a[href="/sushi"]').count() === 1, "Sushi project link is missing");
  await page.locator('a[href="/sushi"]').click();
  await page.waitForURL("**/sushi", { timeout: 5000 });
  await page.locator(".case-study").waitFor({ state: "attached", timeout: 3000 });
  const caseShell = await readShell(page, ".case-study");
  assertPacoShell(caseShell, "case-study");
  assert((await page.locator(".case-hero h1").textContent())?.trim() === "Sushi", "Sushi case-study heading is missing");
  assert((await page.locator(".case-hero__eyebrow").textContent())?.trim() === "Browser-native AI experiments", "Sushi case-study eyebrow is missing");
  const typography = await page.evaluate(() => {
    const selectors = {
      wordmark: ".case-wordmark",
      homeLink: ".case-home-link",
      eyebrow: ".case-hero__eyebrow",
      heading: ".case-hero h1",
      externalLink: ".external-link",
      overview: "h2.case-label",
      labHeading: ".sushi-lab__heading h2",
      labName: ".sushi-lab__name",
      nextProject: ".case-nav__title",
    };
    return Object.fromEntries(Object.entries(selectors).map(([role, selector]) => {
      const element = document.querySelector(selector);
      return [role, element ? getComputedStyle(element).fontWeight : null];
    }));
  });
  for (const [role, expectedWeight] of Object.entries({
    wordmark: "700",
    homeLink: "400",
    eyebrow: "400",
    heading: "700",
    externalLink: "400",
    overview: "700",
    labHeading: "700",
    labName: "700",
    nextProject: "700",
  })) {
    assert(typography[role] === expectedWeight, `Sushi ${role} weight is ${typography[role]}`);
  }
  assert(await page.locator('.project-media img[alt*="Sushi"]').count() === 1, "Sushi case-study media is missing");
  for (const route of ["/sushi/llm", "/sushi/tts", "/sushi/llm-tts", "/sushi/stt", "/sushi/stt-llm-tts"]) {
    assert(await page.locator(`a[href="${route}/"]`).count() === 1, `${route} lab link is missing`);
  }
  assert(await page.evaluate(() => window.__junimoViewTransitionCalls()) >= 1, "internal navigation did not use the native view transition bridge");

  await page.locator(".case-wordmark").click();
  await page.waitForURL("**/", { timeout: 5000 });
  assert(await page.evaluate(() => window.__junimoViewTransitionCalls()) >= 2, "return navigation did not use the native view transition bridge");
  assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
  await context.close();

  const narrowContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  const narrowPage = await narrowContext.newPage();
  await narrowPage.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
  const narrowShell = await readShell(narrowPage, ".home-shell");
  assertPacoShell(narrowShell, "narrow homepage");
  const narrowHeaderTop = await narrowPage.locator(".home-header h1").evaluate((element) => element.getBoundingClientRect().top);
  assert(Math.abs(narrowHeaderTop - 64) < 2, `mobile header top is ${narrowHeaderTop}`);
  await narrowContext.close();

  console.log(JSON.stringify({
    status: "ok",
    shell: "640px capped with 24px side gutters",
    topSpacing: "128px desktop / 64px mobile",
    navigation: "native view-transition bridge",
    scroll: "smooth native document scrolling",
  }, null, 2));
} finally {
  await browser.close();
}
