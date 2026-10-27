<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  MoreFilled,
  More,
  Upload,
  Download,
  UploadFilled,
  FolderOpened,
  EditPen,
  Delete,
  Key,
  Check,
  Close
} from '@element-plus/icons-vue'
import ConfigListAside from '@/components/ConfigListAside.vue'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'
import {
  MAX_MASTER_COLUMNS,
  MAX_MASTER_IMPORT_ROWS,
  vectorizationStatusLabels,
  appendChangeLog,
  createEmptyColumn,
  createMasterDefinition,
  createRowFromColumns,
  findMasterDefinition,
  getMasterChangeLogs,
  masterDataDefinitions,
  queueVectorization,
  type MasterDataColumn,
  type MasterDataDefinition,
  type MasterDataRow,
  type VectorizationStatus
} from '@/mocks/masterDataConfig'
import { readRows } from '@/utils/phase3Files'
import { PLACEHOLDER, searchPlaceholder } from '@/constants/placeholders'

import MasterSyncHistory from '@/components/phase3/MasterSyncHistory.vue'
import MasterHierarchyView from '@/components/phase3/MasterHierarchyView.vue'
import MasterDataDialogs from '@/components/phase3/MasterDataDialogs.vue'
import { syncingMasters, SYNC_TIME, masterConfig, hierarchyBindings } from '@/mocks/phase3'

const { t } = useI18n()

const historyVisible=ref(false)
const selectedMasterId = ref('master-disease')
watch(selectedMasterId,()=>{historyVisible.value=false})
const phase3Dialogs=ref<InstanceType<typeof MasterDataDialogs>>()
const statusOrder=ref<'ascending'|'descending'|null>(null)
const phase3Config=computed(()=>masterConfig(selectedMasterId.value))
const syncReady=computed(()=>{const c=phase3Config.value;return c.enabled&&!!c.connection&&!!c.source&&Object.values(c.fields).some(Boolean)})
const nextSyncLabel=computed(()=>{
 if(!syncReady.value)return '—'
 const now=Date.now(),jst=new Date(now+9*3600000),[hour,minute]=SYNC_TIME.split(':').map(Number)
 let next=new Date(Date.UTC(jst.getUTCFullYear(),jst.getUTCMonth(),jst.getUTCDate(),hour,minute))
 if(next.getTime()-9*3600000<=now)next=new Date(next.getTime()+86400000)
 return `${next.getUTCMonth()+1}/${next.getUTCDate()} ${SYNC_TIME} JST`
})
const masterView=ref('data')

const hierarchyView=ref<InstanceType<typeof MasterHierarchyView>>()
const hierarchySaving=ref(false),hierarchyLeaveVisible=ref(false)
let hierarchyLeaveResolve:((allow:boolean)=>void)|undefined
async function saveMaster(){
 if(masterView.value==='hierarchy'){
  if(hierarchySaving.value||!hierarchyView.value)return false
  hierarchySaving.value=true
  try{return await hierarchyView.value.save()}finally{hierarchySaving.value=false}
 }
 if(editingRowId.value){saveInlineEdit();return !editingRowId.value}
 ElMessage.success(t('phase3.saved'));return true
}
function finishHierarchyLeave(allow:boolean){const resolve=hierarchyLeaveResolve;hierarchyLeaveResolve=undefined;hierarchyLeaveVisible.value=false;resolve?.(allow)}
async function guardHierarchyLeave(){
 if(hierarchyView.value?.busy||hierarchySaving.value){ElMessage.warning(t('phase3.hierarchyBusy'));return false}
 if(!hierarchyView.value?.dirty)return true
 if(hierarchyLeaveResolve)return false
 hierarchyLeaveVisible.value=true
 return await new Promise<boolean>(resolve=>{hierarchyLeaveResolve=resolve})
}
async function saveHierarchyAndContinue(){if(await saveMaster())finishHierarchyLeave(true)}
function discardHierarchyAndContinue(){hierarchyView.value?.discard();finishHierarchyLeave(true)}
function beforeMasterTabLeave(next:string|number,current:string|number){return current==='hierarchy'&&next!==current?guardHierarchyLeave():true}
onBeforeRouteLeave(()=>guardHierarchyLeave())
function preventUnsavedUnload(event:BeforeUnloadEvent){if(hierarchyView.value?.dirty){event.preventDefault();event.returnValue=''}}
onMounted(()=>window.addEventListener('beforeunload',preventUnsavedUnload))
onBeforeUnmount(()=>{window.removeEventListener('beforeunload',preventUnsavedUnload);hierarchyLeaveResolve?.(false)})

function sortStatus(event:{prop:string;order:'ascending'|'descending'|null}){statusOrder.value=event.order;page.value=1}
function showFailure(row:MasterDataRow){if(row.vectorizationStatus==='failed')void ElMessageBox.alert(row.vectorizationError||t('phase3.failed'),t('phase3.reason'),MESSAGE_BOX_CONFIRM_DEFAULTS)}
const listKeyword = ref('')
const dataKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const selectedRowIds = ref<string[]>([])

const addMasterDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const columnDialogVisible = ref(false)
const importDialogVisible = ref(false)

type ImportUpdateMode = 'append' | 'overwrite'

const importUpdateMode = ref<ImportUpdateMode>('append')
const importFile = ref<File | null>(null)
const importFileInputRef = ref<HTMLInputElement | null>(null)
const importDragDepth = ref(0)
const isImportDragOver = ref(false)

const newMasterName = ref('')
const renamingMasterId = ref<string | null>(null)
const renameDraft = ref('')
const editingRowId = ref<string | null>(null)
const pendingNewRowId = ref<string | null>(null)

const rowDraft = reactive<Record<string, string>>({})
const columnDraft = ref<MasterDataColumn[]>([])


const selectedMaster = computed(() => findMasterDefinition(selectedMasterId.value))
watch(selectedMasterId,()=>{masterView.value='data'})

const filteredMasters = computed(() => {
  const kw = listKeyword.value.trim().toLowerCase()
  if (!kw) return masterDataDefinitions.value
  return masterDataDefinitions.value.filter((item) => item.name.toLowerCase().includes(kw))
})

const queryCodeColumns = computed(
  () => selectedMaster.value?.columns.filter((column) => column.isQueryCode) ?? []
)

