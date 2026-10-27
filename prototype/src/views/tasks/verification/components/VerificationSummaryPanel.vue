<script setup lang="ts">
import { computed, nextTick, ref, type ComponentPublicInstance } from 'vue'
import { ArrowDown, ArrowRight, Check, CircleCheck } from '@element-plus/icons-vue'
import {
  categoryLabel,
  CATEGORY_ORDER,
  detectionTargetLabel,
  getCompletenessFieldRefs,
  sealDetectionContentLabel,
  getRuleFieldRefs,
  isHumanConfirmed,
  isTriggeredItem,
  needsHumanReview,
  type CompletenessFieldRequirement,
  type CompletenessRequirement,
  type DataEquationOperand,
  type HumanVerdict,
  type RuleFieldRef,
  type RuleVerificationField,
  type SealCompareTarget,
  type VerificationCategory,
  type VerificationDocument,
  type VerificationRule
} from '@/mocks/verificationTask'
import {
  formatQualifiedDocField,
  formatQualifiedStandardField
} from '@/utils/fieldDisplayName'
import { t } from '@/i18n/translate'

export interface SummaryReturnContext {
  scrollTop: number
  selectedRuleId: string | null
  selectedCompletenessId: string | null
  selectedCompletenessFieldId: string | null
  expandedCategories: VerificationCategory[]
}

const props = defineProps<{
  documents: VerificationDocument[]
  completeness: CompletenessRequirement[]
  completenessFields: CompletenessFieldRequirement[]
  rules: VerificationRule[]
  selectedRuleId: string | null
  selectedCompletenessId: string | null
  selectedCompletenessFieldId: string | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  selectRule: [ruleId: string]
  selectCompleteness: [id: string]
  selectCompletenessField: [id: string]
  navigateToField: [fileId: string, fieldId: string | null, contextId?: string]
  navigateToStandardField: [standardField: string, contextId?: string]
  toggleRuleConfirm: [ruleId: string]
  toggleCompletenessRowConfirm: []
  toggleCompletenessFieldsRowConfirm: []
}>()

const triggeredCompleteness = computed(() =>
  props.completeness.filter(isTriggeredItem)
)

const triggeredCompletenessFields = computed(() =>
  props.completenessFields.filter(isTriggeredItem)
)

/** 欠損帳票のみ */
const missingCompleteness = computed(() =>
  triggeredCompleteness.value.filter((item) => item.status === 'missing')
)

/** 欠損フィールドのみ */
const missingCompletenessFields = computed(() =>
  triggeredCompletenessFields.value.filter((item) => item.status === 'missing')
)

const missingCompletenessReviewItems = computed(() =>
  missingCompleteness.value.filter(needsHumanReview)
)

const missingCompletenessFieldsReviewItems = computed(() =>
  missingCompletenessFields.value.filter(needsHumanReview)
)

const completenessDocsRowAllConfirmed = computed(
  () =>
    missingCompletenessReviewItems.value.length > 0 &&
    missingCompletenessReviewItems.value.every((item) => isConfirmed(item.humanVerdict))
)

const completenessFieldsRowAllConfirmed = computed(
  () =>
    missingCompletenessFieldsReviewItems.value.length > 0 &&
    missingCompletenessFieldsReviewItems.value.every((item) => isConfirmed(item.humanVerdict))
)

const hasCompletenessIssues = computed(
  () => missingCompleteness.value.length > 0 || missingCompletenessFields.value.length > 0
)

interface SummarySection {
  category: VerificationCategory
  label: string
  count: number
  kind: 'completeness' | 'rules'
  rules: VerificationRule[]
}

const summarySections = computed((): SummarySection[] =>
  CATEGORY_ORDER.map((category) => {
    if (category === 'completeness') {
      return {
        category,
        label: categoryLabel(category),
        count:
          (missingCompleteness.value.length > 0 ? 1 : 0) +
          (missingCompletenessFields.value.length > 0 ? 1 : 0),
        kind: 'completeness',
        rules: []
      }
    }

    const rules = props.rules.filter((rule) => rule.category === category && isTriggeredItem(rule))
    return {
      category,
      label: categoryLabel(category),
      count: rules.length,
      kind: 'rules',
      rules
    }
  })
)

const expandedCategories = ref<Set<VerificationCategory>>(new Set(CATEGORY_ORDER))
const listRef = ref<HTMLElement | null>(null)
const itemRefs = ref<Record<string, HTMLElement>>({})

function summaryItemRefKey(kind: 'rule' | 'completeness' | 'completeness-field', id: string) {
  return `${kind}:${id}`
}

function setSummaryItemRef(
  kind: 'rule' | 'completeness' | 'completeness-field',
  id: string,
  el: Element | ComponentPublicInstance | null
) {
  const key = summaryItemRefKey(kind, id)
  const node = el instanceof HTMLElement ? el : (el as ComponentPublicInstance | null)?.$el
  if (node instanceof HTMLElement) {
    itemRefs.value[key] = node
  } else {
    delete itemRefs.value[key]
  }
}

