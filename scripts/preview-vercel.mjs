// Preview the actual static output and serverless handler without the local Vite proxy.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from '../api/prd.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){req.url='/api/prd?__path='+encodeURIComponent(url.pathname)+(url.search?'&'+url.search.slice(1):'');return await handler(req,res);}
 let relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));if(/^\/(business-rules|tasks|upload|cases|system)(\/|$)/.test(url.pathname))relative='prototype.html';const file=path.resolve(root,relative);if(!file.startsWith(root))throw Error('Invalid path');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end('Not found');}}).listen(Number(process.env.PORT||4190),'127.0.0.1',()=>console.log('Vercel output preview: http://127.0.0.1:'+(process.env.PORT||4190)));
