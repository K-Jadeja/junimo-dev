# Mossclip portfolio refresh — 2026-10-05

GreenPost has become Mossclip. The portfolio previously described the older media pipeline, linked to its sslip.io host and showed its old caption studio. Updating the name alone would leave visitors with the wrong product story.

## Current product

The primary brand and domain are **Mossclip**, at <https://mossclip.com>. <https://mossclips.com> redirects to the same site. The public homepage was checked on 2026-10-05, and the owner confirmed a Discord community of about 15 people with some active beta testers. The portfolio uses the durable description “Discord beta community” rather than a membership count.

The current workflow accepts YouTube, Twitch or Kick recordings and file uploads, finds highlights, reframes them vertically, adds word-timed captions, and leaves creators in control of the final edit. The public site describes transcript-based cuts, nine caption styles and watermark-free 1080 × 1920 exports. These are product descriptions verified against the public page, not a new end-to-end generation test.

## Changed surfaces

- Homepage introduction, project listing and Now copy use Mossclip. Now is dated October 2026.
- `/mossclip` is the canonical portfolio project route, with updated title, description, closed-beta status and external link.
- `/greenpost` and `/work/greenpost` return permanent redirects to `/mossclip`. The existing `/work/mossclip` route also permanently redirects to `/mossclip`.
- The first refresh used an authentic 1440 × 1100 public homepage capture at `public/projects/mossclip/mossclip-public.webp`. The Looks follow-up below replaces the displayed image. Old assets and archived design references remain preserved.
- Screenshot and theme QA scripts follow the new canonical route.

## Refresh workflow

1. Check the public product page and primary domain before writing copy. Avoid importing old architecture descriptions or unverified adoption claims.
2. Update `src/data/portfolio.ts` and the homepage introduction together. Check current scripts for hardcoded names, routes and Now copy.
3. When changing a slug, preserve incoming legacy links with permanent redirects in `next.config.mjs`.
4. Capture the public product in a single Playwright browser at a known viewport. Wait for fonts and visible media, inspect the screenshot, and set the asset ratio to its real dimensions.
5. Run the direct TypeScript and ESLint binaries sequentially. Use one scoped dev server for desktop/mobile homepage and project-page checks, legacy redirect checks and theme persistence. Do not run a laptop production build.
6. Stage only the task files, commit and push to `origin/main` under the repository publishing policy. Verify the deployed homepage, project route, image and legacy redirects separately from local checks.

## Validation for this refresh

- Direct TypeScript check passed: `node_modules\\.bin\\tsc.cmd --noEmit --pretty false`.
- Redirect configuration was loaded and checked for both old paths and permanent destinations.
- The source screenshot was inspected before conversion to a 127 KB WebP.
- The repository-wide ESLint scan was stopped after stalling; the bounded check passed with `node_modules\\.bin\\eslint.cmd src scripts next.config.mjs`. Syntax checks for the four changed QA/capture scripts and `git diff --check` also passed.
- A local development server and production build were skipped because available physical memory fell below 1 GB. Desktop/mobile acceptance is performed against the deployed site; a deployment status alone does not establish browser acceptance.

## Looks follow-up — 2026-10-05

The owner then supplied <https://mossclip.com/en/looks>. The initial refresh had missed this central feature, leaving the project framed around captioned clipping alone. The public Looks page and its video examples were inspected before revising the portfolio.

Looks creates complete Blackboard, Notebook and Collage treatments: chalk drawings, pen annotations and stop-motion paper collage. Visitors choose the look before a job, or restyle an existing captioned clip. The page explicitly distinguishes editable captioned clips from styled clips whose drawings are rendered into the video and cannot be opened in the caption editor. The portfolio now preserves that distinction instead of suggesting every output supports transcript edits.

The homepage project description and project-page copy include both workflows. `Explore Looks` links directly to the feature page. The displayed image is a fresh 1440 × 820 reduced-motion public-page capture, `public/projects/mossclip/mossclip-looks.webp`, showing the same source clip in all four treatments. Reduced motion keeps the documented comparison posters stable for the capture; the video sources were also inspected with motion enabled. The former homepage image remains preserved.

This verifies the public presentation and examples, not a new authenticated clip-generation job, latency benchmark or billing test. The first refresh's live desktop/mobile, metadata, redirect and theme checks passed on `5124954`; the follow-up checks focus on the changed copy, feature link and image.

The follow-up direct TypeScript check, focused ESLint check on `src/data/portfolio.ts`, and whitespace check passed. A full production build remains skipped under the laptop-safe validation policy.

## Engineering and product ownership — 2026-10-05

The owner asked for Claude Code memories to be reviewed and for the portfolio to acknowledge product ownership and the Discord beta. The public feature page alone had supported a feature summary, but did not convey the engineering or the work of bringing users into the product.

The saved Claude project memory was read under `C:/Users/Krishna/.claude/projects/d--Workspace-Github-Projects-gp2/memory/`. Its editor and concurrency notes describe earlier implementations, so they were treated as historical context rather than current production proof. Newer evidence came from gp2's `docs/2026-10-03-claude-chalk-sketch-kits.md` and `docs/2026-10-03-discord-beta-gate.md`, alongside `D:/Workspace/Greenpost-Style-Lab/{chalk,sketch2,paper}/README.md`, the Chalk director compiler and Modal service source. Lab files and old release notes do not establish current deployment state; no production audit or paid generation job was run.

The resulting portfolio claims describe the architecture without publishing private configuration or making latency or adoption claims: validated AI scene direction, timed words and camera cuts, speaker-aware layout, tracking and matting where needed, custom compositors, parallel render workers and verified input/engine/output identity. The Product section describes the owner's product and visual direction, recruited Discord community, onboarding, account access and the channel for first-use support and feedback. The owner reported about 15 community members, some beta testers; this is not described as 15 active users or proof of retention.

Mossclip's role is now `Independent Product Builder / AI Engineer`. Its overview stays brief, with two additional text sections, Engineering and Product. Optional typed project details reuse the existing project-page typography and spacing; other projects retain their existing content.

The direct TypeScript check, focused ESLint check on the changed TypeScript files and whitespace check passed. Browser acceptance checks all three text sections at desktop, 390 px and 360 px, the source image and link, section spacing and no horizontal overflow, with Remalt as a control for the optional detail rendering. The heavy build remains skipped.

## Public capability copy — 2026-10-05

The owner asked to describe the technical capabilities without disclosing the implementation. The Engineering paragraph now describes speech-synced illustrations, captions and scene changes; chalk and pen animation; moving cut-outs; stop-motion collage; animated numbers; sound effects; and 1080p vertical output. These capabilities are grounded in the feature page and the engine/style notes inspected above. Scene planning, infrastructure/provider details and integrity-check terminology have been removed from the public copy. Future portfolio edits should preserve this boundary: describe what the system enables, keep the implementation in internal documentation.
