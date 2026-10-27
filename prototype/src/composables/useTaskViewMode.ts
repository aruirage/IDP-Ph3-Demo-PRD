import { computed } from 'vue'
import { useRoute } from 'vue-router'

/** 已办任务详情：?mode=view 时仅展示、不可编辑 */
export function useTaskViewMode() {
  const route = useRoute()
  const isViewOnly = computed(() => route.query.mode === 'view')
  return { isViewOnly }
}
