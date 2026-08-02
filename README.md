# Krishnasinh Jadeja

A small, text-led personal homepage for Krishnasinh Jadeja, built with the Next.js App Router and TypeScript.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm qa:references
pnpm qa:local
```

`playwright` uses the installed Chrome executable for the reference and local screenshot passes. `qa:local` captures the homepage and direct project routes at 1440px, 1024px, 390px, and 360px.

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

The homepage currently uses authentic public-page captures:

- `public/projects/remalt/remalt-public.webp`
- `public/projects/greenpost/greenpost-public.webp`
- `public/projects/project-doru/project-doru-public.webp`

### Replacing a screenshot with a future demo video

1. Add the video and poster to the matching project directory, for example:

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

3. Keep the poster crop and `aspectRatio` identical to the video. No homepage layout changes are required.

`ProjectMedia` keeps videos muted, loops them only near the viewport, pauses them when they leave the viewport, and avoids autoplay when reduced motion is requested.

## Resume

No résumé PDF is present, so the résumé link is hidden. If one is added, place it at `public/resume/krishnasinh-jadeja.pdf` and add it to the quiet link group in `src/app/page.tsx`.

## Research

The concrete browser measurements and visual observations for the six requested references are recorded in [`docs/reference-analysis.md`](docs/reference-analysis.md). The current homepage follows the reduction lessons from Paco Coursey and Emil Kowalski without copying their writing, code, or assets.
