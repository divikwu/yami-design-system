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
  type TopicLandingPageModuleId,
  type TopicLandingPageProps,
} from "@yami/prototypes/topic-landing-page";
import {
  distinctEditorialProducts,
  exploreGroupsWithAll,
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
type ContentCopy = ContentPreviewProps["contentSpec"]["tasks"][number]["copy"];
type SelectionPlan = SelectionPreviewProps["plan"];
type SelectionModule = SelectionPlan["modules"][number];

const NEUTRAL_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f3f3f3'/%3E%3C/svg%3E";

function omittedModules(
  ...entries: Array<TopicLandingPageModuleId | false>
): TopicLandingPageModuleId[] {
  return entries.filter((id): id is TopicLandingPageModuleId => Boolean(id));
}

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

function withRetainedVisuals(
  props: TopicLandingPageProps,
  spec: GenerationSpec,
): TopicLandingPageProps {
  const heroAsset = moduleById(spec, "hero")?.assets[0];
  const shortcutAssets = moduleById(spec, "shortcuts")?.assets ?? [];
  const startHere = moduleById(spec, "start-here");
  const startHereAssetsByScene = new Map(
    startHere?.scenes.map((scene, index) => [scene.id, startHere.assets[index]]) ?? [],
  );
  const retainedThemes = props.standardRail?.themes?.map((theme, index) => {
    const asset = startHereAssetsByScene.get(theme.value) ?? startHere?.assets[index];
    if (!asset) return theme;
    return {
      ...theme,
      content: {
        ...theme.content,
        image: {
          ...theme.content.image,
          src: asset.url,
          alt: asset.altText?.text ?? theme.content.image.alt,
          objectPosition: focalPointObjectPosition(asset.focalPoint),
        },
        ...(asset.backgroundColor ? { backgroundColor: asset.backgroundColor } : {}),
      },
    };
  });
  const retainedDefaultTheme = retainedThemes?.find(
    ({ value }) => value === props.standardRail?.defaultValue,
  ) ?? retainedThemes?.[0];
  const startHereAsset = startHere?.assets[0];
  const brandAssets = moduleById(spec, "brand-spotlight")?.assets ?? [];

  return {
    ...props,
    hero: heroAsset
      ? {
          ...props.hero,
          className: [props.hero.className, styles.generatedHero].filter(Boolean).join(" "),
          image: {
            ...props.hero.image,
            src: heroAsset.url,
            alt: heroAsset.altText?.text ?? props.hero.image.alt,
            width: heroAsset.width,
            height: heroAsset.height,
            objectPosition: focalPointObjectPosition(heroAsset.focalPoint),
          },
          backgroundImageSrc: heroAsset.url,
          ...(heroAsset.backgroundColor ? { backgroundColor: heroAsset.backgroundColor } : {}),
        }
      : props.hero,
    shortcutRail: {
      ...props.shortcutRail,
      items: props.shortcutRail.items.map((item, index) => shortcutAssets[index]
        ? {
            ...item,
            iconSrc: shortcutAssets[index]!.url,
            imagePresentation: "full-bleed" as const,
          }
        : item),
    },
    standardRail: props.standardRail
      ? {
          ...props.standardRail,
          content: retainedDefaultTheme?.content ?? (startHereAsset
            ? {
                ...props.standardRail.content,
                image: {
                  ...props.standardRail.content.image,
                  src: startHereAsset.url,
                  alt: startHereAsset.altText?.text ?? props.standardRail.content.image.alt,
                  objectPosition: focalPointObjectPosition(startHereAsset.focalPoint),
                },
                ...(startHereAsset.backgroundColor
                  ? { backgroundColor: startHereAsset.backgroundColor }
                  : {}),
              }
            : props.standardRail.content),
          ...(retainedThemes ? { themes: retainedThemes } : {}),
        }
      : props.standardRail,
    brandRail: props.brandRail
      ? {
          ...props.brandRail,
          campaigns: props.brandRail.campaigns.map((campaign, index) => ({
            ...campaign,
            banner: brandAssets[index]
              ? {
                  ...campaign.banner,
                  src: brandAssets[index]!.url,
                  alt: brandAssets[index]!.altText?.text ?? campaign.banner.alt,
                }
              : campaign.banner,
          })),
        }
      : props.brandRail,
  };
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

function generatedGroupedProductsFor(
  module: GenerationModule,
  defaultMode: "first" | "largest" = "first",
  maxProducts = Number.POSITIVE_INFINITY,
  allLanguage?: GenerationSpec["language"],
) {
  const rawGroups = module.groups ?? [];
  const groups = allLanguage
    ? exploreGroupsWithAll(
        rawGroups,
        module.products.map(({ id }) => id),
        allLanguage,
      )
    : rawGroups;
  const productsById = new Map(module.products.map((product) => [product.id, product]));
  return {
    tabs: groups.map(({ id, label }) => ({ value: id, label })),
    productsByTab: Object.fromEntries(
      groups.map((group) => [
        group.id,
        distinctEditorialProducts(group.productIds.flatMap((productId) => {
          const product = productsById.get(productId);
          return product ? [product] : [];
        })).slice(0, maxProducts).map(productListItem),
      ]),
    ),
    defaultValue: (defaultMode === "largest"
      ? groups.reduce<typeof groups[number] | undefined>((largest, group) =>
          !largest || group.productIds.length > largest.productIds.length ? group : largest,
        undefined)
      : groups[0])?.id,
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
  fallbackImage: string,
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
          src: asset?.url ?? fallbackImage,
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
  const explore = moduleById(spec, "explore-more");
  const heroAsset = hero?.assets[0];
  const fallbackImage = heroAsset?.url ?? hero?.products[0]?.imageUrl ?? NEUTRAL_IMAGE;
  const groupedShortcutProducts = shortcuts?.groups?.flatMap((group) => {
    const product = shortcuts.products.find(({ id }) => id === group.productIds[0]);
    return product ? [product] : [];
  }) ?? [];
  const shortcutProducts = groupedShortcutProducts.length > 0
    ? groupedShortcutProducts
    : shortcuts?.products ?? [];
  const startHereThemes = startHere && base.standardRail
    ? sceneThemes(startHere, NEUTRAL_IMAGE)
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
    brands && {
      value: "generated-brands",
      label: brands.copy.title.text,
      targetId: "brand-spotlight",
    },
    explore && {
      value: "generated-explore",
      label: explore.copy.title.text,
      targetId: "product-list",
    },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...base,
    hiddenModules: omittedModules(
      !hero && "hero",
      !shortcuts && "shortcuts",
      !startHere && "start-here",
      !popular && "popular-picks",
      !brands && "brand-spotlight",
      "reviews",
      !explore && "explore-more",
    ),
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
            src: heroAsset?.url ?? hero.products[0]?.imageUrl ?? NEUTRAL_IMAGE,
            alt: heroAsset?.altText?.text ?? hero.copy.title.text,
            width: heroAsset?.width ?? base.hero.image.width,
            height: heroAsset?.height ?? base.hero.image.height,
            ...(heroAsset
              ? { objectPosition: focalPointObjectPosition(heroAsset.focalPoint) }
              : {}),
          },
          backgroundImageSrc: heroAsset?.url ?? hero.products[0]?.imageUrl ?? NEUTRAL_IMAGE,
          ...(heroAsset?.backgroundColor
            ? { backgroundColor: heroAsset.backgroundColor }
            : {}),
        }
      : base.hero,
    primaryTabs: {
      ariaLabel: spec.language === "zh" ? "生成页面导航" : "Generated page navigation",
      defaultValue: primaryTabs[0]?.value ?? "",
      items: primaryTabs,
    },
    shortcutRail: shortcuts
      ? {
          ...base.shortcutRail,
          title: shortcuts.copy.title.text,
          items: shortcutProducts.map((product, index) => ({
            id: `generated-shortcut-${product.id}`,
            label: shortcuts.copy.items?.[index]?.label.text ?? product.title,
            iconSrc: shortcuts.assets[index]?.url ?? product.imageUrl,
            imagePresentation: shortcuts.assets[index] ? "full-bleed" as const : "icon" as const,
            href: shortcuts.groups?.[index]?.id
              ? `#explore-more-${shortcuts.groups[index]!.id}`
              : product.productUrl,
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
          onAddToCart: base.brandRail?.onAddToCart,
        }
      : undefined,
    reviewList: undefined,
    waterfall: explore
      ? {
          ...base.waterfall,
          title: explore.copy.title.text,
          description: explore.copy.description?.text,
          products: explore.products.slice(0, 12).map(productListItem),
          ...generatedGroupedProductsFor(explore, "first", 12, spec.language),
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
  const groupedProductsFor = (
    module: SelectionModule | undefined,
    defaultMode: "first" | "largest" = "first",
    maxProducts = Number.POSITIVE_INFINITY,
    includeAll = false,
  ) => {
    const rawGroups = module?.groups ?? [];
    const groups = includeAll
      ? exploreGroupsWithAll(rawGroups, module?.productIds ?? [], plan.language)
      : rawGroups;
    return {
      tabs: groups.map(({ id, label }) => ({ value: id, label })),
      productsByTab: Object.fromEntries(
        groups.map((group) => [
          group.id,
          distinctEditorialProducts(group.productIds.flatMap((productId) => {
            const product = productsById.get(productId);
            return product ? [product] : [];
          })).slice(0, maxProducts).map(selectionProductListItem),
        ]),
      ),
      defaultValue: (defaultMode === "largest"
        ? groups.reduce<typeof groups[number] | undefined>((largest, group) =>
            !largest || group.productIds.length > largest.productIds.length ? group : largest,
          undefined)
        : groups[0])?.id,
    };
  };
  const hero = selectionModuleById(plan, "hero");
  const shortcuts = selectionModuleById(plan, "shortcuts");
  const startHere = selectionModuleById(plan, "start-here");
  const popular = selectionModuleById(plan, "popular-picks");
  const brands = selectionModuleById(plan, "brand-spotlight");
  const explore = selectionModuleById(plan, "explore-more");
  const groupedShortcutProducts = (shortcuts?.groups ?? []).flatMap((group) => {
    const product = productsById.get(group.productIds[0] ?? "");
    return product ? [product] : [];
  });
  const shortcutProducts = groupedShortcutProducts.length > 0
    ? groupedShortcutProducts
    : shortcuts?.productIds.flatMap((productId) => {
        const product = productsById.get(productId);
        return product ? [product] : [];
      }) ?? [];
  const heroProducts = productsFor(hero);
  const imageFor = (productIds: readonly string[] | undefined) =>
    (productIds ?? []).map((id) => productsById.get(id)?.imageUrl).find(Boolean) ??
      NEUTRAL_IMAGE;
  const heroImage = imageFor(hero?.productIds);
  const startHereThemes = startHere && base.standardRail
      ? (startHere.groups ?? []).map((group) => {
        const products = group.productIds.flatMap((productId) => {
          const product = productsById.get(productId);
          return product ? [selectionProductListItem(product)] : [];
        });
        return {
          value: group.id,
          label: selectionText(group.label, defaultCopy.startHereTitle),
          content: {
            image: {
              src: imageFor(group.productIds),
              alt: products[0]?.imageAlt ?? "",
            },
            title: selectionText(group.label, defaultCopy.startHereTitle),
            description: defaultCopy.sceneDescription,
          },
          products,
        };
      })
    : [];
  const primaryTabs = [
    shortcuts && { value: "selection-shortcuts", label: selectionText(shortcuts.heading, defaultCopy.shortcutsTitle), targetId: "explore" },
    startHere && { value: "selection-start-here", label: selectionText(startHere.heading, defaultCopy.startHereTitle), targetId: "shop" },
    popular && { value: "selection-popular", label: selectionText(popular.heading, defaultCopy.popularTitle), targetId: "popular-picks" },
    brands && { value: "selection-brands", label: selectionText(brands.heading, defaultCopy.brandTitle), targetId: "brand-spotlight" },
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
  return {
    ...base,
    hiddenModules: omittedModules(
      !hero && "hero",
      !shortcuts && "shortcuts",
      !startHere && "start-here",
      !popular && "popular-picks",
      !brands && "brand-spotlight",
      "reviews",
      !explore && "explore-more",
    ),
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
      image: {
        ...base.hero.image,
        src: heroImage,
        alt: heroProducts[0]?.imageAlt ?? "",
      },
      backgroundImageSrc: heroImage,
    },
    primaryTabs: {
      ariaLabel: plan.language === "zh" ? "页面导航" : "Page navigation",
      defaultValue: primaryTabs[0]?.value ?? "",
      items: primaryTabs,
    },
    shortcutRail: shortcuts
      ? {
          ...base.shortcutRail,
          title: selectionText(shortcuts.heading, defaultCopy.shortcutsTitle),
          items: shortcutProducts.map((product, index) => ({
            id: `selection-shortcut-${product.id}`,
            label: selectionText(shortcuts.groups?.[index]?.label, product.title),
            iconSrc: product.imageUrl,
            imagePresentation: "icon" as const,
            href: shortcuts.groups?.[index]?.id
              ? `#explore-more-${shortcuts.groups[index]!.id}`
              : product.productUrl,
          })),
        }
      : base.shortcutRail,
    standardRail: startHere && base.standardRail
      ? {
          ...base.standardRail,
          title: selectionText(startHere.heading, defaultCopy.startHereTitle),
          content: startHereThemes[0]?.content ?? {
            ...base.standardRail.content,
            image: {
              src: imageFor(startHere.productIds),
              alt: productsFor(startHere)[0]?.imageAlt ?? "",
            },
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
          onAddToCart: base.brandRail?.onAddToCart,
        }
      : undefined,
    reviewList: undefined,
    waterfall: explore
      ? {
          ...base.waterfall,
          title: selectionText(explore.heading, defaultCopy.exploreTitle),
          description: selectionText(explore.description, defaultCopy.exploreDescription),
          products: productsFor(explore).slice(0, 12),
          ...groupedProductsFor(explore, "first", 12, true),
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
  retainedVisualSpec?: ContentPreviewProps["retainedVisualSpec"],
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
  const primaryTabLabels = new Map([
    ["explore", shortcuts?.title.text],
    ["shop", startHere?.title.text],
    ["popular-picks", popular?.title.text],
    ["brand-spotlight", brands?.title.text],
    ["product-list", explore?.title.text],
  ]);
  const localizedTabs = (
    tabs: TopicLandingPageProps["productRail"]["tabs"],
    copy: ContentCopy | undefined,
  ) => {
    const labelsByGroupId = new Map(
      copy?.groups?.map(({ groupId, label }) => [groupId, label.text]) ?? [],
    );
    return tabs?.map((tab) => ({
      ...tab,
      label: labelsByGroupId.get(tab.value) ?? tab.label,
    }));
  };
  const contentProps: TopicLandingPageProps = {
    ...props,
    hero: hero
      ? {
          ...props.hero,
          title: hero.title.text,
          description: hero.description?.text,
          tags: hero.tags?.map(({ text }) => text) ?? props.hero.tags,
        }
      : props.hero,
    primaryTabs: {
      ...props.primaryTabs,
      items: props.primaryTabs.items.map((item) => ({
        ...item,
        label: primaryTabLabels.get(item.targetId) ?? item.label,
      })),
    },
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
      ? {
          ...props.productRail,
          title: popular.title.text,
          tabs: localizedTabs(props.productRail.tabs, popular),
        }
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
          tabs: localizedTabs(props.waterfall.tabs, explore),
        }
      : props.waterfall,
  };
  return retainedVisualSpec
    ? withRetainedVisuals(contentProps, retainedVisualSpec)
    : contentProps;
}

export function RealTopicPagePreview(preview: TopicPagePreviewRendererProps) {
  const props = preview.mode === "selection"
    ? selectionPrototypeProps(preview.pageTypeRef, preview.plan)
    : preview.mode === "content"
      ? contentPrototypeProps(
          preview.pageTypeRef,
          preview.plan,
          preview.contentSpec,
          preview.retainedVisualSpec,
        )
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
      {...(preview.mode === "content" && preview.retainedVisualSpec
        ? { "data-retained-generation-spec": preview.retainedVisualSpec.digest }
        : {})}
    >
      <TopicLandingPage
        key={preview.mode === "generated" || preview.mode === "visual"
          ? preview.generationSpec.digest
          : preview.mode === "content"
            ? `${preview.contentSpec.digest}:${preview.retainedVisualSpec?.digest ?? ""}`
            : preview.plan.generatedAt}
        {...props}
      />
    </div>
  );
}

export function TopicGeneratorWorkbench() {
  return (
    <TopicGenerator
      PagePreviewRenderer={RealTopicPagePreview}
      managedRunApiBase="/api/topic-generator"
    />
  );
}
