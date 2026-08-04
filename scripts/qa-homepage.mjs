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
      const writingList = document.querySelector(".home-writing .portfolio-list");
      const readTypography = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const style = getComputedStyle(element);
        return {
          family: style.fontFamily,
          weight: style.fontWeight,
          fontSize: style.fontSize,
          color: style.color,
          marginBottom: style.marginBottom,
          synthesisWeight: style.fontSynthesisWeight,
        };
      };
      return {
        headings: [...document.querySelectorAll("h1, h2")].map((element) => element.textContent?.trim()),
        hasNowUpdate: document.querySelector(".home-now__updated")?.textContent?.trim().length > 0,
        nowCopy: document.querySelector(".home-now__copy")?.textContent?.trim() ?? "",
        hasConnect: document.querySelector(".home-connect") !== null,
        hasLowerGrid: document.querySelector(".home-lower") !== null,
        endingLinkCount: document.querySelectorAll(".home-footer a").length,
        linkDecorations: [...document.querySelectorAll("a")].map((element) => getComputedStyle(element).textDecorationLine),
        introGap: intro && bulb ? intro.top - bulb.bottom : null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        imageCount: document.querySelectorAll("img").length,
        previewCount: document.querySelectorAll('[class*="preview"]').length,
        hasSelectedWork: document.body.innerText.includes("Selected work"),
        hasSushi: document.body.innerText.includes("Sushi"),
        hasBulbHint: document.body.innerText.toLowerCase().includes("click to switch light"),
        typography: {
          body: readTypography("body"),
          header: readTypography(".home-header h1"),
          intro: readTypography(".home-intro__copy h2"),
          links: readTypography(".home-links"),
          section: readTypography(".home-section > h2"),
          openSource: readTypography(".home-open-source > h2"),
          project: readTypography(".home-index__title"),
          description: readTypography(".home-index__description"),
          writing: readTypography(".home-writing .portfolio-list__title"),
        },
        writingList: writingList ? {
          linkCount: writingList.querySelectorAll(".portfolio-list__link").length,
          descriptionCount: writingList.querySelectorAll(".portfolio-list__description").length,
          arrowCount: writingList.querySelectorAll(".portfolio-list__external").length,
          maxWidth: getComputedStyle(writingList).maxWidth,
          gap: getComputedStyle(writingList).rowGap,
        } : null,
      };
    });

    assert(response?.status() === 200, `${viewport.name} homepage status is ${response?.status()}`);
    assert(state.headings.includes("Projects"), `${viewport.name} Projects section is missing`);
    assert(state.headings.includes("Writing"), `${viewport.name} Writing section is missing`);
    assert(state.headings.includes("Now"), `${viewport.name} Now section is missing`);
    assert(!state.hasConnect, `${viewport.name} redundant Connect section remains`);
    assert(!state.hasLowerGrid, `${viewport.name} redundant lower grid remains`);
    assert(state.hasNowUpdate, `${viewport.name} Now update label is missing`);
    assert(state.nowCopy.includes("Browser rendering"), `${viewport.name} Now focus is missing`);
    assert(!state.nowCopy.includes("Remalt"), `${viewport.name} Now repeats the intro's current work`);
    assert(state.endingLinkCount === 0, `${viewport.name} ending still contains redundant links`);
    assert(state.hasSushi, `${viewport.name} Sushi project is missing`);
    for (const [role, expectedWeight] of Object.entries({
      body: "400",
      header: "600",
      intro: "600",
      links: "400",
      section: "400",
      project: "500",
      description: "400",
      writing: "500",
    })) {
      assert(state.typography[role]?.weight === expectedWeight, `${viewport.name} ${role} weight is ${state.typography[role]?.weight}`);
    }
    assert(state.typography.body?.family.startsWith("Inter"), `${viewport.name} font family is ${state.typography.body?.family}`);
    assert(state.typography.body?.synthesisWeight === "none", `${viewport.name} font synthesis is ${state.typography.body?.synthesisWeight}`);
    assert(state.typography.openSource?.color === state.typography.section?.color, `${viewport.name} Open source heading color differs from section headings`);
    assert(state.typography.openSource?.marginBottom === state.typography.section?.marginBottom, `${viewport.name} Open source heading spacing differs from section headings`);
    assert(state.typography.writing?.fontSize === "18px", `${viewport.name} Writing font size is ${state.typography.writing?.fontSize}`);
    assert(state.writingList?.linkCount === 7, `${viewport.name} Writing link count is ${state.writingList?.linkCount}`);
    assert(state.writingList?.descriptionCount === 7, `${viewport.name} Writing description count is ${state.writingList?.descriptionCount}`);
    assert(state.writingList?.arrowCount === 7, `${viewport.name} Writing external arrow count is ${state.writingList?.arrowCount}`);
    assert(state.writingList?.gap === (viewport.name === "desktop" ? "6px" : "16px"), `${viewport.name} Writing list gap is ${state.writingList?.gap}`);
    assert(state.linkDecorations.every((decoration) => decoration === "none"), `${viewport.name} has a resting underlined link`);
    assert(state.previewCount === 0, `${viewport.name} still renders homepage preview UI`);
    assert(!state.hasSelectedWork, `${viewport.name} still renders the old Selected work label`);
    assert(!state.hasBulbHint, `${viewport.name} still renders the bulb instruction`);
    assert(!state.overflow, `${viewport.name} homepage has horizontal overflow`);
    assert(state.imageCount === 2, `${viewport.name} homepage image count changed: ${state.imageCount}`);
    if (viewport.name === "mobile") {
      assert(state.introGap >= 24, `mobile bulb overlaps the intro by ${state.introGap}px`);
      await page.locator(".home-now").scrollIntoViewIfNeeded();
      const lowerSafeArea = await page.evaluate(() => {
        const lower = document.querySelector(".home-now");
        const bulb = document.querySelector(".flexible-pixel-bulb__assembly");
        if (!lower || !bulb) return null;
        const lowerRect = lower.getBoundingClientRect();
        const bulbRect = bulb.getBoundingClientRect();
        const paddingRight = Number.parseFloat(getComputedStyle(lower).paddingRight) || 0;
        return { contentRight: lowerRect.right - paddingRight, bulbLeft: bulbRect.left };
      });
      assert(lowerSafeArea && lowerSafeArea.contentRight <= lowerSafeArea.bulbLeft, `mobile lower content enters the fixed bulb safe area: ${JSON.stringify(lowerSafeArea)}`);
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
