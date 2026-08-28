import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { ProductDetailPage } from "./ProductDetailPage";
import { createFoodProductDetailPageFixture, foodProductSource } from "./food-fixtures";

const meta = {
  title: "YAMI/Pages/Product Detail/Food",
  tags: ["!autodocs"],
  component: ProductDetailPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component: `食品类 PDP · TSUJIRI 辻利无糖宇治抹茶粉 40g。复用 ProductDetailPage，支持中英文及 PC / Mobile。\n\n[官网商品来源](${foodProductSource.url}) · 采集日期：${foodProductSource.capturedAt}。价格、销量、评分与赏味期限均为该日期的展示快照，并非实时库存或履约承诺。官网只有单一 40g 规格，因此不显示多规格选择器。9 张商品图与 8 款食品推荐使用官网 CDN；需要网络连接。\n\n评价区域显示官网评分分布与 4 条真实评价的摘要／翻译，明确标注并链接回来源，不使用护肤评价、买家照片或个人浏览历史。官网文字未提供的配料、营养及过敏原数据不补造。购物车与评价提交沿用现有原型的演示边界，不执行真实交易。\n\nFood PDP using the shared layout. Prices, ratings and best-before date are a dated snapshot, not live data. Single 40g size; no variant selector. Review summaries are labeled paraphrases. Unverified ingredients, nutrition and allergen data are omitted. Cart and review actions are prototype-only.`,
      },
      story: { inline: false, height: "1800px" },
    },
  },
  globals: { theme: "light" },
  args: createFoodProductDetailPageFixture(),
  render: (_args, { globals }) => (
    <ProductDetailPage {...createFoodProductDetailPageFixture(globals.locale === "zh" ? "zh" : "en")} />
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

const verifyFoodPage: Story["play"] = async ({ canvasElement, globals }) => {
  const locale = globals.locale === "zh" ? "zh" : "en";
  const fixture = createFoodProductDetailPageFixture(locale);
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("heading", { level: 1, name: fixture.title })).toBeVisible();
  await expect(canvas.getByText(locale === "zh" ? "89折" : "11% off", { exact: true })).toBeVisible();
  await expect(canvasElement.querySelector('[data-slot="product-detail-best-before"]')).toHaveTextContent(fixture.bestBefore);
  await expect(canvasElement.querySelector('[data-slot="product-detail-options"] fieldset')).toBeNull();
  await expect(canvasElement.querySelector('[data-pdp-info-module="options"]')).toBeNull();
  const bestBefore = canvasElement.querySelector<HTMLElement>('[data-slot="product-detail-best-before"]')!;
  await expect(canvasElement.querySelectorAll('[data-slot="product-detail-best-before"]')).toHaveLength(1);
  await expect(bestBefore.parentElement).toBe(canvasElement.querySelector('[data-slot="product-detail-summary"]'));
  await expect(bestBefore.previousElementSibling).toBe(canvasElement.querySelector('[data-slot="product-detail-price"]'));
  await expect(getComputedStyle(bestBefore).borderTopWidth).toBe("1px");
  await expect(getComputedStyle(bestBefore).borderTopColor).toBe("rgba(0, 0, 0, 0.08)");
  await expect(bestBefore.getBoundingClientRect().top).toBeGreaterThanOrEqual(bestBefore.previousElementSibling!.getBoundingClientRect().bottom);
  await expect(canvasElement.querySelector('[data-pdp-add-to-cart]')).toBeEnabled();
  await expect(canvasElement.querySelectorAll('[data-slot="product-media-gallery-thumbnail"]')).toHaveLength(9);
  await expect(canvasElement.querySelector('[data-pdp-module="brand-products"]')).toBeNull();
  await expect(canvasElement.querySelector('[data-pdp-module="recently-viewed"]')).toBeNull();

  const increase = canvas.getByRole("button", { name: fixture.copy.increaseQuantity, exact: true });
  const decrease = canvas.getByRole("button", { name: fixture.copy.decreaseQuantity, exact: true });
  await userEvent.click(increase);
  await expect(canvasElement.querySelector("output")).toHaveTextContent("2");
  await userEvent.click(decrease);
  await expect(canvasElement.querySelector("output")).toHaveTextContent("1");

  const thumbnails = canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="product-media-gallery-thumbnail"]');
  await userEvent.click(thumbnails[1]!);
  await expect(thumbnails[1]).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(thumbnails[0]!);
  await expect(thumbnails[0]).toHaveAttribute("aria-pressed", "true");

  const disclosure = canvas.getByRole("button", { name: fixture.copy.specifications, exact: true });
  await userEvent.click(disclosure);
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(disclosure);
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");

  const document = canvasElement.ownerDocument;
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
};

export const DesktopEnglishRegression: Story = {
  ...PC,
  tags: ["!dev", "!autodocs"],
  globals: { ...PC.globals, locale: "en" },
  play: verifyFoodPage,
};

export const DesktopChineseRegression: Story = {
  ...PC,
  tags: ["!dev", "!autodocs"],
  globals: { ...PC.globals, locale: "zh" },
  play: verifyFoodPage,
};

export const MobileEnglishRegression: Story = {
  ...Mobile,
  tags: ["!dev", "!autodocs"],
  globals: { ...Mobile.globals, locale: "en" },
  play: verifyFoodPage,
};

export const MobileChineseRegression: Story = {
  ...Mobile,
  tags: ["!dev", "!autodocs"],
  globals: { ...Mobile.globals, locale: "zh" },
  play: verifyFoodPage,
};
