class StreamingAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];    // array of Float32Array chunks
    this.offset = 0;    // read position in first chunk
    this.finishing = false;
    this.started = false;
    this.levelWindow = 1024;
    this.levelSamples = 0;
    this.levelSumSquares = 0;
    this.levelPeak = 0;
    this.port.onmessage = (e) => {
      if (e.data.type === 'chunk') {
        this.finishing = false;
        this.queue.push(e.data.samples);
      } else if (e.data.type === 'finish') {
        this.finishing = true;
      } else if (e.data.type === 'clear') {
        this.queue = [];
        this.offset = 0;
        this.finishing = false;
        this.started = false;
        this.levelSamples = 0;
        this.levelSumSquares = 0;
        this.levelPeak = 0;
      }
    };
  }

  process(inputs, outputs) {
    const out = outputs[0][0];
    let written = 0;
    while (written < out.length && this.queue.length > 0) {
      const chunk = this.queue[0];
      const available = chunk.length - this.offset;
      const needed = out.length - written;
      const n = Math.min(available, needed);
      out.set(chunk.subarray(this.offset, this.offset + n), written);
      written += n;
      this.offset += n;
      if (this.offset >= chunk.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }
    // Fill remainder with silence
    for (let i = written; i < out.length; i++) out[i] = 0;

    if (!this.started && written > 0) {
      this.started = true;
      this.port.postMessage({ type: 'started' });
    }

    for (let i = 0; i < out.length; i++) {
      const sample = out[i];
      const magnitude = Math.abs(sample);
      if (magnitude > this.levelPeak) this.levelPeak = magnitude;
      this.levelSumSquares += sample * sample;
      this.levelSamples += 1;
    }
    if (this.levelSamples >= this.levelWindow) {
      const rms = Math.sqrt(this.levelSumSquares / this.levelSamples);
      const level = Math.min(1, rms * 4.8 + this.levelPeak * 1.4);
      this.port.postMessage({ type: 'level', level });
      this.levelSamples = 0;
      this.levelSumSquares = 0;
      this.levelPeak = 0;
    }

    if (this.finishing && this.queue.length === 0) {
      this.port.postMessage({ type: 'ended' });
      this.finishing = false;
      this.started = false;
    }
    return true;
  }
}

registerProcessor('streaming-audio', StreamingAudioProcessor);
