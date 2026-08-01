import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputRoot = path.resolve("artifacts/references");
const references = [
  { slug: "paco", name: "Paco Coursey", url: "https://paco.me/" },
  { slug: "emil", name: "Emil Kowalski", url: "https://emilkowal.ski/" },
  { slug: "rauno", name: "Rauno Freiberg", url: "https://rauno.me/" },
  { slug: "brian", name: "Brian Lovin", url: "https://brianlovin.com/" },
  { slug: "carl", name: "Carl Barenbrug", url: "https://carlbarenbrug.com/" },
  { slug: "lee", name: "Lee Robinson", url: "https://leerob.com/" },
  { slug: "remalt", name: "Remalt", url: "https://remalt.com/" },
  { slug: "greenpost", name: "GreenPost", url: "https://greenpost.46.62.255.217.sslip.io/en" },
  { slug: "project-doru", name: "Project Doru", url: "https://projectdoru.46.62.255.217.sslip.io/" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--disable-gpu", "--no-sandbox"],
});
const results = [];

for (const reference of references) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const filename = `${reference.slug}-${viewport.name}.png`;
    const filepath = path.join(outputRoot, filename);
    const result = { ...reference, viewport: viewport.name, filename, status: "ok", consoleErrors };

    try {
      await page.goto(reference.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1400);
      await page.screenshot({ path: filepath, fullPage: true, type: "png" });
      result.title = await page.title();
      result.scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      result.bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 280);
    } catch (error) {
      result.status = "error";
      result.error = error instanceof Error ? error.message : String(error);
    } finally {
      await context.close();
    }

    results.push(result);
    console.log(`${result.status.toUpperCase()} ${reference.name} ${viewport.name}${result.error ? ` — ${result.error}` : ""}`);
  }
}

await browser.close();
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(results, null, 2));
