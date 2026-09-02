---
slug: getting-started
title: 快速开始
description: "在现有 YAMI 工作区中加载 Token、字体与公共组件，并用统一命令验证结果。"
group: start
order: 10
keywords: ["安装", "Token", "组件", "验证"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/README.md
  - packages/design-system/SKILL.md
  - packages/design-system/package.json
---

YAMI 的最小接入面由样式、Token 和公共组件组成。仓库内应用必须通过 `@yami/design-system` 的公开导出使用它们，不得复制组件源码或手写品牌值。

## 在工作区中使用

当前设计系统是 monorepo 内的私有 workspace 包。新应用必须在自己的 `package.json` 中声明依赖：

```json
{
  "dependencies": {
    "@yami/design-system": "workspace:*"
  }
}
```

安装仓库依赖后，应用可以从公共入口加载样式：

```tsx
import "@yami/design-system/styles/base.css";
import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
```

Token 必须先于页面样式生效。应用样式只能消费语义变量，例如 `var(--text-primary)`、`var(--background-primary)` 和 `var(--space-200)`。

## 使用公共组件

组件从包根导入。业务应用负责内容和页面结构，组件负责交互状态、可访问性与 Token 绑定。

```tsx
import { Button, Card, Input } from "@yami/design-system";

export function Example() {
  return (
    <Card padding="lg" surface="secondary">
      <Input label="搜索" placeholder="输入关键词" />
      <Button variant="primary">提交</Button>
    </Card>
  );
}
```

页面跳转必须使用链接。`Button` 只处理动作，不替代 `<a>` 或框架路由链接。

## 先读契约

开始实现前必须确认三个来源：

1. `SKILL.md` 定义 Agent 的读取与验证顺序。
2. `DESIGN.md` 定义 Token、组件规则与禁止模式。
3. `generated/catalog.json` 记录当前可用组件、状态和公共导出。

Storybook 是视觉与交互来源。Docsite 解释规则，不复制组件详情。

## 验证交付

在仓库根目录运行：

```bash
pnpm validate
```

验证必须覆盖 lint、类型、设计原则、生成文件漂移、包边界和测试。命令通过只证明技术契约成立；公开发布前仍必须检查字体、品牌标识和图片的分发权限。
