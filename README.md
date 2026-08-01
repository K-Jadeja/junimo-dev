# Krishnasinh Jadeja — portfolio

An editorial, media-led portfolio for Krishnasinh Jadeja, built with the Next.js App Router, TypeScript, Tailwind CSS v4 and Motion for React.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Project media

The homepage and case studies read project content from `src/data/portfolio.ts`. Each project has a typed `media` object:

```ts
media: {
  type: "image" | "video",
  src: string,
  poster?: string,
  alt: string,
  aspectRatio?: string,
}
```

The current WebP files are project-specific temporary compositions:

- `public/projects/remalt/remalt-temporary.webp`
- `public/projects/greenpost/greenpost-temporary.webp`
- `public/projects/project-doru/project-doru-temporary.webp`

The editable SVG sources sit next to them for future art direction. They are honest placeholders, not private dashboard captures.

### Replacing a placeholder with a demo video

1. Add the MP4 or WebM file to the project folder, for example `public/projects/remalt/remalt-demo.mp4`.
2. Add a poster image beside it, for example `public/projects/remalt/remalt-poster.webp`.
3. In `src/data/portfolio.ts`, change only that project’s `media` object:

   ```ts
   media: {
     type: "video",
     src: "/projects/remalt/remalt-demo.mp4",
     poster: "/projects/remalt/remalt-poster.webp",
     alt: "Remalt product demo showing connected research and AI workflows.",
     aspectRatio: "16 / 10",
   }
   ```

4. Keep the aspect ratio stable and provide a poster with the same crop. No layout component changes are required.

`ProjectMedia` keeps videos muted, loops them only when near the viewport, pauses them when they leave the viewport, and avoids autoplay when `prefers-reduced-motion` is enabled.

## Resume

No resume PDF was present in the repository, so the navigation intentionally does not include a broken resume link. If one is added later, place it at `public/resume/krishnasinh-jadeja.pdf` and add the link to `src/components/site-header.tsx`.

## Design research notes

The visual system was informed by a direct review of [Paco Coursey](https://paco.me), [Emil Kowalski](https://emilkowal.ski), [Rauno Freiberg](https://rauno.me), [Brian Lovin](https://brianlovin.com), [Carl Barenbrug](https://carlbarenbrug.com), and [Lee Robinson](https://leerob.com). The implementation uses the shared principles of compact navigation, editorial spacing, project-led structure, restrained motion, and short personal copy while keeping the visual identity original.

Public project references checked during the build: [Remalt](https://remalt.com), [GreenPost](https://greenpost.46.62.255.217.sslip.io/en), and [Project Doru](https://projectdoru.46.62.255.217.sslip.io/). Authenticated surfaces were not accessed.
