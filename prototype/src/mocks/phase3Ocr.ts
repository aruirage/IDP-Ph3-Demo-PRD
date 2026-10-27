import { compareSimilarityCandidates } from './masterCandidateOrder'
import { docTypeDefinitions } from './docTypeSettings'
import { activeHierarchies } from './phase3'
import { findMasterDefinition } from './masterDataConfig'
import type { OcrExtractionField, OcrMasterMatchCandidate } from './ocrExtractionTask'
export function applyPhase3Once(fields:OcrExtractionField[],docTypeName?:string){
 const review=docTypeDefinitions.value.find(d=>d.name===docTypeName)?.readModel
 for(const field of fields){field.ocrOriginalValue??=field.value;if(field.phase3Matched)continue;field.phase3Matched=true;field.masterReviewEnabled=review?.masterReviewEnabled??true
 if(!field.masterDataId||!field.masterMatchCandidates?.length)continue
 const table=findMasterDefinition(field.masterDataId);if(!table)continue
 const candidates=field.masterMatchCandidates.filter(c=>c.strategy!=='code'&&(c.similarityScore||0)>75).sort(compareSimilarityCandidates).slice(0,3)
 const bindings=activeHierarchies(table),binding=field.masterCodeColumnId?bindings.find(([id])=>id===field.masterCodeColumnId)?.[1]:bindings.length===1?bindings[0][1]:undefined
 const hierarchyPath=(code:string)=>{const path:string[]=[],seen=new Set<string>();let node=binding?.nodes.find(n=>n.code.replace(/\./g,'')===code.replace(/\./g,''));while(node&&!seen.has(node.code)){seen.add(node.code);path.unshift(`${node.code} ${node.name}`);node=binding?.nodes.find(n=>n.code===node?.parent)}return path.join(' › ')}
 const exactCandidates=table.columns.some(c=>c.isQueryCode)?field.masterMatchCandidates.filter(c=>c.strategy==='code'):[]
 const exact=exactCandidates.length===1?exactCandidates[0]:undefined
 const codeOf=(c:OcrMasterMatchCandidate)=>Object.entries(c.linkedValues||{}).find(([id])=>id!==field.id&&/code|icd/i.test(id))?.[1]||c.value
 for(const candidate of field.masterMatchCandidates){candidate.hierarchyPath=hierarchyPath(codeOf(candidate));const node=binding?.nodes.find(n=>n.code.replace(/\./g,'')===codeOf(candidate).replace(/\./g,''));candidate.hierarchyLevel=node?node.level+1:undefined}
 const commonOfficial=(items:OcrMasterMatchCandidate[]):OcrMasterMatchCandidate|undefined=>{
  if(!binding||!items.length)return
  const index=new Map(binding.nodes.map(n=>[n.code.replace(/\./g,''),n]))
  const paths=items.map(item=>{let node=index.get(codeOf(item).replace(/\./g,''));const path:typeof binding.nodes=[],seen=new Set<string>();while(node&&!seen.has(node.code)){seen.add(node.code);path.push(node);node=node.parent?index.get(node.parent.replace(/\./g,'')):undefined}return path})
  if(paths.some(path=>!path.length))return
  const node=paths[0].find(node=>paths.every(path=>path.some(parent=>parent.code===node.code)))
  if(!node)return
  if(!binding.nameColumnId)return
  const linkedValues:Record<string,string>={}
  const refs=field.masterMatchCodeFieldRefs?.length?field.masterMatchCodeFieldRefs:[{fieldId:field.id,label:field.label,masterColumnId:field.masterDataColumnId}]
  const boundCode=bindings.find(([,item])=>item===binding)?.[0]
  for(const ref of refs){
   const mapped=ref.masterColumnId||fields.find(f=>f.id===ref.fieldId)?.masterDataColumnId
   if(mapped===boundCode)linkedValues[ref.fieldId]=node.code
   else if(mapped===binding.nameColumnId)linkedValues[ref.fieldId]=node.name
   else return
  }
  return {value:linkedValues[field.id]||node.name,strategy:'parent',hierarchyOfficial:true,hierarchyLevel:node.level,hierarchyPath:hierarchyPath(node.code),linkedValues}

 }
 let adopted:OcrMasterMatchCandidate|undefined
 if(exactCandidates.length>1){adopted=commonOfficial(exactCandidates)}
 else if(exact){if(candidates.some(c=>codeOf(c)===codeOf(exact))||field.phase3ModelTrusted===true)adopted=exact}
 else if(candidates.length){if((candidates[0].similarityScore||0)>=(review?.autoAdoptThreshold??90))adopted=candidates[0];else if(candidates.length>1&&binding?.nodes.length)adopted=commonOfficial(candidates)}
 field.masterReviewEnabled=review?.masterReviewEnabled??true
 if(!adopted)field.masterMatchConfirmRule||='low-similarity'
 if(adopted){field.masterMatchCandidates=[adopted,...(field.masterMatchCandidates||[])];field.masterHierarchyOfficial=adopted.hierarchyOfficial;field.masterHierarchyLevel=adopted.hierarchyLevel;field.masterAutoAdopted=true;field.masterMatchStrategy=adopted.strategy;field.masterMatchSimilarity=adopted.similarityScore;field.masterHierarchyPath=adopted.hierarchyPath;for(const [id,value]of Object.entries(adopted.linkedValues||{[field.id]:adopted.value})){const target=fields.find(f=>f.id===id);if(target){target.ocrOriginalValue??=target.value;target.masterHierarchyOfficial=adopted.hierarchyOfficial;target.masterHierarchyLevel=adopted.hierarchyLevel;target.masterAutoAdopted=true;target.masterHierarchyPath=adopted.hierarchyPath;target.masterMatchStrategy=adopted.strategy;target.masterMatchSimilarity=adopted.similarityScore;target.value=value;delete target.masterMatchConfirmRule}}field.value=adopted.linkedValues?.[field.id]||adopted.value;delete field.masterMatchConfirmRule}
 }
}
