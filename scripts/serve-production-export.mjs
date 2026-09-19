import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';

const root=resolve(process.argv[2]??'dist');
const port=Number(process.argv[3]??8082);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.ttf':'font/ttf','.ico':'image/x-icon'};

createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url??'/',`http://${request.headers.host}`).pathname);
    const candidate=join(root,pathname.replace(/^\/+/,''));
    const file=(await stat(candidate).catch(()=>null))?.isFile()?candidate:join(root,'index.html');
    response.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream','cache-control':'no-store'});
    response.end(await readFile(file));
  }catch{response.writeHead(500);response.end('production_export_unavailable')}
}).listen(port,'127.0.0.1',()=>process.stdout.write(`Production export ready at http://127.0.0.1:${port}\n`));
