import { reactive, watch } from 'vue'
import { customerIcdFields } from './customerIcdSample'
import { officialIcdSample } from './officialIcdSample'
import type { MasterDataDefinition, MasterDataRow } from './masterDataConfig'
export interface Schedule { frequency: 'daily'|'weekly'|'monthly'|'halfyear'; time:string; weekday:number; month:number; day:number }
export interface ExternalConnection { id:string; name:string; url:string; created:string; creator:string; testStatus?:'success'|'failed'; testedUrl?:string; connector?:'salesforce'|'http-api'; authentication?:'client-credentials'|'api-key'|'bearer-token'|'none'; tokenUrl?:string; apiKeyHeader?:string; clientId?:string; useClientCredentials?:boolean; secretConfigured?:boolean; updated?:string; updatedBy?:string }
export interface Classification { level:number; code:string; name:string; parent:string|null }
export interface SyncRun { id:string; start:string; duration:string; trigger:string; status:string; added:number; changed:number; removed:number; unchanged:number; failed:number; reason:string }
export interface HierarchyBinding { nameColumnId?:string; definitionName:string; nodes:Classification[]; overrides:Record<string,string|null> }
export const SYNC_TIME = '03:00'
export const syncingMasters=reactive<Record<string,boolean>>({})
export interface OcrModelTemplate {id:string;name:string;main:string;verify:string[];docTypes:string[]}
export interface MasterP3 { hierarchies?:Record<string,HierarchyBinding>; threshold:number; connection:string; source:string; key:string; fields:Record<string,string>; enabled:boolean; automatic:boolean; schedule:Schedule; definitionName:string; nodes:Classification[]; codeColumn:string; nameColumn:string; overrides:Record<string,string>; history:SyncRun[] }
interface Phase3State { connections:ExternalConnection[]; masters:Record<string,MasterP3>; ocr:{main:string; verify:string[]; availableModels?:string[]; templates?:OcrModelTemplate[]; fallbackId?:string} }
const seed:Phase3State={connections:[{id:'sfdc',name:'SFDC',url:'https://sfdc-demo.example.com',clientId:'demo-idp-client-id',secretConfigured:true,created:'2026-10-22 09:00',creator:'管理者'}],masters:{},ocr:{main:'model-conn-001',verify:['model-conn-002']}}
let loaded=seed
try { const value=JSON.parse(localStorage.getItem('neosai-phase3-vue')||'null'); if(value?.connections&&value?.masters&&value?.ocr)loaded=value } catch {}
export const p3=reactive<Phase3State>(loaded)
watch(p3,value=>localStorage.setItem('neosai-phase3-vue',JSON.stringify(value)),{deep:true})
export function masterConfig(id:string):MasterP3 { return p3.masters[id] ||= {threshold:90,connection:'',source:'',key:'Id',fields:{},enabled:false,automatic:true,schedule:{frequency:'daily',time:'03:00',weekday:1,month:1,day:1},definitionName:'',nodes:[],codeColumn:'',nameColumn:'',overrides:{},history:[]} }
const demoSync=masterConfig('master-disease')
if(!localStorage.getItem('neosai-phase3-active-demo-v1')){
 if(!demoSync.connection&&!demoSync.source){Object.assign(demoSync,{enabled:true,connection:'sfdc',source:'ICD10コードマスタ',key:'Id',fields:{Id:'',ICD10コード:'col-d-code',傷病名:'col-d-name',特定疾病:'col-d-disease','特定疾病（Famix）':'col-d-disease-famix',特定部位:'col-d-site','特定部位（Famix）':'col-d-site-famix'}})}
 localStorage.setItem('neosai-phase3-active-demo-v1','1')
}
// Migrate only the original demo mapping; preserve user-defined mappings.
if(demoSync.source==='ICD10コードマスタ'&&demoSync.fields.Id==='col-d-code'&&demoSync.fields.ICD10コード==='col-d-icd'){
 demoSync.fields={Id:'',ICD10コード:'col-d-code',傷病名:'col-d-name',特定疾病:'col-d-disease','特定疾病（Famix）':'col-d-disease-famix',特定部位:'col-d-site','特定部位（Famix）':'col-d-site-famix'}
}
export const sourceExamples=[{name:'ICD10コードマスタ',fields:customerIcdFields},{name:'医療機関マスタ',fields:['Id','機関コード','医療機関名','都道府県']},{name:'TNM分類マスタ',fields:['Id','分類コード','分類名']}]
export function makeNodes(rows:string[][]):Classification[]{
 if(!rows.length||rows[0].length!==3||!['階層','层级'].includes(rows[0][0])||rows[0][1].toLowerCase()!=='code'||!['名称','名前','名称'].includes(rows[0][2]))throw Error('invalidDefinition')
 const content=rows.slice(1).filter(c=>c.some(v=>v.trim()))
 if(content.length&&content.every(c=>/^[A-Z][0-9]{2}[0-9A-Za-z.]*$/.test(c[1]?.trim()||''))){
  const nodes=content.map(c=>({level:1,code:c[1].trim(),name:c[2]?.trim()||'',parent:null as string|null})),map=new Map(nodes.map(n=>[normalize(n.code),n]))
  if(map.size!==nodes.length||nodes.some(n=>!n.name))throw Error('invalidDefinition')
  for(const n of nodes){const code=normalize(n.code);for(let size=code.length-1;size>=3;size--){const parent=map.get(code.slice(0,size));if(parent){n.parent=parent.code;break}}}
  const byCode=new Map(nodes.map(n=>[n.code,n]));const depth=(n:Classification):number=>n.parent?depth(byCode.get(n.parent)!)+1:1;for(const n of nodes)n.level=depth(n)
  return nodes
 }
 const nodes:Classification[]=[],stack:Classification[]=[];const codes=new Set<string>()
 for(const cells of rows.slice(1)){if(!cells.some(v=>v.trim()))continue;const level=Number(cells[0]),code=cells[1]?.trim(),name=cells[2]?.trim();if(!Number.isInteger(level)||level<1||level>stack.length+1||!code||!name||codes.has(code))throw Error('invalidDefinition');stack.length=level-1;const node={level,code,name,parent:stack[level-2]?.code||null};nodes.push(node);stack.push(node);codes.add(code)}
 if(!nodes.length)throw Error('invalidDefinition')
 // A flat ICD export uses code structure; never infer names or create missing official nodes.
 if(nodes.every(n=>n.level===1)&&nodes.every(n=>/^[A-Z][0-9]{2}[0-9A-Za-z.]*$/.test(n.code))){
  const codes=new Map(nodes.map(n=>[normalize(n.code),n]))
  for(const node of nodes){const code=normalize(node.code);for(let size=code.length-1;size>=3;size--){const parent=codes.get(code.slice(0,size));if(parent){node.parent=parent.code;break}}}
  const map=new Map(nodes.map(n=>[n.code,n]));const depth=(n:Classification):number=>n.parent?depth(map.get(n.parent)!)+1:1;for(const n of nodes)n.level=depth(n)
 }
 return nodes
}
export function hierarchyBindings(id:string):Record<string,HierarchyBinding>{const cfg=masterConfig(id);if(!cfg.hierarchies){cfg.hierarchies={};if(cfg.nodes.length&&cfg.codeColumn)cfg.hierarchies[cfg.codeColumn]={nameColumnId:cfg.nameColumn||undefined,definitionName:cfg.definitionName,nodes:cfg.nodes,overrides:cfg.overrides}}return cfg.hierarchies}
export function activeHierarchies(master:MasterDataDefinition){return Object.entries(hierarchyBindings(master.id)).filter(([id,b])=>b.nodes.length&&master.columns.some(c=>c.id===id&&c.isQueryCode))}
const normalize=(code:string)=>code.trim().normalize('NFKC').replace(/\./g,'')
type NodeIndex={exact:Map<string,Classification[]>;normalized:Map<string,Classification[]>;options:{value:string;label:string}[]}
const indexes=new WeakMap<Classification[],NodeIndex>()
function nodeIndex(nodes:Classification[]):NodeIndex{let index=indexes.get(nodes);if(index)return index;index={exact:new Map(),normalized:new Map(),options:[]};const add=(map:Map<string,Classification[]>,key:string,node:Classification)=>{const list=map.get(key)||[];if(!list.includes(node))list.push(node);map.set(key,list)};for(const node of nodes){add(index.exact,node.code,node);add(index.exact,node.name,node);add(index.exact,`${node.code} ${node.name}`,node);add(index.normalized,normalize(node.code),node);index.options.push({value:node.code,label:`${node.code} ${node.name}`})}indexes.set(nodes,index);return index}
export function hierarchyOptions(binding:HierarchyBinding){return nodeIndex(binding.nodes).options}
export function resolveNode(master:MasterDataDefinition,row:MasterDataRow,columnId?:string){const entry=columnId?[columnId,hierarchyBindings(master.id)[columnId]] as const:activeHierarchies(master)[0];if(!entry?.[1])return;return resolveHierarchyNode(row,entry[0],entry[1])}
export function resolveHierarchyNode(row:MasterDataRow,id:string,binding:HierarchyBinding){const index=nodeIndex(binding.nodes),manual=binding.overrides[row.id];if(Object.prototype.hasOwnProperty.call(binding.overrides,row.id)&&manual===null)return;const matches=manual?index.exact.get(manual.trim()):index.normalized.get(normalize(row.values[id]||''));return matches?.length===1?matches[0]:undefined}
export function upperLabel(master:MasterDataDefinition,row:MasterDataRow,columnId?:string){try{const id=columnId||activeHierarchies(master)[0]?.[0];if(!id)return '—';const binding=hierarchyBindings(master.id)[id],node=resolveNode(master,row,id),parent=node?.parent?nodeIndex(binding.nodes).exact.get(node.parent)?.[0]:undefined;if(binding.overrides[row.id])return node?`${node.code} ${node.name}`:binding.overrides[row.id];return parent?`${parent.code} ${parent.name}`:'—'}catch{return '—'}}