function resolveAnchorKey(ctx: SummaryReturnContext): string | null {
  if (ctx.selectedRuleId) return summaryItemRefKey('rule', ctx.selectedRuleId)
  if (ctx.selectedCompletenessId) {
    return summaryItemRefKey('completeness', 'row')
  }
  if (ctx.selectedCompletenessFieldId) {
    return summaryItemRefKey('completeness-field', 'row')
  }
  return null
}

function captureReturnContext(): SummaryReturnContext {
  return {
    scrollTop: listRef.value?.scrollTop ?? 0,
    selectedRuleId: props.selectedRuleId,
    selectedCompletenessId: props.selectedCompletenessId,
    selectedCompletenessFieldId: props.selectedCompletenessFieldId,
    expandedCategories: [...expandedCategories.value]
  }
}

async function restoreReturnContext(ctx: SummaryReturnContext) {
  expandedCategories.value = new Set(
    ctx.expandedCategories.length ? ctx.expandedCategories : CATEGORY_ORDER
  )
  await nextTick()
  const anchorKey = resolveAnchorKey(ctx)
  const anchor = anchorKey ? itemRefs.value[anchorKey] : null
  if (anchor) {
    anchor.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return
  }
  if (listRef.value) {
    listRef.value.scrollTop = ctx.scrollTop
  }
}

defineExpose({ captureReturnContext, restoreReturnContext })

function isCategoryExpanded(category: VerificationCategory) {
  return expandedCategories.value.has(category)
}

function toggleCategory(category: VerificationCategory) {
  const next = new Set(expandedCategories.value)
  if (next.has(category)) {
    next.delete(category)
  } else {
    next.add(category)
  }
  expandedCategories.value = next
}

function ruleRefs(rule: VerificationRule): RuleFieldRef[] {
  return getRuleFieldRefs(rule, props.documents)
}

function mappingSourceRef(rule: VerificationRule, index: number): RuleFieldRef | null {
  return ruleRefs(rule)[index] ?? null
}

function jumpToMappingSource(rule: VerificationRule, index: number) {
  emit('selectRule', rule.id)
  const ref = mappingSourceRef(rule, index)
  if (ref) jumpTo(ref, rule.id)
}

function verificationFieldRef(rule: VerificationRule, index: number): RuleFieldRef | null {
  return ruleRefs(rule)[index] ?? null
}

function jumpToVerificationField(rule: VerificationRule, index: number) {
  emit('selectRule', rule.id)
  const ref = verificationFieldRef(rule, index)
  if (ref) jumpTo(ref, rule.id)
}

function verificationFieldLabel(rule: VerificationRule, index: number): string {
  const field = textVerificationFields(rule)[index]
  if (!field) return '—'
  return formatQualifiedDocField(
    props.documents,
    field.docType,
    field.fieldLabel,
    field.fileId
  )
}

function textVerificationFields(rule: VerificationRule): RuleVerificationField[] {
  if (rule.verificationFields?.length) {
    return rule.verificationFields
  }
  return [
    {
      docType: rule.targetDocType,
      fieldLabel: rule.targetFieldLabel ?? '—',
      appliedOcrValue: rule.appliedOcrValue,
      fileId: rule.targetFileId ?? undefined,
      fieldId: rule.targetFieldId
    }
  ]
}

function jumpToDataOperand(operand: DataEquationOperand, ruleId: string) {
  if (!operand.fileId) return
  emit('selectRule', ruleId)
  emit('navigateToField', operand.fileId, operand.fieldId ?? null, ruleId)
}

function isFormulaOcrOperand(operand: DataEquationOperand): boolean {
  if (operand.role === 'aggregate') return false
  if (operand.operatorText && !operand.fileId) return false
  if (operand.role !== 'factor' && operand.role !== 'breakdown' && operand.role !== 'target') {
    return false
  }
  return Boolean(operand.displayLabel) && (Boolean(operand.fileId) || Boolean(operand.value))
}

function operandFieldRef(operand: DataEquationOperand, rule: VerificationRule): RuleFieldRef | null {
  if (!operand.fileId) return null
  const doc = props.documents.find((item) => item.id === operand.fileId)
  if (!doc) return null
  return {
    fileId: operand.fileId,
    fieldId: operand.fieldId ?? null,
    docType: operand.docType ?? rule.targetDocType,
    fieldLabel: operand.fieldLabel ?? operand.displayLabel,
    fileName: doc.fileName,
    displayName: doc.displayName
  }
}

function operandTableRow(operand: DataEquationOperand, rule: VerificationRule): DataVerificationTableRow {
  const fieldRef = operandFieldRef(operand, rule)
  return {
    label: operand.displayLabel,
    value: operand.value || '—',
    fieldRef,
    operand,
    canNavigate: Boolean(fieldRef)
  }
}

