# Agent Note: Chat live-tail extensions

Status: implemented

English | [中文](2026-09-10-chat-live-tail-extensions.zh.md)

## Problem

An extension can derive useful transient presentation from a streaming Assistant tool call before the durable Tool node exists. Mounting that presentation beside the composer places it outside the transcript flow, while tool-call-only providers previously produced no readable Chat node until settlement.

## Decision

The Chat view declares the session-scoped list slot `conversation.chat.liveTail` immediately after its durable node list. Entries receive the standard Chat selector and return no content while inactive. A running Assistant stream containing only tool-call blocks materializes as a hidden Chat node: `ChatNodeStore.values()` exposes it to extensions, while `ChatSnapshot.order` continues to exclude it from the native transcript.

## Alternatives considered

**Use the composer dock.** The dock remains mounted and is easy to extend, but a transient card there moves when its durable Tool card enters the transcript and gives the two states different scroll ownership.

**Render running tool calls as visible Assistant rows.** This would expose provider-neutral streaming data without another slot, but it would add empty or duplicate native rows before the Tool renderer takes ownership.

**Let extensions portal into the Chat DOM.** A portal can match the visual location, but it makes lifecycle and scroll behavior depend on private DOM structure instead of the typed slot contract.

## Consequences

Extensions can show provider-neutral, streaming tool preparation in the same flow position as the eventual Tool card. Hidden nodes are observable state but never native rows. The Chat apply and view tests cover slot declaration, disposal, and placement; Assistant projection tests cover running and settled tool-call-only visibility.