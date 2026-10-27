<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Upload, Download, Document, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElTreeV2 } from 'element-plus'
import type { MasterDataDefinition, MasterDataRow } from '@/mocks/masterDataConfig'
import { hierarchyBindings, masterConfig, makeNodes, resolveHierarchyNode, hierarchyOptions, type HierarchyBinding } from '@/mocks/phase3'
import { readRows } from '@/utils/phase3Files'
type HierarchyRow={key:string;kind:'official'|'customer';code:string;label:string;row?:MasterDataRow;children?:HierarchyRow[]}
const props=defineProps<{master:MasterDataDefinition}>(),{t}=useI18n()
const hierarchyTab=ref('classified')
const retainedIds=ref<string[]>([])
const keyword=ref(''),busy=ref(false),fileInput=ref<HTMLInputElement>(),tree=ref<InstanceType<typeof ElTreeV2>>()
const pendingColumn=ref(''),pendingNameColumn=ref('')
const draftBindings=ref<Record<string,HierarchyBinding>>({})
const baselineDraft=ref(''),baselineFormal=ref('')
let uploadSequence=0
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value))
const queryColumns=computed(()=>props.master.columns.filter(c=>c.isQueryCode))
function formalState(){const cfg=masterConfig(props.master.id);return JSON.stringify({bindings:hierarchyBindings(props.master.id),code:cfg.codeColumn,name:cfg.nameColumn})}
function draftState(){return JSON.stringify({bindings:draftBindings.value,code:pendingColumn.value,name:pendingNameColumn.value})}
function loadDraft(){
 const cfg=masterConfig(props.master.id)
 draftBindings.value=clone(hierarchyBindings(props.master.id))
 pendingColumn.value=Object.keys(draftBindings.value).find(id=>queryColumns.value.some(c=>c.id===id))||queryColumns.value.find(c=>c.id===cfg.codeColumn)?.id||queryColumns.value[0]?.id||''
 pendingNameColumn.value=draftBindings.value[pendingColumn.value]?.nameColumnId||cfg.nameColumn||''
 baselineDraft.value=draftState();baselineFormal.value=formalState()
}
const dirty=computed(()=>draftState()!==baselineDraft.value)
const column=computed({
 get:()=>pendingColumn.value,
 set:(id:string)=>{const old=draftBindings.value[pendingColumn.value];pendingColumn.value=id;if(pendingNameColumn.value===id)pendingNameColumn.value='';if(old)draftBindings.value={[id]:{...old,nameColumnId:pendingNameColumn.value||undefined,overrides:{}}}}
})
const keepExistingFile=ref(false)
const uploadVisible=ref(false),uploadCode=ref(''),uploadName=ref(''),uploadFile=ref<File>()
function prepareUpload(){keepExistingFile.value=!!binding.value;uploadCode.value=column.value;uploadName.value=nameColumn.value;uploadFile.value=undefined;uploadVisible.value=true}
function dropFile(event:DragEvent){if(!busy.value){uploadFile.value=event.dataTransfer?.files[0]}}
function chooseFile(event:Event){const input=event.target as HTMLInputElement;uploadFile.value=input.files?.[0];input.value=''}
const binding=computed(()=>draftBindings.value[column.value])
const nameColumn=computed({
 get:()=>props.master.columns.some(c=>c.id===pendingNameColumn.value&&c.id!==column.value)?pendingNameColumn.value:'',
 set:(id:string)=>{pendingNameColumn.value=id;if(binding.value)binding.value.nameColumnId=id}
})
async function save(){
 if(busy.value)return false
 if(!column.value||!nameColumn.value||!queryColumns.value.some(c=>c.id===column.value)){ElMessage.warning(t('phase3.hierarchyMappingRequired'));return false}
 if(formalState()!==baselineFormal.value){ElMessage.error(t('phase3.hierarchyConflict'));return false}
 const cfg=masterConfig(props.master.id)
 Object.assign(cfg,{hierarchies:clone(draftBindings.value),codeColumn:column.value,nameColumn:nameColumn.value})
 baselineFormal.value=formalState();baselineDraft.value=draftState();return true
}
defineExpose({dirty,busy,save,discard:loadDraft})
onBeforeUnmount(()=>{uploadSequence++})
const assignmentOptions=computed(()=>binding.value?hierarchyOptions(binding.value):[])
const ready=computed(()=>!!binding.value&&!!nameColumn.value)

