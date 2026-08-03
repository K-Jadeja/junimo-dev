import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

function fail(message) {
  throw new Error(message);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

const canonicalPath = join(root, "public", "favicon.png");
const canonical = readFileSync(canonicalPath);
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

if (!canonical.subarray(0, pngSignature.length).equals(pngSignature)) {
  fail("public/favicon.png is not a PNG file");
}

const width = canonical.readUInt32BE(16);
const height = canonical.readUInt32BE(20);
if (width !== 512 || height !== 512) {
  fail(`public/favicon.png must be 512x512, received ${width}x${height}`);
}

const layout = readFileSync(join(root, "src", "app", "layout.tsx"), "utf8");
if (!layout.includes('url: "/favicon.png"') || !layout.includes('url: "/favicon.ico"')) {
  fail("Next metadata does not expose both canonical favicon formats");
}

const htmlFiles = walk(join(root, "public", "sushi")).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const contents = readFileSync(file, "utf8");
  const iconLinks = [...contents.matchAll(/<link\b[^>]*\brel=["']icon["'][^>]*>/gi)].map((match) => match[0]);
  if (iconLinks.length !== 1) {
    fail(`${relative(root, file)} must contain exactly one favicon link`);
  }
  if (!iconLinks[0].match(/\bhref=["']\/favicon\.png["']/i)) {
    fail(`${relative(root, file)} does not point to /favicon.png`);
  }
  if (contents.includes("favicon.svg") || contents.includes("data:,")) {
    fail(`${relative(root, file)} still contains a legacy favicon reference`);
  }
}

for (const asset of [
  join(root, "public", "favicon.ico"),
  join(root, "public", "favicon.svg"),
  join(root, "src", "app", "icon.svg"),
  join(root, "public", "sushi", "astres", "favicon.svg"),
]) {
  const contents = readFileSync(asset);
  if (contents.length === 0) {
    fail(`${relative(root, asset)} is empty`);
  }
}

console.log(`Favicon QA passed: ${htmlFiles.length} Sushi HTML entrypoints use /favicon.png.`);
