# Sushi conversational avatar

The public conversational avatar is `https://sushi.junimo.dev/llm-tts`.
It is a standalone browser app in `public/sushi/llm-tts`, not a React route.
The legacy STT/LLM/TTS experiments remain separate.

## October 2, 2026: diagnosis and implementation

The original page duplicated desktop and mobile runtime logic in a 57 KB
HTML document. The mobile completion prompt contained only the current
message, so it could not carry a multi-turn conversation. The avatar page had
no microphone input or explicit interruption control. Speech cancellation
used one `discardGeneration` boolean, which a late `gen_start` cleared;
old PCM could then play during the next reply. Synthesis was synchronous in
the worker, so it could not observe cancellation until the sentence ended.

Edge also exposed a transient Alexia `.moc3` XHR network failure. HTTP HEAD
returned 200 with the expected 2,907,200-byte file; an explicit browser reload
successfully rendered the avatar. This was not a missing model asset.
The old page polled forever and showed loading on that failure path.

The conversation now uses one responsive UI and one controller:

- `conversation.js`: setup, streamed transcript, character/history, typed
  turns, microphone turns, explicit interruption, and hands-free resumption.
- `conversation-core.mjs`: sentence boundaries, bounded prompt context on
  complete turns, and speech/silence timing.
- `mobile-provider.js`: the existing local SmolLM2 360M CPU model with full
  role-formatted context. Desktop keeps the selected Smol/Gemma identity;
  Smol uses a dedicated WebLLM worker on this page.
  Wllama receives `useCache: true`; its actual runtime compares every cached
  token to the next complete prompt and discards the differing suffix. Do not
  clear KV state after each successful turn: that needlessly repeats the
  expensive system/persona prefill. Persona changes, interrupted turns, and
  history changes still reconcile against the full next prompt.
- `speech-output.js`: one local Pocket-TTS worker; request IDs plus epochs
  reject stale audio. At most two sentences are synthesized ahead of playback.
  Initial buffering adapts between 0.3 and 2 seconds of PCM to observed speed;
  completed short sentences do not wait for that threshold.
- `conversation-audio-worklet.js`: captions and mouth levels follow the PCM
  being played, not future generated samples. Idle audio does not emit a
  continuous stream of zero-level messages.
- `microphone.js` / `microphone-worklet.js`: English Whisper Tiny Q5 local
  transcription, an acknowledged flush before disconnecting capture, and
  deterministic microphone release on errors, cancellation, hidden tabs,
  and navigation. Capture is capped at 30 seconds. Hands-free waits for a
  1.3-second pause after speech, then listens again after reply audio drains.
  This is turn-based hands-free conversation, not simultaneous full duplex.

Avatar rendering uses one ticker capped at 30 FPS (20 for reduced motion),
with device pixel ratio capped at 1.5 and rendering paused in hidden tabs.
Mouth values are applied in Cubism's `beforeModelUpdate` event: assigning
them earlier lets physics/expressions overwrite them before geometry updates.
The framing slider changes model scale without changing the layout height.
The frame signals readiness and failure to its same-origin parent. One
automatic reload recovers a transient startup failure; an explicit Retry
avatar button remains after failure or a 30-second deadline.

The local history store also had a quota bug: its retry loop could save an
empty array and claim success after dropping the active chat. Saves now must
retain the active session, or report failure. Existing storage keys remain.
This page retains up to 100 messages; inference uses only recent complete
turns that fit its character budget. Interrupted/failed replies stay visibly
marked in the current transcript and are not persisted as completed turns.

## Product and privacy boundary

This is browser-owned local inference, not Remalt-managed or BYOK provider
infrastructure. No server model fallback or browser cloud speech API is used.
The existing selected models and Pocket-TTS voices remain available. Compact
CPU mode is explicitly identified when selected for mobile/no-WebGPU devices.

Start conversation loads language and speech models sequentially, and selects
the chosen voice automatically. There is no automatic model download on page
open. Talk asks for microphone permission and loads the additional ~31 MB
Whisper model. Raw microphone audio and prompts remain local. Model/runtime
files are fetched from the existing hosts. Chat history stays in browser storage.

Read replies aloud can be explicitly switched off for text-only conversation.
Voice failure leaves the generated text visible and reports that speech failed;
it never silently changes the voice provider or pretends playback succeeded.

## Laptop-safe verification

Run sequentially:

```powershell
node --test scripts/test-sushi-conversation.mjs
node_modules\.bin\tsc.cmd --noEmit --pretty false
node_modules\.bin\eslint.cmd scripts/test-sushi-conversation.mjs scripts/serve-sushi-review.mjs scripts/qa-sushi-demos.mjs
node scripts/serve-sushi-review.mjs
```

The review server binds only `127.0.0.1:3100`, serves this repository's static
Sushi files, and sends COOP/COEP headers without starting Next or compiling
the portfolio. It does not prove Next/Vercel host routing. Visit
`http://127.0.0.1:3100/llm-tts`; `?mode=mobile` explicitly tests the compact
CPU runtime. Close this task's server when finished.

