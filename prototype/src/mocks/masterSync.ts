import type { MasterDataDefinition, MasterDataRow } from './masterDataConfig'
import { customerIcdFields, customerIcdSample } from './customerIcdSample'

// Demonstration only: the workbook contains no LastModifiedDate.
export const DEMO_SOURCE_UPDATED_AT='2026-10-22T00:00:00Z'
export function sourceIsNewer(incoming:string,applied?:string){
 const time=Date.parse(incoming)
 if(!Number.isFinite(time))throw Error('Invalid source timestamp')
 if(!applied)return true
 const previous=Date.parse(applied)
 if(!Number.isFinite(previous))throw Error('Invalid applied source timestamp')
 return time>previous
}
export function applyCustomerSync(master:MasterDataDefinition,fields:Record<string,string>,records:readonly (readonly string[])[]=customerIcdSample){
 if(!records.length)throw Error("emptySource")
 if(records.length>100000)throw Error('capacityExceeded')
 const ids=records.map(record=>record[0])
 if(ids.some(id=>!id)||new Set(ids).size!==ids.length)throw Error('invalidSourceId')
 const incomingIds=new Set(ids)
 const result={added:0,changed:0,unchanged:0,removed:0},changed:MasterDataRow[]=[],nextRows:MasterDataRow[]=[]
 const existing=new Map(master.rows.filter(row=>row.sourceRecordId).map(row=>[row.sourceRecordId!,row]))
 for(const record of records){
  const original=existing.get(record[0]),row=original?JSON.parse(JSON.stringify(original)) as MasterDataRow:undefined
  const values:Record<string,string>=row?{...row.values}:Object.fromEntries(master.columns.map(c=>[c.id,'']))
  customerIcdFields.forEach((field,i)=>{const column=fields[field];if(column&&master.columns.some(c=>c.id===column))values[column]=record[i]})
  if(row&&Object.keys(values).every(key=>values[key]===row.values[key])){row.sourceUpdatedAt=DEMO_SOURCE_UPDATED_AT;result.unchanged++;nextRows.push(row);continue}
  const time=new Date().toISOString()
  if(row){nextRows.push(row);row.previousVersion={values:{...row.values},vectorizationStatus:row.vectorizationStatus};row.values=values;row.updatedAt=time;row.sourceUpdatedAt=DEMO_SOURCE_UPDATED_AT;row.vectorizationStatus='processing';delete row.vectorizationError;changed.push(row);result.changed++}
  else{const added:MasterDataRow={id:record[0],sourceRecordId:record[0],sourceUpdatedAt:DEMO_SOURCE_UPDATED_AT,values,updatedAt:time,vectorizationStatus:'processing'};nextRows.push(added);changed.push(added);result.added++}
 }
 result.removed=master.rows.filter(row=>!incomingIds.has(row.sourceRecordId||row.id)).length
 master.rows=nextRows
 if(changed.length||result.removed)master.updatedAt=new Date().toISOString()
 // Guard against a later edit or sync replacing this in-flight version.
 const versions=changed.map(row=>({row,updatedAt:row.updatedAt}))
 setTimeout(()=>{for(const {row,updatedAt} of versions)if(master.rows.includes(row)&&row.updatedAt===updatedAt&&row.vectorizationStatus==='processing'){row.vectorizationStatus='completed';delete row.previousVersion}},6000)
 return result
}
