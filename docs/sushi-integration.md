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
- The homepage Sushi entry now opens the hosted lab directly at
  `https://sushi.junimo.dev`; `/sushi` remains available only as a direct
  case-page route.
- The case-page link points to the canonical GitHub repository and is labelled
  `View on GitHub` so it is distinct from the hosted products in the portfolio.

## Browser lab boundary

The case page stays at `https://junimo.dev/sushi` in the Next.js shell. The
runnable demos remain standalone HTML pages under `public/sushi/` so their
WebGPU, WebAssembly, worker, AudioWorklet, model-picker, persona, and Live2D
contracts stay intact. Their public URLs are hosted on the dedicated lab
subdomain:

- `https://sushi.junimo.dev/llm`
- `https://sushi.junimo.dev/tts`
- `https://sushi.junimo.dev/llm-tts`
- `https://sushi.junimo.dev/stt`
- `https://sushi.junimo.dev/stt-llm-tts`
- `https://sushi.junimo.dev/astres`
- `https://sushi.junimo.dev/classifier`
- `https://sushi.junimo.dev/swarm`

`next.config.mjs` uses the request host to rewrite those clean subdomain
paths to their local `index.html` files and adds the `same-origin` COOP plus
`credentialless` COEP headers needed by the browser runtimes. The root
`https://sushi.junimo.dev/` page is a lightweight lab index. The standalone
pages use root-relative subdomain bases so relative worker, module, worklet,
iframe, asset, and WASM paths continue to resolve.

For local development, `localhost` and `127.0.0.1` also accept the clean
subdomain paths. The portfolio's `/sushi/...` routes remain as a compatibility
fallback for local QA and do not define the production URL.

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

This gate proves the legacy local fallback routes, the host-routed
`sushi.junimo.dev` paths, branded shell, isolation headers, and critical
TTS/LLM-TTS assets. It does not claim that a provider's downloaded model or
remote TTS WASM runtime is healthy; those require an intentional Brave-profile
runtime check with the existing Sushi browser state.

The Vercel project must have `sushi.junimo.dev` attached, and Namecheap must
publish the Vercel record before the public hostname can resolve. The current
record target is documented in `docs/deployment.md`.

## Source-grounded feature summary

The description is based on the checked-out clientsideai code and docs:

- browser-local LLM demos with selectable Smol and Gemma providers;
- speech-to-text, text-to-speech, and combined STT -> LLM -> TTS flows;
- browser experiments including Astres and the distributed Swarm demo;
- local persistence for model choice, chat history, and character persona.

If the preferred public destination changes, update only the `url` and
`linkLabel` fields. Keep the portfolio visual tied to an authentic checked-in
source capture, and do not copy model weights, browser profiles, caches, or
private runtime state into Junimo. If the upstream TTS WASM deployment changes
or fails, preserve that provider failure visibly and repair the pinned
upstream/runtime contract before adding any fallback.