Regression tests exercise late speech packets after Stop, cooperative worker
cancellation, bounded sentence lookahead, actual playback events, audio
flush ordering, mobile context, silence handling, microphone resource cleanup,
GPU abort behavior with a fake engine, and storage quota failure. These are
deterministic contract tests; they are not inference quality benchmarks.

Browser checks should cover one desktop/mobile visual pass, readiness and
retry UI, keyboard input, model/voice settings, a real two-turn conversation,
interruption and a subsequent reply, history restore, and microphone release.
Never call a mocked provider test a live conversation test. Check available
RAM before loading models and avoid simultaneous large-model tests.

The first implementation pass passed TypeScript and focused ESLint. A broad
`eslint .` run was stopped after remaining active for several minutes under
memory pressure. `next build` is intentionally not run on this laptop.

The focused suite has 17 passing regression tests. Changed browser modules
were additionally linted with `--no-ignore` because normal repository lint
excludes vendored Sushi files; there were no errors, with existing unused
variable warnings in the legacy helpers. The deterministic audio comparison
measured 46 idle level messages over 48,000 PCM samples (two seconds at 24 kHz)
in the old worklet and zero in the new worklet. This is a message-count
measurement, not a claim about whole-device CPU savings.

For a real ASR check without recording the room, open
`http://127.0.0.1:3100/__qa__/voice` on the review server and press
Transcribe bundled sample. That harness is in `scripts/qa-sushi-voice.html`,
not in the deployed public directory. It runs the actual Whisper worker on
the repository's `stt-llm-tts/joke.wav` fixture. It does not validate physical
microphone permission UX, acoustic echo cancellation, or real-room VAD.

After publication, inspect Vercel's deployment and verify the served page and
new static modules on the Sushi hostname, including isolation headers.

## Observed acceptance and limits

Edge loaded the real compact SmolLM2 GGUF, Pocket-TTS WASM/model, and Alba
voice, generated typed replies, and returned to ready after PCM playback.
The transcript survived a reload. Stop interrupted queued speech, and New
chat produced a fresh answer to a different question using a reconciled
prompt prefix. These used actual provider runtimes, not fixtures.

On this laptop, before prefix reuse, first words took 61.8 seconds on an
initial turn and 67.5 seconds on a follow-up. After prefix reuse, a cold
prefill of the restored longer chat took 99.2 seconds; the subsequent warm
follow-up took 4.744 seconds, with audio starting at 12.897 seconds. A fresh
conversation reusing the unchanged system prefix produced first words at
3.764 seconds and audio at 10.735 seconds. These are individual observations
on a busy laptop, not a controlled device benchmark or a speed guarantee.

Whisper Tiny transcribed the bundled sample as “Hello, can you tell me a joke
about yourself?” in 27.968 seconds. This verifies the real ASR runtime and
asset path. Actual microphone capture, real-room speech/silence thresholds,
acoustic echo cancellation, and the end-to-end hands-free loop were not live
tested. Their lifecycle and flush paths are covered by deterministic tests.

The compact 360M model repeated a greeting on several follow-ups; the UI and
cache fixes do not make its language quality equivalent to the larger models.
Smol 1.7B WebGPU and Gemma were not loaded here due to limited available RAM.
The page keeps those explicit model choices and never silently sends a
conversation to a cloud service for better output.

Desktop and narrow layouts rendered without horizontal overflow. Browser DOM
inspection confirmed the avatar's 30 FPS cap. A resize review found the model
was fitted before Pixi resized its renderer, leaving it off-center; fitting
now subscribes to the renderer's completed `resize` event instead.

## Publication

Application commit: `8ada56317d98a033d8b844c729cf75323fee8641` on `origin/main`.
Vercel deployment `dpl_EWncdcYnxLkySxRBHekMKG7LQiui` became Ready after a
28-second cloud build and was aliased to `sushi.junimo.dev`.

The live `/llm-tts` page and 15 related JS/CSS modules were fetched and compared
with the reviewed local sources using normalized SHA-256 hashes; all 16
matched and carried the required COOP/COEP headers. Edge confirmed the live
avatar canvas reached ready and exposed the new model, voice, reply-length,
and microphone-mode controls. The model inference measurements above were
made on the isolated local review origin, not repeated on production (which
would download another browser-origin model cache).

## Runtime references

- [WebLLM API](https://webllm.mlc.ai/docs/user/api_reference.html)
- [WebLLM worker implementation](https://github.com/mlc-ai/web-llm/blob/main/src/web_worker.ts)
- [Pixi Live2D update/ticker guide](https://github.com/guansss/pixi-live2d-display/wiki/Complete-Guide)
- The pinned Pixi Live2D 0.4.0 source emits `beforeModelUpdate` immediately
  before `coreModel.update()`, after expression/physics application.
