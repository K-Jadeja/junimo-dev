import { readFile } from "node:fs/promises";
import path from "node:path";

const resumePath = path.join(process.cwd(), "public", "resume", "krishnasinh-jadeja.pdf");

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const resume = await readFile(resumePath);

  return new Response(resume, {
    headers: {
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "Content-Disposition": 'inline; filename="Krishnasinh-Jadeja-Full-Stack-AI-Engineer.pdf"',
      "Content-Length": String(resume.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
