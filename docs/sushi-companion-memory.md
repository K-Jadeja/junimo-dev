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
