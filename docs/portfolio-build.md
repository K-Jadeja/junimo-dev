# Portfolio design-lab build notes

## Direction reset

The first portfolio surface was rejected because it combined a warm beige canvas, oversized hero type, numbered mono labels, cobalt underline, grain, sticky blur, repeated reveals, dark faux-dashboard stages, and repeated project sections. That surface is no longer rendered at `/` or by the design lab.

The reset preserves:

- the Next.js App Router and TypeScript setup;
- typed content in `src/data/portfolio.ts`;
- static `/work/[slug]` project routes;
- the accessible menu foundations in `SiteHeader`;
- the replaceable, near-viewport-aware `ProjectMedia` video path;
- factual project and experience copy.

The active root is now a neutral handoff page. The work-in-progress directions live at `/design-lab?variant=a|b|c` and are intentionally not selected for production.

## Prototype contracts

- Variant A is a narrow, list-first index with a shared preview that responds to pointer hover, keyboard focus, and touch/click.
- Variant B is a product-led composition with different project arrangements and authentic public captures as the only visual surfaces.
- Variant C is a dense directory with one shared preview surface. Its state changes only after a user interaction; there is no scroll choreography.

All three avoid automatic reveal animation, grain, fake browser chrome, decorative number systems, faux dashboards, and the previous cobalt/ivory identity. The only CSS movement left in the lab is a small image scale and link transition.

## Reference workflow

`pnpm qa:references` launches the installed Chrome executable through Playwright and captures all six requested references at desktop and mobile widths, plus public Remalt, GreenPost, and Project Doru surfaces. The current evidence and concrete measurements are recorded in [`reference-analysis.md`](reference-analysis.md).

## Media workflow

The lab uses public-page captures cropped from the fresh Playwright screenshots:

```text
public/projects/remalt/remalt-public.webp
public/projects/greenpost/greenpost-public.webp
public/projects/project-doru/project-doru-public.webp
```

No private dashboards, authenticated pages, personal data, or synthetic UI illustrations are used by the lab. The old generated WebP files remain unreferenced in the working tree because binary deletion is intentionally deferred until the direction is approved.