const filteredRows = computed(() => {
  const master = selectedMaster.value
  if (!master) return []
  const kw = dataKeyword.value.trim().toLowerCase()
  if (!kw) return master.rows

  return master.rows.filter((row) => {
    const queryValues = queryCodeColumns.value.map((column) => row.values[column.id] ?? '')
    if (queryValues.some((value) => value.toLowerCase().includes(kw))) {
      return true
    }
    return master.columns.some((column) =>
      (row.values[column.id] ?? '').toLowerCase().includes(kw)
    )
  })
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const rank={failed:0,processing:1,completed:2}
  const rows=statusOrder.value?[...filteredRows.value].sort((a,b)=>(rank[a.vectorizationStatus]-rank[b.vectorizationStatus])*(statusOrder.value==='ascending'?1:-1)):filteredRows.value
  return rows.slice(start,start+pageSize.value)
})

type HierarchyTableRow=MasterDataRow&{isHierarchyNode?:boolean;children?:HierarchyTableRow[]}

const historyLogs = computed(() =>
  selectedMaster.value ? getMasterChangeLogs(selectedMaster.value.id) : []
)

const vectorizationRunning=computed(()=>selectedMaster.value?.rows.some(row=>row.vectorizationStatus==='processing')??false)
const canRevectorize=computed(()=>!!selectedMaster.value?.rows.length&&!vectorizationRunning.value&&!syncingMasters[selectedMasterId.value]&&!editingRowId.value)

watch(selectedMasterId, (id) => {
  statusOrder.value=null
  page.value = 1
  selectedRowIds.value = []
  dataKeyword.value = ''
  pendingNewRowId.value = null
  editingRowId.value = null
  if (renamingMasterId.value && renamingMasterId.value !== id) {
    cancelInlineRename()
  }
})

watch(dataKeyword, () => {
  page.value = 1
})

watch(page, () => {
  if (editingRowId.value) {
    cancelInlineEdit()
  }
})

function vectorizationStatusClass(status: VectorizationStatus) {
  return `is-${String(status)==='pending'?'processing':status}`
}

function vectorizationStatusLabel(status: VectorizationStatus) {
  return vectorizationStatusLabels()[String(status)==='pending'?'processing':status]
}

async function openAddMasterDialog() {
  if(!await guardHierarchyLeave())return
  newMasterName.value = ''
  addMasterDialogVisible.value = true
}

function confirmAddMaster() {
  const name = newMasterName.value.trim()
  if (!name) {
    ElMessage.warning(t('businessRules.masterData.message.nameRequired'))
    return
  }
  const master = createMasterDefinition(name)
  masterDataDefinitions.value.unshift(master)
  appendChangeLog(master.id, 'マスタ追加', name)
  selectedMasterId.value = master.id
  addMasterDialogVisible.value = false
  ElMessage.success(t('businessRules.masterData.message.masterAdded'))
}

function startInlineRename(master: MasterDataDefinition) {
  selectedMasterId.value = master.id
  editingRowId.value = null
  renamingMasterId.value = master.id
  renameDraft.value = master.name
}

function cancelInlineRename() {
  renamingMasterId.value = null
  renameDraft.value = ''
}

function saveInlineRename() {
  const master = masterDataDefinitions.value.find((item) => item.id === renamingMasterId.value)
  if (!master) return

  const nextName = renameDraft.value.trim()
  if (!nextName) {
    ElMessage.warning(t('businessRules.masterData.message.nameRequired'))
    return
  }

  const previous = master.name
  if (previous !== nextName) {
    master.name = nextName
    master.updatedAt = new Date().toLocaleString('ja-JP', { hour12: false })
    appendChangeLog(master.id, '名称変更', `${previous} → ${nextName}`)
    ElMessage.success(t('businessRules.masterData.message.renamed'))
  }

  cancelInlineRename()
}

async function onListItemClick(master: MasterDataDefinition) {
  if (renamingMasterId.value) return
  if(master.id!==selectedMasterId.value&&!await guardHierarchyLeave())return
  selectedMasterId.value = master.id
}

async function removeMaster(master: MasterDataDefinition) {
  await ElMessageBox.confirm(
    t('businessRules.masterData.message.deleteConfirm', { name: master.name }),
    t('businessRules.masterData.message.deleteTitle'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'warning'
    }
  )
  masterDataDefinitions.value = masterDataDefinitions.value.filter((item) => item.id !== master.id)
  appendChangeLog(master.id, 'マスタ削除', master.name)
  if (selectedMasterId.value === master.id) {
    selectedMasterId.value = masterDataDefinitions.value[0]?.id ?? ''
  }
  ElMessage.success(t('businessRules.masterData.message.masterDeleted'))
}

function openHistoryDialog() {
  historyDialogVisible.value = true
}


function openColumnDialog() {
  const master = selectedMaster.value
  if (!master) return
  columnDraft.value = master.columns.map((column) => ({ ...column }))
  columnDialogVisible.value = true
}

function addColumnDraft() {
  if (columnDraft.value.length >= MAX_MASTER_COLUMNS) {
    ElMessage.warning(t('businessRules.masterData.message.columnMax', { max: MAX_MASTER_COLUMNS }))
    return
  }
  columnDraft.value.push(
    createEmptyColumn(
      t('businessRules.masterData.column.defaultName', {
        index: columnDraft.value.length + 1
      })
    )
  )
}

function removeColumnDraft(columnId: string) {
  if (columnDraft.value.length <= 1) {
    ElMessage.warning(t('businessRules.masterData.message.columnMin'))
    return
  }
  columnDraft.value = columnDraft.value.filter((column) => column.id !== columnId)
}

