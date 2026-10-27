import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {moduleSections,readSection,replaceSection} from './prd-sections.mjs';
export function createPrdHistory({canonical,directory}){
 let queue=Promise.resolve();
 const hash=content=>crypto.createHash('sha256').update(content).digest('hex');
 const locked=work=>{const result=queue.then(work);queue=result.catch(()=>{});return result};
 async function atomic(file,content){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temp,content);await fs.rename(temp,file)}finally{await fs.rm(temp,{force:true})}}
 const stateFile=path.join(directory,'history.json');
 async function load(){const current=await fs.readFile(canonical,'utf8');let state;try{state=JSON.parse(await fs.readFile(stateFile,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error;state={schemaVersion:1,entries:[]}}
  if(!state.entries.length||state.entries.at(-1).hash!==hash(current)){state.entries.push(entry(state.entries.length?'external':'baseline',current,{note:state.entries.length?'文件外部修改':'启用历史管理时的初始内容'}));await persist(state)}return {state,current}}
 function entry(kind,content,extra={}){return {id:crypto.randomUUID(),kind,createdAt:new Date().toISOString(),hash:hash(content),content,...extra}}
 const persist=state=>atomic(stateFile,JSON.stringify(state,null,2)+'\n');
 function meta(item){const {content,...rest}=item;return rest}
 function status(state,current){const releases=state.entries.filter(e=>e.kind==='publish'),latest=releases.at(-1);return {entries:state.entries.map(meta).reverse(),latestVersion:latest?.version||0,hasUnpublishedChanges:!latest||latest.hash!==hash(current),currentHash:hash(current)}}
 async function commit(state,current,next,kind,extra){if(next===current)return {ok:true,unchanged:true,...status(state,current)};const record=entry(kind,next,extra);await atomic(canonical,next);state.entries.push(record);await persist(state);return {ok:true,entry:meta(record),...status(state,next)}}
 return {
  list:()=>locked(async()=>{const {state,current}=await load();return status(state,current)}),
  get:id=>locked(async()=>{const {state,current}=await load();const record=state.entries.find(e=>e.id===id);if(!record)throw Error('历史记录不存在');const previous=record.kind==='publish'?(state.entries.filter(e=>e.kind==='publish'&&e.version<record.version).at(-1)||state.entries.find(e=>e.kind==='baseline')):null;return {entry:record,current,currentHash:hash(current),diffBase:previous||null}}),
  saveSection:(key,content,expectedContent)=>locked(async()=>{const {state,current}=await load();if(!moduleSections[key])throw Error('未知章节');if(typeof content!=='string'||!content.trimStart().startsWith(moduleSections[key][0]))throw Error('请保留模块的章节标题');if(typeof expectedContent==='string'&&readSection(current,key)!==expectedContent){const error=Error('此章节已被其他编辑修改，请重新打开后再保存，当前草稿未丢失');error.status=409;throw error}const next=replaceSection(current,key,content);if((next.match(/^## 第 \d 章/gm)||[]).length!==6)throw Error('请保留六章结构');return commit(state,current,next,'edit',{path:key,note:'保存章节修改'})}),
  publish:(note,expectedHash)=>locked(async()=>{const {state,current}=await load();if(expectedHash&&expectedHash!==hash(current)){const error=Error('文档在发布前发生了变化，请重新检查后发布');error.status=409;throw error}const releases=state.entries.filter(e=>e.kind==='publish');if(releases.at(-1)?.hash===hash(current))throw Error('当前内容已发布，没有新的修改');if(typeof note!=='string'||note.length>6000)throw Error('发布说明最多6000字');const record=entry('publish',current,{version:(releases.at(-1)?.version||0)+1,note:note.trim()});state.entries.push(record);await persist(state);return {ok:true,entry:meta(record),...status(state,current)}}),
  restore:(id,expectedHash)=>locked(async()=>{const {state,current}=await load();if(expectedHash&&expectedHash!==hash(current)){const error=Error('文档已发生变化，请刷新历史后再恢复');error.status=409;throw error}const target=state.entries.find(e=>e.id===id);if(!target)throw Error('历史记录不存在');return commit(state,current,target.content,'restore',{sourceId:id,note:target.version?'恢复已发布版本 V'+target.version:'恢复历史修改'})})
 };
}
