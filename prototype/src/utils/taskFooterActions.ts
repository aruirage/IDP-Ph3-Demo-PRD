import { ElMessageBox } from 'element-plus'
import type { ComposerTranslation } from 'vue-i18n'
import { MESSAGE_BOX_CONFIRM_DEFAULTS } from '@/constants/messageBox'

export async function confirmTaskSupplement(t: ComposerTranslation): Promise<string> {
  await ElMessageBox.confirm(
    t('tasks.common.supplementConfirm'),
    t('tasks.verification.supplement'),
    {
      type: 'info',
      ...MESSAGE_BOX_CONFIRM_DEFAULTS
    }
  )

  const { value } = await ElMessageBox.prompt(
    t('tasks.common.supplementRemarkHint'),
    t('tasks.common.supplementRemarkTitle'),
    {
      confirmButtonText: t('tasks.common.confirm'),
      cancelButtonText: t('tasks.common.cancel'),
      inputType: 'textarea',
      inputPlaceholder: t('tasks.common.supplementRemarkPlaceholder'),
      ...MESSAGE_BOX_CONFIRM_DEFAULTS
    }
  )

  return (value as string)?.trim() ?? ''
}

export async function confirmTaskAbort(t: ComposerTranslation, caseId: string): Promise<void> {
  await ElMessageBox.confirm(
    t('case.message.terminateConfirm', { caseId }),
    t('case.action.terminate'),
    {
      type: 'warning',
      ...MESSAGE_BOX_CONFIRM_DEFAULTS
    }
  )
}
