import type { CaseFileItem } from '@/mocks/caseFiles'

/** 与案件详情文件树相同的分组与排序，用于全案件范围上下文件切换 */
export function orderCaseFilesForNavigation(files: CaseFileItem[]): CaseFileItem[] {
  const folderMap = new Map<string, CaseFileItem[]>()

  for (const file of files) {
    const docType = file.fileType || '—'
    const list = folderMap.get(docType) ?? []
    list.push(file)
    folderMap.set(docType, list)
  }

  return Array.from(folderMap.values()).flat()
}
