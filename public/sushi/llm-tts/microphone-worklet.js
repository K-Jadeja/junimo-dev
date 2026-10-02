class CompanionMicrophone extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1024);
    this.position = 0;
    this.phase = 0;
    this.active = true;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'flush') {
        this.active = false;
        this.flush();
        this.port.postMessage({ type: 'flushed' });
      }
    };
  }
  flush() {
    if (!this.position) return;
    const samples = this.buffer.slice(0, this.position);
    let sum = 0;
    for (const value of samples) sum += value * value;
    this.port.postMessage({ samples, rms: Math.sqrt(sum / samples.length) }, [samples.buffer]);
    this.position = 0;
  }
  process(inputs) {
    if (!this.active) return false;
    const channel = inputs[0]?.[0];
    if (!channel?.length) return true;
    const step = sampleRate / 16000;
    let cursor = this.phase;
    while (cursor < channel.length) {
      const index = Math.floor(cursor);
      const fraction = cursor - index;
      this.buffer[this.position++] = channel[index] + fraction * ((channel[index + 1] ?? channel[index]) - channel[index]);
      if (this.position === this.buffer.length) this.flush();
      cursor += step;
    }
    this.phase = cursor - channel.length;
    return true;
  }
}
registerProcessor('companion-microphone', CompanionMicrophone);
