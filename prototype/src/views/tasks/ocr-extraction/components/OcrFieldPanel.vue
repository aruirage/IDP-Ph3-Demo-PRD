<script setup lang="ts">
import { computed, nextTick, ref, type ComponentPublicInstance } from 'vue'
import { t } from '@/i18n/translate'
import { mockUiText } from '@/i18n/mockUiText'
import { Check, CircleCheck, RefreshLeft } from '@element-plus/icons-vue'
import {
  OCR_CONFIDENCE_THRESHOLD,
  countPendingReviews,
  getFieldAlert,
  getFieldAlertLabel,
  getMasterMatchDropdownOptions,
  getMasterMatchOptionLabel,
  getModelResultOptions,
  hasMasterMatchDropdown,
  hasModelConflict,
  isFieldUserConfirmed,
  isMasterMatchGroupRestored,
  needsFieldReview,
  type OcrExtractionField,
  type OcrExtractionTable,
  type OcrFieldAlert,
  type OcrMasterMatchCandidate
} from '@/mocks/ocrExtractionTask'
import { PLACEHOLDER } from '@/constants/placeholders'

const props = defineProps<{
  fields: OcrExtractionField[]
  tables?: OcrExtractionTable[]
  selectedFieldId: string | null
  readonly?: boolean
}>()

const tables = computed(() => props.tables ?? [])

const tableRowCount = computed(() =>
  tables.value.reduce((sum, table) => sum + table.rows.length, 0)
)

const showReviewOnly = defineModel<boolean>('showReviewOnly', { default: false })

const pendingReviewCount = computed(() => countPendingReviews(props.fields))

const displayFields = computed(() =>
  showReviewOnly.value
    ? props.fields.filter((field) => needsFieldReview(field, props.fields))
    : props.fields
)

const emit = defineEmits<{
  selectField: [fieldId: string]
  updateValue: [fieldId: string, value: string]
  resolveValue: [fieldId: string, value: string]
  selectMasterMatch: [fieldId: string, candidate: OcrMasterMatchCandidate]
  toggleConfirm: [fieldId: string]
  restoreValue: [fieldId: string]
}>()

const scrollRef = ref<HTMLElement | null>(null)
const rowRefs = ref<Record<string, HTMLElement>>({})

const alertClassMap: Record<OcrFieldAlert, string> = {
  none: '',
  'low-confidence': 'is-low-confidence',
  'model-conflict': 'is-model-conflict',
  'value-out-of-range': 'is-value-out-of-range',
  'required-empty': 'is-required-empty',
  'master-low-similarity': 'is-master-match',
  'master-empty-result': 'is-master-match',
  'master-low-confidence': 'is-master-match',
  'master-execution-error': 'is-master-match'
}

const masterStrategyLabels = computed(() => {
  const map = new Map<string, string>()
  for (const strategy of ['ocr', 'match', 'code', 'hybrid', 'parent'] as const) {
    map.set(strategy, strategy==='ocr'?getMasterMatchOptionLabel(strategy):t(strategy==='parent'?'phase3.parentMatch':strategy==='code'?'phase3.exactMatch':'phase3.similarityMatch'))
  }
  return map
})

function masterStrategyLabel(strategy: string): string {
  return masterStrategyLabels.value.get(strategy) ?? strategy
}

function isMasterField(field:OcrExtractionField){return !!(field.masterDataId||field.masterMatchCandidates?.length||field.masterMatchConfirmRule||field.masterMatchLinkedTo||field.masterMatchedValue||field.masterMatchStrategy)}
function hasMasterCandidates(field: OcrExtractionField): boolean {
  return hasMasterMatchDropdown(field, props.fields)
}

