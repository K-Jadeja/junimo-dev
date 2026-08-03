# Portfolio build notes

## Current direction

The active homepage is a dark personal site built around the reduction of Paco Coursey and Lee Robinson:

- near-black background, soft off-white text, and quiet grey secondary text;
- a compact single-person introduction rather than a landing-page hero;
- a text-first index with Projects, Writing, Now and More sections that can grow without changing the layout model;
- Paco-style wide desktop alignment with a narrow readable text rhythm;
- direct links, short lists, and no conventional navigation bar;
- one expressive object only: the processed Omori poster bulb that drops vertically into the upper-right corner and lights the intro area;
- no cards, bento grid, grain, gradients outside the bulb glow, scroll choreography, or marketing CTA.

The bulb lives in `src/components/flexible-pixel-bulb.tsx` as a fixed DOM assembly. `public/assets/omori-bulb-body.png` is the post-processed transparent bulb body and socket; the poster wire is intentionally separate as a three-pixel line, extended above the viewport to the socket so its animated top edge is never visible. The assembly is pinned to the upper-right and uses one vertical CSS entrance animation with no physics, swing, drag, rotation, or pixel-art renderer. The theme canvas remains full-viewport and only supplies a restrained bulb-origin glow during theme changes. Reduced-motion mode starts at the final pinned position.

The light-theme transition keeps the bulb-origin story while treating the theme change as a real continuous palette interpolation: the page background, foreground, muted text, borders, wire, and bulb layers move together from the source palette to the target palette. A soft radial field supplies atmosphere without a black-and-white wave or pixel-art wipe. A mid-transition click reverses from the current interpolation point.

## Theme transition motion contract (2026-08-02)

The bulb is the source of the theme change, not a mask that wipes one page color over another:

- the body `--bg` value must be interpolated every animation frame, so an in-progress transition is visibly between the dark and light palettes;
- foreground and border variables must use the same eased progress as the background, without CSS transitions lagging behind the frame loop;
- the separate wire and transparent bulb layers must use that same eased palette progress; the committed `body[data-theme]` value must never be the renderer's binary color switch;
- ambient emission must be rendered on the full-viewport canvas from the bulb's current viewport center; never aim it at a hardcoded screen target or draw it only inside the clipped local bulb canvas;
- the theme canvas may add only a restrained radial lead and warm afterglow; it must not paint an opaque target-background wipe;
- dark-mode activation waits briefly, ignites during the longer transition, and preserves the lit state when the target theme commits;
- the light asset opacity must move toward the target palette: light-to-dark starts with the black light-mode asset visible and ends with the warm dark-mode asset visible, while dark-to-light does the inverse;
- reduced motion commits immediately, and a second activation during a transition reverses from the current progress;
- the entrance has one explicit `data-entry="settled"` completion marker, and the resting state never depends on a simulated rope or a post-animation snap;
- `pnpm qa:flexible-pixel-bulb` checks intermediate colors, both final themes, and reversal behavior in addition to the existing bulb interaction gates.

## Theme-aware native scrollbar (2026-08-03)

The document keeps the browser's native scrollbar, but its track, thumb and hover colors follow the same dark/light palette as the page. The scroll container is the root `html` element, so the renderer updates the scrollbar variables on that element during the bulb transition and commits the matching final palette with `html[data-theme]`. The focused bulb QA gate checks the dark, in-transition and light scrollbar states alongside the page colors.

## Theme asset-direction regression (2026-08-03)

The light-to-dark transition briefly showed the warm bulb, faded toward the black asset, then snapped back to warm at completion. The root cause was the transparent layer opacity mapping: the palette progress was assigned directly to the light layer even when the target palette was dark. The renderer now derives light-layer progress from the target theme, and `pnpm qa:flexible-pixel-bulb` asserts that light-to-dark begins with the light-mode asset dominant before the final warm layer commits.

## Wire weight correction (2026-08-03)

The original one-pixel wire read as a hairline next to the poster bulb at the captured viewport scale. The first correction made it a centered two-pixel DOM line, with the browser QA gate checking its width on both desktop and narrow viewports while preserving the same socket connection and no-overflow contract.

The next capture exposed the animated wire's rounded top edge while the bulb was dropping. The wire is now three pixels wide, anchored at `50.7%` to match the socket, and starts two stable viewport heights above the assembly. Static `vh` geometry keeps that hidden extension from being recomputed while mobile browser chrome responds to scrolling, so only the socket connection is visible throughout the entrance animation.

