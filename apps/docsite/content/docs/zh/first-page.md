---
slug: first-page
title: 创建第一个页面
description: "从现有抹茶页面与本地素材出发，用 AI 创建独立练习版本，完成一次修改、自查和评审准备。"
group: ai
order: 50
keywords: ["第一个页面", "AI", "教程", "抹茶", "Story", "fixture"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.topic.stories.tsx
  - packages/prototypes/pages/TopicLandingPage/topic.fixtures.ts
  - packages/prototypes/pages/TopicLandingPage/matcha.fixture.ts
  - packages/prototypes/pages/TopicLandingPage/index.ts
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.types.ts
  - apps/storybook/.storybook/main.ts
  - packages/design-system/components/ThemeHero/ThemeHero.tsx
---

这次练习做一个“周末抹茶灵感”页面。目标不是从零重写页面，而是理解如何让 AI 复用一个完整示例，形成自己的版本，再根据反馈修改。完成后得到独立的本地 Story，不会自动上线。

## 准备需求与参考

先完成[准备工作环境](/zh/docs/prepare-environment)，并在自己的任务分支操作。打开 [Topic — PC 参考页面](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-topic-landing-page-topic--pc)或 [Topic — Mobile 参考页面](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-topic-landing-page-topic--mobile)，观察内容顺序、商品区和窄屏布局。

本次输入已经明确，不需要另找图片或连接实时接口：

| 项目 | 练习要求 |
| --- | --- |
| 使用场景 | 邀请同事评审一个周末抹茶内容页 |
| 中文主标题 | 周末，从一杯抹茶开始 |
| 中文说明 | 从抹茶拿铁到随手小点，找到适合周末的搭配。 |
| 英文主标题 | Make room for matcha this weekend |
| 英文说明 | Explore matcha lattes, sweet treats, and easy pairings for a slower weekend. |
| 页面与商品 | 保留参考页全部模块、商品、顺序、图片和已有交互；仅修改首屏标题与说明 |
| 验证范围 | 中文与英文、浅色与深色，以及共用验收清单中的窄屏与宽屏 |

参考源在 `packages/prototypes/pages/TopicLandingPage/`：Story 是 `TopicLandingPage.topic.stories.tsx`，内容入口是 `topic.fixtures.ts`，抹茶数据与图片映射在 `matcha.fixture.ts`，首屏图片是 `assets/matcha/hero.webp`，商品图片在 `assets/matcha/products/`。

这些是版本固定的练习素材，商品价格与库存不代表当前线上状态。本次不刷新数据，也不从真实商城下单。

## 给 AI 一个有边界的任务

发送以下提示词；代码编辑范围是新练习文件，不是公共页面的默认示例：

```text
请使用当前 YAMI 项目创建“周末抹茶灵感”页面练习。
先读取适用的 AGENTS.md、packages/design-system/SKILL.md 及其要求的规范。
参考 packages/prototypes/pages/TopicLandingPage/TopicLandingPage.topic.stories.tsx，
读取 topic.fixtures.ts、matcha.fixture.ts、页面类型和公开导出。
只新建 packages/prototypes/pages/Learning/MatchaPractice.stories.tsx，
通过 @yami/prototypes/topic-landing-page 复用 TopicLandingPage 与
createTopicKeywordLandingPageFixture，不复制页面或组件实现。
若目标文件已存在，先说明并选择本任务独立名称，不覆盖已有练习。
首屏中文标题：周末，从一杯抹茶开始
首屏中文说明：从抹茶拿铁到随手小点，找到适合周末的搭配。
首屏英文标题：Make room for matcha this weekend
首屏英文说明：Explore matcha lattes, sweet treats, and easy pairings for a slower weekend.
保留原有商品、图片、模块顺序和交互；不改默认 fixture、Token 或公共组件。
新增 Story 为 YAMI/Pages/Learning/Matcha Practice，导出 Preview，
读取 Storybook 的 locale，并保留主题与视口工具可切换。
完成后验证本地画布、语言切换和改动范围，报告预览地址与实际检查结果。
不要提交、合并或部署。
```

AI 应先确认目录和复用方式，再编辑。如果它提议增加组件库、重写整页或改全局样式，先让它解释为什么现有页面不能满足这次只改两句文案的需求。

## 建立独立的页面版本

下面是一份完整的最小 Story，可作为 AI 的实现参考。将它保存到上述新文件；这里的“独立版本”是新 Story 与本任务的数据覆盖，不是复制整套组件源码。

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  TopicLandingPage,
  createTopicKeywordLandingPageFixture,
} from "@yami/prototypes/topic-landing-page";

