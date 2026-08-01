# Krishnasinh Jadeja design lab

This checkout is currently a prototype lab for the next portfolio direction. The previous ivory/cobalt portfolio surface has been removed from the root route. The useful Next.js structure, typed content, project routes, accessible navigation foundations, and replaceable media system remain intact.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the neutral handoff at `http://localhost:3000/`, then choose a prototype:

- `http://localhost:3000/design-lab?variant=a` - Quiet index
- `http://localhost:3000/design-lab?variant=b` - Product editorial
- `http://localhost:3000/design-lab?variant=c` - Interactive directory

The root route intentionally does not select a winner. Each lab prototype uses the same facts and typed project data, but a different information architecture and interaction model.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm qa:references
pnpm qa:local
```

`playwright` uses the installed Chrome executable to capture the six reference sites, the three public project surfaces, and local responsive screenshots.

## Project media

Project content lives in `src/data/portfolio.ts`. Every project has a typed media object:

```ts
media: {
  type: "image" | "video",
  src: string,
  poster?: string,
  alt: string,
  aspectRatio?: string,
}
```

The design lab currently uses cropped, authentic public-page captures:

- `public/projects/remalt/remalt-public.webp`
- `public/projects/greenpost/greenpost-public.webp`
- `public/projects/project-doru/project-doru-public.webp`

The older synthetic placeholder files are no longer referenced by the data model or the lab prototypes. They are retained only in the working tree until the direction is approved and asset cleanup can be finalized.

### Replacing a project image with a future demo video

1. Put the MP4 or WebM file and its poster in the matching project folder, for example:

   ```text
   public/projects/remalt/remalt-demo.mp4
   public/projects/remalt/remalt-poster.webp
   ```

2. Change only that project’s `media` object in `src/data/portfolio.ts`:

   ```ts
   media: {
     type: "video",
     src: "/projects/remalt/remalt-demo.mp4",
     poster: "/projects/remalt/remalt-poster.webp",
     alt: "Remalt product demo showing connected research and AI workflows.",
     aspectRatio: "16 / 10",
   }
   ```

3. Keep the poster crop and `aspectRatio` identical to the video. No prototype layout component needs to change.

`ProjectMedia` keeps videos muted, loops them only near the viewport, pauses them when they leave the viewport, and does not autoplay them when reduced motion is requested.

## Resume

No resume PDF is present. The lab prototypes intentionally do not show a broken resume link. If one is added later, place it at `public/resume/krishnasinh-jadeja.pdf` and connect it from the selected direction’s navigation.

## Research

Concrete browser measurements and visual observations for Paco Coursey, Emil Kowalski, Rauno Freiberg, Brian Lovin, Carl Barenbrug, and Lee Robinson are in [`docs/reference-analysis.md`](docs/reference-analysis.md). The fresh captures are in `artifacts/references/`.