const expandedCandidates = ref<Record<string,boolean>>({})
function candidateKey(item:OcrMasterMatchCandidate){return `${item.strategy}:${item.value}`}
function isAdoptedCandidate(field:OcrExtractionField,item:OcrMasterMatchCandidate){
 if(item.strategy==='ocr'||item.strategy!==(field.masterHierarchyOfficial?'parent':field.masterMatchStrategy))return false
 return Object.entries(item.linkedValues||{[field.id]:item.value}).every(([id,value])=>(!props.fields.some(member=>member.id===id)||props.fields.find(member=>member.id===id)!.value===value))
}
function candidates(field:OcrExtractionField){
 const rank=(item:OcrMasterMatchCandidate)=>item.strategy==='code'?0:item.strategy==='parent'?2:item.strategy==='ocr'?3:1
 return getMasterMatchDropdownOptions(field,props.fields).sort((a,b)=>Number(isAdoptedCandidate(field,b))-Number(isAdoptedCandidate(field,a))||rank(a)-rank(b)||(b.similarityScore??0)-(a.similarityScore??0))
}
function selectedCandidate(field:OcrExtractionField){return candidates(field).find(item=>{
 const values=item.linkedValues||{[field.id]:item.value}
 return (item.strategy===(field.masterHierarchyOfficial?'parent':field.masterMatchStrategy)||item.strategy==='ocr')&&Object.entries(values).every(([id,value])=>(!props.fields.some(member=>member.id===id)||props.fields.find(member=>member.id===id)!.value===value))
})}
function displayedCandidate(field:OcrExtractionField){
 const selected=selectedCandidate(field)
 return selected?.strategy!=='ocr'&&selected?selected:candidates(field).find(item=>item.strategy!=='ocr')
}
function chooseCandidate(field:OcrExtractionField,key:string){const item=candidates(field).find(item=>candidateKey(item)===key);if(item)emit('selectMasterMatch',field.id,item)}
function setRowRef(fieldId: string, el: Element | ComponentPublicInstance | null) {
  const node = el instanceof HTMLElement ? el : (el as ComponentPublicInstance | null)?.$el
  if (node instanceof HTMLElement) {
    rowRefs.value[fieldId] = node
  } else {
    delete rowRefs.value[fieldId]
  }
}

function selectField(fieldId: string) {
  emit('selectField', fieldId)
}

function updateValue(fieldId: string, value: string) {
  emit('updateValue', fieldId, value)
}

function resolveValue(fieldId: string, value: string) {
  emit('resolveValue', fieldId, value)
}

function toggleConfirm(fieldId: string) {
  emit('toggleConfirm', fieldId)
}

function fieldAlert(field: OcrExtractionField): OcrFieldAlert {
  return getFieldAlert(field, props.fields)
}

function restoreValue(fieldId: string) {
  emit('restoreValue', fieldId)
}

function rowAlertClass(field: OcrExtractionField): string {
  if (needsFieldReview(field, props.fields)) {
    return alertClassMap[fieldAlert(field)]
  }
  if (fieldAlert(field) !== 'none' && isFieldUserConfirmed(field, props.fields)) {
    return 'is-user-confirmed'
  }
  return ''
}

function isRestoreDisabled(field: OcrExtractionField): boolean {
  return isMasterMatchGroupRestored(field, props.fields)
}

function isRowVisible(fieldId: string): boolean {
  const container = scrollRef.value
  const row = rowRefs.value[fieldId]
  if (!container || !row) return true

  const containerRect = container.getBoundingClientRect()
  const rowRect = row.getBoundingClientRect()
  return rowRect.top >= containerRect.top && rowRect.bottom <= containerRect.bottom
}

async function scrollToField(fieldId: string) {
  if (!fieldId || isRowVisible(fieldId)) return
  await nextTick()
  rowRefs.value[fieldId]?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
}

defineExpose({ scrollToField })
</script>

