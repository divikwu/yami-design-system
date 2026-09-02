---
slug: introducing-yami-design-system
title: 认识 YAMI Design System
description: "YAMI 如何把品牌规则、Token、组件、原型与验证连接成一条可追溯的产品交付链。"
date: "2026-08-29"
category: update
authors: ["YAMI Design System Team"]
tags: ["Design System", "Token", "Storybook", "Workflow"]
relatedDocs: ["getting-started", "collaboration", "contribute-upstream"]
coverAlt: "YAMI Design System 标识与 Update 分类"
draft: true
---

这篇文章说明 YAMI Design System 如何把品牌规则、组件实现和验证证据连接成一条可执行的交付链。读完后，你会知道规则存放在哪里、应用如何消费，以及一项变更如何被验证。

第一期 Docsite 提供解释入口，Storybook 继续维护组件 API 和真实交互，Catalog、Registry 与 CI 则把组件状态、依赖和交付证据串起来。

实际路径是：`DESIGN.md` 定义规则，DTCG JSON 生成 Token，公共组件消费语义 Token，Storybook 验证状态，CI 检查生成漂移、边界、类型和测试。

## 从静态规范到可执行契约

传统设计规范经常在设计稿、文档和代码之间漂移。YAMI 把职责拆成相互关联的来源：

- `DESIGN.md` 记录品牌、视觉、内容和交互硬规则。
- DTCG JSON 保存原始 Token、语义别名和主题覆盖。
- 公共组件实现属性、状态、可访问性和 Token 绑定。
- Catalog 与 Registry 把组件状态和依赖转换为机器可读数据。
- Storybook 展示真实组件，应用原型验证业务组合。
- CI 检查生成漂移、包边界、设计原则、类型和测试。

这样的结构让一次修改可以被追踪：来源在哪里变化，生成物为什么变化，哪些页面受到影响，以及最终用什么证据确认结果。

## YAMI 的视觉不是装饰集合

YAMI 以中性画布、清楚层级和克制反馈为基础。品牌红只属于官方 Logo；操作红只表达明确动作、价格、促销、紧急信息或错误。

页面不能用渐变、毛玻璃、装饰插画或悬浮阴影弥补信息结构。Card 默认无边框、无阴影；hover 通过语义背景变化表达。每个屏幕最多保留一个 emphasis 操作，让用户可以立即理解任务优先级。

这些限制不是为了减少表现力，而是为了让品牌在不同应用、语言和主题中保持可识别，也让 Agent 生成的页面仍然落在可验证边界内。

## Docsite 与 Storybook 的分工

Docsite 第一期包含系统概览、基础规范、协作指南和 Blog。它帮助读者回答三类问题：

1. YAMI 的原则与 Token 如何工作？
2. 新应用如何正确接入设计系统？
3. 一项设计或代码变更如何被验证与发布？

Storybook 继续承担组件目录。Button 的变体、Input 的状态、Sheet 的焦点行为或新组件的成熟度都以 Storybook 和生成 Catalog 为准。Docsite 只提供入口，不复制 API，从结构上避免双重事实来源。

## 双语与主题是一等能力

中文和英文使用相同稳定 slug，并维护对等信息。语言切换保留当前文档、Blog 和锚点，而不是把用户送回首页。内容检查会验证两种语言的排序、分类、日期、来源和相关链接是否一致；语言质量仍需要人工审校。

主题首次跟随系统，用户手动选择后保存偏好。亮暗模式共享相同语义 Token，组件不维护独立暗色属性。官方 Logo 会根据表面使用匹配的完整锁定版资源。

## 什么才算完成

本地页面可打开只是开始。YAMI 的交付至少需要：来源可追溯、静态检查通过、真实交互可操作，以及发布目标与 commit SHA 可确认。

Docsite 本身也遵循这条规则。第一期会在内容、类型、单元测试、生产构建、键盘路径、无障碍和仓库级验证全部通过后进入独立预览；生产发布仍需要明确授权和人工抽查。

YAMI 仍会继续演进，但演进必须从来源开始，并留下可以复现的证据。这比快速堆叠更多页面更重要。