export function ocrTemplates():OcrModelTemplate[]{return p3.ocr.templates ||= [{id:'ocr-default',name:'標準OCR',main:p3.ocr.main,verify:[...p3.ocr.verify],docTypes:[]}]}
export function resolveOcrTemplate(docTypeId:string){const templates=ocrTemplates();return templates.find(t=>t.id!==(p3.ocr.fallbackId||templates[0]?.id)&&t.docTypes.includes(docTypeId))||templates.find(t=>t.id===p3.ocr.fallbackId)||templates[0]}

if(!localStorage.getItem('neosai-official-hierarchy-demo-v1')){
 const bindings=hierarchyBindings('master-disease')
 if(!bindings['col-d-code'])bindings['col-d-code']={nameColumnId:'col-d-name',definitionName:'hierarchy-template (1).xlsx',nodes:makeNodes(officialIcdSample),overrides:{}}
 localStorage.setItem('neosai-official-hierarchy-demo-v1','1')
}

const demoConnection=p3.connections.find(c=>c.id==='sfdc')
if(demoConnection&&!demoConnection.url){Object.assign(demoConnection,{url:'https://sfdc-demo.example.com',clientId:'demo-idp-client-id',secretConfigured:true})}

// Repair flat bindings imported from the supplied ICD workbook before prefix parsing existed.
for(const config of Object.values(p3.masters))for(const binding of Object.values(config.hierarchies||{})){
 if(binding.definitionName==='hierarchy-template (1).xlsx'&&binding.nodes.length>1&&binding.nodes.every(n=>n.level===1&&!n.parent)){
  binding.nodes=makeNodes([['階層','code','名称'],...binding.nodes.map(n=>['1',n.code,n.name])])
 }
}

if(!localStorage.getItem('neosai-official-full-file-v1')){
 const bindings=hierarchyBindings('master-disease'),binding=bindings['col-d-code']
 if(binding?.definitionName==='hierarchy-template (1).xlsx'&&binding.nodes.length===63){binding.nodes=makeNodes(officialIcdSample)}
 localStorage.setItem('neosai-official-full-file-v1','1')
}

// Explicitly migrate the known ICD demo mapping; never infer customer columns from labels.
const icdDemoBinding=hierarchyBindings('master-disease')['col-d-code']
if(icdDemoBinding&&!icdDemoBinding.nameColumnId)icdDemoBinding.nameColumnId='col-d-name'
