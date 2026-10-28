import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createPrdHistory} from './prd-history.mjs';
import {createPrdComments} from './prd-comments.mjs';
import {moduleSections,readSection} from './prd-sections.mjs';
import {reviewManifest} from './prd-review-manifest.mjs';
import {mergeCanvasManifest} from './canvas-manifest.mjs';
import {searchPrd} from './prd-search.mjs';
import {selectPrdSources} from './prd-model-selector.mjs';
const hash=text=>createHash('sha256').update(text).digest('hex');
function initialState(seed){const fingerprint=hash(seed.canonical);return {revision:null,baseHash:fingerprint,canonical:seed.canonical,manifest:structuredClone(seed.manifest),comments:[],history:{schemaVersion:1,entries:[{id:'baseline-'+fingerprint,kind:'baseline',createdAt:seed.builtAt,hash:fingerprint,content:seed.canonical,note:'部署时的初始内容'}]}};}
const mutations=new Set(['PUT /api/file','POST /api/prd-comments','POST /api/prd-history/publish','POST /api/prd-history/restore']);
export async function handleCloudApi({pathname,method,query=new URLSearchParams(),data={}},{seed,store}){
 const mutating=mutations.has(method+' '+pathname);
 if(mutating&&!store.writable){const error=Error('当前为GitHub只读预览，请修改仓库文件并推送更新；网页修改不保存到持久化存储');error.status=503;throw error;}
 if(pathname==='/api/deployment'&&method==='GET')return {cloud:true,writable:store.writable,notice:store.writable?'':'GitHub 最新版 · 只读预览，内容随仓库推送及部署更新。'};
 const snapshot=await store.load(),state=snapshot.value?structuredClone(snapshot.value):initialState(seed);
 // A repository update refreshes an untouched document; cloud edits remain intact.
 const needsMigration=state.baseHash!==hash(seed.canonical)&&hash(state.canonical)===state.baseHash;
 if(needsMigration){state.canonical=seed.canonical;state.baseHash=hash(seed.canonical);state.history.entries.push({id:'repository-'+state.baseHash,kind:'external',createdAt:seed.builtAt,hash:state.baseHash,content:state.canonical,note:'GitHub 文档更新'});}
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'prd-request-'));
 try{
  const canonical=path.join(folder,'PRD.md'),directory=path.join(folder,'history'),commentFile=path.join(directory,'comments.json');
  await fs.mkdir(directory);await Promise.all([fs.writeFile(canonical,state.canonical),fs.writeFile(path.join(directory,'history.json'),JSON.stringify(state.history)),fs.writeFile(commentFile,JSON.stringify(state.comments))]);
  const history=createPrdHistory({canonical,directory}),comments=createPrdComments(commentFile),manifest=reviewManifest(state.manifest);
  let result;
  if(pathname==='/api/manifest'&&method==='GET')result={...manifest,deployment:{cloud:true,writable:store.writable}};
  else if(pathname==='/api/file'&&method==='GET'){
   const key=query.get('path');if(moduleSections[key])result={path:key,content:readSection(state.canonical,key)};
   else if(key==='interaction-prd.json')result={path:key,content:JSON.stringify(state.manifest,null,2)};
   else if(Object.hasOwn(seed.files||{},key))result={path:key,content:seed.files[key]};
   else throw Object.assign(Error('文件不存在'),{status:404});
  }else if(pathname==='/api/file'&&method==='PUT'){
   if(data.path==='interaction-prd.json'){mergeCanvasManifest(state.manifest,JSON.parse(data.content));result={ok:true};}
   else if(moduleSections[data.path])result=await history.saveSection(data.path,data.content,data.expectedContent);
   else throw Error('仅支持编辑 PRD 正文和全局画布');
  }else if(pathname==='/api/prd-history'&&method==='GET')result=await history.list();
  else if(pathname==='/api/prd-history/entry'&&method==='GET')result=await history.get(query.get('id'));
  else if(pathname==='/api/prd-history/publish'&&method==='POST')result=await history.publish(data.note||'',data.expectedHash);
  else if(pathname==='/api/prd-history/restore'&&method==='POST')result=await history.restore(data.id,data.expectedHash);
  else if(pathname==='/api/prd-comments'&&method==='GET')result=await comments.list();
  else if(pathname==='/api/prd-comments'&&method==='POST')result=await comments.mutate(data);
  else if(pathname==='/api/prd-download'&&method==='POST'){
   let text=state.canonical,version='最新草稿',title='NeosAI-IDP-三期PRD';if(data.version&&data.version!=='draft'){const record=await history.get(data.version);if(record.entry.kind!=='publish')throw Error('请选择发布版本或最新草稿');text=record.entry.content;version='V'+record.entry.version;}
   if(data.scope==='module'){if(!moduleSections[data.path])throw Error('当前章节不支持下载');text=readSection(text,data.path);title=manifest.modules.find(m=>m.prd===data.path)?.title||title;}result={content:text,version,title};
  }else if(pathname==='/api/prd-ask'&&method==='POST'){
   const status=await history.list(),published=status.entries.find(e=>e.kind==='publish');let text=state.canonical,version='最新草稿';if(data.scope!=='draft'&&published){const record=await history.get(published.id);text=record.entry.content;version='V'+published.version;}
   const found=searchPrd(text,data.question,{role:data.role,moduleId:data.moduleId,limit:12});let selected,notice='';try{selected=await selectPrdSources(data.question,found.matches);}catch{selected={configured:false,matches:found.matches.slice(0,5)};notice='模型筛选暂不可用，当前展示检索原文。';}
   result={...found,matches:selected.matches,version,currentHash:status.currentHash,mode:selected.configured?'model-selected-sources':'source-search',notice:[!published&&data.scope!=='draft'?'尚无发布版本，本次检索最新草稿。':'',notice||(!selected.configured?'模型未配置，当前展示检索原文。':'')].filter(Boolean).join(' ')};
  }else throw Object.assign(Error('接口不存在'),{status:404});
  if(mutating||(needsMigration&&store.writable)){state.canonical=await fs.readFile(canonical,'utf8');state.history=JSON.parse(await fs.readFile(path.join(directory,'history.json'),'utf8'));state.comments=await comments.list();state.revision=randomUUID();await store.save(state,snapshot.revision);}
  return result;
 }finally{await fs.rm(folder,{recursive:true,force:true});}
}
