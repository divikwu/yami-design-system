---
slug: first-page
title: Create your first page
description: "Use an existing matcha page and local assets to build an isolated exercise with AI, then iterate, check, and prepare it for review."
group: ai
order: 50
keywords: ["first page", "AI", "tutorial", "matcha", "Story", "fixture"]
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

Build a “Matcha weekend inspiration” page in this exercise. The goal is not to rewrite a page from scratch. It is to learn how AI can reuse a complete example, create your own version, and respond to feedback. The result is an independent local Story, not an automatically published website.

## Prepare the brief and reference

Complete [Prepare your environment](/en/docs/prepare-environment) and work on your own task branch. Open the [Topic — PC reference](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-topic-landing-page-topic--pc) or [Topic — Mobile reference](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-topic-landing-page-topic--mobile). Inspect the content order, product sections, and narrow-screen layout.

The exercise inputs are ready; you do not need to find new images or connect a live service:

| Item | Exercise requirement |
| --- | --- |
| Use case | Prepare a weekend matcha content page for teammate review |
| Chinese headline | 周末，从一杯抹茶开始 |
| Chinese description | 从抹茶拿铁到随手小点，找到适合周末的搭配。 |
| English headline | Make room for matcha this weekend |
| English description | Explore matcha lattes, sweet treats, and easy pairings for a slower weekend. |
| Page and products | Keep every reference module, product, ordering, image, and existing interaction; change only the hero headline and description |
| Checks | Chinese and English, light and dark, and the narrow and wide sizes in the shared acceptance checklist |

Reference sources live in `packages/prototypes/pages/TopicLandingPage/`: the Story is `TopicLandingPage.topic.stories.tsx`, the content entry is `topic.fixtures.ts`, and matcha data and image mappings are in `matcha.fixture.ts`. The hero image is `assets/matcha/hero.webp`; product images are in `assets/matcha/products/`.

These are versioned exercise assets. Product prices and availability do not represent current storefront data. Do not refresh the data or place real orders in this exercise.

## Give AI a bounded task

Send the prompt below. The edit scope is a new exercise file, not the shared page's default example:

```text
Create a Matcha weekend inspiration exercise in this YAMI project.
Read applicable AGENTS.md files, packages/design-system/SKILL.md,
and the specifications it requires first.
Use packages/prototypes/pages/TopicLandingPage/TopicLandingPage.topic.stories.tsx
as the reference. Read topic.fixtures.ts, matcha.fixture.ts, page types,
and public exports. Create only this file:
packages/prototypes/pages/Learning/MatchaPractice.stories.tsx.
Reuse TopicLandingPage and createTopicKeywordLandingPageFixture from
@yami/prototypes/topic-landing-page. Do not copy page or component implementations.
If the target exists, explain and choose an independent task name instead
of overwriting someone else's exercise.
Chinese headline: 周末，从一杯抹茶开始
Chinese description: 从抹茶拿铁到随手小点，找到适合周末的搭配。
English headline: Make room for matcha this weekend
English description: Explore matcha lattes, sweet treats, and easy pairings for a slower weekend.
Keep existing products, images, module order, and interactions. Do not change
default fixtures, tokens, or shared components. Use the Story title
YAMI/Pages/Learning/Matcha Practice and export Preview. Read Storybook's
locale and leave theme and viewport controls available.
Verify the local canvas, language switching, and edit scope.
Report the preview URL and actual checks. Do not commit, merge, or deploy.
```

AI should confirm the directory and reuse approach before editing. If it proposes another component library, a page rewrite, or global style changes, ask why the existing page cannot support this two-sentence change.

## Create an independent page version

This is a complete minimal Story that AI can use as its implementation reference. Save it in the new file above. An “independent version” here means a new Story with task-specific data overrides, not a copy of the component library.

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

`apps/storybook/.storybook/main.ts` already scans `packages/prototypes/pages/**/*.stories.*`, so local Storybook discovers this location without a new route or configuration change. This exercise file is created while following the tutorial; it is not a preinstalled page.

This Story deliberately renders fixed content for the selected locale; Controls do not save copy changes. Edit `practiceCopy` for a lasting change. Switching Controls or locale does not commit files for you.

## Open it and make one revision

In local Storybook, find `YAMI → Pages → Learning → Matcha Practice → Preview`. With the default port, its URL is `http://localhost:6006/?path=/story/yami-pages-learning-matcha-practice--preview`. If you chose another port, use the actual server address.

Expected result: Chinese shows “周末，从一杯抹茶开始”; switching to English shows its counterpart. The matcha hero image, category links, product sections, and remaining content still come from the reference. The original `Topic — PC` and `Topic — Mobile` Stories remain unchanged.

Try one small revision to practice the feedback, save, and preview loop:

```text
Change only the description in this task's MatchaPractice Story.
Keep the headline, images, products, and layout unchanged.
Chinese: 选一款抹茶，搭配喜欢的小点，给周末留一点轻松。
English: Pick your matcha, add a favorite treat, and make time to unwind.
Update both languages and check their complete display at 375px and 1440px.
Report actual results. Do not commit or deploy.
```

If the page does not change, confirm the new Story, saved file, and selected language before asking AI to rebuild it.

## Check and save a review record

Use the [shared acceptance checklist](/en/docs/review-checklist#use-the-shared-acceptance-checklist) and run its [technical checks](/en/docs/review-checklist#run-technical-checks). This example's `play` checks only the hero title for the running locale. It does not automatically prove every language, theme, size, or business interaction is correct.

In particular, confirm that product images load, original fixtures are unchanged, both new copy variants work, and narrow screens have no page-level horizontal overflow. Example links and demo actions do not mean real transaction services are connected.

Save a review record with at least the task, owner, task branch and commit or uncommitted state, new Story URL, fixture path, screenshots of both languages, checked sizes and themes, command results, and known limitations. See [Record results and open issues](/en/docs/review-checklist#record-results-and-open-issues) for all fields.

Saving a file, committing it, and sharing a preview are separate actions. After confirming the diff, follow [Start and manage a task](/en/docs/manage-tasks) to save a scoped version. Do not let AI commit the entire workspace as a convenience.

## Next step

For product or module changes, continue to [Edit page content and layout](/en/docs/edit-pages). When ready for teammate feedback, read [Share previews and review](/en/docs/review-preview): your `localhost` address is not a teammate-accessible preview link.
