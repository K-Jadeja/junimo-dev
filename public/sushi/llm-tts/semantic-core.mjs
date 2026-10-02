export function cosine(left, right) {
  if (left.length !== right.length || !left.length) throw new Error('Memory vector dimensions do not match.');
  let dot = 0, a = 0, b = 0;
  for (let i = 0; i < left.length; i++) {
    if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) throw new Error('Memory vector contains invalid values.');
    dot += left[i] * right[i]; a += left[i] ** 2; b += right[i] ** 2;
  }
  return a && b ? dot / Math.sqrt(a * b) : 0;
}
export function memoryChunks(text, size = 640) {
  if (!Number.isInteger(size) || size <= 80) throw new Error('Memory chunks must exceed their overlap.');
  const chunks = [];
  for (let index = 0; index < text.length; index += size - 80) chunks.push(text.slice(index, index + size));
  // Whole messages preserve pronoun context, but a message can mix several
  // unrelated facts. Also index individual sentences so one topic is not
  // diluted by a name, a city and a plan in the same utterance.
  const sentences = text.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [];
  if (sentences.length > 1) for (const sentence of sentences) {
    const clean = sentence.trim();
    if (clean.length >= 25 && clean.length <= size) chunks.push(clean);
  }
  return chunks.length ? [...new Set(chunks)] : [''];
}
export function validVectors(vectors) {
  return Array.isArray(vectors) && vectors.length > 0 && vectors.every(vector => Array.isArray(vector) && vector.length === 384 && vector.every(Number.isFinite));
}
