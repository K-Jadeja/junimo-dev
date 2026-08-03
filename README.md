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
pnpm qa:sushi
```

Playwright uses the installed Chrome executable for reference, interaction, and local screenshot passes. `qa:local` captures the homepage and direct project routes (`/remalt`, `/sushi`, `/greenpost`, `/project-doru`) at 1440px, 1024px, 390px, and 360px and waits for the bulb's settled entrance state. `qa:sushi` checks the standalone Sushi browser-lab routes, Junimo branding, COOP/COEP headers, and critical speech/runtime assets without downloading models or opening the microphone. Legacy `/work/:slug` links permanently redirect to the root project routes.

## Bulb interaction

The hanging bulb is implemented in `src/components/flexible-pixel-bulb.tsx` as a fixed poster-style assembly. The processed transparent asset in `public/assets/omori-bulb-body.png` contains only the bulb body and socket; the wire is a separate three-pixel DOM line, anchored at `50.7%` to match the socket and extended above the viewport so its animated top edge is never visible. The assembly enters once with a vertical CSS drop and remains pinned to the upper-right viewport position. There is no rope simulation, swing, drag state, or canvas body renderer.

The bulb is a keyboard- and pointer-accessible button. Clicking it toggles the light and dark page themes. The transition canvas provides only a soft bulb-origin glow while the page palette and two transparent bulb layers crossfade continuously: the original dark asset is used in light mode, while the same asset is warm-tinted for dark mode. Reduced-motion users get the final pinned position without the entrance animation.

Run the issue-specific browser gate with:

```bash
pnpm qa:flexible-pixel-bulb
pnpm qa:capture-bulb-poster
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

The project routes currently use:

- `public/projects/remalt/remalt-public.webp`
- `public/projects/sushi/sushi-swarm-public.png`
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
