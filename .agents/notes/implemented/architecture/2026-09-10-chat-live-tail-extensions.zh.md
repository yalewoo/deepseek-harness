# Agent Note: Chat 实时尾部扩展

Status: implemented

[English](2026-09-10-chat-live-tail-extensions.md) | 中文

## Problem

在持久 Tool 节点出现前，扩展可以从流式 Assistant 工具调用中派生有用的临时界面。把该界面挂在 composer 旁会使它脱离 transcript 消息流；同时，仅含工具调用的 provider 在完成前不会产生可读取的 Chat 节点。

## Decision

Chat 视图在持久节点列表之后声明会话作用域的 list slot `conversation.chat.liveTail`。条目接收标准 Chat selector，并在未激活时不返回内容。仅含工具调用块的运行中 Assistant 流会物化为隐藏 Chat 节点：扩展可通过 `ChatNodeStore.values()` 读取它，而 `ChatSnapshot.order` 继续将其排除在原生 transcript 之外。

## Alternatives considered

**使用 composer dock。** dock 持续挂载且易于扩展，但持久 Tool 卡进入 transcript 时临时卡会移动，而且两种状态的滚动归属不同。

**把运行中的工具调用渲染为可见 Assistant 行。** 这可以在不增加 slot 的情况下暴露 provider 无关的流式数据，但会在 Tool renderer 接管前增加空白或重复的原生行。

**让扩展通过 portal 写入 Chat DOM。** portal 可以匹配视觉位置，但会让生命周期和滚动行为依赖私有 DOM 结构，而不是类型化 slot 契约。

## Consequences

扩展可以在最终 Tool 卡所在的同一消息流位置显示 provider 无关的流式工具准备状态。隐藏节点可被观察，但永远不会成为原生行。Chat apply 和 view 测试覆盖 slot 声明、卸载与位置；Assistant 投影测试覆盖运行中和已完成的纯工具调用可见性。