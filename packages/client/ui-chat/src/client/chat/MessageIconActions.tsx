// Shared IconActions chrome for user and assistant message operations.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IconBranchOutline16, IconCheckOutline16, IconCopyOutline16, IconRefreshOutline16,
  IconTrashOutline16, Tooltip, writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
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
  /** Remove this message and later history in a derived conversation. */
  onDelete?: (() => void) | undefined
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
  text, time, clock, onBranch, onRegenerate, onDelete, className,
  extraActions, usageAction, t,
}: MessageIconActionsProps) {
  const day = useCalendarDay()
  // Same success chrome as CodeBlock: a short check swap after the write,
  // gated so re-clicks during the window neither re-copy nor stack timers.
  const [copied, setCopied] = useState(false)
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
  return (
    <div className={className === undefined ? css.actions : `${css.actions} ${className}`}>
      {clock === 'start' ? clockEl : null}
      <Tooltip label={copied ? t('copied') : t('copy')} side="bottom">
        <button type="button" className={css.action} aria-label={copied ? t('copied') : t('copy')} onClick={onCopy}>
          {copied ? <IconCheckOutline16 /> : <IconCopyOutline16 />}
        </button>
      </Tooltip>
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
          <button
            type="button"
            className={css.action}
            aria-label={t('message.branch')}
            onClick={onBranch}
          >
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
  )
}