interface DataVerificationTableRow {
  label: string
  value: string
  fieldRef?: RuleFieldRef | null
  operand?: DataEquationOperand
  canNavigate: boolean
}

function jumpToDataTableField(rule: VerificationRule, row: DataVerificationTableRow) {
  if (!row.fieldRef) return
  emit('selectRule', rule.id)
  jumpTo(row.fieldRef, rule.id)
}

function dataVerificationTableRows(rule: VerificationRule): DataVerificationTableRow[] {
  const eq = rule.dataEquation
  if (!eq) {
    return textVerificationFields(rule).map((field, index) => ({
      label: formatQualifiedDocField(
        props.documents,
        field.docType,
        field.fieldLabel,
        field.fileId
      ),
      value: field.appliedOcrValue || '—',
      fieldRef: verificationFieldRef(rule, index),
      canNavigate: Boolean(verificationFieldRef(rule, index))
    }))
  }

  const rows: DataVerificationTableRow[] = []
  const seenKeys = new Set<string>()

  function addRow(row: DataVerificationTableRow, dedupeKey?: string) {
    const key =
      dedupeKey ??
      (row.fieldRef ? `${row.fieldRef.fileId}:${row.fieldRef.fieldId}` : row.label)
    if (seenKeys.has(key)) return
    seenKeys.add(key)
    rows.push(row)
  }

  const leftRef = ruleRefs(rule)[0] ?? null
  if (leftRef) {
    addRow({
      label: eq.leftLabel,
      value: eq.leftValue,
      fieldRef: leftRef,
      canNavigate: true
    })
  }

  for (const operand of eq.operands) {
    if (!isFormulaOcrOperand(operand)) continue
    addRow(
      operandTableRow(operand, rule),
      operand.fileId ? `${operand.fileId}:${operand.fieldId ?? operand.displayLabel}` : operand.displayLabel
    )
  }

  return rows
}

function sealCompareTargetLabel(target: SealCompareTarget): string {
  if (target.type === 'standard') {
    return formatQualifiedStandardField(target.displayLabel ?? target.standardField ?? '—')
  }
  if (!target.docType || !target.fieldLabel) return '—'
  return formatQualifiedDocField(
    props.documents,
    target.docType,
    target.fieldLabel,
    target.fileId
  )
}

function sealDetectionObjectLabel(rule: VerificationRule): string {
  return rule.detectionTarget ? detectionTargetLabel(rule.detectionTarget) : '—'
}

function sealCompareTargetsSummary(rule: VerificationRule): string {
  const target = rule.compareTargets?.[0]
  if (!target) return '—'
  return sealCompareTargetLabel(target)
}

interface SealOcrRow {
  kind: 'compare' | 'detection'
  label: string
  value: string
  compareTarget?: SealCompareTarget
  canNavigate: boolean
}

function hasSealContentVerification(rule: VerificationRule): boolean {
  return Boolean(rule.compareTargets?.length)
}

function sealVerificationResult(rule: VerificationRule): string {
  const raw = `${rule.aiResult ?? ''} ${rule.extractedValue ?? ''}`.trim()
  if (/未検出|未检出/.test(raw)) return t('tasks.verification.verdict.notDetected')
  if (/不一致/.test(raw)) return t('tasks.verification.verdict.mismatch')
  if (rule.aiResult?.trim()) return rule.aiResult.trim()
  return t('tasks.verification.verdict.notDetected')
}

function sealOcrRows(rule: VerificationRule): SealOcrRow[] {
  if (!hasSealContentVerification(rule)) {
    return []
  }

  const rows: SealOcrRow[] = []
  const compareTarget = rule.compareTargets?.[0]
  if (compareTarget) {
    rows.push({
      kind: 'compare',
      label: sealCompareTargetLabel(compareTarget),
      value: compareTarget.expectedValue || '—',
      compareTarget,
      canNavigate: true
    })
  }

  rows.push({
    kind: 'detection',
    label: sealDetectionContentLabel(rule.detectionTarget),
    value: rule.appliedOcrValue ?? '',
    canNavigate: Boolean(rule.targetFileId)
  })

  return rows
}

function jumpToSealOcrRow(rule: VerificationRule, row: SealOcrRow) {
  if (row.kind === 'compare' && row.compareTarget) {
    jumpToSealCompareTarget(rule, row.compareTarget)
    return
  }
  if (row.kind === 'detection') {
    jumpToSealDetection(rule)
  }
}

function jumpToSealDetection(rule: VerificationRule) {
  emit('selectRule', rule.id)
  if (rule.targetFileId) {
    emit('navigateToField', rule.targetFileId, null, rule.id)
  }
}

