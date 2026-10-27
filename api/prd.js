import fs from 'node:fs/promises';
import path from 'node:path';
import {handleCloudApi} from '../scripts/prd-cloud-api.mjs';
import {createCloudStore} from '../scripts/prd-cloud-store.mjs';
let seed;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json;charset=utf-8');
 try{
  seed||=JSON.parse(await fs.readFile(path.join(process.cwd(),'.vercel-data/seed.json'),'utf8'));
  const url=new URL(req.url,'http://localhost');
  const pathname=url.searchParams.get('__path')||url.pathname;
  let data=req.body;if(typeof data==='string')data=JSON.parse(data);if(!data&&!['GET','HEAD'].includes(req.method)){let text='';for await(const chunk of req){text+=chunk;if(text.length>4*1024*1024)throw Object.assign(Error('请求内容过大'),{status:413});}data=text?JSON.parse(text):{};}
  const result=await handleCloudApi({pathname,method:req.method,query:url.searchParams,data:data||{}},{seed,store:createCloudStore()});res.statusCode=200;res.end(JSON.stringify(result));
 }catch(error){res.statusCode=error.status||400;res.end(JSON.stringify({error:error.message}));}
}
