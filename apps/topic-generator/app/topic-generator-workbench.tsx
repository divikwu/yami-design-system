"use client";

import type {
  BrandProductCampaign,
  ProductListItem,
  ThemeProductListTheme,
} from "@yami/design-system";
import "@yami/design-system/styles/base.css";
import {
  createCampaignTopicLandingPageFixture,
  createTopicKeywordLandingPageFixture,
  createTopicLandingPageFixture,
  TopicLandingPage,
  type TopicLandingPageProps,
} from "@yami/prototypes";
import {
  TopicGenerator,
  type TopicPagePreviewRendererProps,
} from "@yami/topic-generator/web";

import styles from "./topic-generator-workbench.module.css";

type GenerationSpec = TopicPagePreviewRendererProps["generationSpec"];
type GenerationModule = GenerationSpec["modules"][number];

function moduleById(spec: GenerationSpec, id: GenerationModule["id"]) {
  return spec.modules.find((module) => module.id === id);
}

function productListItem(
  product: GenerationModule["products"][number],
): ProductListItem {
  return {
    id: product.id,
    image: product.imageUrl,
    imageAlt: product.title,
    brand: product.brand,
    brandHref: product.productUrl,
    href: product.productUrl,
    title: product.title,
    priceCurrent: product.price,
  };
}

function baseFixture(
  pageTypeRef: TopicPagePreviewRendererProps["pageTypeRef"],
  locale: GenerationSpec["language"],
) {
  if (pageTypeRef === "landing-page/brand@1") {
    return createTopicLandingPageFixture(locale);
  }
  if (pageTypeRef === "landing-page/topic@1") {
    return createTopicKeywordLandingPageFixture(locale);
  }
  if (pageTypeRef === "landing-page/campaign@1") {
    return createCampaignTopicLandingPageFixture(locale);
  }
  throw new Error(`No Topic Landing Page prototype is registered for ${pageTypeRef}.`);
}

function sceneThemes(
  module: GenerationModule,
  fallback: NonNullable<TopicLandingPageProps["standardRail"]>,
): ThemeProductListTheme[] {
  const productsById = new Map(
    module.products.map((product) => [product.id, productListItem(product)]),
  );
  return module.scenes.map((scene, index) => {
    const sceneCopy = module.copy.scenes?.find(({ sceneId }) => sceneId === scene.id);
    const asset = module.assets[index];
    return {
      value: scene.id,
      label: sceneCopy?.label.text ?? scene.shoppingGoal,
      content: {
        image: {
          src: asset?.url ?? fallback.content.image.src,
          alt: asset?.altText?.text ?? String(sceneCopy?.title.text ?? scene.shoppingGoal),
        },
        ...(asset?.backgroundColor ? { backgroundColor: asset.backgroundColor } : {}),
        title: sceneCopy?.title.text ?? scene.shoppingGoal,
        description: sceneCopy?.description.text ?? module.shoppingGoal,
      },
      products: scene.productIds.flatMap((id) => {
        const product = productsById.get(id);
        return product ? [product] : [];
      }),
    };
  });
}

function brandCampaigns(
  module: GenerationModule,
  fallbackImage: string,
): BrandProductCampaign[] {
  const grouped = new Map<string, GenerationModule["products"]>();
  module.products.forEach((product) => {
    const products = grouped.get(product.brand) ?? [];
    grouped.set(product.brand, [...products, product]);
  });
  return [...grouped.entries()].map(([brand, products], index) => ({
    id: `generated-brand-${index + 1}`,
    title: brand,
    href: products[0]?.productUrl,
    banner: {
      src: module.assets[index]?.url ?? products[0]?.imageUrl ?? fallbackImage,
      alt: module.assets[index]?.altText?.text ?? brand,
    },
    products: products.map(productListItem),
  }));
}

