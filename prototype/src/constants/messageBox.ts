import type { ElMessageBoxOptions } from 'element-plus'
import { i18n } from '@/i18n'

/** 確認ダイアログの共通ボタン文案（主按钮统一 OK） */
export const MESSAGE_BOX_CONFIRM_DEFAULTS: Pick<
  ElMessageBoxOptions,
  'confirmButtonText' | 'cancelButtonText'
> = {
  get confirmButtonText() {
    return i18n.global.t('common.ok')
  },
  get cancelButtonText() {
    return i18n.global.t('common.cancel')
  }
}
