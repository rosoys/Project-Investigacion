import http from 'node:http';
import {createServer} from 'vite';
import {handler} from './index.js';
const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
http.createServer((req,res)=>req.url.startsWith('/api/')?handler(req,res):vite.middlewares(req,res)).listen(3000,'127.0.0.1',()=>console.log('CPM: http://localhost:3000'));
