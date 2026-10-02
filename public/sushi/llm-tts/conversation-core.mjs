export function createSentenceBuffer(emit, maxLength = 180) {
  let pending = '';
  function flush(final = false) {
    while (pending) {
      const match = /[.!?](?:["”']?)(?:\s|$)|\n/.exec(pending);
      let cut = match && (final || match.index + match[0].length < pending.length || /\s$/.test(match[0]))
        ? match.index + match[0].length : 0;
      if (!cut && pending.length > maxLength) cut = pending.lastIndexOf(' ', maxLength) || maxLength;
      if (cut < 0) cut = maxLength;
      if (!cut && final) cut = pending.length;
      if (!cut) return;
      const sentence = pending.slice(0, cut).trim();
      pending = pending.slice(cut).trimStart();
      if (sentence) emit(sentence);
    }
  }
  return { push(delta) { pending += delta; flush(); }, finish() { flush(true); } };
}

// Bound prompt context on whole turns. Saved history is not silently truncated
// to fit the mobile model's smaller context window.
export function conversationContext(messages, maxCharacters = 4500) {
  const turns = [];
  for (let index = 0; index < messages.length - 1; index++) {
    if (messages[index].role === 'user' && messages[index + 1].role === 'assistant') {
      turns.push(messages.slice(index, index + 2));
      index++;
    }
  }
  const result = [];
  let size = 0;
  for (const turn of turns.reverse()) {
    const length = turn.reduce((sum, message) => sum + message.content.length, 0);
    if (size + length > maxCharacters) break;
    result.unshift(...turn);
    size += length;
  }
  return result;
}

export function mobilePrompt(messages) {
  return messages.map(({ role, content }) => `<|im_start|>${role}\n${content.replace(/<\|im_(?:start|end)\|>/g, '')}<|im_end|>\n`).join('') + '<|im_start|>assistant\n';
}

export class VoiceActivity {
  constructor({ silenceMs = 1300, maxMs = 30000, threshold = .015 } = {}) {
    Object.assign(this, { silenceMs, maxMs, threshold });
    this.elapsed = 0;
    this.voiced = 0;
    this.silence = 0;
  }
  push(rms, durationMs) {
    this.elapsed += durationMs;
    if (rms >= this.threshold) { this.voiced += durationMs; this.silence = 0; }
    else this.silence += durationMs;
    if (this.elapsed >= this.maxMs) return this.voiced >= 200 ? 'send' : 'empty';
    if (this.voiced >= 250 && this.silence >= this.silenceMs) return 'send';
    if (!this.voiced && this.elapsed >= 12000) return 'empty';
    return 'listen';
  }
}
