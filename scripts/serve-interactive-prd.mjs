import {userModelOptions,testUserModel} from './prd-user-model.mjs';
import {reviewManifest} from './prd-review-manifest.mjs';
import {answerPrd as selectPrdSources} from './prd-model-selector.mjs';
import {searchPrd} from './prd-search.mjs';
import {createPrdComments} from './prd-comments.mjs';
import http from 'node:http';
import {createPrdHistory} from './prd-history.mjs';
import {mergeCanvasManifest} from './canvas-manifest.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {moduleSections,readSection} from './prd-sections.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),workspace=path.join(root,'interaction-prd/NeosAI-IDP-三期需求-workspace'),canonical=process.env.PRD_CANONICAL_PATH||path.join(root,'PRD.zh-CN.md');
try{process.loadEnvFile(path.join(root,'.env.local'))}catch(error){if(error.code!=='ENOENT')throw error}
const history=createPrdHistory({canonical,directory:process.env.PRD_HISTORY_DIR||path.join(root,'.prd-history')});
async function currentManifest(){return reviewManifest(JSON.parse(await fs.readFile(path.join(workspace,'interaction-prd.json'),'utf8')))}
async function payload(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>24*1024*1024)throw Error('Request too large')}return JSON.parse(text)}
function json(res,value,status=200){res.writeHead(status,{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
const comments=createPrdComments(path.join(root,'.prd-history','comments.json'));
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:4176');
 if(url.pathname==='/api/prd-model-test'&&req.method==='POST')return json(res,await testUserModel((await payload(req)).modelConfig));
 if(url.pathname==='/api/prd-download'&&req.method==='POST'){const data=await payload(req);let text,version;if(data.version&&data.version!=='draft'){const record=await history.get(data.version);if(record.entry.kind!=='publish')throw Error('请选择发布版本或最新草稿');text=record.entry.content;version='V'+record.entry.version}else{text=await fs.readFile(canonical,'utf8');version='最新草稿'}let title='NeosAI-IDP-三期PRD';if(data.scope==='module'){if(!moduleSections[data.path])throw Error('当前章节不支持下载');text=readSection(text,data.path);title=(await currentManifest()).modules.find(m=>m.prd===data.path)?.title||title}return json(res,{content:text,version,title})}
 if(url.pathname==='/api/prd-ask'&&req.method==='POST'){const data=await payload(req),status=await history.list(),published=status.entries.find(e=>e.kind==='publish');let text,version;if(data.scope==='draft'||!published){text=await fs.readFile(canonical,'utf8');version='最新草稿'}else{const result=await history.get(published.id);text=result.entry.content;version='V'+published.version}const found=searchPrd(text,data.question,{role:data.role,moduleId:data.moduleId,limit:12});const userOptions=await userModelOptions(data.modelConfig);let selected,modelNotice='';try{selected=await selectPrdSources(data.question,found.matches,userOptions)}catch{selected={configured:false,matches:found.matches.slice(0,5)};modelNotice='模型回答暂不可用，当前展示检索原文。'}return json(res,{...found,matches:selected.matches,answer:selected.answer||[],version,mode:selected.configured?'grounded-answer':'source-search',notice:[!published&&data.scope!=='draft'?'尚无发布版本，本次检索最新草稿。':'',modelNotice||(!selected.configured?'模型未配置，当前展示检索原文。':'')].filter(Boolean).join(' '),currentHash:status.currentHash})}
 if(url.pathname==='/api/prd-comments'&&req.method==='GET')return json(res,await comments.list())
 if(url.pathname==='/api/prd-comments'&&req.method==='POST')return json(res,await comments.mutate(await payload(req)))
 if(url.pathname==='/api/prd-history'&&req.method==='GET')return json(res,await history.list())
 if(url.pathname==='/api/prd-history/entry'&&req.method==='GET')return json(res,await history.get(url.searchParams.get('id')))
 if(url.pathname==='/api/prd-history/publish'&&req.method==='POST'){const data=await payload(req);return json(res,await history.publish(data.note||'',data.expectedHash))}
 if(url.pathname==='/api/prd-history/restore'&&req.method==='POST'){const data=await payload(req);return json(res,await history.restore(data.id,data.expectedHash))}
 if(url.pathname==='/api/manifest'&&req.method==='GET')return json(res,await currentManifest())
 if(url.pathname==='/api/file'&&req.method==='GET'&&moduleSections[url.searchParams.get('path')]){const key=url.searchParams.get('path');return json(res,{path:key,content:readSection(await fs.readFile(canonical,'utf8'),key)})}
 if(url.pathname==='/api/file'&&req.method==='PUT'){const data=await payload(req);if(data.path==='interaction-prd.json'){const incoming=JSON.parse(data.content),base=JSON.parse(await fs.readFile(path.join(workspace,'interaction-prd.json'),'utf8'));mergeCanvasManifest(base,incoming);await fs.writeFile(path.join(workspace,'interaction-prd.json'),JSON.stringify(base,null,2)+'\n');return json(res,{ok:true})}if(moduleSections[data.path])return json(res,await history.saveSection(data.path,data.content,data.expectedContent));const upstream=http.request({hostname:'127.0.0.1',port:4173,path:req.url,method:'PUT',headers:{'Content-Type':'application/json'}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});upstream.on('error',e=>json(res,{error:e.message},502));upstream.end(JSON.stringify(data));return}
 if(url.pathname==='/api/export'&&req.method==='POST'){const data=await payload(req),manifest=await currentManifest(),module=manifest.modules.find(m=>m.id===data.moduleId);if(module&&moduleSections[module.prd]){if((data.screenshots||[]).length!==module.pages.length)throw Error('原型截图数量不完整');const folder=path.join(workspace,'exports',module.id+'-'+new Date().toISOString().replace(/[:.]/g,'-'));await fs.mkdir(folder,{recursive:true});let text=readSection(await fs.readFile(canonical,'utf8'),module.prd)+'\n## 原型截图\n';for(const shot of data.screenshots||[]){const page=manifest.pages.find(p=>p.id===shot.pageId&&module.pages.includes(p.id));if(!page)throw Error('Unknown page');const match=/^data:image\/png;base64,([\s\S]+)$/.exec(shot.dataUrl||'');if(!match)throw Error('Invalid screenshot');await fs.writeFile(path.join(folder,page.id+'.png'),Buffer.from(match[1],'base64'));text+='\n### '+page.title+'\n\n!['+page.title+'](./'+page.id+'.png)\n'}await fs.writeFile(path.join(folder,module.id+'.md'),text);return json(res,{ok:true,folder:path.relative(workspace,folder),markdown:module.id+'.md'})}throw Error('请使用正式PRD模块导出')}
 const appPath=/^\/(business-rules|tasks|src|node_modules|@vite|@id|@fs|assets)(\/|$)/.test(url.pathname)||['/__uno.css','/logo.png','/icons.svg','/favicon.svg'].includes(url.pathname);
 const port=appPath?5174:4173;const upstream=http.request({hostname:'127.0.0.1',port,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:'+port}},r=>{res.writeHead(r.statusCode,{...r.headers,'Cache-Control':'no-store'});r.pipe(res)});upstream.on('error',e=>{if(!res.headersSent)json(res,{error:e.message},502);else res.end()});req.pipe(upstream);
 }catch(error){json(res,{error:error.message},error.status||400)}});
const port=Number(process.env.PORT||4176);server.listen(port,'127.0.0.1',()=>console.log('Interactive PRD: http://127.0.0.1:'+port));
