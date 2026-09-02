---
slug: resources-contribution
title: 资源与贡献
description: "找到规范、Catalog、Storybook 与贡献流程，并理解公开发布前的资产边界。"
group: guides
order: 220
keywords: ["资源", "贡献", "Storybook", "Catalog", "发布"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/README.md
  - packages/design-system/generated/catalog.json
  - packages/design-system/CHANGELOG.md
  - docs/adr/003-public-production-and-manual-deployments.md
  - docs/migration/asset-rights.csv
---

YAMI 的规范、代码和验证位于同一仓库，但承担不同职责。贡献前先选择正确入口，避免创建第二份事实来源。

## 资源地图

| 资源 | 用途 |
| --- | --- |
| Docsite | 理解系统原则、基础规范和协作流程 |
| Storybook | 查看组件属性、状态、示例和交互 |
| Catalog | 机器可读的组件清单与成熟度 |
| Registry | 组件交付与依赖元数据 |
| GitHub | 源码、决策记录、变更与评审 |

组件详情只在 Storybook 维护。Docsite 中的组件入口统一跳转 Storybook，避免两个站点出现不同 API 描述。

## 提交变更

变更应从最接近事实来源的位置开始：Token 修改源 JSON，组件修改源码与元数据，文档修改对应语言 Markdown。生成文件只能通过命令更新。

每次提交保持单一目的，并包含必要测试。不要顺便格式化或重构无关区域。

## 验证顺序

1. 运行受影响包的类型和单元测试。
2. 运行生成漂移与设计原则检查。
3. 在 Storybook 或应用中检查真实交互。
4. 运行仓库级 `pnpm validate`。
5. 发布前记录 commit SHA、CI 与人工抽查。

## 资产与发布

本地可用不等于可以公开分发。字体、Logo、图标与图片必须在资产权利清单中有明确结论。新增第三方素材必须先确认来源和许可。

Canvas、Storybook、Topic Generator 和 Docsite 是独立部署目标。Docsite 的上线不能替换或改变其他应用的域名与发布流程。
