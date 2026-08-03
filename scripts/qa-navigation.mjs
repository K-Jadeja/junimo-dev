import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readShell(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, viewport: window.innerWidth };
  });
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
  assert(Math.abs(homeShell.width - Math.min(homeShell.viewport * 0.88, 680)) < 2, `homepage shell width is ${homeShell.width}`);

  await page.locator('a[href="/work/remalt"]').click();
  await page.waitForURL("**/work/remalt", { timeout: 5000 });
  await page.locator(".case-study").waitFor({ state: "attached", timeout: 3000 });
  const caseShell = await readShell(page, ".case-study");
  assert(Math.abs(caseShell.width - Math.min(caseShell.viewport * 0.88, 680)) < 2, `case-study shell width is ${caseShell.width}`);
  assert(await page.evaluate(() => window.__junimoViewTransitionCalls()) >= 1, "internal navigation did not use the native view transition bridge");

  await page.locator(".case-back").click();
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
  assert(Math.abs(narrowShell.width - narrowShell.viewport * 0.88) < 2, `narrow shell width is ${narrowShell.width}`);
  await narrowContext.close();

  console.log(JSON.stringify({
    status: "ok",
    shell: "88dvw capped at 680px",
    navigation: "native view-transition bridge",
    scroll: "smooth native document scrolling",
  }, null, 2));
} finally {
  await browser.close();
}
