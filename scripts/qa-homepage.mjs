import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.locator('.flexible-pixel-bulb[data-entry="settled"]').waitFor({ state: "attached", timeout: 5000 });
    const state = await page.evaluate(() => {
      const intro = document.querySelector(".home-intro__copy h2")?.getBoundingClientRect();
      const bulb = document.querySelector(".flexible-pixel-bulb__toggle")?.getBoundingClientRect();
      return {
        headings: [...document.querySelectorAll("h1, h2")].map((element) => element.textContent?.trim()),
        linkDecorations: [...document.querySelectorAll("a")].map((element) => getComputedStyle(element).textDecorationLine),
        introGap: intro && bulb ? intro.top - bulb.bottom : null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        imageCount: document.querySelectorAll("img").length,
        previewCount: document.querySelectorAll('[class*="preview"]').length,
        hasSelectedWork: document.body.innerText.includes("Selected work"),
        hasBulbHint: document.body.innerText.toLowerCase().includes("click to switch light"),
      };
    });

    assert(response?.status() === 200, `${viewport.name} homepage status is ${response?.status()}`);
    assert(state.headings.includes("Projects"), `${viewport.name} Projects section is missing`);
    assert(state.headings.includes("Writing"), `${viewport.name} Writing section is missing`);
    assert(state.headings.includes("Now"), `${viewport.name} Now section is missing`);
    assert(state.linkDecorations.every((decoration) => decoration === "none"), `${viewport.name} has a resting underlined link`);
    assert(state.previewCount === 0, `${viewport.name} still renders homepage preview UI`);
    assert(!state.hasSelectedWork, `${viewport.name} still renders the old Selected work label`);
    assert(!state.hasBulbHint, `${viewport.name} still renders the bulb instruction`);
    assert(!state.overflow, `${viewport.name} homepage has horizontal overflow`);
    assert(state.imageCount === 2, `${viewport.name} homepage image count changed: ${state.imageCount}`);
    if (viewport.name === "mobile") {
      assert(state.introGap >= 24, `mobile bulb overlaps the intro by ${state.introGap}px`);
    }
    assert(consoleErrors.length === 0, `${viewport.name} console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `${viewport.name} page errors: ${pageErrors.join(" | ")}`);
    await context.close();
  }

  console.log(JSON.stringify({
    status: "ok",
    layout: "text-first single-column index",
    links: "no resting underlines",
    media: "bulb only",
    responsive: "mobile bulb clears intro",
  }, null, 2));
} finally {
  await browser.close();
}
