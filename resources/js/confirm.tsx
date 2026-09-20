import { Text } from '@mantine/core'
import type { MantineColor } from '@mantine/core'
import { useModals } from '@mantine/modals'
import { useTranslation } from 'react-i18next'

/** Wording of a dialog, for the actions the deletion defaults do not fit. */
export type ConfirmOptions = {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: MantineColor
}

/**
 * Asks the reader to confirm an action and answers whether they did, the way `window.confirm` does
 * — with Mantine's confirm modal, which a browser cannot refuse to show. The dialog is the one the
 * `ModalsProvider` of the application renders, so an action that cannot be undone simply waits:
 *
 *     if (!(await confirm(t('repos.confirmDelete', { name: repo.name })))) return
 */
export function useConfirm() {
  const modals = useModals()
  const { t } = useTranslation()

  return (message: string, options: ConfirmOptions = {}) =>
    new Promise<boolean>((resolve) => {
      // Answering once is the whole contract: cancelling, the close button, the Escape key and the
      // overlay all read as a no, and only confirming reads as a yes
      let answered = false
      const settle = (confirmed: boolean) => {
        if (answered) return
        answered = true
        resolve(confirmed)
      }

      modals.openConfirmModal({
        centered: true,
        children: <Text>{message}</Text>,
        confirmProps: { color: options.color ?? 'red' },
        labels: {
          cancel: options.cancelLabel ?? t('common.cancel'),
          confirm: options.confirmLabel ?? t('common.delete'),
        },
        title: options.title ?? t('common.confirm'),
        onCancel: () => settle(false),
        onClose: () => settle(false),
        onConfirm: () => settle(true),
      })
    })
}
