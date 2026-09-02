---
slug: create-components
title: 扩展或创建组件
description: "在明确职责边界后补齐实现、契约、Storybook 和验证，让新能力可以被其他页面可靠复用。"
group: maintenance
order: 150
keywords: ["创建组件", "变体", "meta", "Storybook", "公共导出"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/DESIGN.md
  - packages/design-system/components/AspectRatio/meta.json
  - packages/design-system/components/AspectRatio/AspectRatio.stories.tsx
  - packages/design-system/components/index.ts
  - packages/design-system/package.json
  - tooling/catalog/build.mjs
  - tooling/registry/build.mjs
  - package.json
---

适用于组件作者与维护者。开始前应有已确认的能力缺口、负责人、可复现场景与验收条件；不确定是否需要公共组件时，先[反馈组件能力缺口](/zh/docs/component-gaps)。

## 选择最小的扩展方式

| 方式 | 适合的情况 | 应保留的边界 |
| --- | --- | --- |
| 组合已有组件 | 变化在模块顺序、内容或页面布局 | 页面负责组合，不改基础组件默认值。 |
| 扩展已有变体 | 同一职责出现可复用的新表现或状态 | 语义明确，原有调用行为保持可预期。 |
| 创建新组件 | 新能力有独立职责，现有组合无法合理表达 | 明确输入、输出、交互和不负责的事项。 |

把选择及理由写进任务记录。不要因为一个页面需要新外观，就复制整个公共组件。

## 先读实现依据

1. 阅读 `packages/design-system/SKILL.md` 和完整的 `DESIGN.md`。
2. 检查最接近的组件的实现、`meta.json`、`usage.md`、Story 与测试。
3. 检查 `generated/catalog.json` 和包的公开导出，确认当前可用能力。
4. 在实现前列出参数、默认值、必要状态和对旧调用的影响。

例如，[AspectRatio 的 Storybook 示例](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-layout-aspectratio--showcase)对应 `YAMI/Components/Layout/AspectRatio` 的 `Showcase`，可作为职责清晰的基础组件参考，不是所有组件都应照搬的文件模板。

## 补齐组件交付内容

在 `packages/design-system/components/<Name>/` 中按照相近组件的现有结构实现：

- 组件源码与样式：消费语义 Token，处理约定的状态与无障碍行为。
- `meta.json`：记录参数、状态、版本、依赖、Token 绑定与无障碍约定，内容与实现一致。
- `usage.md`：写清何时使用、不负责什么、最小示例及常见误用。
- Story：提供维护中的 `Showcase`，按需要增加参数试用、边界状态和交互用例。
- 示例与测试：覆盖默认行为、此次新增能力和旧调用兼容性。
- 组件目录的 `index.ts`：导出公开组件与类型，不暴露内部实现细节。

新组件还需要在 `packages/design-system/components/index.ts` 中加入根导出。只写目录内的 `index.ts`，不能保证页面能从包根导入。

在实际消费方验证公开入口，例如已有组件的调用方式：

```tsx
import { AspectRatio } from "@yami/design-system";
```

有真实 Figma 对应关系时同步关联信息；不要为通过检查编造节点或设计链接。

## 保持公共包独立

公共组件只接收页面需要提供的数据与回调。业务接口、鉴权、项目路由、活动文案和素材由使用方管理。

不要向 `packages/design-system` 引入 Next.js、Motion、Zod、Design Labs 或 Astryx 运行时。页面组合放在合适的页面或 prototype 层，不把应用依赖复制进组件包。

Token 源文件位于 `tokens/**/*.tokens.json`；生成的 Token、Catalog 和 Registry 由脚本更新。不要手工修改生成文件，也不要将 Registry 元数据当作已经部署的远程安装服务。

## 生成并验证

在仓库根目录运行；生成命令会更新受影响的派生文件，需要一并检查差异：

```bash
pnpm generate
pnpm validate
pnpm test:storybook
pnpm --filter @yami/storybook build
pnpm check:docgen
git diff --check
```

`pnpm validate` 覆盖静态与单元验证，但不替代独立的 Storybook 浏览器测试和人工视觉检查。`check:docgen` 在 Storybook 构建后核对故事、文档与索引。

启动 Storybook，检查该能力相关的中英文、亮暗模式、键盘操作和屏幕尺寸。记录实际测过的组合；不要把单个默认示例通过写成全部状态通过。

## 交付前检查

- 实现、参数类型、`meta.json`、Usage 和 Story 描述的是同一能力。
- 包根可以导入组件与类型，旧页面不依赖新增的必填参数才能运行。
- 新增或改变的交互有测试，长内容和空数据有明确表现。
- 生成文件无漂移，验证结果与已知限制已记录。
- 公共内容已去除项目数据、密钥及无授权素材。

交付物是一组可复用源码、使用约定、示例和验证证据，不只是截图。

## 常见问题

**页面能用，Storybook 找不到？** 检查 Story 的 title、导出、项目收集范围及构建输出；不要只改导航标签。

**生成文件检查失败？** 先检查源元数据，再重新生成并审查差异，不直接手改 Catalog 或关闭检查。

**必须改变旧参数或默认值？** 先说明受影响调用与迁移方式，由维护者确认兼容性方案，再实施变更。

## 下一步

本地完成后进入[贡献公共能力到上游](/zh/docs/contribute-upstream)。不因验证通过就自动提交、合并或发布。
