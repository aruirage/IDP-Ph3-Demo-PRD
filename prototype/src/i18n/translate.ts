import { i18n } from '@/i18n'

export function t(key: string, params?: Record<string, unknown>) {
  return i18n.global.t(key, params ?? {})
}
