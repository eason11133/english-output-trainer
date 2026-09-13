import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 8087);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const candidate = normalize(join(root, pathname));
  const file = candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()
    ? candidate
    : join(root, 'index.html');
  response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(response);
}).listen(port, '0.0.0.0', () => console.log(`Static export listening on ${port}`));
