import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ProductDetailPage } from "./ProductDetailPage";
import { beverageProductSource, createBeverageProductDetailPageFixture } from "./beverage-fixtures";

const meta = {
  title: "YAMI/Pages/Product Detail/Beverage",
  tags: ["!autodocs"],
  component: ProductDetailPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component: `饮料类 PDP · BINGGRAE 宾格瑞香蕉味牛奶饮料，200ml × 6盒。复用 ProductDetailPage，支持中英文及 PC / Mobile。\n\n[官网商品来源](${beverageProductSource.url}) · 采集日期：${beverageProductSource.capturedAt}。价格、销量、评分及赏味期限均为该日期的展示快照，并非实时库存或履约承诺。聚焦香蕉口味，官网其他口味未接入，不显示切换控件。官网没有该商品的榜单排名，因此不显示排名徽章。\n\n11 张官网商品静态图（不含视频封面）与 8 款饮料推荐使用官网 CDN，需要网络连接。营养成分表及独立配料模块按[完整包装标签](${beverageProductSource.labelImage})录入，每份为1盒（200ml），每包装6份。官网图库存在不同版本的营养标签，本页只使用所链接版本，不混用其他版本的数值；每日参考值沿用原标签，未列出的值以 — 标示，并非0。配料与牛奶过敏原已单独展示，饮用前请核对实物包装。\n\n评价区域显示官网评分分布及 4 条香蕉口味评价的摘要／翻译，并链接回来源；不使用买家照片、其他产品评价或个人浏览历史。购物车和评价提交仅为原型演示，不执行真实交易。\n\nBeverage PDP using the shared layout. Dated banana-flavor snapshot, not live pricing or stock. Eleven still images; no video or flavor switching. Nutrition and ingredients use one linked packaging label consistently, per 200ml carton. The gallery has differing label versions; daily values follow the linked label and missing values are not inferred. Check the actual pack. Reviews are labeled summaries. Cart and review actions are prototype-only.`,
      },
      story: { inline: false, height: "1800px" },
    },
  },
  globals: { theme: "light" },
  args: createBeverageProductDetailPageFixture(),
  render: (_args, { globals }) => (
    <ProductDetailPage {...createBeverageProductDetailPageFixture(globals.locale === "zh" ? "zh" : "en")} />
  ),
} satisfies Meta<typeof ProductDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PC: Story = {
  globals: { viewport: { value: "yamiDesktopLg", isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
};

const verifyBeveragePage: Story["play"] = async ({ canvasElement, globals }) => {
  const locale = globals.locale === "zh" ? "zh" : "en";
  const mobile = canvasElement.ownerDocument.defaultView!.matchMedia("(max-width: 1023.98px)").matches;
  const fixture = createBeverageProductDetailPageFixture(locale);
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("heading", { level: 1, name: fixture.title })).toBeVisible();
  await expect(canvas.getByText(locale === "zh" ? "78折" : "22% off", { exact: true })).toBeVisible();
  await expect(canvasElement.querySelector('[data-slot="product-detail-best-before"]')).toHaveTextContent(fixture.bestBefore);
  await expect(canvasElement.querySelector('[data-slot="product-detail-ranking"]')).toBeNull();
  await expect(canvasElement.querySelector('[data-slot="product-detail-options"] fieldset')).toBeNull();
  await expect(canvasElement.querySelector('[data-pdp-info-module="options"]')).toBeNull();
  const bestBefore = canvasElement.querySelector<HTMLElement>('[data-slot="product-detail-best-before"]')!;
  await expect(canvasElement.querySelectorAll('[data-slot="product-detail-best-before"]')).toHaveLength(1);
  await expect(bestBefore.parentElement).toBe(canvasElement.querySelector('[data-slot="product-detail-summary"]'));
  await expect(bestBefore.previousElementSibling).toBe(canvasElement.querySelector('[data-slot="product-detail-price"]'));
  await expect(getComputedStyle(bestBefore.previousElementSibling!).paddingTop).toBe("0px");
  await expect(getComputedStyle(bestBefore.previousElementSibling!).paddingBottom).toBe("0px");
  await expect(getComputedStyle(bestBefore).borderTopWidth).toBe(mobile ? "1px" : "0px");
  await expect(getComputedStyle(bestBefore).borderTopStyle).toBe(mobile ? "solid" : "none");
  await expect(bestBefore.getBoundingClientRect().top).toBeGreaterThanOrEqual(bestBefore.previousElementSibling!.getBoundingClientRect().bottom);
  await expect(canvasElement.querySelector('[data-pdp-add-to-cart]')).toBeEnabled();
  await expect(canvasElement.querySelectorAll('[data-slot="product-media-gallery-thumbnail"]')).toHaveLength(11);
  await expect(canvasElement.querySelector('[data-pdp-module="brand-products"]')).toBeNull();
  await expect(canvasElement.querySelector('[data-pdp-module="recently-viewed"]')).toBeNull();
  if (!mobile) {
    await expect(canvas.getByText(locale === "zh" ? /含牛奶。/ : /Contains milk\./)).toBeVisible();
    await expect(canvas.getByText(locale === "zh" ? "开封后冷藏" : "Refrigerate after opening", { exact: true })).toBeVisible();
  }

  await userEvent.click(canvas.getByRole("button", { name: fixture.copy.increaseQuantity, exact: true }));
  await expect(canvasElement.querySelector("output")).toHaveTextContent("2");
  await userEvent.click(canvas.getByRole("button", { name: fixture.copy.decreaseQuantity, exact: true }));
  await expect(canvasElement.querySelector("output")).toHaveTextContent("1");

  const thumbnails = canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="product-media-gallery-thumbnail"]');
  await userEvent.click(thumbnails[1]!);
  await expect(thumbnails[1]).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(thumbnails[0]!);
  await expect(thumbnails[0]).toHaveAttribute("aria-pressed", "true");

  const disclosure = canvas.getByRole("button", { name: fixture.copy.specifications, exact: true });
  await userEvent.click(disclosure);
  if (mobile) {
    await expect(disclosure).toHaveAttribute("aria-haspopup", "dialog");
    const sheet = canvas.getByRole("dialog", { name: fixture.copy.specifications });
    await expect(sheet).toBeVisible();
    await expect(within(sheet).getByText(locale === "zh" ? "开封后冷藏" : "Refrigerate after opening", { exact: true })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    await expect(disclosure).toHaveFocus();
  } else {
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(disclosure);
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  }

  {
    const trigger = canvas.getByRole("button", { name: fixture.copy.openImagePreview });
    await userEvent.click(trigger);
    const preview = canvas.getByRole("dialog", { name: fixture.copy.galleryLabel });
    await expect(preview).toBeVisible();
    await expect(within(preview).getByRole("img")).toHaveAttribute("alt", fixture.images[0].alt);
    await userEvent.click(within(preview).getByRole("button", { name: fixture.copy.closeImagePreview }));
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
  }
  const nutritionTrigger = canvas.getByRole("button", { name: fixture.nutrition!.title, exact: true });
  const root = canvasElement.ownerDocument.documentElement;
  const originalOverflow = root.style.overflow;
  let sheetScrollTop = 0;
  if (mobile) {
    await expect(canvas.queryByRole("table", { name: fixture.nutrition!.title })).toBeNull();
    await expect(nutritionTrigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(nutritionTrigger).not.toHaveAttribute("aria-expanded");
    await userEvent.click(nutritionTrigger);
    const sheet = canvas.getByRole("dialog", { name: fixture.nutrition!.title });
    await expect(sheet).toBeVisible();
    await expect(getComputedStyle(sheet).backgroundColor).toBe("rgb(255, 255, 255)");
    await expect(getComputedStyle(sheet).borderTopLeftRadius).toBe("12px");
    await expect(getComputedStyle(root).overflow).toBe("hidden");
    await expect(sheet.getBoundingClientRect().bottom).toBeCloseTo(root.clientHeight, 0);
    const sheetCanvas = within(sheet);
    const close = sheetCanvas.getByRole("button", { name: locale === "zh" ? "关闭营养成分表" : "Close nutrition facts" });
    await expect(close).toHaveFocus();
    const language = sheetCanvas.getByRole("combobox", { name: locale === "zh" ? "营养成分表语言" : "Nutrition facts language" });
    await expect(language).toHaveValue(locale);
    const otherLocale = locale === "en" ? "zh" : "en";
    await userEvent.selectOptions(language, otherLocale);
    const otherTable = sheetCanvas.getByRole("table", { name: fixture.nutritionTranslations![otherLocale]!.title });
    await expect(within(otherTable).getByText("160", { exact: true })).toBeVisible();
    await expect(otherTable.closest("[lang]")).toHaveAttribute("lang", otherLocale);
    await userEvent.selectOptions(language, locale);
    const content = sheet.querySelector<HTMLElement>('[data-slot="product-nutrition-sheet-content"]')!;
    const heading = sheetCanvas.getByRole("heading", { level: 2 });
    const headingTop = heading.getBoundingClientRect().top;
    await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    content.scrollTop = 120;
    sheetScrollTop = content.scrollTop;
    await expect(sheetScrollTop).toBeGreaterThan(0);
    await expect(heading.getBoundingClientRect().top).toBe(headingTop);
    content.scrollTop = 0;
  } else {
    await expect(nutritionTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(nutritionTrigger).not.toHaveAttribute("aria-haspopup");
    await expect(canvas.queryByRole("dialog")).toBeNull();
  }
  const nutrition = canvas.getByRole("table", { name: fixture.nutrition!.title });
  await expect(nutrition).toBeVisible();
  await expect(within(nutrition).getAllByRole("row")).toHaveLength(14);
  await expect(within(nutrition).getByRole("heading", { level: 3, name: fixture.nutrition!.title })).toBeVisible();
  await expect(getComputedStyle(within(nutrition).getByRole("heading", { level: 3 })).fontSize).toBe(mobile ? "28px" : "40px");
  await expect(within(nutrition).getByText("160", { exact: true })).toBeVisible();
  await expect(getComputedStyle(within(nutrition).getByText("160", { exact: true })).fontSize).toBe(mobile ? "20px" : "28px");
  await expect(within(nutrition).getByRole("rowheader", { name: /5.5g/ })).toBeVisible();
  await expect(within(nutrition).getByRole("rowheader", { name: /85mg/ })).toBeVisible();
  const label = nutrition.parentElement!;
  const styles = getComputedStyle(label);
  await expect(styles.borderTopWidth).toBe("2px");
  await expect(styles.maxWidth).toBe("400px");
  await expect(styles.paddingTop).toBe(mobile ? "4px" : "8px");
  await expect(styles.paddingBottom).toBe(mobile ? "4px" : "8px");
  await expect(styles.paddingLeft).toBe(mobile ? "8px" : "12px");
  await expect(styles.paddingRight).toBe(mobile ? "8px" : "12px");
  const titleStyle = getComputedStyle(within(nutrition).getByRole("heading", { level: 3 }));
  await expect(titleStyle.paddingTop).toBe("8px");
  await expect(titleStyle.paddingBottom).toBe("8px");
  await expect(titleStyle.fontWeight).toBe(locale === "zh" ? "600" : "500");
  await expect(titleStyle.borderBottomWidth).toBe("2px");
  const serving = nutrition.querySelector("caption > div:first-of-type")!;
  const calories = nutrition.querySelector("caption > div:last-of-type")!;
  await expect(getComputedStyle(serving).borderBottomWidth).toBe("6px");
  await expect(getComputedStyle(calories).borderBottomWidth).toBe("4px");
  const nutrientRows = nutrition.querySelectorAll("tbody tr");
  const vitaminRow = nutrientRows[fixture.nutrition!.rows.findIndex((row) => row.groupStart)]!;
  await expect(getComputedStyle(vitaminRow).borderTopWidth).toBe("6px");
  await expect(getComputedStyle(nutrientRows[nutrientRows.length - 1]!).borderBottomWidth).toBe("2px");
  await expect(getComputedStyle(within(nutrition).getByRole("rowheader", { name: /5.5g/ })).borderBottomWidth).toBe("1px");
  const footnoteStyle = getComputedStyle(within(label).getByText(fixture.nutrition!.dailyValueNote, { exact: true }));
  await expect(footnoteStyle.fontSize).toBe("14px");
  await expect(footnoteStyle.paddingTop).toBe(mobile ? "4px" : "8px");
  await expect(footnoteStyle.paddingBottom).toBe(mobile ? "4px" : "0px");
  await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
  const indented = within(nutrition).getByRole("rowheader", { name: /2.7g/ });
  await expect(getComputedStyle(indented).paddingInlineStart).toBe(mobile ? "16px" : "24px");
  await expect(getComputedStyle(indented).paddingBlockStart).toBe("4px");
  await expect(getComputedStyle(indented).paddingBlockEnd).toBe("4px");
  await expect(getComputedStyle(indented).fontSize).toBe("14px");
  const nutritionScope = mobile ? within(canvas.getByRole("dialog", { name: fixture.nutrition!.title })) : canvas;
  await expect(nutritionScope.getByText(fixture.nutrition!.note!, { exact: true })).toBeVisible();
  for (const source of [fixture.nutrition!, fixture.ingredients!]) {
    const inSheet = mobile;
    const isNutrition = source === fixture.nutrition;
    const sourceTrigger = isNutrition ? nutritionTrigger : canvas.getByRole("button", { name: source.title, exact: true });
    if (mobile && !isNutrition) {
      await userEvent.click(sourceTrigger);
      await expect(canvas.getByRole("dialog", { name: source.title })).toBeVisible();
      await expect(within(canvas.getByRole("dialog", { name: source.title })).getByText(locale === "zh" ? /含牛奶。/ : /Contains milk\./)).toBeVisible();
    }
    const sourceScope = inSheet ? within(canvas.getByRole("dialog", { name: source.title })) : canvas;
    const sourceLink = sourceScope.getByRole("link", { name: inSheet && isNutrition ? (locale === "zh" ? "查看标签原图" : "View original label") : source.sourceLabel, exact: true });
    await expect(sourceLink).toHaveAttribute("href", source.sourceHref);
    {
      const sourceIndex = fixture.images.findIndex((image) => image.src === source.sourceHref);
      await expect(sourceIndex).toBe(10);
      const originalOverflow = canvasElement.ownerDocument.documentElement.style.overflow;
      for (let attempt = 0; attempt < 2; attempt++) {
        await userEvent.click(sourceLink);
        const preview = canvas.getByRole("dialog", { name: fixture.copy.galleryLabel });
        await expect(preview).toBeVisible();
        await expect(within(preview).getByRole("img")).toHaveAttribute("src", source.sourceHref);
        await expect(within(preview).getByRole("group", { name: fixture.copy.thumbnailsLabel }).querySelectorAll("button")).toHaveLength(fixture.images.length);
        await expect(within(preview).getByRole("button", { name: `11 / 11: ${fixture.images[sourceIndex].alt}` })).toHaveAttribute("aria-pressed", "true");
        await expect(canvasElement.querySelector('[data-slot="product-media-gallery"]')).toHaveAttribute("data-active-index", "10");
        if (mobile) {
          await userEvent.click(within(preview).getByRole("button", { name: `10 / 11: ${fixture.images[9].alt}` }));
        } else {
          await userEvent.click(within(preview).getByRole("button", { name: fixture.copy.previousImage }));
        }
        await expect(within(preview).getByRole("img")).toHaveAttribute("alt", fixture.images[9].alt);
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(canvas.queryByRole("dialog", { name: fixture.copy.galleryLabel })).toBeNull());
        await expect(sourceLink).toHaveFocus();
        await expect(canvasElement.ownerDocument.documentElement.style.overflow).toBe(originalOverflow);
        if (inSheet) {
          await expect(canvas.getByRole("dialog", { name: source.title })).toBeVisible();
          await expect(getComputedStyle(root).overflow).toBe("hidden");
        }
      }
      if (inSheet) {
        const sheet = canvas.getByRole("dialog", { name: source.title });
        const pageScrollTop = root.scrollTop;
        await userEvent.click(sheet.querySelector("button")!);
        await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
        await expect(sourceTrigger).toHaveFocus();
        await expect(root.scrollTop).toBe(pageScrollTop);
        await expect(root.style.overflow).toBe(originalOverflow);
      }
      await userEvent.click(thumbnails[0]!);
    }
  }
  await expect(canvasElement.querySelectorAll('[data-pdp-detail-module]')).toHaveLength(5);
  for (const title of mobile ? [fixture.ingredients!.title, fixture.copy.disclaimer] : [fixture.nutrition!.title, fixture.ingredients!.title]) {
    const toggle = canvas.getByRole("button", { name: title, exact: true });
    await userEvent.click(toggle);
    if (mobile) {
      await expect(toggle).toHaveAttribute("aria-haspopup", "dialog");
      await expect(canvas.getByRole("dialog", { name: title })).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
      await expect(toggle).toHaveFocus();
      continue;
    }
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
  if (mobile) {
    await userEvent.click(nutritionTrigger);
    await expect(canvas.getByRole("dialog", { name: fixture.nutrition!.title })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    await expect(nutritionTrigger).toHaveFocus();
    await expect(root.style.overflow).toBe(originalOverflow);
    await expect(canvas.queryByRole("table", { name: fixture.nutrition!.title })).toBeNull();
  } else {
    await expect(nutrition).toBeVisible();
  }

  const document = canvasElement.ownerDocument;
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
};

export const DesktopEnglishRegression: Story = {
  ...PC, tags: ["!dev", "!autodocs"],
  globals: { ...PC.globals, locale: "en" }, play: verifyBeveragePage,
};
export const DesktopChineseRegression: Story = {
  ...PC, tags: ["!dev", "!autodocs"],
  globals: { ...PC.globals, locale: "zh" }, play: verifyBeveragePage,
};
export const MobileEnglishRegression: Story = {
  ...Mobile, tags: ["!dev", "!autodocs"],
  globals: { ...Mobile.globals, locale: "en" }, play: verifyBeveragePage,
};
export const MobileChineseRegression: Story = {
  ...Mobile, tags: ["!dev", "!autodocs"],
  globals: { ...Mobile.globals, locale: "zh" }, play: verifyBeveragePage,
};
