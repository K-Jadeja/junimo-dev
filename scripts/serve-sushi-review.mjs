// Lightweight static review server. No Next compilation or model preload.
import http from 'node:http';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';

const root = fileURLToPath(new URL('../public/sushi/', import.meta.url));
const backups = new Map();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.wav': 'audio/wav' };
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/__qa__/model-backup/') && ['GET', 'OPTIONS'].includes(request.method)) {
      if (request.headers.origin !== 'https://sushi.junimo.dev' || request.headers.host !== '127.0.0.1:3100') { response.writeHead(403).end(); return; }
      const backup = backups.get(url.pathname);
      if (!backup || Date.now() - backup.created > 15 * 60 * 1000) { response.writeHead(404).end(); return; }
      const headers = { 'Access-Control-Allow-Origin': 'https://sushi.junimo.dev', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Private-Network': 'true', 'Content-Type': 'application/octet-stream', 'Content-Length': backup.size, 'Cache-Control': 'no-store' };
      if (request.method === 'OPTIONS') { response.writeHead(204, { ...headers, 'Content-Length': 0 }).end(); return; }
      response.writeHead(200, headers); createReadStream(backup.file).pipe(response); return;
    }
    if (url.pathname === '/__qa__/model-backup' && request.method === 'POST') {
      if (request.headers.origin !== 'http://127.0.0.1:3100' || request.headers.host !== '127.0.0.1:3100' || request.headers['content-type'] !== 'application/octet-stream') { response.writeHead(403).end(); return; }
      const size = Number(request.headers['content-length']);
      if (!Number.isSafeInteger(size) || size < 1 || size > 1024 ** 3) { response.writeHead(413).end(); return; }
      const file = path.join(os.tmpdir(), `sushi-models-${randomUUID()}.sushicache`);
      await pipeline(request, createWriteStream(file, { flags: 'wx' }));
      const endpoint = `/__qa__/model-backup/${randomUUID()}`;
      backups.set(endpoint, { file, size, created: Date.now() });
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ file, link: `http://127.0.0.1:3100${endpoint}` }));
      return;
    }
    if (['/__qa__/voice', '/__qa__/cache'].includes(url.pathname)) {
      const file = fileURLToPath(new URL(url.pathname.endsWith('cache') ? './qa-sushi-cache.html' : './qa-sushi-voice.html', import.meta.url));
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' });
      createReadStream(file).pipe(response);
      return;
    }
    const pathname = decodeURIComponent(url.pathname).replace(/^\/sushi(?=\/|$)/, '');
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
    let info = await stat(file);
    if (info.isDirectory()) { file = path.join(file, 'index.html'); info = await stat(file); }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 3100), '127.0.0.1', () => console.log('Sushi review: http://127.0.0.1:3100/llm-tts'));