function generatedPrototypeProps(
  pageTypeRef: TopicPagePreviewRendererProps["pageTypeRef"],
  spec: GenerationSpec,
): TopicLandingPageProps {
  const base = baseFixture(pageTypeRef, spec.language);
  const hero = moduleById(spec, "hero");
  const shortcuts = moduleById(spec, "shortcuts");
  const startHere = moduleById(spec, "start-here");
  const popular = moduleById(spec, "popular-picks");
  const brands = moduleById(spec, "brand-spotlight");
  const reviews = moduleById(spec, "reviews");
  const explore = moduleById(spec, "explore-more");
  const heroAsset = hero?.assets[0];
  const fallbackImage = heroAsset?.url ?? base.hero.image.src;
  const startHereThemes = startHere && base.standardRail
    ? sceneThemes(startHere, base.standardRail)
    : [];
  const primaryTabs = [
    shortcuts && {
      value: "generated-shortcuts",
      label: shortcuts.copy.title.text,
      targetId: "explore",
    },
    startHere && {
      value: "generated-start-here",
      label: startHere.copy.title.text,
      targetId: "shop",
    },
    popular && {
      value: "generated-popular",
      label: popular.copy.title.text,
      targetId: "popular-picks",
    },
    reviews && {
      value: "generated-reviews",
      label: reviews.copy.title.text,
      targetId: "reviews",
    },
    explore && {
      value: "generated-explore",
      label: explore.copy.title.text,
      targetId: "product-list",
    },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...base,
    lang: spec.language,
    activityHeader: {
      ...base.activityHeader,
      title: spec.keyword,
    },
    hero: hero
      ? {
          ...base.hero,
          title: hero.copy.title.text,
          description: hero.copy.description?.text ?? hero.shoppingGoal,
          tags: hero.copy.tags?.map(({ text }) => text),
          image: {
            src: heroAsset?.url ?? base.hero.image.src,
            alt: heroAsset?.altText?.text ?? hero.copy.title.text,
            width: heroAsset?.width ?? base.hero.image.width,
            height: heroAsset?.height ?? base.hero.image.height,
          },
          backgroundImageSrc: heroAsset?.url ?? base.hero.backgroundImageSrc,
          ...(heroAsset?.backgroundColor
            ? { backgroundColor: heroAsset.backgroundColor }
            : {}),
        }
      : base.hero,
    primaryTabs: {
      ariaLabel: spec.language === "zh" ? "生成页面导航" : "Generated page navigation",
      defaultValue: primaryTabs[0]?.value ?? base.primaryTabs.defaultValue,
      items: primaryTabs.length > 0 ? primaryTabs : base.primaryTabs.items,
    },
    shortcutRail: shortcuts
      ? {
          ...base.shortcutRail,
          title: shortcuts.copy.title.text,
          items: shortcuts.products.map((product, index) => ({
            id: `generated-shortcut-${product.id}`,
            label: shortcuts.copy.items?.[index]?.label.text ?? product.title,
            iconSrc: shortcuts.assets[index]?.url ?? product.imageUrl,
            imagePresentation: "full-bleed" as const,
            href: product.productUrl,
          })),
        }
      : base.shortcutRail,
    standardRail: startHere && base.standardRail
      ? {
          ...base.standardRail,
          title: startHere.copy.title.text,
          content: startHereThemes[0]?.content ?? {
            ...base.standardRail.content,
            image: {
              src: startHere.assets[0]?.url ?? fallbackImage,
              alt: startHere.assets[0]?.altText?.text ?? startHere.copy.title.text,
            },
            title: startHere.copy.title.text,
            description: startHere.copy.description?.text ?? startHere.shoppingGoal,
          },
          products: (startHereThemes[0]?.products.length
            ? startHereThemes[0].products
            : startHere.products.map(productListItem)),
          themes: startHereThemes.length > 0 ? startHereThemes : undefined,
          tabs: startHereThemes.length > 0
            ? startHereThemes.map(({ value, label }) => ({ value, label }))
            : undefined,
          defaultValue: startHereThemes[0]?.value,
          value: undefined,
          onValueChange: undefined,
        }
      : undefined,
    productRail: popular
      ? {
          ...base.productRail,
          title: popular.copy.title.text,
          products: popular.products.map(productListItem),
          tabs: undefined,
          defaultValue: undefined,
          value: undefined,
          onValueChange: undefined,
        }
      : base.productRail,
    brandRail: brands
      ? {
          title: brands.copy.title.text,
          campaigns: brandCampaigns(brands, fallbackImage),
          mobileSurface: "plain",
          dividerPosition: "top",
          dividerVariant: "gray",
        }
      : undefined,
    reviewList: reviews ? base.reviewList : undefined,
    waterfall: explore
      ? {
          ...base.waterfall,
          title: explore.copy.title.text,
          description: explore.copy.description?.text,
          products: explore.products.map(productListItem),
          productsByTab: undefined,
          tabs: undefined,
          defaultValue: undefined,
          value: undefined,
          onValueChange: undefined,
        }
      : base.waterfall,
  };
}

function RealTopicPagePreview({
  pageTypeRef,
  generationSpec,
}: TopicPagePreviewRendererProps) {
  const props = generatedPrototypeProps(pageTypeRef, generationSpec);
  return (
    <div
      className={styles.prototypePreview}
      data-theme="light"
      data-page-preview-prototype
      data-page-type-ref={pageTypeRef}
    >
      <TopicLandingPage key={generationSpec.digest} {...props} />
    </div>
  );
}

export function TopicGeneratorWorkbench() {
  return <TopicGenerator PagePreviewRenderer={RealTopicPagePreview} />;
}
