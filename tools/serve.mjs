/** Dependency-free development server. Serve locally so WebGPU can use a secure context. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 8080);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(resolve(root) + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Shield Polar Lab: http://localhost:${port}`));
