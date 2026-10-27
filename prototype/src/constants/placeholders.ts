import { i18n } from '@/i18n'

/** フォーム・フィルター共通プレースホルダー（neosai-prototype-design Skill 準拠） */
export const PLACEHOLDER = {
  get SELECT() {
    return i18n.global.t('placeholder.select')
  },
  get SELECT_SEARCH() {
    return i18n.global.t('placeholder.selectSearch')
  },
  get SELECT_MULTIPLE() {
    return i18n.global.t('placeholder.selectMultiple')
  },
  get INPUT() {
    return i18n.global.t('placeholder.input')
  },
  get SELECT_OR_INPUT() {
    return i18n.global.t('placeholder.selectOrInput')
  },
  get FILTER_ALL() {
    return i18n.global.t('placeholder.filterAll')
  },
  get DATE_START() {
    return i18n.global.t('placeholder.dateStart')
  },
  get DATE_END() {
    return i18n.global.t('placeholder.dateEnd')
  },
  get REQUIRED() {
    return i18n.global.t('placeholder.required')
  },
  get EMPTY() {
    return i18n.global.t('placeholder.empty')
  },
  get NOT_SET() {
    return i18n.global.t('placeholder.notSet')
  },
  get NOT_DETECTED() {
    return i18n.global.t('placeholder.notDetected')
  },
  get UNCLASSIFIED() {
    return i18n.global.t('placeholder.unclassified')
  },
  get MASTER_MATCH_STRATEGY() {
    return i18n.global.t('placeholder.masterMatchStrategy')
  },
  get MASTER_MATCH_CONFIRM_RULE() {
    return i18n.global.t('placeholder.masterMatchConfirmRule')
  }
} as const

/** 検索入力の標準形式：{対象}で検索 */
export function searchPlaceholder(keyword: string) {
  return i18n.global.t('placeholder.searchBy', { keyword })
}

/** コンボボックス等：{対象}を選択または入力 */
export function selectOrInputPlaceholder(subject: string) {
  return i18n.global.t('placeholder.selectOrInputSubject', { subject })
}
