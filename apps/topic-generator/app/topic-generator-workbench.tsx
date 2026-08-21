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
  selectionDefaultCopy,
  TopicGenerator,
  type TopicPagePreviewRendererProps,
} from "@yami/topic-generator/web";

import styles from "./topic-generator-workbench.module.css";

type GeneratedPreviewProps = Extract<TopicPagePreviewRendererProps, { mode: "generated" }>;
type GenerationSpec = GeneratedPreviewProps["generationSpec"];
type GenerationModule = GenerationSpec["modules"][number];
type SelectionPreviewProps = Extract<TopicPagePreviewRendererProps, { mode: "selection" }>;
type ContentPreviewProps = Extract<TopicPagePreviewRendererProps, { mode: "content" }>;
type SelectionPlan = SelectionPreviewProps["plan"];
type SelectionModule = SelectionPlan["modules"][number];

function moduleById(spec: GenerationSpec, id: GenerationModule["id"]) {
  return spec.modules.find((module) => module.id === id);
}

function selectionModuleById(plan: SelectionPlan, id: SelectionModule["id"]) {
  return plan.modules.find((module) => module.id === id && module.visible);
}

function selectionText<T>(value: string | undefined, fallback: T): string | T {
  return value?.trim() || fallback;
}

function focalPointObjectPosition(focalPoint: { x: number; y: number }) {
  return `${focalPoint.x * 100}% ${focalPoint.y * 100}%`;
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

function generatedGroupedProductsFor(module: GenerationModule) {
  const groups = module.groups ?? [];
  const productsById = new Map(
    module.products.map((product) => [product.id, productListItem(product)]),
  );
  return {
    tabs: groups.map(({ id, label }) => ({ value: id, label })),
    productsByTab: Object.fromEntries(
      groups.map((group) => [
        group.id,
        group.productIds.flatMap((productId) => {
          const product = productsById.get(productId);
          return product ? [product] : [];
        }),
      ]),
    ),
    defaultValue: groups[0]?.id,
  };
}

function selectionProductListItem(
  product: SelectionPlan["products"][number],
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

export function baseFixture(
  pageTypeRef: TopicPagePreviewRendererProps["pageTypeRef"],
  locale: GenerationSpec["language"],
) {
  if (pageTypeRef === "landing-page/brand@1" || pageTypeRef === "landing-page/brand@2") {
    return createTopicLandingPageFixture(locale);
  }
  if (pageTypeRef === "landing-page/topic@1" || pageTypeRef === "landing-page/topic@2") {
    return createTopicKeywordLandingPageFixture(locale);
  }
  if (pageTypeRef === "landing-page/campaign@1" || pageTypeRef === "landing-page/campaign@2") {
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
          ...(asset ? { objectPosition: focalPointObjectPosition(asset.focalPoint) } : {}),
        },
        ...(asset?.backgroundColor ? { backgroundColor: asset.backgroundColor } : {}),
        title: sceneCopy?.title.text ?? scene.shoppingGoal,
        description: sceneCopy?.description?.text,
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

export function generatedPrototypeProps(
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
          className: [base.hero.className, styles.generatedHero].filter(Boolean).join(" "),
          title: hero.copy.title.text,
          description: hero.copy.description?.text,
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
            description: startHere.copy.description?.text,
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
          ...generatedGroupedProductsFor(popular),
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
          ...generatedGroupedProductsFor(explore),
          value: undefined,
          onValueChange: undefined,
        }
      : base.waterfall,
  };
}

export function selectionPrototypeProps(
  pageTypeRef: SelectionPreviewProps["pageTypeRef"],
  plan: SelectionPlan,
): TopicLandingPageProps {
  const base = baseFixture(pageTypeRef, plan.language);
  const defaultCopy = selectionDefaultCopy(plan.keyword, plan.language);
  const productsById = new Map(plan.products.map((product) => [product.id, product]));
  const productsFor = (module: SelectionModule | undefined) =>
    (module?.productIds ?? []).flatMap((productId) => {
      const product = productsById.get(productId);
      return product ? [selectionProductListItem(product)] : [];
    });
  const groupedProductsFor = (module: SelectionModule | undefined) => {
    const groups = module?.groups ?? [];
    return {
      tabs: groups.map(({ id, label }) => ({ value: id, label })),
      productsByTab: Object.fromEntries(
        groups.map((group) => [
          group.id,
          group.productIds.flatMap((productId) => {
            const product = productsById.get(productId);
            return product ? [selectionProductListItem(product)] : [];
          }),
        ]),
      ),
      defaultValue: groups[0]?.id,
    };
  };
  const hero = selectionModuleById(plan, "hero");
  const shortcuts = selectionModuleById(plan, "shortcuts");
  const startHere = selectionModuleById(plan, "start-here");
  const popular = selectionModuleById(plan, "popular-picks");
  const brands = selectionModuleById(plan, "brand-spotlight");
  const reviews = selectionModuleById(plan, "reviews");
  const explore = selectionModuleById(plan, "explore-more");
  const shortcutProducts = shortcuts?.productIds.flatMap((productId) => {
    const product = productsById.get(productId);
    return product ? [product] : [];
  }) ?? [];
  const startHereThemes = startHere && base.standardRail
      ? (startHere.groups ?? []).map((group) => ({
        value: group.id,
        label: selectionText(group.label, defaultCopy.startHereTitle),
        content: {
          image: base.standardRail!.content.image,
          title: selectionText(group.label, defaultCopy.startHereTitle),
          description: defaultCopy.sceneDescription,
        },
        products: group.productIds.flatMap((productId) => {
          const product = productsById.get(productId);
          return product ? [selectionProductListItem(product)] : [];
        }),
      }))
    : [];
  const primaryTabs = [
    shortcuts && { value: "selection-shortcuts", label: selectionText(shortcuts.heading, defaultCopy.shortcutsTitle), targetId: "explore" },
    startHere && { value: "selection-start-here", label: selectionText(startHere.heading, defaultCopy.startHereTitle), targetId: "shop" },
    popular && { value: "selection-popular", label: selectionText(popular.heading, defaultCopy.popularTitle), targetId: "popular-picks" },
    reviews && { value: "selection-reviews", label: selectionText(reviews.heading, defaultCopy.reviewsTitle), targetId: "reviews" },
    explore && { value: "selection-explore", label: selectionText(explore.heading, defaultCopy.exploreTitle), targetId: "product-list" },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const brandCampaigns = (brands?.groups ?? []).flatMap((group, index) => {
    const products = group.productIds.flatMap((productId) => {
      const product = productsById.get(productId);
      return product ? [product] : [];
    });
    const bannerProduct = products[0];
    return bannerProduct
      ? [{
          id: `selection-brand-${index + 1}`,
          title: selectionText(group.label, bannerProduct.brand),
          href: bannerProduct.productUrl,
          banner: { src: bannerProduct.imageUrl, alt: "" },
          products: products.map(selectionProductListItem),
        }]
      : [];
  });
  const reviewCards = reviews
    ? reviews.productIds.flatMap((productId, index) => {
        const product = productsById.get(productId);
        const fallback = base.reviewList?.reviews[index % (base.reviewList.reviews.length || 1)];
        return fallback && product
          ? [{
              ...fallback,
              id: `selection-review-${product.id}`,
              product: {
                imageSrc: product.imageUrl,
                imageAlt: product.title,
                brand: product.brand,
                name: product.title,
                href: product.productUrl,
              },
            }]
          : [];
      })
    : [];

  return {
    ...base,
    lang: plan.language,
    activityHeader: { ...base.activityHeader, title: plan.keyword },
    hero: {
      ...base.hero,
      title: selectionText(hero?.heading, selectionText(plan.content.headline, defaultCopy.heroTitle)),
      description: selectionText(
        hero?.description,
        selectionText(plan.content.description, defaultCopy.heroDescription),
      ),
      tags: plan.content.tags.length > 0
        ? plan.content.tags
        : (plan.selectedCategories ?? []).slice(0, 3).map(({ label }) => label),
      cta: undefined,
      secondaryCta: undefined,
    },
    primaryTabs: {
      ariaLabel: plan.language === "zh" ? "页面导航" : "Page navigation",
      defaultValue: primaryTabs[0]?.value ?? base.primaryTabs.defaultValue,
      items: primaryTabs.length > 0 ? primaryTabs : base.primaryTabs.items,
    },
    shortcutRail: shortcuts
      ? {
          ...base.shortcutRail,
          title: selectionText(shortcuts.heading, defaultCopy.shortcutsTitle),
          items: shortcutProducts.map((product, index) => ({
            id: `selection-shortcut-${product.id}`,
            label: selectionText(shortcuts.groups?.[index]?.label, product.title),
            iconSrc: product.imageUrl,
            imagePresentation: "full-bleed" as const,
            href: product.productUrl,
          })),
        }
      : base.shortcutRail,
    standardRail: startHere && base.standardRail
      ? {
          ...base.standardRail,
          title: selectionText(startHere.heading, defaultCopy.startHereTitle),
          content: startHereThemes[0]?.content ?? {
            ...base.standardRail.content,
            title: selectionText(startHere.heading, defaultCopy.startHereTitle),
            description: defaultCopy.sceneDescription,
          },
          products: startHereThemes[0]?.products ?? productsFor(startHere),
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
          title: selectionText(popular.heading, defaultCopy.popularTitle),
          products: productsFor(popular),
          ...groupedProductsFor(popular),
          value: undefined,
          onValueChange: undefined,
        }
      : base.productRail,
    brandRail: brands && brandCampaigns.length > 0
      ? {
          title: selectionText(brands.heading, defaultCopy.brandTitle),
          campaigns: brandCampaigns,
          mobileSurface: "plain",
          dividerPosition: "top",
          dividerVariant: "gray",
        }
      : undefined,
    reviewList: reviews && base.reviewList
      ? {
          ...base.reviewList,
          title: selectionText(reviews.heading, defaultCopy.reviewsTitle),
          reviews: reviewCards,
        }
      : undefined,
    waterfall: explore
      ? {
          ...base.waterfall,
          title: selectionText(explore.heading, defaultCopy.exploreTitle),
          description: selectionText(explore.description, defaultCopy.exploreDescription),
          products: productsFor(explore),
          ...groupedProductsFor(explore),
          value: undefined,
          onValueChange: undefined,
        }
      : base.waterfall,
  };
}

export function contentPrototypeProps(
  pageTypeRef: ContentPreviewProps["pageTypeRef"],
  plan: ContentPreviewProps["plan"],
  contentSpec: ContentPreviewProps["contentSpec"],
): TopicLandingPageProps {
  const props = selectionPrototypeProps(pageTypeRef, plan);
  const copyByModule = new Map(
    contentSpec.tasks.map((task) => [task.moduleId, task.copy]),
  );
  const hero = copyByModule.get("hero");
  const shortcuts = copyByModule.get("shortcuts");
  const startHere = copyByModule.get("start-here");
  const popular = copyByModule.get("popular-picks");
  const brands = copyByModule.get("brand-spotlight");
  const reviews = copyByModule.get("reviews");
  const explore = copyByModule.get("explore-more");
  return {
    ...props,
    hero: hero
      ? {
          ...props.hero,
          title: hero.title.text,
          description: hero.description?.text,
          tags: hero.tags?.map(({ text }) => text) ?? props.hero.tags,
        }
      : props.hero,
    shortcutRail: shortcuts && props.shortcutRail
      ? {
          ...props.shortcutRail,
          title: shortcuts.title.text,
          items: props.shortcutRail.items.map((item, index) => ({
            ...item,
            label: shortcuts.items?.[index]?.label.text ?? item.label,
          })),
        }
      : props.shortcutRail,
    standardRail: startHere && props.standardRail
      ? {
          ...props.standardRail,
          title: startHere.title.text,
          content: {
            ...props.standardRail.content,
            title: startHere.scenes?.[0]?.title.text ?? startHere.title.text,
            description: startHere.scenes?.[0]?.description?.text ??
              startHere.description?.text,
          },
          themes: props.standardRail.themes?.map((theme) => {
            const sceneCopy = startHere.scenes?.find(({ sceneId }) => sceneId === theme.value);
            return {
              ...theme,
              ...(sceneCopy ? { label: sceneCopy.label.text } : {}),
              content: {
                ...theme.content,
                ...(sceneCopy ? { title: sceneCopy.title.text } : {}),
                description: sceneCopy?.description?.text ?? startHere.description?.text,
              },
            };
          }),
        }
      : props.standardRail,
    productRail: popular
      ? { ...props.productRail, title: popular.title.text }
      : props.productRail,
    brandRail: brands && props.brandRail
      ? { ...props.brandRail, title: brands.title.text }
      : props.brandRail,
    reviewList: reviews && props.reviewList
      ? { ...props.reviewList, title: reviews.title.text }
      : props.reviewList,
    waterfall: explore
      ? {
          ...props.waterfall,
          title: explore.title.text,
          description: explore.description?.text,
        }
      : props.waterfall,
  };
}

export function RealTopicPagePreview(preview: TopicPagePreviewRendererProps) {
  const props = preview.mode === "selection"
    ? selectionPrototypeProps(preview.pageTypeRef, preview.plan)
    : preview.mode === "content"
      ? contentPrototypeProps(preview.pageTypeRef, preview.plan, preview.contentSpec)
      : generatedPrototypeProps(preview.pageTypeRef, preview.generationSpec);
  return (
    <div
      className={styles.prototypePreview}
      data-theme="light"
      data-page-preview-prototype
      data-page-preview-state={preview.mode}
      data-page-type-ref={preview.pageTypeRef}
      {...(preview.mode === "generated" || preview.mode === "visual"
        ? { "data-generation-spec": preview.generationSpec.digest }
        : {})}
    >
      <TopicLandingPage
        key={preview.mode === "generated" || preview.mode === "visual"
          ? preview.generationSpec.digest
          : preview.mode === "content"
            ? preview.contentSpec.digest
            : preview.plan.generatedAt}
        {...props}
      />
    </div>
  );
}

export function TopicGeneratorWorkbench() {
  return <TopicGenerator PagePreviewRenderer={RealTopicPagePreview} />;
}