function jumpToSealCompareTarget(rule: VerificationRule, target: SealCompareTarget) {
  emit('selectRule', rule.id)
  if (target.type === 'standard' && target.standardField) {
    emit('navigateToStandardField', target.standardField, rule.id)
    return
  }
  if (target.fileId) {
    emit('navigateToField', target.fileId, target.fieldId ?? null, rule.id)
    return
  }
  if (target.docType && target.fieldLabel) {
    const ref = ruleRefs(rule).find(
      (item) => item.docType === target.docType && item.fieldLabel === target.fieldLabel
    )
    if (ref) jumpTo(ref, rule.id)
  }
}

function mappingSourceFieldLabel(rule: VerificationRule, index: number): string {
  const source = rule.mappingSourceValues?.[index]
  if (!source) return '—'
  return formatQualifiedDocField(
    props.documents,
    source.docType,
    source.fieldLabel,
    source.fileId
  )
}

function standardFieldDisplayLabel(rule: VerificationRule): string {
  const label = rule.standardFieldLabel || rule.standardField || '—'
  if (label === '—') return label
  return formatQualifiedStandardField(label)
}

function completenessFieldDisplayLabel(item: CompletenessFieldRequirement): string {
  return formatQualifiedStandardField(item.displayLabel)
}

function completenessFieldRefs(item: CompletenessFieldRequirement): RuleFieldRef[] {
  return getCompletenessFieldRefs(item, props.documents)
}

function jumpToFieldItem(item: CompletenessFieldRequirement) {
  emit('selectCompletenessField', item.id)
  const refs = completenessFieldRefs(item)
  if (refs[0]) jumpTo(refs[0], item.id)
}

function jumpToStandardField(rule: VerificationRule) {
  if (!rule.standardField) return
  emit('selectRule', rule.id)
  emit('navigateToStandardField', rule.standardField, rule.id)
}

function jumpTo(ref: RuleFieldRef, contextId?: string) {
  emit('navigateToField', ref.fileId, ref.fieldId, contextId)
}

function selectCompletenessDoc(item: CompletenessRequirement) {
  emit('selectCompleteness', item.id)
}

function isConfirmed(verdict: HumanVerdict) {
  return isHumanConfirmed(verdict)
}
</script>

