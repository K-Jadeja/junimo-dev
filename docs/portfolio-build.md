# Portfolio build notes

## Current direction

The design-lab prototypes were rejected and removed. The active site is one small, text-led homepage inspired by the reduction and personal structure of Paco Coursey and Emil Kowalski:

- one sans-serif family;
- white background, near-black text, and quiet grey secondary text;
- a 680-740px reading column with an optional desktop project preview beside it;
- a compact introduction instead of a hero;
- projects, now, experience, elsewhere, and a plain footer;
- no sticky navigation, visual numbering, accent palette, grain, cards, gradients, reveal choreography, or marketing CTA.

## Browser QA workflow

`pnpm qa:references` launches the installed Chrome executable through Playwright and captures the six requested references at desktop and mobile widths. The measurements and concrete visual observations are in [`reference-analysis.md`](reference-analysis.md).

`pnpm qa:local` captures `/` and the direct project routes at 1440px, 1024px, 390px, and 360px. It removes the development-only Next issue badge from screenshots so the evidence represents the page itself.

## Media

The current homepage uses only authentic public-page captures:

```text
public/projects/remalt/remalt-public.webp
public/projects/greenpost/greenpost-public.webp
public/projects/project-doru/project-doru-public.webp
```

No authenticated dashboards, private data, synthetic interfaces, or browser frames are used. Future MP4/WebM replacement is documented in the root README and only requires changing a project’s typed `media` object.
