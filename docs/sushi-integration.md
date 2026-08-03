# Sushi portfolio integration

Sushi is the public-facing name of the client-side AI project in
`D:\Workspace\Github-Projects\clientsideai` (the repository remote is
`K-Jadeja/sushi`). Junimo presents it as a current independent project and
exposes the source repository's runnable browser experiments inside a branded
Sushi lab.

## Portfolio mapping

- The project data lives in `src/data/portfolio.ts` under the `sushi` slug.
- The homepage description is intentionally short: local AI, speech and
  real-time experiments in the browser.
- The case page uses the existing Junimo shell, the Junimo bulb-led palette,
  and the source repository's Swarm screenshot at
  `public/projects/sushi/sushi-swarm-public.png`.
- The case-page link points to the canonical GitHub repository and is labelled
  `View on GitHub` so it is distinct from the hosted products in the portfolio.

## Browser lab boundary

The case page stays in the Next.js shell. The runnable demos remain standalone
HTML pages under `public/sushi/` so their WebGPU, WebAssembly, worker,
AudioWorklet, model-picker, persona, and Live2D contracts stay intact:

- `/sushi/llm`
- `/sushi/tts`
- `/sushi/llm-tts`
- `/sushi/stt`
- `/sushi/stt-llm-tts`
- `/sushi/astres`
- `/sushi/classifier`
- `/sushi/swarm`

`next.config.mjs` rewrites each clean route to its local `index.html` and adds
the `same-origin` COOP plus `credentialless` COEP headers needed by the
browser runtimes. Each page has a base URL for its original directory, so
relative worker, module, worklet, iframe, and WASM paths continue to resolve
after the clean-route rewrite.

The integration intentionally excludes model weights, browser profiles,
Cache Storage, and private runtime state. Models and voice assets still load
from the original providers; on a fresh browser the existing pages require the
user's load action, while an existing Sushi cache keeps its original resume
behavior.

Validate the route shell without starting model or microphone inference with:

```powershell
$env:BASE_URL = "http://localhost:3100"
node scripts\qa-sushi-demos.mjs
```

This gate proves the routes, branded shell, isolation headers, and critical
TTS/LLM-TTS assets. It does not claim that a provider's downloaded model or
remote TTS WASM runtime is healthy; those require an intentional Brave-profile
runtime check with the existing Sushi browser state.

## Source-grounded feature summary

The description is based on the checked-out clientsideai code and docs:

- browser-local LLM demos with selectable Smol and Gemma providers;
- speech-to-text, text-to-speech, and combined STT -> LLM -> TTS flows;
- browser experiments including Astres and the distributed Swarm demo;
- local persistence for model choice, chat history, and character persona.

When the project gets a public hosted demo, update only the `url` and
`linkLabel` fields if the preferred destination changes. Keep the portfolio
visual tied to an authentic checked-in source capture, and do not copy model
weights, browser profiles, caches, or private runtime state into Junimo. If
the upstream TTS WASM deployment changes or fails, preserve that provider
failure visibly and repair the pinned upstream/runtime contract before adding
any fallback.
