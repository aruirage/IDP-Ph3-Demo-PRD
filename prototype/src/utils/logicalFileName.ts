/** PRD 6.15 分割文件自动命名 */
export interface LogicalFileNameParts {
  /** 上传原件主文件名（不含扩展名） */
  uploadBaseName: string
  /** 文件分割序号，从 1 起 */
  documentSplitIndex?: number
  /** 画像分割序号，从 1 起 */
  imageSplitIndex?: number
  extension: string
}

export function logicalFileStem(
  parts: Omit<LogicalFileNameParts, 'extension'>
): string {
  let stem = parts.uploadBaseName
  if (parts.documentSplitIndex != null && parts.documentSplitIndex > 0) {
    stem += `_D${parts.documentSplitIndex}`
  }
  if (parts.imageSplitIndex != null && parts.imageSplitIndex > 0) {
    stem += `_P${parts.imageSplitIndex}`
  }
  return stem
}

export function buildLogicalFileName(parts: LogicalFileNameParts): string {
  const ext = parts.extension.replace(/^\./, '')
  return `${logicalFileStem(parts)}.${ext}`
}

export function stripFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  return index > 0 ? fileName.slice(0, index) : fileName
}