const practiceCopy = {
  zh: {
    title: "周末，从一杯抹茶开始",
    description: "从抹茶拿铁到随手小点，找到适合周末的搭配。",
  },
  en: {
    title: "Make room for matcha this weekend",
    description:
      "Explore matcha lattes, sweet treats, and easy pairings for a slower weekend.",
  },
} as const;

const meta = {
  title: "YAMI/Pages/Learning/Matcha Practice",
  component: TopicLandingPage,
  parameters: { layout: "fullscreen" },
  args: createTopicKeywordLandingPageFixture("zh"),
  render: (_args, { globals }) => {
    const locale = globals.locale === "en" ? "en" : "zh";
    const base = createTopicKeywordLandingPageFixture(locale);
    return (
      <TopicLandingPage
        {...base}
        hero={{ ...base.hero, ...practiceCopy[locale] }}
      />
    );
  },
} satisfies Meta<typeof TopicLandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  play: async ({ canvasElement, globals }) => {
    const locale = globals.locale === "en" ? "en" : "zh";
    const title = canvasElement.querySelector('[data-slot="theme-hero-title"]');
    if (title?.textContent?.trim() !== practiceCopy[locale].title) {
      throw new Error("The practice hero must show the selected locale's title");
    }
  },
};
```

`apps/storybook/.storybook/main.ts` 已扫描 `packages/prototypes/pages/**/*.stories.*`，因此这个位置会被本地 Storybook 发现，不需要增加路由或修改 Storybook 配置。上述文件是跟随教程时创建的练习，不是仓库预装的页面。

这个 Story 有意从固定内容与语言生成页面，不使用 Controls 保存文案修改。需要永久调整内容时修改 `practiceCopy`；切换 Controls 或语言不会替你提交文件。

## 打开并完成一轮修改

在本地 Storybook 查找 `YAMI → Pages → Learning → Matcha Practice → Preview`。默认端口下，地址为 `http://localhost:6006/?path=/story/yami-pages-learning-matcha-practice--preview`；若用了其他端口，以终端实际地址为准。

预期结果：中文看到“周末，从一杯抹茶开始”；切换 English 后看到对应英文。抹茶主图、分类入口、商品区和其余页面内容仍来自原有示例。原来的 `Topic — PC` 与 `Topic — Mobile` 不应被修改。

接着试一次小修改，体验“反馈 → 保存 → 再看”的循环：

```text
只调整本任务 MatchaPractice 的说明文案，主标题、图片、商品和布局不变。
中文改为：选一款抹茶，搭配喜欢的小点，给周末留一点轻松。
英文改为：Pick your matcha, add a favorite treat, and make time to unwind.
中英文同时更新；检查两种语言在 375px 和 1440px 下的完整显示。
完成后报告实际检查结果，不提交或部署。
```

若页面没变化，先检查是否打开了新 Story、是否保存了文件、语言是否正确，不要直接让 AI 重建一遍。

## 自查并保存评审记录

使用[共用验收清单](/zh/docs/review-checklist#use-the-shared-acceptance-checklist)，并运行其中的[技术检查](/zh/docs/review-checklist#run-technical-checks)。本例的 `play` 只检查当前运行语言的首屏标题，不会自动证明所有语言、主题、尺寸和业务交互都正确。

特别确认：没有丢失商品图，没有改动原始 fixture，新 Story 的两种文案可切换，页面在窄屏无横向溢出。样例中的跳转与演示动作不代表真实交易服务已经接入。

保存一份评审记录，至少包括：任务名、负责人、任务分支与提交或未提交状态、新 Story 地址、fixture 路径、两种语言截图、已查尺寸与主题、命令结果和已知限制。完整字段见[记录结果与剩余问题](/zh/docs/review-checklist#record-results-and-open-issues)。

文件保存、Git 提交、共享预览是不同步骤。确认改动后再按[开始与管理一个任务](/zh/docs/manage-tasks)保存明确范围的版本；不要让 AI 顺手提交整个工作区。

## 下一步

想进一步调整商品或模块，继续[调整页面与内容](/zh/docs/edit-pages)。准备给同事看时，阅读[共享预览与评审](/zh/docs/review-preview)：你的 `localhost` 地址不能直接作为同事的共享链接。