## Responsive wire connection regression (2026-08-03)

The mobile media query shortened the wire to `60px` without moving its `-200vh` origin, leaving the entire line above the viewport and a `722px` gap before the socket at a 376px × 362px viewport. The assembly now owns one `--bulb-socket-top` value that drives its height, the wire's calculated length, and the toggle position. Desktop keeps the fluid `clamp()` offset; mobile sets the shared offset to `58px`, preserving the hidden wire end and the socket connection at every tested viewport. `pnpm qa:flexible-pixel-bulb` checks the connection at 1440px, 1024px, 376px, 390px, and 360px widths.

## Minimal interaction chrome (2026-08-03)

The bulb is intentionally self-explanatory as the only interactive object on the page. The temporary `click to switch light` helper label was removed from the DOM and stylesheet so the poster silhouette remains the sole visual instruction; the focused bulb QA gate asserts that the instructional hint is absent.

## Viewport-fixed poster bulb (2026-08-02)

The bulb layer is `position: fixed` with a full-viewport wrapper, so the straight wire, bulb, and light stay pinned to the upper-right viewport corner during document scroll. The page container stays overflow-visible, while the root `html`/`body` viewport uses `overflow-x: clip` to prevent a horizontal scrollbar. The bulb QA gate asserts the asset load, vertical wire-to-socket connection, no-physics contract, narrow viewport bounds, zero body expansion, and unchanged bulb bounds before and after scrolling.

## Browser QA workflow

`pnpm qa:references` launches the installed Chrome executable through Playwright and captures the requested reference pages at desktop and mobile widths. The concrete measurements and observations are in [`reference-analysis.md`](reference-analysis.md).

`pnpm qa:local` captures `/` and the direct project routes at 1440px, 1024px, 390px, and 360px. It removes the development-only Next issue badge and waits for `.flexible-pixel-bulb[data-renderer="poster-dom"][data-entry="settled"]` before capturing the homepage. `pnpm qa:flexible-pixel-bulb` verifies the processed asset, straight wire connection, vertical entrance contract, no-physics renderer, theme crossfade, viewport-fixed positioning, scroll invariance, reduced-motion behavior, overflow, and browser errors. `pnpm qa:capture-bulb-poster` captures the entrance, settled dark/light themes, mobile, and reduced-motion frames under `artifacts/bulb-poster/`.

The 2026-08-03 Paco spacing refinement was source-audited against the public CSS because the in-app browser backend was unavailable. The focused local Playwright navigation check then hit the laptop's native out-of-memory guard; `node --check`, the direct TypeScript check, ESLint, and `git diff --check` remain the lightweight validation path until browser capacity is available.

## Asset processing record (2026-08-02)

