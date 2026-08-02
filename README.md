# Krishnasinh Jadeja

A dark, text-led personal homepage for Krishnasinh Jadeja, built with the Next.js App Router and TypeScript.

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

Playwright uses the installed Chrome executable for reference, interaction, and local screenshot passes. `qa:local` captures the homepage and direct project routes at 1440px, 1024px, 390px, and 360px and waits for the bulb's settled light-on state.

## Bulb interaction

The hanging bulb is implemented in `src/components/flexible-pixel-bulb.tsx` as a direct React/TypeScript port of the executable v4 prototype in `references/approved-bulb-v4/junimo-bulb-preview-v4.html`. It keeps the prototype's Path2D silhouette, dot pitch, luminance/dropout functions, rope constraints, anchor, drop, swing, ignition sweep, filament, halo, and directional beam in one dependency-free canvas. The component uses a ResizeObserver, a clamped device-pixel ratio, and full animation/listener cleanup. It detects `prefers-reduced-motion` and starts at the final lit frame without the physics drop.

The bulb can be dragged through the transparent pointer target. Clicking it runs the approved v4 extinguish/ignite behavior and the prototype's radial pixel transition between the dark and light page themes. The transition canvas is created and removed with the component, while the bulb canvas remains local to the intro.

Run the issue-specific browser gate with:

```bash
pnpm qa:flexible-pixel-bulb
pnpm qa:capture-bulb-v4
```

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

The homepage currently uses:

- `public/projects/remalt/remalt-public.webp`
- `public/projects/greenpost/greenpost-public.webp`
- `public/projects/project-doru/project-doru-public.webp`

### Replacing a screenshot with a future demo video

1. Add the video and poster to the matching project directory:

   ```text
   public/projects/remalt/remalt-demo.mp4
   public/projects/remalt/remalt-poster.webp
   ```

2. Change only that project's `media` object in `src/data/portfolio.ts`:

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

## Now content

Edit the typed `now` object in `src/data/portfolio.ts`. Populate `building`, `exploring`, `playing`, `listening`, `reading`, or `outsideWork`; empty optional fields are not rendered. `updatedAt` controls the small date shown beside the section.

## Resume

No resume PDF is present, so the resume link is hidden. If one is added, place it at `public/resume/krishnasinh-jadeja.pdf` and add it to the quiet link group in `src/app/page.tsx`.

## Research

The browser measurements and visual observations for Paco Coursey, Lee Robinson, and the other reference pages are recorded in [`docs/reference-analysis.md`](docs/reference-analysis.md). The current homepage uses their reduction and rhythm as principles without copying their writing, code, or assets.
