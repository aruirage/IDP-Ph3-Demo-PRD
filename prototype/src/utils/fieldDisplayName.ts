import type { VerificationDocument } from '@/mocks/verificationTask'

/** 展示名：未設定時はファイル名（拡張子なし） */
export function getDocumentDisplayName(doc: Pick<VerificationDocument, 'displayName' | 'fileName'>): string {
  const explicit = doc.displayName?.trim()
  if (explicit) return explicit
  return doc.fileName.replace(/\.[^.]+$/, '')
}

export function countDocumentsByType(documents: VerificationDocument[], docType: string): number {
  return documents.filter((doc) => doc.docType === docType).length
}

export function shouldDisambiguateDocType(
  documents: VerificationDocument[],
  docType: string
): boolean {
  return countDocumentsByType(documents, docType) > 1
}

export function getDocumentTypeInstanceIndex(
  documents: VerificationDocument[],
  doc: VerificationDocument
): number {
  const sameType = documents.filter((item) => item.docType === doc.docType)
  const index = sameType.findIndex((item) => item.id === doc.id)
  return index >= 0 ? index + 1 : 1
}

/** AI检证 Tab：同类型仅一份时显示账票类型，多份时追加序号（不展示真实文件名） */
export function formatVerificationScopeTabLabel(
  documents: VerificationDocument[],
  doc: VerificationDocument
): string {
  if (!shouldDisambiguateDocType(documents, doc.docType)) {
    return doc.docType
  }
  return `${doc.docType}${getDocumentTypeInstanceIndex(documents, doc)}`
}

function findDocument(
  documents: VerificationDocument[],
  docType: string,
  fileId?: string | null
): VerificationDocument | null {
  if (fileId) {
    return documents.find((doc) => doc.id === fileId) ?? null
  }
  return documents.find((doc) => doc.docType === docType) ?? null
}

/** 帳票フィールドの表示形式：与 Tab 标签一致（如 診断書1.患者氏名） */
export function formatQualifiedDocField(
  documents: VerificationDocument[],
  docType: string,
  fieldLabel: string,
  fileId?: string | null
): string {
  const doc = findDocument(documents, docType, fileId)
  const typeLabel = doc ? formatVerificationScopeTabLabel(documents, doc) : docType
  return `${typeLabel}.${fieldLabel}`
}

/** 標準フィールドの表示形式：標準.表示名 */
export function formatQualifiedStandardField(displayLabel: string): string {
  return `標準.${displayLabel}`
}

export function shouldShowDisplayNameSubtitle(
  doc: Pick<VerificationDocument, 'docType' | 'displayName' | 'fileName'>
): boolean {
  const displayName = getDocumentDisplayName(doc)
  return displayName !== doc.docType
}
