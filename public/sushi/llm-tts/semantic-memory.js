import { rounds } from './companion-memory.mjs';

export function memoryDocuments(sessions) {
  return sessions.flatMap(session => rounds(session.messages).map((round, index) => ({ id: `${session.id}:${index}`, text: round[0].content })));
}
export class SemanticMemory {
  constructor(scope, onStatus = () => {}) {
    this.scope = scope; this.onStatus = onStatus; this.worker = null; this.pending = new Map(); this.serial = 0;
  }
  request(type, payload, signal) {
    if (!this.worker) {
      const worker = new Worker(new URL('./semantic-worker.js', import.meta.url), { type: 'module' });
      this.worker = worker;
      worker.onmessage = ({ data }) => {
        if (data.type === 'status') { this.onStatus(data.text); return; }
        const request = this.pending.get(data.id); if (!request) return;
        request.finish();
        if (data.error) request.reject(new Error(data.error)); else request.resolve(data.result);
      };
      worker.onerror = event => { this.destroy(new Error(event.message || 'Memory search failed to start.')); };
    }
    if (signal?.aborted) return Promise.reject(new DOMException('Stopped', 'AbortError'));
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const abort = () => { this.worker?.postMessage({ type: 'cancel', id }); finish(); reject(new DOMException('Stopped', 'AbortError')); };
      const timer = setTimeout(() => { this.destroy(new Error('Memory preparation timed out. Retry Start conversation.')); }, 180000);
      const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); this.pending.delete(id); };
      this.pending.set(id, { resolve, reject, finish }); signal?.addEventListener('abort', abort, { once: true });
      this.worker.postMessage({ type, id, scope: this.scope, ...payload });
    });
  }
  prepare(sessions) { return this.request('prepare', { documents: memoryDocuments(sessions) }); }
  rank(sessions, query, signal) { return this.request('rank', { documents: memoryDocuments(sessions), query }, signal); }
  forget() { return this.request('forget', {}); }
  destroy(reason = new DOMException('Session ended', 'AbortError')) {
    this.worker?.terminate(); this.worker = null;
    for (const pending of [...this.pending.values()]) { pending.finish(); pending.reject(reason); }
  }
}