function saveColumnSettings() {
  const master = selectedMaster.value
  if (!master) return

  if(columnDraft.value.length>MAX_MASTER_COLUMNS){ElMessage.warning(t('businessRules.masterData.message.columnMax',{max:MAX_MASTER_COLUMNS}));return}
  const labels = columnDraft.value.map((column) => column.label.trim())
  if (labels.some((label) => !label)) {
    ElMessage.warning(t('businessRules.masterData.message.columnNameRequired'))
    return
  }
  if (new Set(labels).size !== labels.length) {
    ElMessage.warning(t('businessRules.masterData.message.columnNameDuplicate'))
    return
  }

  if(Object.entries(hierarchyBindings(master.id)).some(([code,binding])=>binding.nameColumnId&&columnDraft.value.some(c=>c.id===code&&c.isQueryCode)&&!columnDraft.value.some(c=>c.id===binding.nameColumnId))){ElMessage.warning(t('phase3.hierarchyNameInUse'));return}
  const nextColumns = columnDraft.value.map((column) => ({
    ...column,
    label: column.label.trim()
  }))

  for (const row of master.rows) {
    for (const column of nextColumns) {
      if (!(column.id in row.values)) {
        row.values[column.id] = ''
      }
    }
    for (const columnId of Object.keys(row.values)) {
      if (!nextColumns.some((column) => column.id === columnId)) {
        delete row.values[columnId]
      }
    }
  }

  const previousBindings=hierarchyBindings(master.id)
  const nextBindings=Object.fromEntries(nextColumns.filter(c=>c.isQueryCode&&previousBindings[c.id]?.nodes.length).map(c=>[c.id,previousBindings[c.id]]))
  masterConfig(master.id).hierarchies=nextBindings
  master.columns = nextColumns
  master.updatedAt = new Date().toLocaleString('ja-JP', { hour12: false })
  const queryLabels = nextColumns.filter((column) => column.isQueryCode).map((column) => column.label)
  appendChangeLog(
    master.id,
    '列設定更新',
    `照会コード列：${queryLabels.length ? queryLabels.join('、') : 'なし'}`
  )
  columnDialogVisible.value = false
  ElMessage.success(t('businessRules.masterData.message.columnSettingsSaved'))
}

function resetRowDraft(row?: MasterDataRow) {
  const master = selectedMaster.value
  if (!master) return
  for (const key of Object.keys(rowDraft)) {
    delete rowDraft[key]
  }
  for (const column of master.columns) {
    rowDraft[column.id] = row?.values[column.id] ?? ''
  }
}

function addRowInline() {
  const master = selectedMaster.value
  if (!master || editingRowId.value || !master.columns.length) return

  const row = createRowFromColumns(master.columns)
  master.rows.unshift(row)
  master.updatedAt = new Date().toLocaleString('ja-JP', { hour12: false })
  page.value = 1
  pendingNewRowId.value = row.id
  editingRowId.value = row.id
  resetRowDraft()
}

function startInlineEdit(row: MasterDataRow) {
  renamingMasterId.value = null
  editingRowId.value = row.id
  resetRowDraft(row)
}

function cancelInlineEdit() {
  const master = selectedMaster.value
  const rowId = editingRowId.value
  if (master && rowId && pendingNewRowId.value === rowId) {
    master.rows = master.rows.filter((row) => row.id !== rowId)
  }
  pendingNewRowId.value = null
  editingRowId.value = null
}

function rowClassName({ row }: { row: MasterDataRow }) {
  return editingRowId.value === row.id ? 'v-master-data__row--editing' : ''
}

function sourceIdColumn(master:MasterDataDefinition){return masterConfig(master.id).fields.Id||''}
function isSourceIdCell(row:MasterDataRow,columnId:string){return !!selectedMaster.value&&!!row.sourceRecordId&&sourceIdColumn(selectedMaster.value)===columnId}

function validateRowDraft(master: MasterDataDefinition): Record<string, string> | null {
  const row=master.rows.find(r=>r.id===editingRowId.value),idColumn=sourceIdColumn(master)
  if(row?.sourceRecordId&&idColumn&&rowDraft[idColumn]!==row.values[idColumn]){ElMessage.warning(t('phase3.sourceIdReadonly'));return null}
  for (const column of master.columns) {
    if (!(rowDraft[column.id] ?? '').trim()) {
      ElMessage.warning(
        t('businessRules.masterData.message.fieldRequired', { name: column.label })
      )
      return null
    }
  }

  const values: Record<string, string> = {}
  for (const column of master.columns) {
    values[column.id] = rowDraft[column.id].trim()
  }
  return values
}

function saveInlineEdit() {
  const master = selectedMaster.value
  if (!master || !editingRowId.value) return

  const values = validateRowDraft(master)
  if (!values) return

  const target = master.rows.find((row) => row.id === editingRowId.value)
  if (!target) return

  const isNewRow = pendingNewRowId.value === editingRowId.value

  Object.assign(target.values, values)
  target.updatedAt = new Date().toLocaleString('ja-JP', { hour12: false })
  master.updatedAt = target.updatedAt
  queueVectorization(master, [target.id])
  appendChangeLog(master.id, isNewRow ? '行追加' : '行更新', Object.values(values).join(' / '))
  pendingNewRowId.value = null
  editingRowId.value = null
  ElMessage.success(
    isNewRow
      ? t('businessRules.masterData.message.rowAdded')
      : t('businessRules.masterData.message.rowUpdated')
  )
}

async function removeRows(rowIds: string[]) {
  const master = selectedMaster.value
  if (!master || !rowIds.length) return

  await ElMessageBox.confirm(
    t('businessRules.masterData.message.rowsDeleteConfirm', { count: rowIds.length }),
    t('businessRules.masterData.message.deleteTitle'),
    {
      ...MESSAGE_BOX_CONFIRM_DEFAULTS,
      type: 'warning'
    }
  )

  const codeColumn=Object.keys(hierarchyBindings(master.id)).find(id=>master.columns.some(c=>c.id===id&&c.isQueryCode))
  const binding=codeColumn?hierarchyBindings(master.id)[codeColumn]:undefined
  if(codeColumn&&binding){
    const normalize=(value:string)=>value.trim().normalize('NFKC').replace(/\./g,'')
    const removedCodes=new Set(master.rows.filter(r=>rowIds.includes(r.id)).map(r=>normalize(r.values[codeColumn]||'')))
    for(const row of master.rows.filter(r=>!rowIds.includes(r.id)))removedCodes.delete(normalize(row.values[codeColumn]||''))
    const nodes=new Map(binding.nodes.map(node=>[node.code,node]))
    for(const row of master.rows.filter(r=>!rowIds.includes(r.id))){
      const manual=binding.overrides[row.id]
      let node=manual?nodes.get(manual):binding.nodes.find(n=>normalize(n.code)===normalize(row.values[codeColumn]||''))
      const seen=new Set<string>()
      while(node?.parent&&!seen.has(node.code)){seen.add(node.code);if(removedCodes.has(normalize(node.parent))){binding.overrides[row.id]=null;break}node=nodes.get(node.parent)}
    }
    for(const id of rowIds)delete binding.overrides[id]
  }
  master.rows = master.rows.filter((row) => !rowIds.includes(row.id))
  if (editingRowId.value && rowIds.includes(editingRowId.value)) {
    pendingNewRowId.value = null
    editingRowId.value = null
  }
  selectedRowIds.value = selectedRowIds.value.filter((id) => !rowIds.includes(id))
  master.updatedAt = new Date().toLocaleString('ja-JP', { hour12: false })
  appendChangeLog(master.id, '行削除', `${rowIds.length} 件`)
  ElMessage.success(t('businessRules.masterData.message.deleted'))
}

