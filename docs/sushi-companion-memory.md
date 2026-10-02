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

## Root causes in the previous implementation

The avatar retained only 100 messages and passed 2,200/6,000 characters of recent
context. There was no cross-session retrieval. Its default persona forced a
fantasy roleplay even for ordinary conversation. Gemma used an old MediaPipe
component, mapped system instructions to user turns, configured about 1,024
total tokens and cleared history after every reply. These are concrete limits,
not problems solved by merely renaming chat history to memory.

## Intended implementation and acceptance

Retain full avatar transcripts within browser storage, keep a bounded active
prompt, retrieve relevant dated rounds, and expose small editable remembered
notes. Avoid an additional embedding model, vector service, cloud API, or
per-turn extraction model. Preserve model conversation state while the exact
prior turns match; rebuild only after edits, resets, interruptions or context
rotation. Separate normal companionship from the existing character roleplay.

Acceptance must include long-history retrieval, cross-session references,
updated facts, unknown facts, persona/topic changes, forgetting, reload,
interruption, bounded follow-ups, storage failure, and actual Gemma browser
inference. Deterministic retrieval tests are not model-answer accuracy tests.
Record measured latency and any live-test limitations separately.

## Implementation and operation

- `companion-memory.mjs` retrieves up to five original, dated conversation
  rounds using lexical relevance, small topic expansions and recency. This is
  deliberately not semantic embedding search: paraphrases can miss a memory.
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
