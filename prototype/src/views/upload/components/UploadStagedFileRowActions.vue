<script setup lang="ts">
import { Delete, FullScreen } from '@element-plus/icons-vue'

defineEmits<{
  preview: []
  delete: []
}>()
</script>

<template>
  <div class="v-upload-row-actions">
    <el-tooltip :content="$t('case.action.preview')" placement="top">
      <button type="button" class="v-upload-row-actions__btn" @click="$emit('preview')">
        <el-icon :size="16"><FullScreen /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip :content="$t('case.action.delete')" placement="top">
      <button type="button" class="v-upload-row-actions__btn" @click="$emit('delete')">
        <el-icon :size="16"><Delete /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.v-upload-row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: #fff;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
}
</style>
