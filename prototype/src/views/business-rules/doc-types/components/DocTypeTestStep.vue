<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import ImageViewerFloatingToolbar from '@/components/ImageViewerFloatingToolbar.vue'
import {
  DEFAULT_PROCESS_CONFIDENCE,
  type DocTypeDefinition
} from '@/mocks/docTypeSettings'
import DocTypeSamplePreview from './DocTypeSamplePreview.vue'

const { t } = useI18n()

const docType = defineModel<DocTypeDefinition>({ required: true })

const activeTab = ref<'text' | 'table'>('text')
const previewRef = ref<InstanceType<typeof DocTypeSamplePreview> | null>(null)
const testImageUrl = ref('')
const hasTestResult = ref(false)

const displayImageUrl = computed(
  () => testImageUrl.value || docType.value.sampleImageUrl
)

const previewZoom = computed(() => unref(previewRef.value?.zoom) ?? 100)

interface TextTestRow {
  fieldId: string
  itemName: string
  extractedValue: string
  confidence: number
}

interface TableTestRow {
  tableId: string
  tableName: string
  columnId: string
  columnKey: string
  extractedValue: string
  confidence: number
}

const textTestRows = ref<TextTestRow[]>([])
const tableTestRows = ref<TableTestRow[]>([])

function onToolbarFit() {
  previewRef.value?.applyFitZoom()
}

function onToolbarRotateLeft() {
  previewRef.value?.rotateLeft()
}

function onToolbarRotateRight() {
  previewRef.value?.rotateRight()
}

function onToolbarZoomIn() {
  previewRef.value?.zoomIn()
}

function onToolbarZoomOut() {
  previewRef.value?.zoomOut()
}

function buildMockResults() {
  textTestRows.value = docType.value.ocrRead.textFields
    .filter((field) => field.itemName.trim())
    .map((field) => {
      const rule = docType.value.processRules.textFields.find((item) => item.fieldId === field.id)
      return {
        fieldId: field.id,
        itemName: field.itemName,
        extractedValue: field.correctSample || '—',
        confidence: rule?.confidence ?? DEFAULT_PROCESS_CONFIDENCE
      }
    })

  tableTestRows.value = docType.value.ocrRead.tables.flatMap((table) =>
    table.columns
      .filter((column) => column.columnKey.trim())
      .map((column) => {
        const rule = docType.value.processRules.tableColumns.find(
          (item) => item.tableId === table.id && item.columnId === column.id
        )
        return {
          tableId: table.id,
          tableName: table.name,
          columnId: column.id,
          columnKey: column.columnKey,
          extractedValue: column.correctSample || '—',
          confidence: rule?.confidence ?? DEFAULT_PROCESS_CONFIDENCE
        }
      })
  )
}

function runTest() {
  if (!displayImageUrl.value) {
    ElMessage.warning(t('businessRules.docType.message.testFileRequired'))
    return
  }
  buildMockResults()
  hasTestResult.value = true
  ElMessage.success(t('businessRules.docType.message.testDone'))
}

function setTestFile(file: File) {
  if (testImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(testImageUrl.value)
  }
  testImageUrl.value = URL.createObjectURL(file)
  hasTestResult.value = false
  textTestRows.value = []
  tableTestRows.value = []
  ElMessage.success(t('businessRules.docType.message.testFileSelected'))
}

defineExpose({
  runTest,
  setTestFile
})
</script>

<template>
  <div class="v-doc-type-test v-doc-type-workspace v-doc-type-workspace--2-3">
    <div class="v-doc-type-test__preview">
      <ImageViewerFloatingToolbar
        variant="dock"
        class="v-doc-type-test__preview-toolbar"
        :show-navigation="false"
        :show-crop="false"
        :show-fit="true"
        :zoom="previewZoom"
        @fit="onToolbarFit"
        @rotate-left="onToolbarRotateLeft"
        @rotate-right="onToolbarRotateRight"
        @zoom-in="onToolbarZoomIn"
        @zoom-out="onToolbarZoomOut"
      />

      <DocTypeSamplePreview
        ref="previewRef"
        :image-url="displayImageUrl"
        hide-toolbar
      />
    </div>

    <div class="v-doc-type-test__panel">
      <el-tabs v-model="activeTab" stretch class="v-doc-type-test__tabs">
        <el-tab-pane :label="$t('businessRules.docType.tab.textRead')" name="text" />
        <el-tab-pane :label="$t('businessRules.docType.tab.tableRead')" name="table" />
      </el-tabs>

      <div class="v-doc-type-test__panel-body">
          <template v-if="!hasTestResult">
            <div class="v-doc-type-test__empty">
              {{ $t('businessRules.docType.test.runHint') }}
            </div>
          </template>

          <template v-else-if="activeTab === 'text'">
            <el-table
              v-if="textTestRows.length"
              :data="textTestRows"
              border
              class="v-doc-type-test__table v-doc-type-table"
            >
              <el-table-column
                type="index"
                :label="$t('common.index')"
                width="80"
                align="center"
                header-class-name="v-list-table__index-col"
                class-name="v-list-table__index-col"
              />
              <el-table-column :label="$t('businessRules.docType.column.itemName')" min-width="140" prop="itemName" />
              <el-table-column :label="$t('businessRules.docType.column.extractedValue')" min-width="180" prop="extractedValue" />
              <el-table-column :label="$t('businessRules.docType.column.confidence')" width="120" align="center">
                <template #default="{ row }">
                  {{ row.confidence.toFixed(2) }}%
                </template>
              </el-table-column>
            </el-table>
            <div v-else class="v-doc-type-test__empty">{{ $t('businessRules.docType.test.noTextItems') }}</div>
          </template>

          <template v-else>
            <el-table
              v-if="tableTestRows.length"
              :data="tableTestRows"
              border
              class="v-doc-type-test__table v-doc-type-table"
            >
              <el-table-column
                type="index"
                :label="$t('common.index')"
                width="80"
                align="center"
                header-class-name="v-list-table__index-col"
                class-name="v-list-table__index-col"
              />
              <el-table-column :label="$t('businessRules.docType.column.tableName')" min-width="120" prop="tableName" />
              <el-table-column :label="$t('businessRules.docType.column.columnKey')" min-width="120" prop="columnKey" />
              <el-table-column :label="$t('businessRules.docType.column.extractedValue')" min-width="160" prop="extractedValue" />
              <el-table-column :label="$t('businessRules.docType.column.confidence')" width="120" align="center">
                <template #default="{ row }">
                  {{ row.confidence.toFixed(2) }}%
                </template>
              </el-table-column>
            </el-table>
            <div v-else class="v-doc-type-test__empty">{{ $t('businessRules.docType.test.noTableColumns') }}</div>
          </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './doc-type-workspace.scss';

.v-doc-type-test {
  flex: 1;
  min-height: 0;

  &__preview {
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  &__preview-toolbar {
    flex-shrink: 0;
  }

  &__tabs {
    flex-shrink: 0;
    width: 100%;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0 var(--app-panel-padding);
    }

    :deep(.el-tabs__item) {
      font-size: var(--app-font-size-base);
      height: 40px;
      padding: 0 12px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--border-color);
    }
  }

  &__panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  &__panel-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--app-panel-padding);
  }

  &__table {
    width: 100%;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    font-size: var(--app-font-size-base);
    color: var(--text-secondary);
    text-align: center;
  }
}
</style>
