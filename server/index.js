import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {solve} from '../src/cpm.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
export function handler(req,res){
 if(req.url==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"status":"ok"}');return;}
 if(req.url==='/api/solve'&&req.method==='POST'){let body='';req.on('data',chunk=>{body+=chunk;if(body.length>200000)req.destroy();});req.on('end',()=>{try{const result=solve(JSON.parse(body).activities);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}});return;}
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const pathname=new URL(req.url,'http://localhost').pathname;
 const target=path.resolve(root,'.'+decodeURIComponent(pathname));
 if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);res.end();return;}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
 const serve=async()=>{try{const data=await readFile(target===root?path.join(root,'index.html'):target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(data);}catch{try{res.writeHead(200,{'Content-Type':'text/html'});res.end(await readFile(path.join(root,'index.html')));}catch{res.writeHead(404);res.end('Ejecuta npm run build primero.');}}};serve();
}
if(process.argv[1]===fileURLToPath(import.meta.url))http.createServer(handler).listen(process.env.PORT||3001,'127.0.0.1',()=>console.log('CPM: http://localhost:3001'));
