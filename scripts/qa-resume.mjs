const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const homepageResponse = await fetch(`${baseUrl}/`);
const homepage = await homepageResponse.text();
assert(homepageResponse.ok, `homepage status is ${homepageResponse.status}`);
assert(homepage.includes('href="/resume"'), "homepage Resume link is missing");

const resumeResponse = await fetch(`${baseUrl}/resume`);
const resume = new Uint8Array(await resumeResponse.arrayBuffer());
const contentType = resumeResponse.headers.get("content-type") ?? "";
const contentDisposition = resumeResponse.headers.get("content-disposition") ?? "";
const signature = new TextDecoder().decode(resume.slice(0, 5));

assert(resumeResponse.ok, `/resume status is ${resumeResponse.status}`);
assert(contentType.startsWith("application/pdf"), `/resume content type is ${contentType}`);
assert(contentDisposition.startsWith("inline"), `/resume disposition is ${contentDisposition}`);
assert(signature === "%PDF-", `/resume does not contain a PDF signature: ${signature}`);

console.log(JSON.stringify({
  status: "ok",
  route: "/resume",
  contentType,
  contentDisposition,
  bytes: resume.byteLength,
}, null, 2));
