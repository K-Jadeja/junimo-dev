# Moving browser model downloads between origins

The avatar's local review site and deployed Sushi site have different browser
storage origins. Browser storage is not a directory that can safely be symlinked.
Use `/llm-tts/model-transfer.html` on each origin, in the same browser profile.

1. Run `node scripts/serve-sushi-review.mjs` when recovering the review cache.
2. Open `http://127.0.0.1:3100/llm-tts/model-transfer.html` in the original Edge profile.
3. Save the model backup. This reads existing bytes only and makes no model fetch.
4. Open `https://sushi.junimo.dev/llm-tts/model-transfer.html` and import that file.
5. The destination verifies checksums before writing, preserves conflicting
   existing files, rereads saved bytes, and lists what is actually available.
6. A full imported set enables the compact CPU model, Alba and Whisper. Imported
   mode persists on the deployed origin and prohibits new model downloads.
   Missing/evicted models require restoring the backup. App JS/WASM can still
   load from their existing runtime hosts; this is not a fully offline app.

If browser automation cannot choose local files, the local `/__qa__/cache` page
can save a backup through its loopback helper. Paste its temporary link into
the deployed transfer page's local-helper section. GET access is restricted to
the exact Sushi origin, exact loopback host, a random UUID and a 15-minute
lifetime; it exposes only the exported model bundle, not arbitrary local files.
Stop the review server after transfer. Backups remain in the system temp folder
for explicit user cleanup. Do not enable broader extension permissions solely
to automate this operation.

Backups contain only allowlisted CPU GGUF, Wllama metadata, Pocket-TTS model,
tokenizer, supported voices and Whisper Tiny. No chats, settings, account data
or recorded audio are exported or uploaded. The binary format uses a bounded
JSON manifest and SHA-256 per 8 MiB chunk; metadata is written after the GGUF.
It deliberately does not transfer WebLLM/Gemma caches. An imported smaller CPU
model must never be relabeled as, or silently trigger, a larger GPU download.

Do not promise cache retention without inspecting it. On October 2 the recovery
inspection found only Whisper Tiny on `127.0.0.1:3100`, despite the earlier
successful language/voice runtime tests. No supported entries were found on
`localhost:3100`. The cause of missing language/voice files is not established;
successful inference alone was insufficient proof of durable retention.

## Lightweight checks

Run `node --test scripts/test-sushi-model-cache.mjs` and the existing
`scripts/test-sushi-conversation.mjs`, then direct TypeScript/focused ESLint.
Do not run a local production build. `/__qa__/cache` on the local review server
lists only model-related cache keys and the Wllama cache directory for diagnosis.
No such diagnostics route is deployed.
