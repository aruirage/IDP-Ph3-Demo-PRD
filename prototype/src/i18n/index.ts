import { createI18n } from 'vue-i18n'
import ja from './locales/ja'
import zhCN from './locales/zh-CN'

export type AppLocale = 'ja' | 'zh-CN'

const LOCALE_STORAGE_KEY = 'neosai-prototype-locale'

function readStoredLocale(): AppLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored === 'ja' || stored === 'zh-CN') return stored
  return 'ja'
}

export const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale(),
  fallbackLocale: 'ja',
  messages: {
    ja,
    'zh-CN': zhCN
  }
})

export function persistLocale(locale: AppLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

persistLocale(i18n.global.locale.value as AppLocale)
