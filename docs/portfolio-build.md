# Portfolio build notes

## Current direction

The active homepage is a dark personal site built around the reduction of Paco Coursey and Lee Robinson:

- near-black background, soft off-white text, and quiet grey secondary text;
- a compact single-person introduction rather than a landing-page hero;
- Paco-style wide desktop alignment with a narrow readable text rhythm;
- direct links, short lists, and no conventional navigation bar;
- one expressive object only: the approved v4 canvas pixel-dot hanging bulb that drops, settles, then lights the intro area;
- no cards, bento grid, grain, gradients outside the bulb glow, scroll choreography, or marketing CTA.

The bulb lives in `src/components/flexible-pixel-bulb.tsx` and is ported directly from `references/approved-bulb-v4/junimo-bulb-preview-v4.html`. Its local 2D canvas retains the source Path2D geometry, dot generation, rope particle/constraint simulation, fixed ceiling anchor, slack-to-taut motion, body rotation, ignition timing, staggered illumination, and filament spark. Ambient emission is rendered separately on a full-viewport canvas, anchored to the bulb's viewport position so the light cannot drift toward a fixed screen point or be clipped by the oversized local bulb canvas. The component is local to `.home-intro`, uses one canvas ref and one container ref, observes resize and scroll position, clamps drawing-buffer ratios to the source's maximum of 2, and cancels its frame/listeners on unmount. Reduced-motion mode starts at the final lit state without running the drop.

The source prototype also contains the global light-theme transition. The port keeps the bulb-origin story while treating the theme change as a real continuous palette interpolation: the page background, foreground, muted text, borders, and warm accent move together from the source palette to the target palette. A soft radial field and a low-opacity Bayer-ordered fringe provide local texture without replacing the page with hard target-colored pixel blocks. Turning on uses the longer ignition/diffusion pass; turning off contracts faster with a short warm afterglow. A mid-transition click reverses from the current interpolation point.

## Theme transition motion contract (2026-08-02)

The bulb is the source of the theme change, not a mask that wipes one page color over another:

- the body `--bg` value must be interpolated every animation frame, so an in-progress transition is visibly between the dark and light palettes;
- foreground and border variables must use the same eased progress as the background, without CSS transitions lagging behind the frame loop;
- ambient emission must be rendered on the full-viewport canvas from the bulb's current viewport center; never aim it at a hardcoded screen target or draw it only inside the clipped local bulb canvas;
- the canvas may add a restrained radial lead, warm afterglow, and low-opacity pixel fringe, but it must not paint opaque occupied target-background cells;
- dark-mode activation waits briefly, ignites during the longer transition, and preserves the lit state when the target theme commits;
- reduced motion commits immediately, and a second activation during a transition reverses from the current progress;
- `pnpm qa:flexible-pixel-bulb` checks intermediate colors, both final themes, and reversal behavior in addition to the existing bulb interaction gates.

## Bulb swing clipping fix (2026-08-02)

The swinging canvas must be allowed to paint outside both the intro and the homepage container. An `overflow-x: clip` or `hidden` rule on either ancestor creates a hard black edge over the bulb during the drop and swing. The page container therefore stays overflow-visible, while the root `html`/`body` viewport uses `overflow-x: clip` to prevent a horizontal scrollbar without clipping the local effect at an inner layout boundary. The bulb QA gate asserts both ancestor overflow values.

## Browser QA workflow

`pnpm qa:references` launches the installed Chrome executable through Playwright and captures the requested reference pages at desktop and mobile widths. The concrete measurements and observations are in [`reference-analysis.md`](reference-analysis.md).

`pnpm qa:local` captures `/` and the direct project routes at 1440px, 1024px, 390px, and 360px. It removes the development-only Next issue badge and waits for `.flexible-pixel-bulb[data-renderer="canvas"][data-state="lit"]` before capturing the homepage, so the screenshot represents the settled interaction rather than its entrance frame. `pnpm qa:flexible-pixel-bulb` verifies the v4 renderer marker, high-DPI drawing buffer, absence of the deleted bulb DOM, taut rope progression, unclipped hero canvas, reduced-motion behavior, drag/release interaction, overflow, and browser errors. `pnpm qa:capture-bulb-v4` captures the first, slack, taut/swing, ignition, final-lit, mobile, and reduced-motion verification frames under `artifacts/bulb-v4/`.

## Media

The homepage uses authentic public-page captures:

```text
public/projects/remalt/remalt-public.webp
public/projects/greenpost/greenpost-public.webp
public/projects/project-doru/project-doru-public.webp
```

No authenticated dashboards, private data, synthetic interfaces, or browser frames are used. Future MP4/WebM replacement is documented in the root README and only requires changing a project's typed `media` object.
