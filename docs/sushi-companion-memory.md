# Conversational companion: memory and model research

## Product contract

A local companion should sustain context, recall relevant earlier conversations,
accept corrections, and offer occasional considerate follow-ups. It must not
invent a shared history, confuse its own suggestions with user facts, or claim
perfect recall. Existing chats and character settings must survive this work.
Keep the incumbent interface; add clear model and memory controls.

## Research and decisions (2026-10-02)

- [LongMemEval](https://arxiv.org/html/2410.10813v2) separates extraction,
  cross-session reasoning, time, updates and abstention. Its experiments support
  retaining conversation rounds instead of relying on lossy fact summaries.
  Use source-grounded retrieval plus user-editable notes, with dated evidence.
  Test corrections and unknown facts as well as easy name recall.
- [LoCoMo](https://arxiv.org/abs/2402.17753) evaluates conversations spanning
  hundreds of turns and finds persistent temporal/causal reasoning gaps. A large
  advertised context window is not evidence of perfect memory.
- [Generative Agents](https://arxiv.org/abs/2304.03442) combines observations,
  retrieval and planning for coherent behavior. Apply continuity and relevant
  callbacks without implementing a general autonomous agent loop.
- [Memory-aware proactive dialogue](https://arxiv.org/abs/2503.05150) distinguishes
  relevant historical topics from appropriate timing. Follow-ups must be bounded,
  visible, interruptible, and stopped when the user leaves or starts typing.
- [ComPeer](https://arxiv.org/abs/2407.18064) explores history-grounded proactive
  peer support; this companion is not a mental-health treatment or human person.
- [Google's Gemma 4 card](https://ai.google.dev/gemma/docs/core/model_card_4)
  documents E2B's native system role and optional thinking. Disable thinking for
  spoken chat; never speak internal reasoning channels.
- [LiteRT-LM Web API](https://developers.google.com/edge/litert-lm/js) provides
  streaming, cancellation and persistent Conversation objects. Pin the runtime
  version. Keep an 8K operational context rather than claiming the model card's
  theoretical 128K window is available affordably in this browser.
- [The publisher's model card](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm)
  identifies the web-optimized `.litertlm` file and marks the MediaPipe `.task`
  route as maintenance mode. The current package's GPU Artisan loader streams
  weights instead of requiring the complete model in WASM memory first.

## Working-product research, 2026-10-02 follow-up

Reviewed primary product/engineering documentation, separately from vendor
accuracy claims. Hosted-product benchmarks do not predict this laptop's speed.

| Product / source | Documented mechanism | Local-app decision |
| --- | --- | --- |
| [Kindroid](https://kindroid.ai/v2/docs/memory/) | Persistent character/notes context, recent history, retrieved long-term memories and keyed journals; relevance, recency and diversity influence recall. | Keep notes separate from history and show the original recalled statements. Test paraphrases, not only matching keywords. |
| [Character.AI](https://blog.character.ai/memory/) | Editable facts, user-pinned story memory, and memory usage controls. | Protect user-maintained notes from context rotation; expose recall evidence inside Memory. |
| [Zep / Graphiti](https://www.getzep.com/blog/how-zep-tracks-provenance-in-agent-memory/) | Preserve raw episodes, associate derived facts with sources, and track invalidation when facts change. | Retain original rounds and timestamps; prefer corrections and remove deleted sources. A graph database is unnecessary for this single-browser scope. |
| [Letta](https://www.letta.com/blog/sleep-time-compute/) | Separate memory consolidation from the conversational path to reduce synchronous work. | Avoid a second extraction generation on each reply. Consider idle indexing only if measured recall failures justify it; do not run background agents while the user is away. |
| [LiveKit](https://livekit.com/blog/turn-detection-and-interruption-handling) | Treat speech detection, end-of-turn decisions and interruptions as distinct concerns; stream and cancel work rather than accumulating audio. | Keep bounded speech lookahead and cancellation; measure first text and first audible output separately. Silence-only endpointing and tap-to-interrupt remain disclosed limits. |
| [Pipecat Smart Turn](https://github.com/pipecat-ai/smart-turn) | A local audio model estimates whether speech is complete, beyond an amplitude threshold. | Do not claim the current RMS detector provides semantic turn detection. Adding another audio model requires a measured cutoff problem and resource budget. |

Browser evaluation uses `?evaluate=1` on the deployed origin. It isolates test
transcripts and preferences from real companion memory while sharing the same
model files. Test emotional intent (listening vs advice), topic transitions,
corrections, absent facts, cross-session recall, source inspection, timing, and
interruption. The ordinary URL continues to use the user's normal history.

## Root causes in the previous implementation (detail)

The avatar retained only 100 messages and passed 2,200/6,000 characters of recent
context. There was no cross-session retrieval. Its default persona forced a
fantasy roleplay even for ordinary conversation. Gemma used an old MediaPipe
component, mapped system instructions to user turns, configured about 1,024
total tokens and cleared history after every reply. These are concrete limits,
not problems solved by merely renaming chat history to memory.

## Intended implementation and acceptance

Retain full avatar transcripts within browser storage, keep a bounded active
prompt, retrieve relevant dated rounds, and expose small editable remembered
notes. A live paraphrase failure justified a small local embedding model;
avoid a vector service, cloud API, or per-turn extraction generation. Preserve model conversation state while the exact
prior turns match; rebuild only after edits, resets, interruptions or context
rotation. Separate normal companionship from the existing character roleplay.

Acceptance must include long-history retrieval, cross-session references,
updated facts, unknown facts, persona/topic changes, forgetting, reload,
interruption, bounded follow-ups, storage failure, and actual Gemma browser
inference. Deterministic retrieval tests are not model-answer accuracy tests.
Record measured latency and any live-test limitations separately.

## Implementation and operation

- `companion-memory.mjs` retrieves up to five original, dated conversation
  rounds using user-statement lexical relevance, meaning similarity and recency.
  Explicit corrections accompany older source facts, within the same budget.
  If both do not fit, omit the obsolete source rather than return it alone.
  Recent context is separate from storage and rotates on complete rounds.
- Avatar sessions retain their complete messages in the existing browser store.
  Both new and legacy avatar sessions are protected from other demos' 24-session
  eviction. Quota failure preserves the previous saved transcript and reports
  the unsaved turn. Browser clearing/eviction can still remove local storage;
  export important conversations through Memory.
- Memory contains editable notes, cross-session recall, everyday/character
  selection, and an optional initiative switch. Initiative defaults off. It
  permits one contextual follow-up after 45 seconds, only in a visible, idle
  tab, and never chains follow-ups or interrupts typing, speech, or hands-free
  capture. Deleting one chat cannot erase copies quoted in another chat.
- The new avatar-only Gemma provider uses LiteRT-LM 0.17.1, a pinned model
  revision and an 8K window. It keeps a matching conversation alive, disables
  thinking, filters thought channels and discards interrupted KV state. Other
  demos retain their existing providers.
- Gemma downloads once to `sushi-models` in OPFS on the deployed origin. HTTP
  caching is disabled for these weights to avoid a second browser cache copy.
  A receipt commits only after a complete file; incomplete artifacts are never
  loaded. A Web Lock serializes competing tab downloads. Writes batch at 4 MiB.
  Network/disk failures close the stream and allow a deliberate retry.
- Gemma's meaning search uses pinned Transformers.js 3.7.2 and the quantized
  [MiniLM model](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/751bff37182d3f1213fa05d7196b954e230abad9)
  in one CPU worker (~23 MB weights plus runtime). Only user statements are
  embedded. Overlapping chunks preserve details late in a message. IndexedDB
  stores vectors, source IDs and hashes, not another transcript. Unchanged
  sources reuse vectors; changed or corrupt records rebuild. Deleted sources
  are pruned, deletion clears derived vectors, and every recall intersects the
  current allowed source list. The model is shared across isolated evaluation
  and ordinary conversations, but their vector indexes and transcripts are not.
  Semantic setup failures block readiness and offer retry; no cloud fallback.

## Gemma acceptance after freeing disk space

Gemma downloaded successfully on the deployed origin in Edge Profile 1, then
loaded from the saved file after reload. Real project recall took 2.0 seconds
to first text and 7.8 seconds to audible speech. Initial text-only QA turns
took 0.6–3.1 seconds to first text. These are observed individual turns, not
percentile benchmarks. The corrected dog name, present city vs future move,
and admission of an unknown brother's name passed across new chats.

The initial tone was too therapeutic and missed humor. `131195f` revised the
everyday prompt to use concrete details, concise responses, fewer reflexive
questions and less coaching. A separate paraphrase test ("four-legged
roommate") missed the previously discussed greyhound with keyword retrieval.
That measured failure motivated local semantic search and correction bundles.
43 focused tests pass after that change; actual embedding/browser acceptance
is recorded below once tested. Physical microphone input remains unverified.

The first live MiniLM test still missed the pet. Inspection of similarity
scores showed that a multi-topic message (pet, city, preferred name) diluted
the pet reference to 0.158, while an identical earlier question scored 1.0.
Index complete messages plus individual sentences, exclude repeated copies of
the current question from recall, and retain source-linked corrections. This
addresses evidence granularity and repeated-question dominance rather than
adding a special synonym for the test's wording. Evaluation-only diagnostics
show source text and cosine scores for reproducible tuning. Speech telemetry
also separates first text, completed sentence, synthesized chunk, and playback.

### Saved-model disappearance during testing

After successful inference, free space on the profile drive dropped to 0.23
GiB. A later Start unexpectedly began another Gemma download; it was stopped
immediately. The transfer page then showed no supported cached models, while
chat localStorage remained, and free space recovered to 3.27 GiB. This is
consistent with browser storage eviction under pressure; no storage deletion
was issued by the task. The original loader used best-effort OPFS/Cache API
without requesting persistence. Start now requests `navigator.storage.persist()`
from its user gesture and visibly reports whether protection was granted.
The page also checks Gemma's actual file and receipt before reporting it saved.
Never promise permanent caching when the browser declines persistence, and
never infer cache reuse solely from successful model startup.

### Playback buffering correction

The playback controller estimated ongoing synthesis speed from the time a
sentence was submitted. That included one-time text conditioning/startup and
could make a fast subsequent stream appear slow, selecting a two-second audio
buffer unnecessarily. Throughput now measures samples after the first chunk
against time after that chunk. The initial target is 0.6 seconds; measured
throughput still increases the target for genuinely slow synthesis. A focused
regression simulates a three-second startup followed by fast chunks, then slow
chunks, and checks both paths. This preserves the voice/model and cancellation
contract. Actual before/after audio timing and underruns must still be checked
on the deployed site; vendor native/Mac timings are not laptop measurements.

Live instrumentation confirmed one example: first text 2.462 s, first sentence
2.872 s, first audio chunk 3.918 s (1.032 s synthesis), playback 8.055 s.
Sentence-level indexing raised the relevant pet score to 0.199, still below
the initial cutoff. Retrieval now considers the top four semantic candidates
above 0.18 and 60% of the strongest candidate, alongside lexical matches, with original evidence and corrections
still capped at five rounds. This is empirical local calibration, not a
universal relevance probability. Unknown-fact abstention needs live retesting.
Stop is also available while microphone permission is pending, and long memory
source text wraps within its dialog.

Gemma's first proactive browser test fired once, but followed an unrelated
older balcony conversation instead of the current moth-bakery idea. This was
a failed quality check. Proactive turns now skip historical retrieval and
rebuild their model context from the active conversation plus explicit notes,
removing stale retrieval text from KV state. The cue identifies the latest
user message as reference data. Normal requested replies retain cross-chat
recall. A regression proves that initiative cannot select other saved chats.

### Local GPU speech

The CPU voice remained too slow under laptop load: one corrected-name reply
measured 5.307 s to text, 9.479 s to first synthesized chunk and 15.682 s to
playback, with zero measured playback underruns. Buffering alone cannot fix
slow sustained synthesis. The [Kokoro.js maintainer's browser implementation](https://github.com/hexgrad/kokoro/tree/main/kokoro.js)
and [AIRI's working avatar speech worker](https://github.com/moeru-ai/airi/blob/main/packages/stage-ui/src/workers/kokoro/worker.ts)
support local WebGPU speech. Use Kokoro 1.2.1, FP32 as the maintainer recommends,
and pinned HF weights (~325 MB). Heart is the GPU default; Pocket CPU voices
remain explicit selections, including imported-cache-only mode. There is no
cloud or automatic CPU fallback. This is user-owned local inference, with no
provider billing or audio transmission.

The existing bounded sentence queue/worklet handles both engines. Kokoro warms
one short utterance silently during setup, transfers PCM directly, validates
sample rate/data and drops cancelled results after ONNX inference settles.
Regression coverage proves these branches. Speech cancellation stops playback
immediately; it cannot preempt an already submitted ONNX GPU operation.

## Validation / storage incident, 2026-10-02

39 focused tests pass, including a 600-turn retained transcript, old-fact
retrieval, correction ordering, unknown facts, deletion, old-session protection,
quota failure, KV reuse/cancellation, non-Latin window rotation, and model-file
cache reuse/truncation. TypeScript and focused ESLint pass. No laptop production
build was run; Vercel built `c103dfa` successfully in 28 seconds and routed it to
`sushi.junimo.dev`. Edge rendered the new controls without console errors.

The real deployed Gemma download failed with `QuotaExceededError`. Windows
reported approximately **0.25 GiB free on C:** (the browser profile drive), and
2.19 GiB on D:. Browser quota estimates are not a reliable measure of available
physical disk space. Do not retry the 2 GB download until at least 3 GB is freed
on the profile drive. No unrelated files were deleted. Model inference,
answer-quality acceptance and Gemma latency remain unverified pending storage.
The previous compact-model/voice cache remains available.

Deployed compact-model checks on `f0083cc` confirmed cached language/voice
initialization, chat saving and restoration after reload. A first short reply
took 23.7 seconds to text and 34.5 seconds to voice. Cross-session retrieval
found the earlier project/storage conversation; its reply took 28.5 seconds
to text and 42.9 seconds to voice, but the 360M model echoed source formatting.
This is a failed answer-quality acceptance, not proof of humanlike memory.
`b992cc0` removes generic instruction terms from retrieval, prevents recency
alone from returning unrelated personal facts, and supplies only original user
statements to the compact model. Gemma still receives dated full rounds.
Regression assertions cover the observed irrelevant arithmetic recall and an
unknown birthday amid recent personal statements.

Initiative timing counts silence after speech ends, respects open settings
dialogs, cancels when the user starts typing, and stops after one follow-up.
The user's Edge preference was enabled at their request for proactive behavior;
the product default remains off. Physical microphone input and a sustained
Gemma conversation have not been accepted in this session.

The revised compact recall test returned `I'm Sushi.` after 30.5 seconds.
An actual timed follow-up then started once without a fabricated user turn,
but invented a car-related event absent from the history (11.8-second TTFT).
This exposed a model capability failure, not a retrieval/timer failure.
**Automatic initiative now requires Gemma 4**; the UI states this requirement
and regression coverage rejects incapable models. The compact model remains
available for explicitly requested chat, with its reasoning limits disclosed.
Do not enable automatic initiative on a smaller model without a real behavioral
evaluation, or present these tests as proof of Gemma answer quality.
