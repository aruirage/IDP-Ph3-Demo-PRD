import type { OcrModelTemplate } from './phase3'
export function templateValidation(rows:OcrModelTemplate[],fallback:string|undefined,available:string[],docTypes:string[]):string|undefined{
 if(!rows.length||!rows.some(row=>row.id===fallback))return 'templateRequired'
 const models=new Set(available),types=new Set(docTypes),names=new Set<string>(),combinations=new Set<string>(),usedTypes=new Set<string>()
 for(const row of rows){
  if(!row.name.trim()||!row.main||!row.verify.length||(row.id!==fallback&&!row.docTypes.length))return 'templateRequired'
  if(!models.has(row.main)||row.verify.some(id=>id===row.main||!models.has(id))||new Set(row.verify).size!==row.verify.length||(row.id!==fallback&&row.docTypes.some(id=>!types.has(id))))return 'templateInvalid'
  const name=row.name.trim().normalize('NFKC').toLocaleLowerCase(),combination=JSON.stringify([row.main,[...row.verify].sort()])
  if(names.has(name))return 'templateDuplicateName'
  if(combinations.has(combination))return 'templateDuplicateModels'
  if(row.id!==fallback&&(row.docTypes.some(id=>usedTypes.has(id))||new Set(row.docTypes).size!==row.docTypes.length))return 'templateDuplicateDoc'
  names.add(name);combinations.add(combination);if(row.id!==fallback)row.docTypes.forEach(id=>usedTypes.add(id))
 }
}
