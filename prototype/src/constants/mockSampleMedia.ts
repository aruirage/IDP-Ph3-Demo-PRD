/** 原型全局示例账票影像（診療明細書） */
export const MOCK_SAMPLE_MEDIA_URL = '/mock/shinryo-meisai-sample.jpg'

export function isPdfDocumentUrl(url: string): boolean {
  return /\.pdf($|[?#])/i.test(url)
}

function isPdfUrl(url: string): boolean {
  return isPdfDocumentUrl(url)
}

/** PDF 预览追加 viewer 参数；图片等静态资源直接返回 URL */
export function mockDocumentPreviewSrc(
  url: string,
  options?: { page?: number; view?: 'Fit' | 'FitH' }
): string {
  if (!isPdfUrl(url)) return url
  const view = options?.view ?? 'Fit'
  const pagePart = options?.page != null ? `&page=${options.page}` : ''
  return `${url}#toolbar=0&navpanes=0&scrollbar=0&view=${view}${pagePart}`
}
