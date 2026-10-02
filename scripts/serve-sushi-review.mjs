// Lightweight static review server. No Next compilation or model preload.
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/sushi/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.wav': 'audio/wav' };
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/__qa__/voice') {
      const file = fileURLToPath(new URL('./qa-sushi-voice.html', import.meta.url));
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
