# Sushi portfolio integration

Sushi is the public-facing name of the client-side AI project in
`D:\Workspace\Github-Projects\clientsideai` (the repository remote is
`K-Jadeja/sushi`). Junimo presents it as a current independent project rather
than copying the source repository's Jekyll shell or browser-runtime code into
the portfolio app.

## Portfolio mapping

- The project data lives in `src/data/portfolio.ts` under the `sushi` slug.
- The homepage description is intentionally short: local AI, speech and
  real-time experiments in the browser.
- The case page uses the existing Junimo shell, the Junimo bulb-led palette,
  and the source repository's Swarm screenshot at
  `public/projects/sushi/sushi-swarm-public.png`.
- The case-page link points to the canonical GitHub repository and is labelled
  `View on GitHub` so it is distinct from the hosted products in the portfolio.

## Source-grounded feature summary

The description is based on the checked-out clientsideai code and docs:

- browser-local LLM demos with selectable Smol and Gemma providers;
- speech-to-text, text-to-speech, and combined STT -> LLM -> TTS flows;
- browser experiments including Astres and the distributed Swarm demo;
- local persistence for model choice, chat history, and character persona.

When the project gets a public hosted demo, update only the `url` and
`linkLabel` fields if the preferred destination changes. Keep the portfolio
visual tied to an authentic checked-in source capture, and do not copy model
weights, browser profiles, caches, or private runtime state into Junimo.
