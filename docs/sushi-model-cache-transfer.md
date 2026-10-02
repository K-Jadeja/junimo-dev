# Moving browser model downloads between origins

The avatar's local review site and deployed Sushi site have different browser
storage origins. Browser storage is not a directory that can safely be symlinked.
Use `/llm-tts/model-transfer.html` on each origin, in the same browser profile.
This copies bytes; it does not deduplicate disk storage. Source cache,
destination cache and backup are separate copies. Explain this before offering
the workflow to someone trying to save disk space. Direct destination downloads
avoid the backup copy but do not automatically remove any previous source cache.

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

The local `/__qa__/cache` page can also save a backup to the system temp folder
through its same-origin loopback helper. Browser automation may lack permission
to choose that file; manual selection is then needed. There is no cross-origin
local-network transfer endpoint. Stop the review server after use, and remove
backups only with user permission.

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

## October 2 final outcome

The user clarified that disk space, rather than bandwidth, was the priority and
chose a direct download on the deployed site instead. The transfer was stopped;
no successful cross-origin model import was claimed. The local helper is closed.
The deployed Edge cache was verified with five files totalling 392.1 MiB:
SmolLM2 360M, metadata, Pocket TTS, tokenizer and Alba. A real production turn
answered "Two plus two equals four" and completed speech playback; cold first
text took 82.5 seconds and first audio 92.7 seconds. This remains slow CPU
inference, not a low-latency acceptance result.

After that check and explicit user permission, the old localhost Whisper cache
entry and both task-created 32,153,161-byte backups were removed. Other browser
data and unrelated artifacts were preserved. Whisper will download on first
Talk on production. Explicit `?mode=mobile` / `?mode=full` now persists the runtime
choice so the normal avatar URL does not unexpectedly select a larger model.