function retryEligibleVectorization() {
  const master = selectedMaster.value
  if (!master || !canRevectorize.value) return
  const targets = master.rows
  if (!targets.length) {
    ElMessage.warning(t('businessRules.masterData.message.noRetryableRows'))
    return
  }
  queueVectorization(
    master,
    targets.map((row) => row.id)
  )
  appendChangeLog(master.id, '再ベクトル化', `${targets.length} 件`)
  ElMessage.success(
    t('businessRules.masterData.message.vectorizationRetryingCount', { count: targets.length })
  )
}

async function handleClose() {
  if(!await guardHierarchyLeave())return
  if (editingRowId.value) {
    cancelInlineEdit()
  }
  cancelInlineRename()
  selectedMasterId.value = ''
  selectedRowIds.value = []
  dataKeyword.value = ''
  page.value = 1
}

function openImportDialog() {
  const master = selectedMaster.value
  if (!master) return
  importUpdateMode.value = 'append'
  importFile.value = null
  importDragDepth.value = 0
  isImportDragOver.value = false
  importDialogVisible.value = true
}

function downloadImportTemplate() {
  const master = selectedMaster.value
  if (!master) return

  const headers = master.columns.map((column) => column.label)
  const sampleRow = master.columns.map((column) =>
    column.isQueryCode ? 'CODE001' : 'サンプル'
  )
  const csv = `${headers.join(',')}\n${sampleRow.join(',')}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${master.name}_template.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function validateImportFile(file: File): boolean {
  const allowed = ['.xlsx', '.csv']
  const dotIndex = file.name.lastIndexOf('.')
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : ''
  if (!allowed.includes(ext)) {
    ElMessage.warning(t('businessRules.masterData.message.importFileTypeInvalid'))
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning(t('businessRules.masterData.message.importFileSizeMax'))
    return false
  }
  return true
}

function setImportFile(file: File | null) {
  if (!file) {
    importFile.value = null
    return
  }
  if (!validateImportFile(file)) return
  importFile.value = file
}

function onImportFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  setImportFile(file)
  input.value = ''
}

function openImportFilePicker() {
  importFileInputRef.value?.click()
}

function onImportDragEnter() {
  importDragDepth.value += 1
  isImportDragOver.value = true
}

function onImportDragLeave() {
  importDragDepth.value = Math.max(0, importDragDepth.value - 1)
  if (importDragDepth.value === 0) {
    isImportDragOver.value = false
  }
}

function onImportDrop(event: DragEvent) {
  importDragDepth.value = 0
  isImportDragOver.value = false
  const file = event.dataTransfer?.files?.[0] ?? null
  setImportFile(file)
}

async function confirmImport() {
 const master=selectedMaster.value,file=importFile.value;if(!master||!file){ElMessage.warning(t('businessRules.masterData.message.uploadFileRequired'));return}
 try{
 const matrix=(await readRows(file)).filter(row=>row.some(v=>v.trim()));if(!matrix.length){ElMessage.warning(t('phase3.required'));return}
 const headers=matrix[0].map(v=>v.trim());if(headers.length>MAX_MASTER_COLUMNS){ElMessage.warning(t('businessRules.masterData.message.columnMax',{max:MAX_MASTER_COLUMNS}));return}if(headers.some(v=>!v)||new Set(headers).size!==headers.length){ElMessage.warning(t('businessRules.masterData.message.columnNameDuplicate'));return}
 const incoming=matrix.slice(1);if(incoming.length+(importUpdateMode.value==='append'?master.rows.length:0)>100000){ElMessage.warning(t('businessRules.masterData.message.importRowMax',{max:100000}));return}
 if(importUpdateMode.value==='overwrite'&&!incoming.length){try{await ElMessageBox.confirm('0 '+t('phase3.allRows')+' — '+t('phase3.deleteConfirm'),master.name,MESSAGE_BOX_CONFIRM_DEFAULTS)}catch{return}}
 const lockedColumn=sourceIdColumn(master),lockedName=master.columns.find(c=>c.id===lockedColumn)?.label,lockedIndex=lockedName?headers.indexOf(lockedName):-1
 if(importUpdateMode.value==='overwrite'&&lockedName&&master.rows.some(row=>row.sourceRecordId&&(lockedIndex<0||!incoming.some(values=>values[lockedIndex]===row.values[lockedColumn])))){ElMessage.warning(t('phase3.sourceIdReadonly'));return}
 const nextColumns=headers.map(label=>master.columns.find(c=>c.label===label)||createEmptyColumn(label));
 if(importUpdateMode.value==='append'&&master.rows.length&&headers.some(h=>!master.columns.some(c=>c.label===h))){ElMessage.warning(t('phase3.required'));return}
 const old=master.rows;const changed:MasterDataRow[]=[]
 const idColumn=nextColumns.find(c=>c.id===sourceIdColumn(master))||nextColumns.find(c=>/^(id|.*[:：]\s*id)$/i.test(c.label));const byId=new Map(old.map(row=>[idColumn?row.values[idColumn.id]:JSON.stringify(row.values),row]));
 const converted=incoming.map(values=>{const row=createRowFromColumns(nextColumns);nextColumns.forEach((c,i)=>row.values[c.id]=values[i]||'');const previous=byId.get(idColumn?row.values[idColumn.id]:JSON.stringify(row.values));if(previous&&JSON.stringify(previous.values)===JSON.stringify(row.values))return previous;if(previous){row.id=previous.id;row.sourceRecordId=previous.sourceRecordId;row.sourceUpdatedAt=previous.sourceUpdatedAt;row.previousVersion={values:{...previous.values},vectorizationStatus:previous.vectorizationStatus}}changed.push(row);return row})
 master.columns=nextColumns;master.rows=importUpdateMode.value==='overwrite'?converted:[...converted,...old.filter(r=>!converted.some(n=>n.id===r.id))];master.updatedAt=new Date().toLocaleString('ja-JP');queueVectorization(master,changed.map(r=>r.id));appendChangeLog(master.id,t('businessRules.masterData.action.batchImport'),file.name+' / '+incoming.length);importDialogVisible.value=false;ElMessage.success(t('businessRules.masterData.message.imported'))
 }catch{ElMessage.error(t('phase3.invalidDefinition'))}
}

function refreshData() {
  ElMessage.success(t('businessRules.masterData.message.listRefreshed'))
}

async function handleMasterMenu(command: string, master: MasterDataDefinition) {
  if(!await guardHierarchyLeave())return
  selectedMasterId.value = master.id
  if (command === 'rename') {
    startInlineRename(master)
    return
  }
  if (command === 'history') {
    openHistoryDialog()
    return
  }
  if (command === 'delete') {
    void removeMaster(master)
  }
}
</script>

<template>
  <div class="v-content-wrap v-master-data">
    <el-dialog v-model="hierarchyLeaveVisible" :title="t('phase3.hierarchyUnsavedTitle')" width="480px" :close-on-click-modal="false" :close-on-press-escape="!hierarchySaving" :show-close="!hierarchySaving" @close="finishHierarchyLeave(false)">
      <p>{{t('phase3.hierarchyUnsaved')}}</p>
      <template #footer>
        <el-button :disabled="hierarchySaving" @click="finishHierarchyLeave(false)">{{t('phase3.cancel')}}</el-button>
        <el-button :disabled="hierarchySaving" @click="discardHierarchyAndContinue">{{t('phase3.hierarchyDiscard')}}</el-button>
        <el-button type="primary" :loading="hierarchySaving" @click="saveHierarchyAndContinue">{{t('phase3.hierarchySaveContinue')}}</el-button>
      </template>
    </el-dialog>
    <header class="v-master-data__header">
      <h1 class="v-master-data__title">{{ $t('businessRules.masterData.title') }}</h1>
    </header>

    <div class="v-master-data__layout">
      <ConfigListAside
        v-model:keyword="listKeyword"
        :title="$t('businessRules.masterData.list.title')"
        :search-placeholder="searchPlaceholder($t('businessRules.masterData.list.searchSubject'))"
        :add-label="$t('businessRules.masterData.list.add')"
        :empty-text="$t('businessRules.masterData.list.empty')"
        :is-empty="filteredMasters.length === 0"
        @add="openAddMasterDialog"
      >
        <li
          v-for="master in filteredMasters"
          :key="master.id"
          class="v-config-list-aside__list-item"
          :class="{
            'is-active': selectedMasterId === master.id,
            'is-renaming': renamingMasterId === master.id
          }"
          @click="onListItemClick(master)"
        >
          <el-input
            v-if="renamingMasterId === master.id"
            v-model="renameDraft"
            class="v-config-list-aside__list-rename-input"
            @click.stop
            @keyup.enter="saveInlineRename"
            @keyup.escape="cancelInlineRename"
          />
          <span v-else class="v-config-list-aside__list-name">{{ master.name }}</span>

          <div
            v-if="renamingMasterId === master.id"
            class="v-config-list-aside__list-rename-actions"
            @click.stop
          >
            <button type="button" class="v-config-list-aside__list-rename-btn" @click="saveInlineRename">
              {{ $t('businessRules.masterData.action.save') }}
            </button>
            <button
              type="button"
              class="v-config-list-aside__list-rename-btn is-cancel"
              @click="cancelInlineRename"
            >
              {{ $t('businessRules.masterData.action.cancel') }}
            </button>
          </div>
          <el-dropdown
            v-else
            trigger="click"
            :disabled="!!renamingMasterId"
            @command="(command: string) => handleMasterMenu(command, master)"
            @click.stop
          >
            <button type="button" class="v-config-list-aside__list-menu" @click.stop>
              <el-icon :size="16"><MoreFilled /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  {{ $t('businessRules.masterData.menu.rename') }}
                </el-dropdown-item>
                <el-dropdown-item command="history">
                  {{ $t('businessRules.masterData.menu.history') }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  {{ $t('businessRules.masterData.menu.delete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </ConfigListAside>

      <section v-if="selectedMaster" class="v-master-data__main">
        <header class="v-master-data__main-head">
          <div class="p3-master-heading"><h2 class="v-master-data__main-title">{{ selectedMaster.name }}</h2><div class="p3-master-summary"><div class="p3-sync-controls"><div class="p3-sync-toggle"><el-switch v-model="phase3Config.enabled" :aria-label="$t('phase3.sync')"/><span>{{$t('phase3.enabled')}}</span></div><el-button :icon="Refresh" :disabled="!syncReady" :loading="!!syncingMasters[selectedMasterId]" @click="phase3Dialogs?.updateNow()">{{ $t(syncingMasters[selectedMasterId]?'phase3.syncing':'phase3.syncNow') }}</el-button><el-dropdown trigger="click" @command="(command:string)=>command==='history'?historyVisible=true:phase3Dialogs?.openSync()"><el-button :aria-label="$t('phase3.actions')" class="p3-sync-more"><el-icon><More/></el-icon></el-button><template #dropdown><el-dropdown-menu><el-dropdown-item command="history">{{$t('phase3.history')}}</el-dropdown-item><el-dropdown-item command="settings">{{$t('phase3.settings')}}</el-dropdown-item></el-dropdown-menu></template></el-dropdown></div><div class="p3-history-summary"><span>{{$t('phase3.nextSync')}}：{{nextSyncLabel}}</span><el-tag :type="syncingMasters[selectedMasterId]?'primary':syncReady?'success':'info'" size="small">{{syncingMasters[selectedMasterId]?'Loading':syncReady?'Active':'Inactive'}}</el-tag></div></div></div>
          <el-tabs v-if="selectedMaster" v-model="masterView" :before-leave="beforeMasterTabLeave" class="p3-master-views"><el-tab-pane :label="$t('phase3.masterDataView')" name="data"/><el-tab-pane :label="$t('phase3.hierarchyView')" name="hierarchy"/></el-tabs>
          <div v-if="masterView==='data'" class="v-master-data__toolbar">
            <div class="v-master-data__toolbar-left">
              <el-button v-if="masterView==='data'" link type="primary" @click="openColumnDialog">
                {{ $t('businessRules.masterData.action.columnSettings') }}
              </el-button>
              <el-button v-if="masterView==='data'"
                type="primary"
                plain
                :icon="Plus"
                :disabled="!!editingRowId || !selectedMaster.columns.length"
                @click="addRowInline"
              >
                {{ $t('businessRules.masterData.action.addData') }}
              </el-button>
              <el-button v-if="masterView==='data'" type="primary" plain :icon="Upload" @click="openImportDialog">
                {{ $t('businessRules.masterData.action.batchImport') }}
              </el-button>
              <el-button v-if="masterView==='data'"
                :disabled="!selectedRowIds.length"
                @click="removeRows(selectedRowIds)"
              >
                {{ $t('businessRules.masterData.action.batchDelete') }}
              </el-button>
              
              

            </div>
            <div v-if="masterView==='data'" class="v-master-data__toolbar-right">
              <el-input
                v-model="dataKeyword"
                :prefix-icon="Search"
                :placeholder="searchPlaceholder($t('businessRules.masterData.placeholder.searchData'))"
                clearable
                class="v-master-data__search"
              />
              <el-button :icon="Refresh" @click="refreshData" />
            </div>
          </div>

        </header>

        <el-drawer v-model="historyVisible" :title="$t('phase3.history')" size="min(820px, 100vw)" destroy-on-close><MasterSyncHistory :runs="phase3Config.history"/></el-drawer>
        <MasterHierarchyView v-if="masterView==='hierarchy'" ref="hierarchyView" :master="selectedMaster"/>
        <div v-else class="v-master-data__table-wrap">
          <el-table
            :data="pagedRows"
            
            row-key="id"
            default-expand-all
            :indent="20"
            border
            :row-class-name="rowClassName"
            @sort-change="sortStatus"
            @selection-change="(rows: MasterDataRow[]) => (selectedRowIds = rows.filter(row=>!row.id.startsWith('hierarchy:')).map((row) => row.id))"
          >
            <el-table-column type="selection" width="48" fixed="left" :selectable="(row:HierarchyTableRow)=>!row.isHierarchyNode"/>
            <el-table-column
              v-if="true"
              :label="$t('businessRules.masterData.column.index')"
              width="64"
              align="center"
              fixed="left"
            >
              <template #default="{ $index }">
                {{ (page - 1) * pageSize + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column
              v-for="column in selectedMaster.columns"
              :key="column.id"
              :prop="`values.${column.id}`"
              min-width="140"
              show-overflow-tooltip
            >
              <template #header>
                <span class="v-master-data__col-head">
                  <span>{{ column.label }}</span>
                  <el-icon v-if="column.isQueryCode" class="v-master-data__col-key" :size="14">
                    <Key />
                  </el-icon>
                  <el-icon class="v-master-data__col-edit" :size="14">
                    <EditPen />
                  </el-icon>
                </span>
              </template>
              <template #default="{ row }">
                <el-input
                  v-if="editingRowId === row.id"
                  v-model="rowDraft[column.id]"
                  :readonly="isSourceIdCell(row,column.id)"
                  :title="isSourceIdCell(row,column.id)?$t('phase3.sourceIdReadonly'):undefined"
                  class="v-master-data__cell-input"
                />
                <span v-else class="v-master-data__cell-text">{{ row.values[column.id] || '—' }}</span>
              </template>
            </el-table-column>
            
            <el-table-column
              :label="$t('businessRules.masterData.column.vectorizationStatus')"
              prop="vectorizationStatus" sortable="custom"
              width="132"
              fixed="right"
            >
              <template #default="{ row }">
                <span
                  v-if="!row.isHierarchyNode" class="v-master-data__ai-status"
                  :class="vectorizationStatusClass(row.vectorizationStatus)"
                  @click="showFailure(row)" :title="row.vectorizationError"
                >
                  <span class="v-master-data__ai-dot" />
                  {{ vectorizationStatusLabel(row.vectorizationStatus) }}
                </span><span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('businessRules.masterData.column.actionProcess')"
              width="108"
              align="center"
              fixed="right"
            >
              <template #default="{ row }">
                <template v-if="editingRowId === row.id">
                  <div class="v-master-data__edit-actions">
                    <el-button
                      link
                      class="v-master-data__edit-confirm"
                      :aria-label="$t('businessRules.masterData.action.save')"
                      @click="saveInlineEdit"
                    >
                      <el-icon :size="18"><Check /></el-icon>
                    </el-button>
                    <el-button
                      link
                      class="v-master-data__edit-cancel"
                      :aria-label="$t('businessRules.masterData.action.cancel')"
                      @click="cancelInlineEdit"
                    >
                      <el-icon :size="18"><Close /></el-icon>
                    </el-button>
                  </div>
                </template>
                <template v-else>
                  <div v-if="!row.isHierarchyNode" class="v-master-data__row-actions">
                    <el-button
                      link
                      type="primary"
                      :disabled="!!editingRowId"
                      @click="startInlineEdit(row)"
                    >
                      <el-icon :size="16"><EditPen /></el-icon>
                    </el-button>
                    <el-button
                      link
                      type="primary"
                      :disabled="!!editingRowId"
                      @click="removeRows([row.id])"
                    >
                      <el-icon :size="16"><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!selectedMaster.rows.length"
            :description="$t('businessRules.masterData.empty.noData')"
            :image-size="88"
            class="v-master-data__empty"
          />
        </div>

        <div v-if="masterView==='data'" class="v-master-data__pagination">
          <span class="v-master-data__pagination-total">
            {{
              $t('businessRules.masterData.pagination.resultTotal', {
                count: filteredRows.length
              })
            }}
          </span>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filteredRows.length"
            :page-sizes="[10, 20, 50]"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>

        <footer class="v-master-data__footer">
          <div class="v-master-data__footer-actions">
            <el-button @click="handleClose">
              {{ $t('businessRules.masterData.action.close') }}
            </el-button>
            <el-button
              type="primary"
              v-if="masterView==='data'"
              :disabled="!canRevectorize" :loading="vectorizationRunning"
              @click="retryEligibleVectorization"
            >
              {{ $t('businessRules.masterData.action.retry') }}
            </el-button>
          </div>
        </footer>
      </section>

      <section v-else class="v-master-data__main v-master-data__main--empty">
        <el-empty
          :description="$t('businessRules.masterData.list.selectHint')"
          :image-size="100"
        />
      </section>
    </div>

    <MasterDataDialogs v-if="selectedMaster" ref="phase3Dialogs" :master="selectedMaster" @history="historyVisible=true"/>
    <el-dialog
      v-model="addMasterDialogVisible"
      :title="$t('businessRules.masterData.list.add')"
      width="480px"
      destroy-on-close
    >
      <el-form label-position="top">
        <AppFormItem :label="$t('businessRules.masterData.field.masterName')" required>
          <el-input
            v-model="newMasterName"
            :placeholder="$t('businessRules.masterData.placeholder.masterNameExample')"
          />
        </AppFormItem>
      </el-form>
      <template #footer>
        <el-button @click="addMasterDialogVisible = false">
          {{ $t('businessRules.masterData.action.cancel') }}
        </el-button>
        <el-button type="primary" @click="confirmAddMaster">
          {{ $t('businessRules.masterData.action.add') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyDialogVisible"
      :title="`${selectedMaster?.name ?? ''}${$t('businessRules.masterData.history.titleSuffix')}`"
      width="720px"
      destroy-on-close
    >
      <el-table :data="historyLogs" border max-height="420">
        <el-table-column
          prop="occurredAt"
          :label="$t('businessRules.masterData.history.occurredAt')"
          width="168"
        />
        <el-table-column
          prop="action"
          :label="$t('businessRules.masterData.history.action')"
          width="120"
        />
        <el-table-column
          prop="operator"
          :label="$t('businessRules.masterData.history.operator')"
          width="120"
        />
        <el-table-column
          prop="detail"
          :label="$t('businessRules.masterData.history.detail')"
          min-width="220"
          show-overflow-tooltip
        />
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="columnDialogVisible"
      :title="$t('businessRules.masterData.action.columnSettings')"
      width="640px"
      destroy-on-close
    >
      <div class="v-master-data__column-toolbar">
        <span class="v-master-data__column-meta">
          {{
            $t('businessRules.masterData.column.count', {
              current: columnDraft.length,
              max: MAX_MASTER_COLUMNS
            })
          }}
        </span>
        <el-button
          :icon="Plus"
          :disabled="columnDraft.length >= MAX_MASTER_COLUMNS"
          @click="addColumnDraft"
        >
          {{ $t('businessRules.masterData.action.addColumn') }}
        </el-button>
      </div>
      <div class="v-master-data__column-list">
        <div v-for="(column, index) in columnDraft" :key="column.id" class="p3-column-entry"><div class="v-master-data__column-row">
          <span class="v-master-data__column-index">{{ index + 1 }}</span>
          <el-input v-model="column.label" :placeholder="PLACEHOLDER.INPUT" />
          <el-checkbox v-model="column.isQueryCode">
            {{ $t('businessRules.masterData.field.queryCode') }}
          </el-checkbox>
          <el-button
            link
            type="danger"
            :disabled="columnDraft.length <= 1"
            @click="removeColumnDraft(column.id)"
          >
            {{ $t('businessRules.masterData.action.delete') }}
          </el-button>
        </div>

        </div>
      </div>
      <template #footer>
        <el-button @click="columnDialogVisible = false">
          {{ $t('businessRules.masterData.action.cancel') }}
        </el-button>
        <el-button type="primary" @click="saveColumnSettings">
          {{ $t('businessRules.masterData.action.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importDialogVisible"
      :title="$t('businessRules.masterData.import.title')"
      width="560px"
      destroy-on-close
      class="v-master-data__import-dialog"
    >
      <div class="v-master-data__import">
        <section class="v-master-data__import-section">
          <h3 class="v-master-data__import-title">
            {{ $t('businessRules.masterData.import.templateSection') }}
          </h3>
          <p class="v-master-data__import-desc">
            {{ $t('businessRules.masterData.import.templateDesc') }}
          </p>
          <el-button :icon="Download" @click="downloadImportTemplate">
            {{ $t('businessRules.masterData.action.downloadTemplate') }}
          </el-button>
        </section>

        <section class="v-master-data__import-section">
          <h3 class="v-master-data__import-title">
            {{ $t('businessRules.masterData.import.uploadSection') }}
            <RequiredTag />
          </h3>
          <div
            class="v-master-data__import-dropzone"
            :class="{ 'is-dragover': isImportDragOver, 'has-file': !!importFile }"
            @dragenter.prevent="onImportDragEnter"
            @dragleave.prevent="onImportDragLeave"
            @dragover.prevent
            @drop.prevent="onImportDrop"
          >
            <el-icon class="v-master-data__import-dropzone-icon" :size="36">
              <UploadFilled />
            </el-icon>
            <p class="v-master-data__import-dropzone-text">
              {{ $t('businessRules.masterData.import.dropzone') }}
            </p>
            <p class="v-master-data__import-dropzone-hint">
              {{
                $t('businessRules.masterData.import.dropzoneHint', {
                  maxRows: MAX_MASTER_IMPORT_ROWS.toLocaleString(),
                  maxColumns: MAX_MASTER_COLUMNS
                })
              }}
            </p>
            <el-button type="primary" :icon="FolderOpened" @click="openImportFilePicker">
              {{ $t('businessRules.masterData.action.selectFile') }}
            </el-button>
            <p v-if="importFile" class="v-master-data__import-file-name">{{ importFile.name }}</p>
            <input
              ref="importFileInputRef"
              type="file"
              class="v-master-data__import-file-input"
              accept=".xlsx,.csv"
              @change="onImportFileInputChange"
            />
          </div>
        </section>

        <section class="v-master-data__import-section">
          <h3 class="v-master-data__import-title">
            {{ $t('businessRules.masterData.import.updateMode') }}
          </h3>
          <el-radio-group v-model="importUpdateMode" class="v-master-data__import-mode">
            <el-radio value="append">{{ $t('businessRules.masterData.import.append') }}</el-radio>
            <el-radio value="overwrite">
              {{ $t('businessRules.masterData.import.overwrite') }}
            </el-radio>
          </el-radio-group>
        </section>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">
          {{ $t('businessRules.masterData.action.cancel') }}
        </el-button>
        <el-button type="primary" @click="confirmImport">OK</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.v-master-data {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--top-header-total-height));
  min-height: unset;
  max-height: calc(100vh - var(--top-header-total-height));
  overflow: hidden;
  box-sizing: border-box;
  padding: var(--app-content-padding) !important;

  &.v-content-wrap {
    min-height: unset;
  }

  &__header {
    flex-shrink: 0;
    margin-bottom: var(--app-page-gap);
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__layout {
    flex: 1;
    display: flex;
    gap: var(--app-page-gap);
    min-height: 0;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    overflow: hidden;

    &--empty {
      align-items: center;
      justify-content: center;
    }
  }

  &__main-head {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex-shrink: 0;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  &__main-title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    flex-wrap: wrap;
  }

  &__toolbar-left,
  &__toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--app-action-bar-gap);
    flex-wrap: wrap;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__search {
    width: 260px;
  }

  &__table-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
    padding: 16px 16px 0;
    overflow: auto;
  }

  &__pagination {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    padding: 16px;
  }

  &__pagination-total {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  :deep(.v-master-data__pagination .el-pagination) {
    --el-pagination-button-height: 28px;
    --el-pagination-font-size: var(--app-font-size-base);
  }

  &__empty {
    position: absolute;
    inset: 0;
    background: #fff;
  }

  :deep(.v-master-data__row--editing > td.el-table__cell) {
    background: #fff;
    vertical-align: middle;
  }

  &__cell-text {
    display: block;
    color: var(--text-primary);
  }

  &__cell-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      box-shadow: 0 0 0 1px var(--border-color) inset;
      background: #fff;
    }

    :deep(.el-input__inner) {
      color: var(--text-primary);
    }
  }

  &__col-head {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__col-key {
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  &__col-edit {
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  &__ai-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    white-space: nowrap;
  }

  &__ai-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--text-secondary);
  }

  &__ai-status.is-pending &__ai-dot {
    background: #c0c4cc;
  }

  &__ai-status.is-processing &__ai-dot {
    background: var(--el-color-warning);
  }

  &__ai-status.is-completed &__ai-dot {
    background: var(--el-color-success);
  }

  &__ai-status.is-failed &__ai-dot {
    background: var(--el-color-danger);
  }

  &__row-actions,
  &__edit-actions {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__edit-confirm {
    color: var(--el-color-success) !important;
  }

  &__edit-cancel {
    color: var(--el-color-danger) !important;
  }

  &__footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 12px 16px;
    border-top: 1px solid var(--border-color);
    background: #fafbfc;
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    gap: var(--app-action-bar-gap);
    flex-shrink: 0;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__column-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--app-section-gap);
  }

  &__column-meta {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
  }

  &__column-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 420px;
    overflow: auto;
  }

  &__column-row {
    display: grid;
    grid-template-columns: 28px 1fr auto auto;
    gap: 10px;
    align-items: center;
  }

  &__column-index {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    text-align: center;
  }

  &__import {
    display: flex;
    flex-direction: column;
    gap: var(--app-page-gap);
  }

  &__import-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__import-title {
    display: inline-flex;
    align-items: center;
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__import-desc {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  &__import-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: var(--app-panel-padding) 16px;
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    background: #fafbfc;
    text-align: center;

    &.is-dragover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &.has-file {
      border-style: solid;
      border-color: var(--el-color-primary-light-7);
    }
  }

  &__import-dropzone-icon {
    color: var(--el-color-primary);
  }

  &__import-dropzone-text {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
  }

  &__import-dropzone-hint {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    line-height: 1.5;
    max-width: 420px;
  }

  &__import-file-name {
    margin: 0;
    font-size: var(--app-font-size-base);
    color: var(--el-color-primary);
    word-break: break-all;
  }

  &__import-file-input {
    display: none;
  }

  &__import-mode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>

<style scoped lang="scss">.p3-master-views{padding:0;margin:0}.p3-master-views :deep(.el-tabs__header){margin:0}.p3-hierarchy-table :deep(.v-master-data__cell-text){display:inline}.p3-tree-code{display:inline-flex;align-items:center;gap:8px;max-width:100%}.p3-tree-code>.el-button{flex-shrink:0}.p3-column-entry{margin-bottom:14px}.p3-column-hierarchy{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0 0 28px;font-size:14px}.p3-file-name{max-width:100%;min-width:0;height:auto;white-space:normal;text-align:left;flex:0 1 auto;justify-content:flex-start;margin-left:0!important}.p3-column-hierarchy>.el-button{margin-left:0}.p3-file-name :deep(span){white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:1.5}.p3-file-upload{position:relative;color:var(--el-color-primary);cursor:pointer}.p3-file-upload input{position:absolute;width:100%;height:100%;inset:0;opacity:0;cursor:pointer}.p3-master-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.p3-master-heading .v-master-data__main-title{margin:0;line-height:32px}.p3-master-summary{display:flex;align-items:center;gap:20px}.p3-master-summary>.p3-history-summary{order:-1}.p3-history-summary{display:flex;align-items:center;gap:12px;font-size:15px}.p3-sync-controls{display:flex;align-items:center;gap:16px}.p3-sync-toggle{display:flex;align-items:center;gap:8px;flex:none}.p3-sync-toggle span{display:inline-block;width:3em;white-space:nowrap}.p3-sync-controls>.el-button{margin-left:0}.p3-sync-more{width:36px;padding:0}.p3-sync-more .el-icon{transform:rotate(90deg)}.p3-config-controls{display:flex;align-items:center;gap:24px;flex-wrap:wrap}.p3-master-search-row{margin-top:4px;margin-bottom:8px;min-height:32px}.p3-threshold{display:flex;align-items:center;gap:7px;white-space:nowrap}.p3-threshold .el-input-number{width:76px}.p3-threshold label{font-size:15px}.p3-threshold .el-icon{cursor:help}.v-master-data__toolbar-left{flex-wrap:wrap}.v-master-data__ai-status{cursor:pointer}.v-master-data__search{max-width:240px}@media(max-width:1300px){.p3-master-heading{flex-wrap:wrap}} </style>