const customers=computed(()=>props.master.rows.map(row=>({key:'customer:'+row.id,kind:'customer' as const,code:row.values[column.value]||'',label:row.values[nameColumn.value||'']||'',row,node:column.value&&binding.value?resolveHierarchyNode(row,column.value,binding.value):undefined})))
const missing=computed(()=>customers.value.filter(row=>!row.node))
const matches=(row:{code:string;label:string})=>`${row.code} ${row.label}`.toLocaleLowerCase().includes(keyword.value.trim().toLocaleLowerCase())
const missingRows=computed(()=>missing.value.filter(matches))
const roots=computed<HierarchyRow[]>(()=>{
 const allNodes=binding.value?.nodes||[],index=new Map(allNodes.map(node=>[node.code,node])),needed=new Set<string>()
 for(const customer of customers.value){let node=customer.node;while(node&&!needed.has(node.code)){needed.add(node.code);node=node.parent?index.get(node.parent):undefined}}
 const nodes=allNodes.filter(node=>needed.has(node.code)),officials=new Map<string,HierarchyRow>(),records=new Map<string,HierarchyRow[]>()
 for(const n of nodes)officials.set(n.code,{key:'official:'+n.code,kind:'official',code:n.code,label:n.name,children:[]})
 for(const customer of customers.value)if(customer.node){const list=records.get(customer.node.code)||[];list.push(customer);records.set(customer.node.code,list)}
 const roots:HierarchyRow[]=[]
 for(const n of nodes){const row=officials.get(n.code)!,siblings=n.parent?officials.get(n.parent)?.children:roots;const target=siblings||roots;target.push(row,...(records.get(n.code)||[]))}
 return roots
})
const visibleNodes=computed(()=>{if(!keyword.value.trim())return roots.value;const filter=(rows:HierarchyRow[],inherited=false):HierarchyRow[]=>rows.flatMap(row=>{const match=inherited||matches(row),children=row.children?filter(row.children,match):undefined;return match||children?.length?[{...row,children}]:[]});return filter(roots.value)})
const expandedKeys=computed(()=>{const nodes=new Map(binding.value?.nodes.map(n=>[n.code,n])||[]),keys=new Set<string>();for(const row of customers.value){let node=row.node;while(node&&!keys.has('official:'+node.code)){keys.add('official:'+node.code);node=node.parent?nodes.get(node.parent):undefined}}return [...keys]})
const allCollapsed=ref(false)
async function setTreeExpanded(expand:boolean){
 await nextTick()
 const instance=tree.value,first=visibleNodes.value[0]
 if(!instance||!first||!instance.getNode(first.key))return
 const keys:string[]=[],pending=[...visibleNodes.value]
 while(pending.length){const node=pending.pop()!;if(node.children?.length){if(expand)keys.push(node.key);pending.push(...node.children)}}
 instance.setExpandedKeys(keys)
 allCollapsed.value=!expand
 instance.scrollTo(0)
}
const addVisible=ref(false),targetCode=ref(''),selectedIds=ref<string[]>([])
async function detach(row:HierarchyRow){if(binding.value&&row.row){binding.value.overrides[row.row.id]=null;if(!await save())loadDraft()}}
const assignmentIds=ref<string[]>([]),inlineAssignId=ref('')
function openAssign(row?:HierarchyRow){assignmentIds.value=row?.row?[row.row.id]:[...selectedIds.value];inlineAssignId.value=row?.row?.id||'';targetCode.value='';addVisible.value=true}
const undoAssignment=ref<{master:string;binding:HierarchyBinding;before:Record<string,string|null|undefined>;after:Record<string,string|null|undefined>}|null>(null)
async function attach(){if(!binding.value)return;if(targetCode.value&&!binding.value.nodes.some(n=>n.code===targetCode.value))return;const current=binding.value,before:Record<string,string|null|undefined>={},after:Record<string,string|null|undefined>={};for(const id of assignmentIds.value){if(!props.master.rows.some(r=>r.id===id))continue;before[id]=current.overrides[id];after[id]=targetCode.value||null;current.overrides[id]=after[id]}if(!await save()){loadDraft();return}undoAssignment.value={master:props.master.id,binding:current,before,after};addVisible.value=false;selectedIds.value=[];targetCode.value=''}

