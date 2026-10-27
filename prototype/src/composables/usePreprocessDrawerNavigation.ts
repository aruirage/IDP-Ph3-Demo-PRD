import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PreprocessLogicalFile, PreprocessPage } from '@/mocks/preprocessConfirmationTask'
import { isUnclassifiedPage } from '@/mocks/preprocessConfirmationTask'

export function usePreprocessDrawerNavigation(
  page: Ref<PreprocessPage | null>,
  allPages: Ref<PreprocessPage[]>,
  logicalFiles: Ref<PreprocessLogicalFile[]>
) {
  const { t } = useI18n()

  const orderedPages = computed(() =>
    [...allPages.value].sort((a, b) => a.order - b.order)
  )

  const currentIndex = computed(() => {
    if (!page.value) return -1
    return orderedPages.value.findIndex((item) => item.id === page.value!.id)
  })

  const canGoPrev = computed(() => currentIndex.value > 0)

  const canGoNext = computed(
    () => currentIndex.value >= 0 && currentIndex.value < orderedPages.value.length - 1
  )

  const currentFileName = computed(() => {
    if (!page.value) return ''
    if (isUnclassifiedPage(page.value)) return t('tasks.common.unclassified')
    const file = logicalFiles.value.find((item) => item.id === page.value!.logicalFileId)
    return file?.displayName ?? ''
  })

  function getAdjacentPageId(direction: 'prev' | 'next'): string | null {
    const index = currentIndex.value
    if (index < 0) return null

    const targetIndex = direction === 'prev' ? index - 1 : index + 1
    const target = orderedPages.value[targetIndex]
    return target?.id ?? null
  }

  return {
    canGoPrev,
    canGoNext,
    currentFileName,
    getAdjacentPageId
  }
}
