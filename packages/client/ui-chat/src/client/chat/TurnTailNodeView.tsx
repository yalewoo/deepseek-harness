import { memo } from 'react'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatNodeViewProps, TurnTailOwnerProps } from '../contract/slots.ts'
import { MessageIconActions } from './MessageIconActions.tsx'
import { TurnTimePanel, TurnUsagePanel } from './TurnUsagePanel.tsx'
import { assistantText } from './turn-assistant.ts'
import css from './TurnTailNodeView.module.css'

type TurnTailNodeViewProps = ChatNodeViewProps<'turn-tail'>
  & PropsRenderSlots<'conversation.chat.turnTail' | 'conversation.chat.assistant-actions'>

/** Turn-local actions and feature tail over the Location index, independent of Assistant placement. */
export const TurnTailNodeView = memo(function TurnTailNodeView({
  node, openFile, branchAt, regenerateAt, editAt, messageVersionsAt,
  switchMessageVersion, deleteAt, renderSlot, renderSlotChain, t, useChat,
}: TurnTailNodeViewProps) {
  const data = node.data
  const isLatestTurn = useChat(snapshot => snapshot.timeline.turnOrder.at(-1) === data.turn)
  const turn = node.location.kind === 'turn' || node.location.kind === 'step'
    ? node.location.turn
    : undefined
  if (turn === undefined) return null
  const closing = data.closing
  const owner: TurnTailOwnerProps = { turn, seq: closing?.finalNode.seq ?? data.seq, openFile }
  const tail = renderSlotChain('conversation.chat.turnTail', owner)
  if (closing === null) return tail === null ? null : <div className={css.root}>{tail}</div>
  const runMs = turn.start === undefined || turn.end === undefined
    ? undefined
    : Math.max(0, turn.end.time - turn.start.time)
  // Interruption-frozen partials carry no messageId, so they address no
  // durable message and contribute no per-message actions.
  const messageId = closing.finalNode.messageId
  const versions = messageVersionsAt(data.turn, 'assistant')
  const assistantActions = messageId === undefined
    ? null
    : renderSlot('conversation.chat.assistant-actions', { messageId })
  return (
    <div
      className={css.root}
      data-turn-tail={data.turn}
      data-actions-reveal={isLatestTurn ? 'always' : 'hover'}
    >
      {tail}
      <MessageIconActions
        text={assistantText(closing.blocks)}
        time={closing.time}
        clock="end"
        onRegenerate={() => { regenerateAt(closing.finalNode.seq, data.turn) }}
        onEdit={messageId === undefined
          ? undefined
          : text => editAt(closing.finalNode.seq, data.turn, 'assistant', text)}
        versions={versions === undefined ? undefined : {
          ...versions,
          onSwitch: switchMessageVersion,
        }}
        onBranch={() => { branchAt(closing.finalNode.seq, 'assistant') }}
        onDelete={() => { deleteAt(closing.finalNode.seq) }}
        className={css.actions}
        extraActions={assistantActions}
        usageAction={(
          <>
            {data.tokenUsage !== undefined && <TurnUsagePanel usage={data.tokenUsage} t={t} />}
            {runMs !== undefined && (
              <TurnTimePanel
                runMs={runMs}
                tokensPerSecond={data.tokensPerSecond}
                ttftMs={data.ttftMs}
                t={t}
              />
            )}
          </>
        )}
        t={t}
      />
    </div>
  )
})
