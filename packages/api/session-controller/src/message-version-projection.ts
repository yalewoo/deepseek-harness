/** Durable message-version provenance projected into Session summaries. */

import type { Context } from '@deepseek-ai/cordis'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection'
import { z } from 'zod'
import type { MessageVersionRecord } from './types.ts'

const messageVersionSchema = z.object({
  groupId: z.string().min(1),
  baseSessionId: z.string().min(1),
  variantSessionId: z.string().min(1),
  anchorTurn: z.number().int().nonnegative(),
  sourceMessageId: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  kind: z.enum(['regenerate', 'user-edit', 'assistant-edit']),
}) as unknown as z.ZodType<MessageVersionRecord>

const messageVersionsSchema = z.array(messageVersionSchema) as unknown as z.ZodType<readonly MessageVersionRecord[]>

export function applyMessageVersionProjection(
  state: readonly MessageVersionRecord[],
  event: SessionEvent,
): readonly MessageVersionRecord[] {
  if (event.type !== 'session/message-version') return state
  const index = state.findIndex(item => item.groupId === event.data.groupId)
  if (index === -1) return [...state, event.data]
  if (state[index] === event.data) return state
  return state.map((item, itemIndex) => itemIndex === index ? event.data : item)
}

const messageVersionProjection = {
  key: 'messageVersions',
  stateSchema: messageVersionsSchema,
  init: () => [],
  apply: applyMessageVersionProjection,
  wire: { viewSchema: messageVersionsSchema, view: state => state },
  stateVersion: 1,
} satisfies ProjectionDefinition<'messageVersions', readonly MessageVersionRecord[]>

export function installMessageVersionProjection(ctx: Context): void {
  ctx.sessionProjections.register(messageVersionProjection)
}
