# Portfolio build notes

## Current direction

The active homepage is a dark personal site built around the reduction of Paco Coursey and Lee Robinson:

- near-black background, soft off-white text, and quiet grey secondary text;
- a compact single-person introduction rather than a landing-page hero;
- Paco-style wide desktop alignment with a narrow readable text rhythm;
- direct links, short lists, and no conventional navigation bar;
- one expressive object only: the processed Omori poster bulb that drops vertically into the upper-right corner and lights the intro area;
- no cards, bento grid, grain, gradients outside the bulb glow, scroll choreography, or marketing CTA.

The bulb lives in `src/components/flexible-pixel-bulb.tsx` as a fixed DOM assembly. `public/assets/omori-bulb-body.png` is the post-processed transparent bulb body and socket; the poster wire is intentionally separate as a one-pixel line from the viewport ceiling to the socket. The assembly is pinned to the upper-right and uses one vertical CSS entrance animation with no physics, swing, drag, rotation, or pixel-art renderer. The theme canvas remains full-viewport and only supplies a restrained bulb-origin glow during theme changes. Reduced-motion mode starts at the final pinned position.

The light-theme transition keeps the bulb-origin story while treating the theme change as a real continuous palette interpolation: the page background, foreground, muted text, borders, wire, and bulb layers move together from the source palette to the target palette. A soft radial field supplies atmosphere without a black-and-white wave or pixel-art wipe. A mid-transition click reverses from the current interpolation point.

## Theme transition motion contract (2026-08-02)

The bulb is the source of the theme change, not a mask that wipes one page color over another:

- the body `--bg` value must be interpolated every animation frame, so an in-progress transition is visibly between the dark and light palettes;
- foreground and border variables must use the same eased progress as the background, without CSS transitions lagging behind the frame loop;
- the separate wire and transparent bulb layers must use that same eased palette progress; the committed `body[data-theme]` value must never be the renderer's binary color switch;
- ambient emission must be rendered on the full-viewport canvas from the bulb's current viewport center; never aim it at a hardcoded screen target or draw it only inside the clipped local bulb canvas;
- the theme canvas may add only a restrained radial lead and warm afterglow; it must not paint an opaque target-background wipe;
- dark-mode activation waits briefly, ignites during the longer transition, and preserves the lit state when the target theme commits;
- reduced motion commits immediately, and a second activation during a transition reverses from the current progress;
- the entrance has one explicit `data-entry="settled"` completion marker, and the resting state never depends on a simulated rope or a post-animation snap;
- `pnpm qa:flexible-pixel-bulb` checks intermediate colors, both final themes, and reversal behavior in addition to the existing bulb interaction gates.

## Viewport-fixed poster bulb (2026-08-02)

The bulb layer is `position: fixed` with a full-viewport wrapper, so the straight wire, bulb, and light stay pinned to the upper-right viewport corner during document scroll. The page container stays overflow-visible, while the root `html`/`body` viewport uses `overflow-x: clip` to prevent a horizontal scrollbar. The bulb QA gate asserts the asset load, vertical wire-to-socket connection, no-physics contract, narrow viewport bounds, zero body expansion, and unchanged bulb bounds before and after scrolling.

## Browser QA workflow

`pnpm qa:references` launches the installed Chrome executable through Playwright and captures the requested reference pages at desktop and mobile widths. The concrete measurements and observations are in [`reference-analysis.md`](reference-analysis.md).

`pnpm qa:local` captures `/` and the direct project routes at 1440px, 1024px, 390px, and 360px. It removes the development-only Next issue badge and waits for `.flexible-pixel-bulb[data-renderer="poster-dom"][data-entry="settled"]` before capturing the homepage. `pnpm qa:flexible-pixel-bulb` verifies the processed asset, straight wire connection, vertical entrance contract, no-physics renderer, theme crossfade, viewport-fixed positioning, scroll invariance, reduced-motion behavior, overflow, and browser errors. `pnpm qa:capture-bulb-poster` captures the entrance, settled dark/light themes, mobile, and reduced-motion frames under `artifacts/bulb-poster/`.

## Asset processing record (2026-08-02)

The source was the bulb poster from the [Omori Posters Behance project](https://www.behance.net/gallery/174856393/Omori-Posters). The poster background, title text, and source wire were removed; the bulb silhouette, socket, and transparent internal marks were preserved in `public/assets/omori-bulb-body.png`. The source poster is not inverted at runtime. Instead, the transparent asset is crossfaded between its original near-black treatment for light mode and a controlled warm tint for dark mode, which keeps the negative-space artwork correct in both themes.

## Media

The homepage uses authentic public-page captures:

```text
public/projects/remalt/remalt-public.webp
public/projects/greenpost/greenpost-public.webp
public/projects/project-doru/project-doru-public.webp
```

No authenticated dashboards, private data, synthetic interfaces, or browser frames are used. Future MP4/WebM replacement is documented in the root README and only requires changing a project's typed `media` object.