<template>
  <div class="v-ocr-fields">
    <div class="v-ocr-fields__header">
      <div class="v-ocr-fields__header-actions">
        <label class="v-ocr-fields__filter" @click.stop>
          <span class="v-ocr-fields__filter-label">{{ $t('tasks.common.reviewOnly') }}</span>
          <el-switch v-model="showReviewOnly" size="small" />
        </label>
        <div class="v-ocr-fields__stats">
          <span class="v-ocr-fields__stat">{{ $t('tasks.common.countFields', { count: fields.length }) }}</span>
          <span v-if="tables.length" class="v-ocr-fields__stat">
            {{ $t('tasks.common.countTablesRows', { count: tables.length, rows: tableRowCount }) }}
          </span>
          <span v-if="pendingReviewCount > 0" class="v-ocr-fields__stat is-danger">
            {{ $t('tasks.common.pendingReview', { count: pendingReviewCount }) }}
          </span>
          <span v-else class="v-ocr-fields__stat is-ok">{{ $t('tasks.common.allConfirmed') }}</span>
        </div>
      </div>
    </div>
    <div ref="scrollRef" class="v-ocr-fields__scroll">
      <section v-if="fields.length" class="v-ocr-fields__section">
        <h4 class="v-ocr-fields__section-title">{{ $t('tasks.common.field') }}</h4>
        <el-empty
          v-if="displayFields.length === 0"
          :description="showReviewOnly ? $t('tasks.ocr.noReviewFields') : $t('tasks.ocr.noFields')"
          :image-size="64"
        />
        <div
          v-for="field in displayFields"
          :key="field.id"
          :ref="(el) => setRowRef(field.id, el)"
          class="v-ocr-fields__row"
          :class="[rowAlertClass(field), { 'is-selected': selectedFieldId === field.id }]"
          @click="selectField(field.id)"
        >
          <div class="v-ocr-fields__row-head">
            <span class="v-ocr-fields__label">
              {{ mockUiText(field.label) }}
              <span v-if="field.required" class="v-ocr-fields__required">*</span>
            </span>
            <span
              v-if="!isMasterField(field)" class="v-ocr-fields__confidence"
              :class="{ 'is-low': field.confidence < OCR_CONFIDENCE_THRESHOLD }"
            >
              {{ $t('tasks.common.confidence', { percent: field.confidence }) }}
            </span>
          </div>


          <div class="v-ocr-fields__input-row">
            <el-select
              v-if="hasModelConflict(field)"
              :model-value="field.value"
              filterable
              allow-create
              default-first-option
              clearable
              :disabled="readonly"
              class="v-ocr-fields__input"
              :placeholder="PLACEHOLDER.SELECT_OR_INPUT"
              @click.stop
              @update:model-value="(value: string) => resolveValue(field.id, value ?? '')"
            >
              <el-option
                v-for="option in getModelResultOptions(field)"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>

            <el-input v-else-if="hasMasterCandidates(field)" :model-value="field.value" :disabled="readonly" class="v-ocr-fields__input" @click.stop @update:model-value="(value:string)=>updateValue(field.id,value)"/>


            <el-input
              v-else
              :model-value="field.value"
              class="v-ocr-fields__input"
              :disabled="readonly"
              :placeholder="field.required ? PLACEHOLDER.REQUIRED : PLACEHOLDER.EMPTY"
              @click.stop
              @update:model-value="(value: string) => updateValue(field.id, value)"
            />

            <el-tooltip v-if="!readonly" :content="$t('tasks.common.restoreOcrValue')" placement="top">
              <span class="v-ocr-fields__restore-wrap" @click.stop>
                <el-button
                  class="v-ocr-fields__restore"
                  :icon="RefreshLeft"
                  :disabled="isRestoreDisabled(field)"
                  :aria-label="$t('tasks.common.restoreOcrValue')"
                  @click="restoreValue(field.id)"
                />
              </span>
            </el-tooltip>

            <el-button
              v-if="!readonly && fieldAlert(field) !== 'none'"
              :type="isFieldUserConfirmed(field, fields) ? 'success' : 'primary'"
              size="small"
              class="v-ocr-fields__confirm"
              :icon="isFieldUserConfirmed(field, fields) ? CircleCheck : Check"
              @click.stop="toggleConfirm(field.id)"
            >
              {{ isFieldUserConfirmed(field, fields) ? $t('tasks.common.confirmed') : $t('tasks.common.confirmAction') }}
            </el-button>
          </div>

          <div v-if="hasMasterCandidates(field) && candidates(field).length" class="p3-inline-candidates" @click.stop>
            <button type="button" class="p3-candidate-header" :aria-expanded="!!expandedCandidates[field.id]" @click="expandedCandidates[field.id]=!expandedCandidates[field.id]">
              <span v-if="displayedCandidate(field)" class="p3-candidate-title">
                <el-tag size="small" effect="light" class="p3-match-source-tag" :class="{'is-ocr':displayedCandidate(field)!.strategy==='ocr'}">{{masterStrategyLabel(displayedCandidate(field)!.strategy)}}</el-tag>
                <span>{{displayedCandidate(field)!.value}}</span><el-tag v-if="field.masterAutoAdopted && isAdoptedCandidate(field,displayedCandidate(field)!)" size="small" effect="light" class="p3-auto-adopt-tag">{{$t('phase3.autoAdopted')}}</el-tag>
                
              </span>
              <span v-else>{{$t('phase3.selectCandidate')}}</span>
              <span class="p3-candidate-chevron" aria-hidden="true">{{expandedCandidates[field.id]?'⌃':'⌄'}}</span>
            </button>
            <div v-if="expandedCandidates[field.id]" class="p3-candidate-options" role="radiogroup" :aria-label="$t('phase3.selectCandidate')">
              <button v-for="item in candidates(field)" :key="candidateKey(item)" type="button" role="radio" :aria-checked="!!selectedCandidate(field) && candidateKey(selectedCandidate(field)!)===candidateKey(item)" :disabled="readonly" class="p3-candidate-option" @click="chooseCandidate(field,candidateKey(item))">
                <span class="p3-candidate-radio" :class="{'is-selected':!!selectedCandidate(field) && candidateKey(selectedCandidate(field)!)===candidateKey(item)}"></span>
                <span class="p3-candidate-title"><el-tag size="small" effect="light" class="p3-match-source-tag" :class="{'is-ocr':item.strategy==='ocr'}">{{masterStrategyLabel(item.strategy)}}</el-tag><span>{{item.value}}</span><el-tag v-if="field.masterAutoAdopted && isAdoptedCandidate(field,item)" size="small" effect="light" class="p3-auto-adopt-tag">{{$t('phase3.autoAdopted')}}</el-tag></span>
              </button>
            </div>
          </div>
          <div v-if="field.masterMatchStrategy && field.masterMatchStrategy!=='ocr' && !hasMasterCandidates(field)" class="p3-match-detail"><el-tag size="small" effect="light" class="p3-match-source-tag">{{masterStrategyLabel(field.masterMatchStrategy)}}</el-tag><span>{{field.value}}</span></div>
          <p v-if="needsFieldReview(field, fields)" class="v-ocr-fields__alert-reason">
            {{ field.masterMatchError ? mockUiText(field.masterMatchError) : getFieldAlertLabel(fieldAlert(field)) }}
          </p>
        </div>
      </section>

      <section v-if="tables.length" class="v-ocr-fields__section is-table">
        <h4 class="v-ocr-fields__section-title">{{ $t('tasks.common.table') }}</h4>
        <div
          v-for="table in tables"
          :key="table.id"
          class="v-ocr-fields__table-block"
        >
          <div class="v-ocr-fields__table-head">
            <span class="v-ocr-fields__table-badge">{{ $t('tasks.common.table') }}</span>
            <h5 class="v-ocr-fields__table-title">{{ mockUiText(table.label) }}</h5>
            <span class="v-ocr-fields__table-meta">{{ $t('tasks.common.countRows', { count: table.rows.length }) }}</span>
          </div>
          <div class="v-ocr-fields__table-scroll">
            <table class="v-ocr-fields__inner-table">
              <thead>
                <tr>
                  <th v-for="column in table.columns" :key="column.id" :title="mockUiText(column.label)">
                    {{ mockUiText(column.label) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in table.rows" :key="`${table.id}-${rowIndex}`">
                  <td
                    v-for="column in table.columns"
                    :key="column.id"
                    :title="row[column.id] ?? ''"
                  >
                    {{ row[column.id] ?? PLACEHOLDER.EMPTY }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <el-empty
        v-if="!fields.length && !tables.length"
        :description="$t('tasks.ocr.noExtractResult')"
        :image-size="64"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ocr-fields {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    min-height: var(--ocr-card-header-height, 52px);
    padding: 0 16px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: var(--app-section-gap);
    margin-left: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__filter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  &__filter-label {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__stat {
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    background: #f9fafb;
    white-space: nowrap;

    &.is-danger {
      border-color: #fecdca;
      color: var(--el-color-danger);
      background: #fff5f5;
    }

    &.is-ok {
      border-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: var(--app-panel-padding);

    &:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }

    &.is-table {
      background: #fafbfc;
      gap: 12px;
    }
  }

  &__section-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  &__section.is-table &__section-title {
    color: var(--text-secondary);
  }

  &__table-block {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  &__table-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
    background: #f9fafb;
    flex-wrap: wrap;
  }

  &__table-badge {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    white-space: nowrap;
  }

  &__table-title {
    margin: 0;
    font-size: var(--app-font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__table-meta {
    margin-left: auto;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__table-scroll {
    overflow-x: auto;
  }

  &__inner-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
    min-width: 520px;

    thead th {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      background: #f9fafb;
      font-size: var(--app-font-size-base);
      font-weight: 600;
      color: var(--text-secondary);
      text-align: left;
      white-space: nowrap;
    }

    tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      font-size: var(--app-font-size-base);
      color: var(--text-primary);
      white-space: nowrap;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  &__row {
    padding: 14px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #f9fafb;
    cursor: pointer;
    transition: border-color var(--transition-time-02), background var(--transition-time-02);


    &.is-low-confidence,
    &.is-model-conflict,
    &.is-value-out-of-range,
    &.is-required-empty,
    &.is-master-match {
      border-color: var(--el-color-danger);
      background: #fff5f5;

      &.is-selected {
        box-shadow: 0 0 0 3px rgba(227, 27, 84, 0.12);
      }
    }

    &.is-user-confirmed {
      border-color: var(--el-color-success-light-5);
      background: #f6ffed;

      &.is-selected {
        box-shadow: 0 0 0 3px rgba(34, 160, 107, 0.12);
      }
    }
  }

  &__row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-section-gap);
    margin-bottom: 8px;
  }

  &__label {
    font-size: var(--app-font-size-base);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__required {
    color: var(--el-color-danger);
    margin-left: 2px;
  }

  &__confidence {
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    white-space: nowrap;

    &.is-low {
      color: var(--el-color-danger);
      font-weight: 600;
    }
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
  }

  &__alert-reason {
    margin: 6px 0 0;
    font-size: var(--app-font-size-base);
    color: var(--el-color-danger);
    line-height: 1.4;
  }

  &__master-option {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 100%;
    text-align: left;
  }

  &__master-tag {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #6941c6;
    background: #f4f3ff;
    white-space: nowrap;
  }

  &__master-value {
    flex: 1;
    min-width: 0;
    font-size: var(--app-font-size-base);
    color: var(--text-primary);
    word-break: break-all;
    text-align: left;
  }

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__restore-wrap {
    display: inline-flex;
    flex-shrink: 0;
    line-height: 0;
  }

  &__restore,
  &__confirm {
    flex-shrink: 0;
  }

  :deep(.v-ocr-fields__restore.el-button) {
    padding: 8px;
  }

  :deep(.v-ocr-fields__confirm.el-button) {
    padding: 5px 10px;
    font-size: var(--app-font-size-base);
    font-weight: 500;
  }

  :deep(.el-input__inner) {
    font-size: var(--app-font-size-base);
  }
}
</style>

<style lang="scss">
.v-ocr-fields__master-popper {
  .el-autocomplete-suggestion__list li {
    height: auto;
    min-height: 34px;
    padding: 8px 12px;
    line-height: 1.4;
  }
}
</style>

<style scoped>.p3-ocr-original{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}.p3-ocr-original label{font-size:15px;color:var(--text-secondary)}</style>

<style scoped>.p3-ocr-original{margin:12px 0 0}.p3-ocr-original summary{color:var(--el-color-primary);cursor:pointer;margin-bottom:8px}.p3-match-path{font-size:15px;color:var(--el-text-color-secondary);line-height:1.6;margin:8px 0}</style>

<style scoped>.p3-match-detail{padding:6px 10px;border:1px solid var(--el-border-color-lighter);border-radius:4px;margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:nowrap;min-width:0}.p3-match-detail .p3-match-path{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:13px;color:var(--el-text-color-secondary);overflow-wrap:anywhere}.p3-candidate-path{display:block;flex-basis:100%;font-size:12px;color:var(--el-text-color-secondary);white-space:normal;line-height:1.5}.v-ocr-fields__master-option{flex-wrap:wrap}</style>

<style>.p3-master-candidate-popper .el-select-dropdown__item{height:auto;min-height:40px;padding:10px 14px;line-height:1.5}.p3-master-candidate{display:flex;align-items:center;gap:10px}.p3-candidate-title{display:flex;align-items:center;gap:8px;white-space:nowrap}.p3-candidate-radio{width:15px;height:15px;border:1px solid var(--el-border-color);border-radius:50%;flex:none;margin-top:3px}.p3-candidate-radio.is-selected{border:5px solid var(--el-color-primary)}.p3-master-candidate-select{width:100%;margin-top:7px}</style>

<style>.p3-master-candidate>div{min-width:0;flex:1}.p3-candidate-title>span:not(.el-tag){flex-shrink:0}.p3-candidate-title .p3-candidate-inline-path{flex:1;flex-shrink:1!important;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--el-text-color-secondary);font-size:12px}</style>

<style scoped>.p3-candidate-inline-path,.p3-match-detail .p3-match-path{background:var(--el-fill-color-light);border-radius:3px;padding:2px 7px;font-size:12px;flex:0 0 auto!important;white-space:nowrap}.p3-match-detail>span:not(.el-tag){font-weight:500}.p3-match-detail .p3-match-path{margin-left:auto}</style>

<style scoped>
.p3-inline-candidates{margin-top:6px;width:100%}
.p3-candidate-header,.p3-candidate-option{display:flex;align-items:center;gap:10px;width:100%;text-align:left;font:inherit;background:var(--el-bg-color);color:var(--el-text-color-regular);cursor:pointer}
.p3-candidate-header{min-height:34px;padding:4px 12px;border:1px solid var(--el-border-color-light);border-radius:4px;justify-content:space-between}
.p3-candidate-chevron{font-size:20px;flex-shrink:0}
.p3-candidate-options{margin-top:4px;border:1px solid var(--el-border-color-light);border-radius:6px;padding:4px 0;background:var(--el-bg-color)}
.p3-candidate-option{min-height:34px;padding:5px 12px;border:0}
.p3-candidate-option:hover{background:var(--el-fill-color-light)}
.p3-candidate-option:disabled{cursor:default}
.p3-candidate-title{min-width:0;flex-wrap:wrap}
</style>

<style scoped>
.p3-match-source-tag{--el-tag-bg-color:var(--el-color-primary-light-9);--el-tag-border-color:var(--el-color-primary-light-9);--el-tag-text-color:var(--el-color-primary)}
.p3-match-source-tag.is-ocr{--el-tag-bg-color:var(--el-fill-color-light);--el-tag-border-color:var(--el-fill-color-light);--el-tag-text-color:var(--el-text-color-regular)}
</style>

<style scoped>.p3-auto-adopt-tag{--el-tag-bg-color:var(--el-fill-color-light);--el-tag-border-color:var(--el-fill-color-light);--el-tag-text-color:var(--el-text-color-regular)}</style>
