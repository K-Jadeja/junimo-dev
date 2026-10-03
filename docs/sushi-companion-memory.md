# Conversational companion: memory and model research

## October 3: direct-file storage and live acceptance

After the user freed space, C: had 5.44 GiB free. Gemma and Kokoro Heart loaded
on the deployed origin in Edge Profile 1. During initialization, the Windows
pagefile grew from 9,825 MiB to 10,862 MiB, and C: reached 1.59 GiB free. Later
the pagefile reached 11,904 MiB. The model-file check subsequently reported
Gemma missing again, while the loaded engine continued replying. This is the
third observed loss of the browser model file; do not retry OPFS downloads as
the solution. The precise browser-internal eviction trigger is still unproven.

The direct-file option passes the original user-selected File to LiteRT. It
stores only a selection preference in localStorage, never a Blob in IndexedDB,
and requires reconnecting the file on a later visit. Missing selection must
stop before any model fetch or OPFS access. Users can explicitly return to
browser storage. The picker validates the web variant's filename and exact
2,008,432,640-byte size; this is not a cryptographic authenticity check. For this
machine, the downloaded file is additionally verified against upstream SHA-256
`3a08e8d94e23b814ae5414469c370c503813949acb8ceaa17e4ebf8a35af35b5`
before being used. Wrong/truncated files and zero-copy/no-fetch behavior have
regression coverage. No file is uploaded or deleted by this feature.

Live evaluation before the revised prompt: corrected dog name Mochi, already
home, current Pune and planned Jaipur were recalled correctly in a new chat.
An unknown university was not fabricated. Humor/no-question intent failed even
with cross-chat recall off; exact-word instruction following succeeded. The
shorter prompt now defaults to statements and literal compliance with no-advice
and no-question requests. New unseen humor still needs live acceptance.

Kokoro's real worker downloaded, warmed, and played valid audio. First playback
latencies were 18.374 s cold, 7.959 s and 8.182 s for subsequent multi-sentence
replies, and 3.0 s for a one-word reply. Measured playback underruns were zero;
these timings do not establish low latency or subjective voice quality. One
reply spent 2.303 s indexing new memory. Completed turns are now indexed while
speech plays; every later query still synchronizes changed sources. Regression
coverage proves prepared vectors are reused and corrected text is re-encoded.

50 focused tests, focused ESLint and direct TypeScript checks pass. Vercel
built runtime release `f4aac1f` in 21 seconds and routed it to Sushi. The browser
renders the direct-file controls and correct GPU voice size. The single file at
`C:\Users\Krishna\Downloads\Sushi\gemma-4-E2B-it-web.litertlm` finished downloading
and passed the exact byte-size and SHA-256 checks above. No `.download` copy
remains. C: had 1.02 GiB free after this download.

The extension cannot select a local file without its file-URL permission. The
user was asked to select this one file manually in the deployed page's picker;
this avoids requiring broader extension access. The previous engine was released
by reloading to the new release. Direct-file inference, revised tone/initiative,
post-change latency, reload/reconnect and physical microphone acceptance remain
pending this selection. No laptop production build was run.

After the user selected the file, deployed direct-file inference succeeded with
no Gemma network download. The smaller Kokoro cache required restoration. The
file remained present at its original verified byte size. With the revised
prompt, an unseen planner joke got a playful response without advice or a
follow-up interview question, but still began with a rhetorical question. A
subsequent switch to a fictional dragon bakery was followed correctly.
Measured text/voice starts were 4.617/8.542 s and 3.171/9.158 s, with no measured
underruns. Warm memory retrieval fell to 56 ms; voice synthesis remained the
dominant delay (4.875 s on the second reply). Do not call these instant replies.

The idle initiative failed by returning to the earlier planner topic, despite
using no cross-chat memories. This exposed distraction from earlier turns in
the active chat. Initiative now receives only the latest completed exchange
and a concise instruction to continue its final answer. The full saved history
is unchanged. An exact topic-switch regression verifies the earlier exchange
is excluded; actual model behavior on this revision still needs acceptance.
The user was also asked to perform one physical-microphone/voice-quality check.