async function assignInline(row:HierarchyRow,value:string){assignmentIds.value=[row.row!.id];targetCode.value=value||'';await attach()}

async function upload(){
 if(busy.value)return
 const file=uploadFile.value,id=props.master.id,code=uploadCode.value,name=uploadName.value
 const removing=!file&&!keepExistingFile.value
 if(removing){if(!binding.value)return;try{await ElMessageBox.confirm(t('phase3.removeHierarchyPrompt'),t('phase3.deleteHierarchyFile'),{confirmButtonText:'OK',cancelButtonText:t('phase3.cancel'),type:'warning'})}catch{return}}
 else if(!queryColumns.value.some(c=>c.id===code)||!props.master.columns.some(c=>c.id===name)||code===name){ElMessage.warning(t('phase3.mappingInvalid'));return}
 const sequence=++uploadSequence;busy.value=true
 try{const original=binding.value,nodes=file?makeNodes(await readRows(file)):original?.nodes;uploadVisible.value=false;await new Promise(resolve=>setTimeout(resolve,900));if(sequence!==uploadSequence||id!==props.master.id)return
 if(formalState()!==baselineFormal.value)throw new Error('conflict')
 if(removing){Object.assign(masterConfig(id),{hierarchies:{},codeColumn:'',nameColumn:''});loadDraft()}
 else{draftBindings.value={[code]:{nameColumnId:name,definitionName:file?.name||original!.definitionName,nodes:nodes!,overrides:!file&&code===column.value?clone(original!.overrides):{}}};pendingColumn.value=code;pendingNameColumn.value=name;busy.value=false;if(!await save()){loadDraft();uploadVisible.value=true;return}}
 retainedIds.value=[];undoAssignment.value=null;ElMessage.success(t('phase3.saved'))
 }catch{if(sequence===uploadSequence){loadDraft();uploadVisible.value=true;ElMessage.error(t('phase3.invalidDefinition'))}}finally{if(sequence===uploadSequence)busy.value=false}
}
const classifiedPage=ref(1),missingPage=ref(1)
const rootGroups=computed(()=>visibleNodes.value.map(row=>[row]))
function countLeafNodes(rows:HierarchyRow[]):number{return rows.filter(r=>r.kind==='official').reduce((n,row)=>n+(row.children?.some(c=>c.kind==='official')?countLeafNodes(row.children):1),0)}
const leafCount=computed(()=>countLeafNodes(visibleNodes.value))
const pagedNodes=computed(()=>rootGroups.value.slice((classifiedPage.value-1)*10,classifiedPage.value*10).flat())
const pageLeafCount=computed(()=>countLeafNodes(pagedNodes.value))
const pagedMissing=computed(()=>missingRows.value.slice((missingPage.value-1)*10,missingPage.value*10))
watch([keyword,()=>props.master.id],()=>{classifiedPage.value=1;missingPage.value=1})
watch(()=>rootGroups.value.length,()=>{classifiedPage.value=Math.min(classifiedPage.value,Math.max(1,Math.ceil(rootGroups.value.length/10)))})
watch(()=>missingRows.value.length,()=>{missingPage.value=Math.min(missingPage.value,Math.max(1,Math.ceil(missingRows.value.length/10)))})
watch(missingPage,()=>{selectedIds.value=[];addVisible.value=false;retainedIds.value=[]})
watch([keyword,hierarchyTab],()=>{addVisible.value=false;retainedIds.value=[]})
watch(classifiedPage,()=>nextTick(()=>setTreeExpanded(!allCollapsed.value)))

