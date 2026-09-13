// Shared IconActions chrome for user and assistant message operations.

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Button, IconBranchOutline16, IconCheckOutline16, IconChevronLeftOutline14,
  IconChevronRightOutline14, IconCopyOutline16, IconEditOutline16, IconRefreshOutline16,
  IconTrashOutline16, Modal, Tooltip, writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { ChatViewSlotProps } from '../contract/slots.ts'
import { formatMessageClock } from './message-chrome.ts'
import { useCalendarDay } from './use-calendar-day.ts'
import css from './MessageIconActions.module.css'

export interface MessageIconActionsProps {
  /** Plain text the copy action writes. */
  text: string
  /** Unix epoch ms for the clock label; omitted for transient messages. */
  time?: number | undefined
  /** Clock before icons (user) or after (assistant). */
  clock: 'start' | 'end'
  /** Fork the session at this message; omission hides the branch action. */
  onBranch?: (() => void) | undefined
  /** Rerun the completed turn containing this message in a derived conversation. */
  onRegenerate?: (() => void) | undefined
  /** Remove this message's turn and later history in a derived conversation. */
  onDelete?: (() => void) | undefined
  /** Save edited text as a new Session-backed message version. */
  onEdit?: ((text: string) => Promise<void>) | undefined
  /** Inline Session-backed version navigation. */
  versions?: {
    currentIndex: number
    sessionIds: readonly SessionId[]
    onSwitch: (sessionId: SessionId) => void
  } | undefined
  /** Parent layout class composed onto the actions row. */
  className?: string | undefined
  /**
   * Slot-rendered actions owned by independent plugins, placed between the
   * built-in copy and branch controls.
   */
  extraActions?: ReactNode
  /**
   * Icon-row Turn-usage trigger (the TurnUsagePanel pill), seated after the
   * branch control at the end of the icon cluster.
   */
  usageAction?: ReactNode
  /** The owning view's locale seat, passed down as a plain prop. */
  t: ChatViewSlotProps['t']
}

/**
 * Message IconActions row shared by user and assistant chrome.
 * @param props - Message text, event time, clock side, callbacks, and className.
 * @returns The actions row element.
 */
export function MessageIconActions({
  text, time, clock, onBranch, onRegenerate, onDelete, onEdit, versions, className,
  extraActions, usageAction, t,
}: MessageIconActionsProps) {
  const day = useCalendarDay()
  // Same success chrome as CodeBlock: a short check swap after the write,
  // gated so re-clicks during the window neither re-copy nor stack timers.
  const [copied, setCopied] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState(text)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const copyPending = useRef(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyEpoch = useRef(0)
  useEffect(() => () => {
    copyEpoch.current += 1
    copyPending.current = false
    if (copyTimer.current !== null) clearTimeout(copyTimer.current)
  }, [])
  const onCopy = useCallback(() => {
    if (copied || copyPending.current) return
    const epoch = copyEpoch.current
    copyPending.current = true
    void writeClipboard(text).then((ok) => {
      if (epoch !== copyEpoch.current) return
      copyPending.current = false
      if (!ok) return
      setCopied(true)
      copyTimer.current = window.setTimeout(() => {
        copyTimer.current = null
        setCopied(false)
      }, 1000)
    })
  }, [copied, text])
  const clockEl = time === undefined ? null : (
    <span className={clock === 'start' ? css.timeStart : css.timeEnd}>
      {formatMessageClock(time, t, day)}
    </span>
  )
  const submitEdit = useCallback(() => {
    if (onEdit === undefined || saving || draft.trim() === '') return
    setSaving(true)
    setEditError(null)
    void onEdit(draft).then(() => {
      setEditOpen(false)
    }).catch((error: unknown) => {
      setEditError(error instanceof Error ? error.message : String(error))
    }).finally(() => { setSaving(false) })
  }, [draft, onEdit, saving])
  const openEdit = useCallback(() => {
    setDraft(text)
    setEditError(null)
    setEditOpen(true)
  }, [text])
  const previousId = versions?.sessionIds[versions.currentIndex - 1]
  const nextId = versions?.sessionIds[versions.currentIndex + 1]
  return (
    <Fragment>
      <div className={className === undefined ? css.actions : `${css.actions} ${className}`}>
        {clock === 'start' ? clockEl : null}
        {versions !== undefined && versions.sessionIds.length > 1 && (
          <span className={css.versions} aria-label={t('message.version.label')}>
            <button type="button" className={css.versionButton} disabled={previousId === undefined} aria-label={t('message.version.previous')} onClick={() => { if (previousId !== undefined) versions.onSwitch(previousId) }}>
              <IconChevronLeftOutline14 />
            </button>
            <span>{versions.currentIndex + 1} / {versions.sessionIds.length}</span>
            <button type="button" className={css.versionButton} disabled={nextId === undefined} aria-label={t('message.version.next')} onClick={() => { if (nextId !== undefined) versions.onSwitch(nextId) }}>
              <IconChevronRightOutline14 />
            </button>
          </span>
        )}
        <Tooltip label={copied ? t('copied') : t('copy')} side="bottom">
          <button type="button" className={css.action} aria-label={copied ? t('copied') : t('copy')} onClick={onCopy}>
            {copied ? <IconCheckOutline16 /> : <IconCopyOutline16 />}
          </button>
        </Tooltip>
        {onEdit !== undefined && (
          <Tooltip label={t('message.edit')} side="bottom">
            <button type="button" className={css.action} aria-label={t('message.edit')} onClick={openEdit}>
              <IconEditOutline16 />
            </button>
          </Tooltip>
        )}
        {extraActions}
        {onRegenerate !== undefined && (
          <Tooltip label={t('message.regenerate')} side="bottom">
            <button type="button" className={css.action} aria-label={t('message.regenerate')} onClick={onRegenerate}>
              <IconRefreshOutline16 />
            </button>
          </Tooltip>
        )}
        {onBranch !== undefined && (
          <Tooltip label={t('message.branch')} side="bottom">
            <button type="button" className={css.action} aria-label={t('message.branch')} onClick={onBranch}>
              <IconBranchOutline16 />
            </button>
          </Tooltip>
        )}
        {onDelete !== undefined && (
          <Tooltip label={t('message.delete')} side="bottom">
            <button type="button" className={css.action} aria-label={t('message.delete')} onClick={onDelete}>
              <IconTrashOutline16 />
            </button>
          </Tooltip>
        )}
        {usageAction}
        {clock === 'end' ? clockEl : null}
      </div>
      {onEdit !== undefined && (
        <Modal
          open={editOpen}
          onClose={() => { if (!saving) setEditOpen(false) }}
          title={t('message.edit.title')}
          closeLabel={t('message.edit.cancel')}
          footer={(
            <div className={css.editFooter}>
              <Button variant="outline" disabled={saving} onClick={() => { setEditOpen(false) }}>{t('message.edit.cancel')}</Button>
              <Button variant="primary" disabled={saving || draft.trim() === ''} onClick={submitEdit}>{saving ? t('message.edit.saving') : t('message.edit.save')}</Button>
            </div>
          )}
        >
          <textarea className={css.editText} value={draft} autoFocus onChange={(event) => { setDraft(event.target.value) }} />
          {editError !== null && <div className={css.editError} role="alert">{editError}</div>}
        </Modal>
      )}
    </Fragment>
  )
}