Release `c5dc328` is deployed and Vercel reports Ready on the Sushi alias
(23-second cloud build). All 51 focused tests pass, including the exact
initiative-context regression; focused ESLint passes. The loaded Edge tab still
runs `f4aac1f` to preserve the selected File and avoid interrupting the pending
microphone check. Consequently, deployment is verified but live acceptance of
the latest initiative change is not. Reloading requires selecting the same
existing disk file again, with no additional Gemma download or saved copy.

## Previous acceptance status (2026-10-02)

Runtime release `f7acbd6` is deployed. The latest focused suite has 49 passing
tests; earlier sections below preserve intermediate results, not current totals.
Gemma answered real deployed-browser conversations and recalled a corrected pet
name across chats, but temporal grounding still needs improvement. GPU voice,
the revised proactive response, physical microphone input, and final sustained
conversation acceptance remain unverified.

The user confirmed that they only closed ChatGPT browser tabs while freeing
space; they did not deliberately clear site data. They then saved the deployed
avatar page to Edge Favorites. Clicking **Protect saved models** on the deployed
page still reported unprotected storage and no saved Gemma file. C: had 2.95 GiB
free and D: 1.46 GiB. Bookmarking is a browser heuristic, not a guarantee of
persistence. Closing tabs can reduce memory/pagefile pressure but is not durable
disk cleanup. Automatic eviction is consistent with the observations, not proven
by browser-internal logs.

No third model download was started. Request another 6 GB of actual C: disk
space before resuming; this is operating headroom, not a guarantee against future
eviction. Keep the existing loaded evaluation tab and the normal deployed page
available while waiting. After space is available, use a single loaded Gemma
engine, verify voice and initiative, and verify cache reuse after reload before
claiming completion. Do not delete unrelated files or repeat downloads blindly.

The user subsequently said no more C: space can be freed. A full volume check
found no additional usable drive; C: had 2.94 GiB and D: 1.42 GiB. The choice of
external storage, explicitly opted-in cloud inference, or a smaller local model
is pending. Do not silently change the local-processing privacy contract or
claim that a smaller model preserves the requested conversation quality.

An external-file route can pass a user-selected `File` directly to the existing
LiteRT engine without copying weights into OPFS. Chromium's
[File System Access documentation](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
supports direct reads and remembered handles, with permission rechecks. This is
a researched option, not implemented or accepted behavior. Keep only a handle
and validated model metadata in site storage; eviction must require reselecting
the same external file, not redownloading it. A future implementation must test
wrong/truncated files, withdrawn permission and disconnected drives.

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
and pinned HF weights (~325 MB). Heart is an explicit GPU choice pending live
acceptance; Alba remains the tested default, including imported-cache-only mode. There is no
cloud or automatic CPU fallback. This is user-owned local inference, with no
provider billing or audio transmission.

The existing bounded sentence queue/worklet handles both engines. Kokoro warms
one short utterance silently during setup, transfers PCM directly, validates
sample rate/data and drops cancelled results after ONNX inference settles.
Regression coverage proves these branches. Speech cancellation stops playback
immediately; it cannot preempt an already submitted ONNX GPU operation.

### Second storage interruption and recovery

The unknown-university acceptance attempt failed before generation because
IndexedDB reported `The database connection is closing`. A second, unloaded
tab confirmed Gemma's file was absent again, while all eight evaluation chats
(29 messages) and preferences survived in localStorage. No third download was
started. Edge still declined persistence. Ask whether browser cleanup was used
when freeing disk space; do not assume user action or automatic eviction as a
proven cause. A favorite/install is one Chromium signal that can improve a
[persistent-storage request](https://web.dev/articles/persistent-storage).
The separate Protect saved models control requests and checks protection
without starting any model download.

The derived memory index now handles forced close/version changes and retries
one closed-database transaction by reopening/rebuilding from allowed original
chat sources. The loaded encoder is reused. An exact regression simulates the
observed InvalidStateError after successful initialization and verifies recovery,
not just an error message. Other failures still surface; no memory is fabricated.
The stronger voice, revised initiative and final latency acceptance remain
pending a stable saved-model store. Keep the original running tab until then.

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
