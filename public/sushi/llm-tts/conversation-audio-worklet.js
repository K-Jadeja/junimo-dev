class ConversationAudio extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sentences = [];
    this.epoch = 0;
    this.frames = 0;
    this.energy = 0;
    this.peak = 0;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'clear') {
        this.epoch = data.epoch;
        this.sentences = [];
        this.frames = this.energy = this.peak = 0;
        return;
      }
      if (data.epoch !== this.epoch) return;
      if (data.type === 'sentence') this.sentences.push({ ...data, chunks: [], offset: 0, samples: 0, prebuffer: 7200, started: false, finished: false, underrunFrames: 0 });
      const sentence = this.sentences.find(item => item.id === data.id);
      if (!sentence) return;
      if (data.type === 'chunk') { sentence.chunks.push(data.samples); sentence.samples += data.samples.length; }
      if (data.type === 'buffer' && !sentence.started) sentence.prebuffer = data.prebuffer;
      if (data.type === 'finish') sentence.finished = true;
    };
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    output.fill(0);
    let written = 0;
    while (written < output.length && this.sentences.length) {
      const sentence = this.sentences[0];
      if (!sentence.started && !sentence.finished && sentence.samples < sentence.prebuffer) break;
      if (sentence.samples > 0 && !sentence.started) {
        sentence.started = true;
        this.port.postMessage({ type: 'started', epoch: this.epoch, id: sentence.id, text: sentence.text });
      }
      const chunk = sentence.chunks[0];
      if (chunk) {
        const length = Math.min(output.length - written, chunk.length - sentence.offset);
        output.set(chunk.subarray(sentence.offset, sentence.offset + length), written);
        written += length;
        sentence.offset += length;
        sentence.samples -= length;
        if (sentence.offset === chunk.length) { sentence.chunks.shift(); sentence.offset = 0; }
      } else if (!sentence.finished) { if (sentence.started) sentence.underrunFrames += output.length - written; break; }
      if (!sentence.samples && sentence.finished) {
        this.port.postMessage({ type: 'ended', epoch: this.epoch, id: sentence.id, underrunMs: sentence.underrunFrames / sampleRate * 1000 });
        this.sentences.shift();
      }
    }
    // Mouth movement is measured from output, never from future synthesized PCM.
    if (written || this.frames) {
      for (const value of output) { this.energy += value * value; this.peak = Math.max(this.peak, Math.abs(value)); }
      this.frames += output.length;
      if (this.frames >= 1200) {
        this.port.postMessage({ type: 'level', epoch: this.epoch, level: Math.min(1, Math.sqrt(this.energy / this.frames) * 4.8 + this.peak * 1.4) });
        this.frames = this.energy = this.peak = 0;
      }
    }
    return true;
  }
}
registerProcessor('conversation-audio', ConversationAudio);