function download(){const blob=new Blob(['\uFEFF階層,code,名称\n1,B37,カンジダ症\n2,B37.0,カンジダ性口内炎\n2,B37.1,肺カンジダ症\n'],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hierarchy-template.csv';a.click();URL.revokeObjectURL(url)}
watch(()=>props.master.id,()=>{undoAssignment.value=null;loadDraft();hierarchyTab.value='classified';keyword.value='';addVisible.value=false;selectedIds.value=[]},{immediate:true})
watch(binding,()=>{addVisible.value=false;selectedIds.value=[];allCollapsed.value=false})
</script>
<template><section class="p3-hierarchy-view" v-loading="busy" :element-loading-text="t('phase3.rebuildingHierarchy')">
<div class="p3-hierarchy-toolbar"><el-button :icon="Download" @click="download">{{t('phase3.hierarchyTemplate')}}</el-button><el-button :icon="Upload" :loading="busy" :disabled="!queryColumns.length" @click="prepareUpload">{{t(binding?'phase3.reuploadHierarchy':'phase3.uploadHierarchy')}}</el-button><el-input v-model="keyword" :prefix-icon="Search" clearable :placeholder="t('phase3.searchHierarchy')" class="p3-tree-search"/></div>
<el-dialog v-model="uploadVisible" class="p3-upload-dialog" :title="t(binding?'phase3.reuploadHierarchy':'phase3.uploadHierarchy')" width="600px" :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy"><el-form label-position="top"><div class="p3-upload-mappings"><el-form-item :label="t('phase3.codeColumn')"><el-select v-model="uploadCode" :disabled="busy" style="width:100%" @change="uploadName===uploadCode&&(uploadName='')"><el-option v-for="item in queryColumns" :key="item.id" :label="item.label" :value="item.id"/></el-select></el-form-item><el-form-item :label="t('phase3.nameColumn')"><el-select v-model="uploadName" :disabled="busy" style="width:100%"><el-option v-for="item in master.columns" :key="item.id" :label="item.label" :value="item.id" :disabled="item.id===uploadCode"/></el-select></el-form-item></div><div class="p3-upload-file-area"><button v-if="!uploadFile&&!keepExistingFile" type="button" class="p3-file-drop" :disabled="busy" @click="fileInput?.click()" @dragover.prevent @drop.prevent="dropFile"><el-icon :size="30"><Upload/></el-icon><span>{{t('phase3.chooseHierarchyFile')}}</span><small>XLSX / CSV</small></button><div v-else class="p3-file-selected"><el-icon :size="28"><Document/></el-icon><div class="p3-file-details"><span>{{uploadFile?.name||binding?.definitionName}}</span><small v-if="uploadFile">{{(uploadFile.size/1024).toFixed(1)}} KB</small></div><el-button link type="primary" :disabled="busy" @click="fileInput?.click()">{{t('phase3.replace')}}</el-button><el-button text :icon="Close" :disabled="busy" :aria-label="t('phase3.removed')" @click="uploadFile=undefined;keepExistingFile=false"/></div><input ref="fileInput" type="file" accept=".xlsx,.csv" hidden @change="chooseFile"/></div></el-form><template #footer><el-button :disabled="busy" @click="uploadVisible=false">{{t('phase3.cancel')}}</el-button><el-button type="primary" :loading="busy" :disabled="(!uploadFile&&!keepExistingFile&&!binding)||((uploadFile||keepExistingFile)&&(!uploadCode||!uploadName||uploadCode===uploadName))" @click="upload">{{t('phase3.save')}}</el-button></template></el-dialog>

<el-empty v-if="!ready" :description="t(!column?'phase3.chooseCodeFirst':!nameColumn?'phase3.chooseNameColumn':'phase3.noHierarchy')"/>
<div v-else class="p3-hierarchy-content"><div class="p3-hierarchy-view-switch"><el-segmented v-model="hierarchyTab" :options="[{value:'classified',label:t('phase3.classified')+' ('+(customers.length-missing.length)+')'},{value:'unclassified',label:t('phase3.unclassified')+' ('+missing.length+')'}]" :aria-label="t('phase3.hierarchyView')"/><el-button v-if="hierarchyTab==='classified'" :disabled="!visibleNodes.length" @click="setTreeExpanded(allCollapsed)">{{t(allCollapsed?'phase3.expandHierarchy':'phase3.collapseHierarchy')}}</el-button><div v-else-if="selectedIds.length" class="p3-inline-assignment"><template v-if="addVisible&&!inlineAssignId"><el-select-v2 :item-height="52" placement="bottom-end" :fallback-placements="['top-end']" popper-class="p3-hierarchy-options" v-model="targetCode" clearable @change="attach" :options="assignmentOptions" filterable :placeholder="t('phase3.targetHierarchy')" style="width:300px"/></template><el-button v-else :disabled="busy||!binding||!selectedIds.length" @click="openAssign()">{{t('phase3.batchAssignHierarchy')}}</el-button></div></div><div v-show="hierarchyTab==='classified'"><div class="p3-hierarchy-tree"><el-tree-v2 ref="tree" :data="pagedNodes" :props="{value:'key',label:'label',children:'children'}" :height="480" :item-size="48" :indent="32" :default-expanded-keys="expandedKeys" :expand-on-click-node="false" @node-expand="allCollapsed=false"><template #default="{data}"><div class="p3-hierarchy-row" :data-hierarchy-key="data.key"><span class="p3-node-name">{{data.code}} {{data.label}}</span><el-tag :type="data.kind==='official'?'primary':'success'" effect="light" size="small">{{t(data.kind==='official'?'phase3.officialOrigin':'phase3.customerOrigin')}}</el-tag><div v-if="data.kind==='customer'" class="p3-node-actions"><el-button class="p3-node-action" link :disabled="busy" :aria-label="t('phase3.moveUnclassified')" @click.stop="detach(data)">{{t('phase3.moveUnclassified')}}</el-button></div></div></template></el-tree-v2></div></div><div v-show="hierarchyTab==='unclassified'"><section class="p3-unclassified"><el-table :data="pagedMissing" border height="480" row-key="key" @selection-change="(rows:typeof missing)=>selectedIds=rows.map(r=>r.row.id)"><el-table-column type="selection" width="48"/><el-table-column prop="code" :label="t('phase3.codeColumn')"/><el-table-column prop="label" :label="t('phase3.recordName')"/><el-table-column :label="t('phase3.targetHierarchy')" width="280" fixed="right"><template #default="{row}"><div class="p3-inline-assignment p3-inline-assignment--row"><el-select-v2 :item-height="52" placement="bottom-end" :fallback-placements="['top-end']" popper-class="p3-hierarchy-options" :model-value="binding?.overrides[row.row.id]||''" clearable @change="(value:string)=>assignInline(row,value)" :options="assignmentOptions" filterable :placeholder="t('phase3.targetHierarchy')" style="width:100%"/></div></template></el-table-column></el-table></section></div><el-pagination v-model:current-page="classifiedPage" v-if="hierarchyTab==='classified'" :page-size="10" :total="rootGroups.length" layout="slot, prev, pager, next, jumper" style="margin-top:20px;justify-content:flex-end"><template #default><span class="p3-leaf-total">{{t('phase3.hierarchyLeafTotal',{page:pageLeafCount,count:leafCount})}}</span></template></el-pagination><el-pagination v-if="hierarchyTab==='unclassified'" v-model:current-page="missingPage" :page-size="10" :total="missingRows.length" layout="total, prev, pager, next, jumper" style="margin-top:20px;justify-content:flex-end"/></div>


</section></template>
<style scoped>
.p3-hierarchy-view-switch{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;min-height:40px}.p3-hierarchy-view-switch :deep(.el-segmented){--el-segmented-bg-color:var(--el-fill-color-light);--el-segmented-item-selected-bg-color:var(--el-bg-color);--el-segmented-item-selected-color:var(--el-text-color-primary);--el-segmented-item-hover-bg-color:var(--el-fill-color);--el-segmented-item-active-bg-color:var(--el-fill-color);--el-segmented-padding:4px;border-radius:6px;font-size:15px}.p3-hierarchy-view-switch :deep(.el-segmented__item){min-height:32px;padding:0 16px}.p3-hierarchy-view-switch :deep(.el-segmented__item.is-selected){font-weight:600}
.p3-hierarchy-view{padding:16px 20px}.p3-hierarchy-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}.p3-definition-name{overflow-wrap:anywhere;max-width:280px;color:var(--el-text-color-secondary)}.p3-tree-search{width:240px;margin-left:auto}.p3-hierarchy-tree{border:1px solid var(--el-border-color-lighter);padding:12px;border-radius:4px}.p3-hierarchy-row{display:flex;width:100%;height:48px;align-items:center;gap:10px;min-width:0}.p3-node-name{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.p3-hierarchy-row>.el-tag{flex:none}.p3-node-action{margin-left:auto}.p3-unclassified-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.p3-unclassified-toolbar h3{margin:0!important}.p3-unclassified{margin:0 0 24px}.p3-unclassified h3{font-size:18px;margin:0 0 16px}.p3-unclassified h3 span{color:var(--el-text-color-secondary)}
</style>

<style scoped>.p3-code-column-picker{display:flex;align-items:center;gap:10px;flex-shrink:0}</style>

<style scoped>.p3-hierarchy-tree :deep(.el-tree-node__content){padding-right:20px}.p3-node-action{flex-shrink:0}</style>

<style scoped>.p3-unclassified{margin:0;border:1px solid var(--el-border-color-lighter);padding:12px;border-radius:4px}</style>

<style scoped>
.p3-upload-mappings{display:grid;grid-template-columns:1fr 1fr;gap:20px}.p3-upload-mappings .el-form-item{margin-bottom:24px}.p3-upload-file-area{margin-bottom:8px}.p3-file-drop{width:100%;min-height:156px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;border:1px dashed var(--el-border-color);border-radius:8px;background:var(--el-fill-color-lighter);color:var(--el-text-color-primary);font:inherit;cursor:pointer}.p3-file-drop:hover,.p3-file-drop:focus-visible{border-color:var(--el-color-primary);outline-color:var(--el-color-primary)}.p3-file-drop>.el-icon{color:var(--el-color-primary)}.p3-file-drop small,.p3-file-details small{color:var(--el-text-color-secondary);font-size:15px}.p3-file-selected{min-height:100px;display:flex;align-items:center;gap:16px;padding:20px;border:1px solid var(--el-border-color-lighter);border-radius:8px;background:var(--el-fill-color-lighter)}.p3-file-selected>.el-icon{color:var(--el-color-primary);flex-shrink:0}.p3-file-details{display:flex;flex:1;min-width:0;flex-direction:column;gap:6px}.p3-file-details>span{overflow-wrap:anywhere}.p3-upload-dialog :deep(.el-dialog__footer){padding-top:24px}@media(max-width:640px){.p3-upload-mappings{grid-template-columns:1fr;gap:0}}
</style>

<style scoped>.p3-current-file{display:flex;gap:12px;margin-bottom:16px;font-size:15px;color:var(--el-text-color-secondary)}.p3-current-file span:last-child{color:var(--el-text-color-primary);overflow-wrap:anywhere}.p3-leaf-total{font-size:15px;color:var(--el-text-color-regular);margin-right:12px}</style>

<style scoped>.p3-inline-assignment{display:flex;align-items:center;gap:8px;min-width:0}.p3-inline-assignment .el-button+.el-button{margin-left:0}</style>

<style scoped>.p3-inline-assignment--row{flex-wrap:wrap;padding:4px 0}.p3-inline-assignment--row>.el-select{flex:0 0 100%;min-width:0}</style>

<style>.p3-hierarchy-options .el-select-dropdown__item{white-space:normal;overflow-wrap:anywhere;line-height:22px;padding-top:4px;padding-bottom:4px;height:52px;box-sizing:border-box}.p3-hierarchy-options{width:400px!important;max-width:calc(100vw - 32px)}.p3-hierarchy-options .el-select-dropdown{width:100%!important}</style>

<style>.p3-hierarchy-options .el-vl__wrapper,.p3-hierarchy-options .el-vl__window{width:100%!important}.p3-hierarchy-options .el-select-dropdown__item{width:100%!important}.p3-current-file>.el-button{margin-left:auto;flex-shrink:0}</style>

<style scoped>.p3-node-actions{display:flex;align-items:center;gap:12px;margin-left:auto;flex-shrink:0}.p3-assignment-feedback{display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:16px;background:var(--el-fill-color-light);border-radius:4px}.p3-assignment-feedback>.el-button:last-child{margin-left:auto}</style>