The source was the bulb poster from the [Omori Posters Behance project](https://www.behance.net/gallery/174856393/Omori-Posters). The poster background, title text, and source wire were removed; the bulb silhouette, socket, and transparent internal marks were preserved in `public/assets/omori-bulb-body.png`. The source poster is not inverted at runtime. Instead, the transparent asset is crossfaded between its original near-black treatment for light mode and a controlled warm tint for dark mode, which keeps the negative-space artwork correct in both themes.

## Layout and page navigation (2026-08-02, updated 2026-08-03)

The page geometry borrows the actual mechanics from [Paco Coursey](https://paco.me/): the content column is `640px` wide with `24px` minimum side gutters, and the top offset is `128px` on desktop and `64px` below `768px`. The type stack and tracking continue to follow the ZeroLimits source comparison. The document uses native `scroll-behavior: smooth`; there is no invented scrollbar widget.

The reference also opts into the browser View Transition API with `@view-transition { navigation: auto; }`. Junimo keeps that rule and wraps its existing Next client navigation with `document.startViewTransition()` in `src/components/page-transition.tsx`, because Next `Link` changes the document in place instead of performing a full page navigation. The route update resolves the native transition after the new pathname is committed, while unsupported browsers use the normal Next navigation path. `pnpm qa:navigation` checks the 640px/24px Paco shell and 128px/64px top offsets at desktop and mobile widths, and verifies both forward and return internal links enter the native transition bridge.

## Media

The case-study routes use authentic public-page captures:

```text
public/projects/remalt/remalt-public.webp
public/projects/greenpost/greenpost-public.webp
public/projects/project-doru/project-doru-public.webp
public/projects/sushi/sushi-swarm-public.png
```

No authenticated dashboards, private data, synthetic interfaces, or browser frames are used. Future MP4/WebM replacement is documented in the root README and only requires changing a project's typed `media` object.

## First text-index pass (2026-08-03)

The homepage was reduced after a fresh Playwright review of Paco Coursey, Emil Kowalski, ZeroLimits.dev, trucs.ai, Lee Robinson and Brian Lovin. The shared pattern is a narrow text column, a small functional type scale, direct project descriptions, and personality expressed through copy rather than homepage media.

- The homepage now uses Paco's 640px content measure, 24px minimum side gutters and responsive top offset, with the `ui-sans-serif, sans-serif` stack from ZeroLimits; line-height and normal tracking remain the reference baseline.
- Projects use a dedicated Brian Lovin-style `ProjectList`: one clean title-plus-description row on desktop, stacked on narrow screens, 6px desktop row rhythm, no padded hover block, and title-only hover emphasis. The preview image, project roles, preview toggles and three-column label rail stay off the homepage.
- The homepage does not include a separate Experience section; current work belongs in the intro and future context can live in Now.
- Writing is a first-class section with seven browser-verified thread entries. It uses detailed, curiosity-driven title-only links, with wording grounded in the linked posts rather than inventing article claims.
- Open source is its own compact index. It surfaces the Featurebase MCP, Gatito Trans Twitch translator, Subscription Tracker Agent, Autonomous Research Agent and Zapier-LangChain Agent, while the GitHub link remains the path to the full archive.
- The existing bulb remains the only expressive visual object. It has no instructional helper text, and the rest of the page avoids an accent system, cards, badges and embedded social widgets.
- New projects and writing entries are data-driven: add one item to `src/data/portfolio.ts` and the shared `PortfolioList` handles the homepage row layout.

## Writing index title treatment (2026-08-03)

The Writing section intentionally does not reuse the Projects descriptions. Its seven links use specific, curiosity-driven titles that carry the useful context themselves, while the title-only treatment keeps the index quick to scan. Titles wrap naturally when needed, and the scoped rule does not affect Projects, Open source or other homepage sections.

Focused Playwright checks should assert seven Writing links, no Writing description nodes, visible title text without ellipsis, the stacked mobile direction, and no horizontal overflow.

## Typography middle ground (2026-08-03)

The homepage typography was source-audited against [ZeroLimits.dev](https://github.com/noClaps/zerolimits.dev) and [Brian Lovin's briOS](https://github.com/brianlovin/briOS). ZeroLimits establishes Junimo's system UI sans, normal tracking and restrained editorial voice; briOS contributes the more legible scale, `font-medium` primary labels, 1.6-style leading and clearer primary/secondary contrast. Junimo keeps the existing family and tracking, but now uses 17px body copy, 18px project/list labels, a 24px intro, stronger 500/600 weights, and 27–34px leading so the page sits between both references without importing a second font dependency.

## ZeroLimits weight alignment (2026-08-03)

Junimo now mirrors ZeroLimits' rendered weight pattern: 400 for body-level copy, navigation, metadata and external links; 700 for heading and title roles; and `font-synthesis-weight: auto` so the browser can resolve weights the same way. Existing Junimo font sizes and layout remain unchanged. Because `case-label` is shared by the Overview heading and smaller navigation/lab labels, only `h2.case-label` receives the 700 heading weight.

## Minimal project pages and route shape (2026-08-03)

Project detail pages now share the homepage's text-first language: the same shell and wordmark, one eyebrow, one title, one description, one quiet context line, one external link, an unboxed project capture, one short overview and simple previous/next navigation. The label rail, breadcrumb, metadata blocks, bordered media card, ownership, challenges, outcomes, technology grouping and decorative bullets were removed to keep the pages focused on the work itself. Canonical project URLs are now `/${slug}` (`/remalt`, `/sushi`, `/greenpost`, `/project-doru`); the previous `/work/${slug}` paths permanently redirect to the root route for link continuity.

The follow-up content trim (2026-08-03) also removed the unused long-form case-study fields from the project data model, so the removed sections cannot reappear through stale project data.
