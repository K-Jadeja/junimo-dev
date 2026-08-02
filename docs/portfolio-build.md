# Portfolio build notes

## Current direction

The active homepage is a dark personal site built around the reduction of Paco Coursey and Lee Robinson:

- near-black background, soft off-white text, and quiet grey secondary text;
- a compact single-person introduction rather than a landing-page hero;
- Paco-style wide desktop alignment with a narrow readable text rhythm;
- direct links, short lists, and no conventional navigation bar;
- one expressive object only: a pixel-dot hanging bulb that drops, settles, then lights the intro area;
- no cards, bento grid, grain, gradients outside the bulb glow, scroll choreography, or marketing CTA.

The bulb lives in `src/components/light-bulb.tsx`. It uses a small requestAnimationFrame simulation with gravity, restitution, angular damping, and a short delayed light-on state. The DOM stays crisp and the page remains readable if JavaScript is delayed. Reduced-motion mode places the bulb in position and enables the softer light state immediately through CSS.

## Browser QA workflow

`pnpm qa:references` launches the installed Chrome executable through Playwright and captures the requested reference pages at desktop and mobile widths. The concrete measurements and observations are in [`reference-analysis.md`](reference-analysis.md).

`pnpm qa:local` captures `/` and the direct project routes at 1440px, 1024px, 390px, and 360px. It removes the development-only Next issue badge and waits for `.light-bulb.is-lit` before capturing the homepage, so the screenshot represents the settled interaction rather than its entrance frame.

## Media

The homepage uses authentic public-page captures:

```text
public/projects/remalt/remalt-public.webp
public/projects/greenpost/greenpost-public.webp
public/projects/project-doru/project-doru-public.webp
```

No authenticated dashboards, private data, synthetic interfaces, or browser frames are used. Future MP4/WebM replacement is documented in the root README and only requires changing a project's typed `media` object.