<template>
  <div class="v-ver-summary">
    <div ref="listRef" class="v-ver-summary__list">
      <section
        v-for="section in summarySections"
        :key="section.category"
        class="v-ver-summary__section"
      >
        <button
          type="button"
          class="v-ver-summary__section-title"
          :class="{ 'is-collapsed': !isCategoryExpanded(section.category) }"
          :aria-expanded="isCategoryExpanded(section.category)"
          @click="toggleCategory(section.category)"
        >
          <el-icon class="v-ver-summary__section-chevron" :size="14">
            <ArrowDown v-if="isCategoryExpanded(section.category)" />
            <ArrowRight v-else />
          </el-icon>
          <span class="v-ver-summary__section-label">{{ section.label }}</span>
          <span v-if="section.count > 0" class="v-ver-summary__section-count">
            {{ $t('tasks.common.countItems', { count: section.count }) }}
          </span>
        </button>

        <div v-show="isCategoryExpanded(section.category)" class="v-ver-summary__section-body">
          <template v-if="section.kind === 'completeness'">
            <template v-if="hasCompletenessIssues">
              <div
                v-if="missingCompleteness.length"
                :ref="(el) => setSummaryItemRef('completeness', 'row', el)"
                class="v-ver-summary__row v-ver-summary__row--compact"
                :class="{
                  'is-selected': missingCompleteness.some(
                    (item) => item.id === selectedCompletenessId
                  ),
                  'is-confirmed': completenessDocsRowAllConfirmed
                }"
              >
                <div class="v-ver-summary__row-body">
                  <p class="v-ver-summary__detail-line v-ver-summary__detail-line--field-row">
                    <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.missingDoc') }}</span>
                    <span class="v-ver-summary__field-links">
                      <button
                        v-for="item in missingCompleteness"
                        :key="item.id"
                        type="button"
                        class="v-ver-summary__field-link"
                        :class="{
                          'is-active': selectedCompletenessId === item.id,
                          'is-confirmed': isConfirmed(item.humanVerdict)
                        }"
                        @click.stop="selectCompletenessDoc(item)"
                      >
                        {{ item.docType }}
                      </button>
                    </span>
                  </p>
                </div>
                <div class="v-ver-summary__item-action">
                  <el-button
                    v-if="!readonly && missingCompletenessReviewItems.length > 0"
                    :type="completenessDocsRowAllConfirmed ? 'success' : 'primary'"
                    size="small"
                    class="v-ver-summary__confirm"
                    :icon="completenessDocsRowAllConfirmed ? CircleCheck : Check"
                    @click.stop="emit('toggleCompletenessRowConfirm')"
                  >
                    {{
                      completenessDocsRowAllConfirmed
                        ? $t('tasks.common.confirmed')
                        : $t('tasks.common.confirmAction')
                    }}
                  </el-button>
                </div>
              </div>

              <div
                v-if="missingCompletenessFields.length"
                :ref="(el) => setSummaryItemRef('completeness-field', 'row', el)"
                class="v-ver-summary__row v-ver-summary__row--compact"
                :class="{
                  'is-selected': missingCompletenessFields.some(
                    (item) => item.id === selectedCompletenessFieldId
                  ),
                  'is-confirmed': completenessFieldsRowAllConfirmed
                }"
              >
                <div class="v-ver-summary__row-body">
                  <p class="v-ver-summary__detail-line v-ver-summary__detail-line--field-row">
                    <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.missingField') }}</span>
                    <span class="v-ver-summary__field-links">
                      <button
                        v-for="item in missingCompletenessFields"
                        :key="item.id"
                        type="button"
                        class="v-ver-summary__field-link"
                        :class="{
                          'is-active': selectedCompletenessFieldId === item.id,
                          'is-confirmed': isConfirmed(item.humanVerdict)
                        }"
                        @click.stop="jumpToFieldItem(item)"
                      >
                        {{ completenessFieldDisplayLabel(item) }}
                      </button>
                    </span>
                  </p>
                </div>
                <div class="v-ver-summary__item-action">
                  <el-button
                    v-if="!readonly && missingCompletenessFieldsReviewItems.length > 0"
                    :type="completenessFieldsRowAllConfirmed ? 'success' : 'primary'"
                    size="small"
                    class="v-ver-summary__confirm"
                    :icon="completenessFieldsRowAllConfirmed ? CircleCheck : Check"
                    @click.stop="emit('toggleCompletenessFieldsRowConfirm')"
                  >
                    {{
                      completenessFieldsRowAllConfirmed
                        ? $t('tasks.common.confirmed')
                        : $t('tasks.common.confirmAction')
                    }}
                  </el-button>
                </div>
              </div>
            </template>
            <p v-else class="v-ver-summary__section-empty">{{ $t('tasks.common.none') }}</p>
          </template>

          <template v-else>
            <template v-if="section.rules.length">
              <div
                v-for="rule in section.rules"
                :key="rule.id"
                :ref="(el) => setSummaryItemRef('rule', rule.id, el)"
                class="v-ver-summary__row v-ver-summary__row--compact"
                :class="{
                  'is-review': section.category !== 'mapping',
                  'is-selected': selectedRuleId === rule.id,
                  'is-confirmed': isConfirmed(rule.humanVerdict)
                }"
              >
                  <div class="v-ver-summary__row-body">
                    <template v-if="rule.category === 'mapping'">
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.standardField') }}</span>
                      <span class="v-ver-summary__detail-value">
                        <button
                          v-if="rule.standardField"
                          type="button"
                          class="v-ver-summary__field-link"
                          @click.stop="jumpToStandardField(rule)"
                        >
                          {{ standardFieldDisplayLabel(rule) }}
                        </button>
                        <template v-else>{{ standardFieldDisplayLabel(rule) }}</template>
                        <span v-if="rule.standardField" class="v-ver-summary__detail-param">
                          （{{ rule.standardField }}）
                        </span>
                      </span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.standardValue') }}</span>
                      <span class="v-ver-summary__mapping-standard-value">
                        {{ rule.appliedOcrValue || '—' }}
                      </span>
                    </p>
                    <div class="v-ver-summary__text-compare">
                      <div class="v-ver-summary__text-compare-head">
                        <span>{{ $t('tasks.verification.summary.verifyField') }}</span>
                        <span>{{ $t('tasks.verification.summary.verifyValue') }}</span>
                      </div>
                      <div
                        v-for="(source, index) in rule.mappingSourceValues ?? []"
                        :key="`${source.docType}-${source.fieldLabel}-${source.fileId ?? index}-${index}`"
                        class="v-ver-summary__text-compare-row"
                      >
                        <button
                          v-if="mappingSourceRef(rule, index)"
                          type="button"
                          class="v-ver-summary__field-link v-ver-summary__text-field-link"
                          @click.stop="jumpToMappingSource(rule, index)"
                        >
                          {{ mappingSourceFieldLabel(rule, index) }}
                        </button>
                        <span v-else class="v-ver-summary__text-field-plain">
                          {{ mappingSourceFieldLabel(rule, index) }}
                        </span>
                        <span class="v-ver-summary__text-ocr-value">
                          {{ source.value || '—' }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="rule.category === 'text'">
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.ruleName') }}</span>
                      <span class="v-ver-summary__detail-value">{{ rule.ruleName || '—' }}</span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.ruleDescription') }}</span>
                      <span class="v-ver-summary__detail-value v-ver-summary__formula-text">
                        {{ rule.ruleDescription || '—' }}
                      </span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.judgment') }}</span>
                      <span class="v-ver-summary__detail-value v-ver-summary__judgment">
                        {{ rule.judgmentExplanation || '—' }}
                      </span>
                    </p>
                    <div class="v-ver-summary__text-compare">
                      <div class="v-ver-summary__text-compare-head">
                        <span>{{ $t('tasks.verification.summary.verifyField') }}</span>
                        <span>{{ $t('tasks.verification.summary.verifyValue') }}</span>
                      </div>
                      <div
                        v-for="(field, index) in textVerificationFields(rule)"
                        :key="`${field.docType}-${field.fieldLabel}-${field.fileId ?? index}-${index}`"
                        class="v-ver-summary__text-compare-row"
                      >
                        <button
                          v-if="verificationFieldRef(rule, index)"
                          type="button"
                          class="v-ver-summary__field-link v-ver-summary__text-field-link"
                          @click.stop="jumpToVerificationField(rule, index)"
                        >
                          {{ verificationFieldLabel(rule, index) }}
                        </button>
                        <span v-else class="v-ver-summary__text-field-plain">
                          {{ verificationFieldLabel(rule, index) }}
                        </span>
                        <span class="v-ver-summary__text-ocr-value">
                          {{ field.appliedOcrValue || '—' }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="rule.category === 'data'">
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.ruleName') }}</span>
                      <span class="v-ver-summary__detail-value">{{ rule.ruleName || '—' }}</span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.ruleDescription') }}</span>
                      <span class="v-ver-summary__detail-value v-ver-summary__formula-text">
                        {{ rule.ruleDescription || '—' }}
                      </span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.judgment') }}</span>
                      <span class="v-ver-summary__detail-value v-ver-summary__judgment">
                        {{ rule.judgmentExplanation || '—' }}
                      </span>
                    </p>

                    <div class="v-ver-summary__text-compare">
                      <div class="v-ver-summary__text-compare-head">
                        <span>{{ $t('tasks.verification.summary.verifyField') }}</span>
                        <span>{{ $t('tasks.verification.summary.verifyValue') }}</span>
                      </div>
                      <div
                        v-for="(row, index) in dataVerificationTableRows(rule)"
                        :key="`data-row-${rule.id}-${index}`"
                        class="v-ver-summary__text-compare-row"
                      >
                        <button
                          v-if="row.fieldRef"
                          type="button"
                          class="v-ver-summary__field-link v-ver-summary__text-field-link"
                          @click.stop="jumpToDataTableField(rule, row)"
                        >
                          {{ row.label }}
                        </button>
                        <button
                          v-else-if="row.canNavigate && row.operand"
                          type="button"
                          class="v-ver-summary__field-link v-ver-summary__text-field-link"
                          @click.stop="jumpToDataOperand(row.operand, rule.id)"
                        >
                          {{ row.label }}
                        </button>
                        <button
                          v-else-if="row.canNavigate"
                          type="button"
                          class="v-ver-summary__field-link v-ver-summary__text-field-link"
                          @click.stop="jumpToVerificationField(rule, index)"
                        >
                          {{ row.label }}
                        </button>
                        <span v-else class="v-ver-summary__text-field-plain">
                          {{ row.label }}
                        </span>
                        <span class="v-ver-summary__text-ocr-value">
                          {{ row.value || '—' }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="rule.category === 'seal'">
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.ruleName') }}</span>
                      <span class="v-ver-summary__detail-value">{{ rule.ruleName || '—' }}</span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.targetDoc') }}</span>
                      <span class="v-ver-summary__detail-value">
                        <button
                          v-if="rule.targetFileId"
                          type="button"
                          class="v-ver-summary__field-link"
                          @click.stop="jumpToSealDetection(rule)"
                        >
                          {{ rule.targetDocType || '—' }}
                        </button>
                        <template v-else>{{ rule.targetDocType || '—' }}</template>
                      </span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.detectionObject') }}</span>
                      <span class="v-ver-summary__detail-value">{{ sealDetectionObjectLabel(rule) }}</span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.compareTarget') }}</span>
                      <span class="v-ver-summary__detail-value">
                        {{
                          hasSealContentVerification(rule)
                            ? sealCompareTargetsSummary(rule)
                            : '—'
                        }}
                      </span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.verificationResult') }}</span>
                      <span class="v-ver-summary__detail-value">{{ sealVerificationResult(rule) }}</span>
                    </p>
                    <div v-if="sealOcrRows(rule).length" class="v-ver-summary__text-compare">
                      <div class="v-ver-summary__text-compare-head">
                        <span>{{ $t('tasks.verification.summary.verifyField') }}</span>
                        <span>{{ $t('tasks.verification.summary.verifyValue') }}</span>
                      </div>
                      <div
                        v-for="(row, index) in sealOcrRows(rule)"
                        :key="`${row.kind}-${row.label}-${index}`"
                        class="v-ver-summary__text-compare-row"
                      >
                        <button
                          v-if="row.canNavigate"
                          type="button"
                          class="v-ver-summary__field-link v-ver-summary__text-field-link"
                          @click.stop="jumpToSealOcrRow(rule, row)"
                        >
                          {{ row.label }}
                        </button>
                        <span v-else class="v-ver-summary__text-field-plain">
                          {{ row.label }}
                        </span>
                        <span class="v-ver-summary__text-ocr-value">
                          {{ row.value }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <p v-if="rule.standardField" class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.standardField') }}</span>
                      <span class="v-ver-summary__detail-value">
                        <button
                          type="button"
                          class="v-ver-summary__field-link"
                          @click.stop="jumpToStandardField(rule)"
                        >
                          {{ standardFieldDisplayLabel(rule) }}
                        </button>
                        <span class="v-ver-summary__detail-param">
                          （{{ rule.standardField }}）
                        </span>
                      </span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.rule') }}</span>
                      <span class="v-ver-summary__detail-value">{{ rule.ruleName }}</span>
                    </p>
                    <p class="v-ver-summary__detail-line">
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.verifyValue') }}</span>
                      <span class="v-ver-summary__detail-value">{{ rule.appliedOcrValue || '—' }}</span>
                    </p>
                    <p
                      v-if="ruleRefs(rule).length"
                      class="v-ver-summary__detail-line v-ver-summary__detail-line--links"
                    >
                      <span class="v-ver-summary__detail-label">{{ $t('tasks.verification.summary.reference') }}</span>
                      <span class="v-ver-summary__detail-value">
                        <button
                          v-for="(ref, index) in ruleRefs(rule)"
                          :key="`${ref.fileId}-${ref.fieldId ?? index}`"
                          type="button"
                          class="v-ver-summary__inline-link"
                          @click.stop="jumpTo(ref, rule.id)"
                        >
                          {{ formatQualifiedDocField(documents, ref.docType, ref.fieldLabel, ref.fileId) }}
                        </button>
                      </span>
                    </p>
                  </template>
                </div>

                <div class="v-ver-summary__item-action">
                  <el-button
                    v-if="!readonly && needsHumanReview(rule)"
                    :type="isConfirmed(rule.humanVerdict) ? 'success' : 'primary'"
                    size="small"
                    class="v-ver-summary__confirm"
                    :icon="isConfirmed(rule.humanVerdict) ? CircleCheck : Check"
                    @click.stop="emit('toggleRuleConfirm', rule.id)"
                  >
                    {{ isConfirmed(rule.humanVerdict) ? $t('tasks.common.confirmed') : $t('tasks.common.confirmAction') }}
                  </el-button>
                </div>
              </div>
            </template>
            <p v-else class="v-ver-summary__section-empty">{{ $t('tasks.common.none') }}</p>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-ver-summary {
  --ver-summary-pad-x: var(--app-panel-padding);
  --ver-summary-action-w: 72px;
  --ver-summary-action-gap: var(--app-page-gap);
  --ver-summary-table-indent: calc(108px + var(--app-section-gap));
  --ver-summary-table-gap: 8px;
  --ver-summary-table-width: min(100%, 600px);
  --ver-summary-table-width-3col: min(100%, 600px);
  --ver-review-bg: linear-gradient(90deg, #fffaf8 0%, #fff 68%);
  --ver-review-bg-hover: linear-gradient(90deg, #fff8f4 0%, #fff 68%);
  --ver-review-bg-selected: linear-gradient(90deg, #fff6f1 0%, #fffaf8 100%);
  --ver-review-bg-confirmed: linear-gradient(90deg, #f8fdf9 0%, #fff 68%);

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;

  &__list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: #fff;
  }

  &__section {
    background: #fff;

    &:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin: 0;
    padding: var(--app-section-gap) var(--app-panel-padding);
    border: none;
    font-size: var(--app-font-size-section);
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-primary);
    letter-spacing: 0.01em;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    background: linear-gradient(
      90deg,
      var(--el-color-primary-light-9) 0%,
      #f9fafb 160px,
      #f9fafb 100%
    );
    border-bottom: 1px solid var(--border-color);
    box-shadow: inset 4px 0 0 var(--el-color-primary);
    transition: background var(--transition-time-02);

    &:hover {
      background: linear-gradient(
        90deg,
        var(--el-color-primary-light-8) 0%,
        #f3f4f6 160px,
        #f3f4f6 100%
      );
    }

    &.is-collapsed {
      border-bottom-color: transparent;
    }
  }

  &__section-chevron {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  &__section-label {
    flex: 1;
    min-width: 0;
  }

  &__section-count {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  &__section-body {
    background: #fff;
    border-bottom: 1px solid var(--border-color);
  }

  &__section-empty {
    margin: 0;
    padding: var(--app-panel-padding);
    font-size: 13px;
    color: var(--text-secondary);
    background: #fff;
  }

  &__row--compact {
    align-items: center;
  }

  &__item-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--ver-summary-action-w);
    gap: var(--ver-summary-action-gap);
    align-items: center;
    padding-left: var(--ver-summary-pad-x);
    padding-right: var(--ver-summary-pad-x);
    box-sizing: border-box;
  }

  &__item-action {
    width: var(--ver-summary-action-w);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  &__item-action-head {
    visibility: hidden;
    width: var(--ver-summary-action-w);
    flex-shrink: 0;
  }

  &__detail-line {
    display: flex;
    align-items: baseline;
    gap: var(--app-section-gap);
    margin: 0;

    & + & {
      margin-top: 6px;
    }

    &--links {
      align-items: flex-start;
    }

    &--field-row {
      align-items: flex-start;
    }
  }

  &__field-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 16px;
    min-width: 0;
  }

  &__field-link {
    display: inline-block;
    width: fit-content;
    max-width: 100%;
    padding: 0;
    border: none;
    background: none;
    color: var(--el-color-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    word-break: break-all;

    &:hover {
      color: var(--el-color-primary-dark-2);
    }

    &.is-active {
      font-weight: 600;
    }

    &.is-confirmed {
      color: var(--el-color-success);
    }
  }

  &__detail-param {
    margin-left: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  &__mapping-standard-value {
    display: inline-block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-all;
    line-height: 1.4;
    padding: 4px 8px;
    border-radius: 6px;
    background: #f9fafb;
  }

  &__formula-text {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    word-break: break-all;
  }

  &__text-compare {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--ver-summary-table-gap);
    margin-top: 8px;
    margin-left: var(--ver-summary-table-indent);
    width: var(--ver-summary-table-width);
    box-sizing: border-box;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;

    &--with-calc {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      width: var(--ver-summary-table-width-3col);
    }

    @media (max-width: 900px) {
      margin-left: 0;
      width: 100%;

      &--with-calc {
        width: 100%;
      }
    }
  }

  &__text-compare-head,
  &__text-compare-row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    column-gap: var(--ver-summary-table-gap);
    justify-items: start;
    align-items: center;
    padding: 6px 10px;
    text-align: left;
  }

  &__text-compare-head {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: #f9fafb;
    border-bottom: 1px solid var(--border-color);
  }

  &__text-compare-row {
    font-size: 14px;
    border-top: 1px solid #f2f4f7;

    &:first-of-type {
      border-top: none;
    }
  }

  &__text-field-link {
    justify-self: start;
    width: fit-content;
    max-width: 100%;
    text-align: left;
  }

  &__text-field-plain {
    color: var(--text-secondary);
    min-width: 0;
    word-break: break-all;
  }

  &__text-ocr-value {
    min-width: 0;
    word-break: break-all;
    line-height: 1.4;
  }

  &__detail-label {
    flex-shrink: 0;
    width: 108px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  &__detail-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-all;

    &.v-ver-summary__judgment {
      font-weight: 400;
      line-height: 1.45;
    }

    &.is-match {
      color: var(--el-color-success);
      font-weight: 600;
    }

    &.is-miss {
      color: var(--el-color-danger);
      font-weight: 600;
    }

    &.is-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    &.is-link {
      padding: 0;
      border: none;
      background: none;
      color: var(--el-color-primary);
      cursor: pointer;
      font-family: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-align: left;

      &:hover {
        color: var(--el-color-primary-dark-2);
      }
    }
  }

  &__inline-link {
    display: inline-block;
    width: fit-content;
    max-width: 100%;
    padding: 0;
    margin: 0 12px 0 0;
    border: none;
    background: none;
    color: var(--el-color-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: var(--el-color-primary-dark-2);
    }
  }

  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--ver-summary-action-w);
    gap: var(--ver-summary-action-gap);
    align-items: flex-start;
    padding: 14px var(--ver-summary-pad-x);
    border-top: 1px solid var(--border-color);
    background: #fff;
    transition: background var(--transition-time-02);
    box-sizing: border-box;

    .v-ver-summary__section-body > &:first-child {
      border-top: none;
    }

    &.is-review {
      background: var(--ver-review-bg);
    }

    &.is-review.is-selected {
      background: var(--ver-review-bg-selected);
    }

    &.is-review.is-confirmed,
    &.is-confirmed {
      background: var(--ver-review-bg-confirmed);
    }

    &:hover.is-review:not(.is-confirmed) {
      background: var(--ver-review-bg-hover);
    }
  }

  &__row-body {
    flex: 1;
    min-width: 0;
  }

  &__confirm {
    flex-shrink: 0;
    margin-top: 0;
  }
}
</style>
