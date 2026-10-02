# Public resume update, 2 October 2026

`/resume` now serves the current one-page resume containing True Dream AI. The PDF was copied unchanged from `D:/Workspace/Github-Projects/resume/output/pdf/Krishnasinh-Jadeja-Resume.pdf`, via its verified application copy.

The previous live resume is preserved byte-for-byte at `/resume/krishnasinh-jadeja-before-truedream-2026-10-02.pdf`. No old version was deleted. The existing inline PDF route, download filename and headers stay in use.

- Current SHA256: `70FD84730F76F59EFFB5D59BB0CE99A14E5FE149AEE93DA69ABB33D2E00C3EFF` (82,857 bytes).
- Archived SHA256: `C5C7DAAF92A9213CC1F3BDF8681B6CCB308BC50D6F63626AE5D73B7782473DE8` (82,713 bytes).

For the next update, fetch the live `/resume`, verify its hash against the repository file, archive that exact file under a dated name before replacement, then verify the new source and served bytes. Check that the intended experience entry is present in extracted text. Stage only the PDF and its archive/documentation. Preserve unrelated working-tree edits. Verify the live route after deployment; a successful push alone is insufficient. Existing browsers can retain the prior PDF for the route's one-hour cache lifetime, so use a fresh request when checking an update.

Validation uses byte hashes, PDF parsing, the existing `scripts/qa-resume.mjs` against production, and live content checks. No local production build is needed for this asset-only change.
