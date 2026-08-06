import type { ProductListItem } from "../ProductList";

import type {
  BrandProductCampaign,
  BrandProductRailProps,
} from "./BrandProductRail.types";

export type BrandProductRailLocale = "zh" | "en";

const assets = {
  "maogeping-banner.webp": new URL(
    "./assets/maogeping-banner.webp",
    import.meta.url,
  ).href,
  "bb-lab-banner.webp": new URL(
    "./assets/bb-lab-banner.webp",
    import.meta.url,
  ).href,
  "biodance-banner.webp": new URL(
    "./assets/biodance-banner.webp",
    import.meta.url,
  ).href,
  "glow-banner.webp": new URL("./assets/glow-banner.webp", import.meta.url)
    .href,
  "teabless-banner.webp": new URL(
    "./assets/teabless-banner.webp",
    import.meta.url,
  ).href,
  "voolga-banner.webp": new URL(
    "./assets/voolga-banner.webp",
    import.meta.url,
  ).href,
  "official-partnership.svg": new URL(
    "./assets/official-partnership.svg",
    import.meta.url,
  ).href,
  "maogeping-highlighter.webp": new URL(
    "./assets/maogeping-highlighter.webp",
    import.meta.url,
  ).href,
  "maogeping-cushion.webp": new URL(
    "./assets/maogeping-cushion.webp",
    import.meta.url,
  ).href,
  "maogeping-concealer.webp": new URL(
    "./assets/maogeping-concealer.webp",
    import.meta.url,
  ).href,
  "bb-lab-glutathione.webp": new URL(
    "./assets/bb-lab-glutathione.webp",
    import.meta.url,
  ).href,
  "bb-lab-biotin.webp": new URL(
    "./assets/bb-lab-biotin.webp",
    import.meta.url,
  ).href,
  "bb-lab-jelly.webp": new URL(
    "./assets/bb-lab-jelly.webp",
    import.meta.url,
  ).href,
  "biodance-mask.webp": new URL(
    "./assets/biodance-mask.webp",
    import.meta.url,
  ).href,
  "biodance-cream.webp": new URL(
    "./assets/biodance-cream.webp",
    import.meta.url,
  ).href,
  "biodance-pads.webp": new URL(
    "./assets/biodance-pads.webp",
    import.meta.url,
  ).href,
  "glow-concealer.webp": new URL(
    "./assets/glow-concealer.webp",
    import.meta.url,
  ).href,
  "glow-patches.webp": new URL(
    "./assets/glow-patches.webp",
    import.meta.url,
  ).href,
  "glow-bb.webp": new URL("./assets/glow-bb.webp", import.meta.url).href,
  "teabless-lotion.webp": new URL(
    "./assets/teabless-lotion.webp",
    import.meta.url,
  ).href,
  "teabless-wash.webp": new URL(
    "./assets/teabless-wash.webp",
    import.meta.url,
  ).href,
  "teabless-rose.webp": new URL(
    "./assets/teabless-rose.webp",
    import.meta.url,
  ).href,
  "voolga-mask.webp": new URL(
    "./assets/voolga-mask.webp",
    import.meta.url,
  ).href,
  "voolga-ampoule.webp": new URL(
    "./assets/voolga-ampoule.webp",
    import.meta.url,
  ).href,
  "voolga-gel.webp": new URL(
    "./assets/voolga-gel.webp",
    import.meta.url,
  ).href,
} as const;

const asset = (name: keyof typeof assets) => assets[name];

const officialPartnership = asset("official-partnership.svg");

const campaignSources = [
  {
    id: "maogeping",
    title: "毛戈平",
    titleEn: "MAOGEPING",
    href: "https://www.yami.com/us/zh/b/maogeping/5445",
    banner: "maogeping-banner.webp",
    products: [
      {
        id: "maogeping-highlighter",
        image: "maogeping-highlighter.webp",
        title:
          "MAOGEPING毛戈平MGP 光影塑颜高光膏 5g 哑光提亮 遮泪沟法令纹面部凹陷【新版】",
        titleEn: "MGP Highlighting Cream Powder, 5g",
        href: "https://www.yami.com/us/zh/p/highlighting-cream-powder-0-18-oz/1023350701",
        priceCurrent: "$31.99",
        priceOriginal: "$58.99",
      },
      {
        id: "maogeping-cushion",
        image: "maogeping-cushion.webp",
        title: "MAOGEPING毛戈平MGP 黑羽翼大油皮气垫 星耀锁妆气垫粉底液 14g",
        titleEn: "MGP Starlight Lock Makeup Cushion Foundation, 14g",
        href: "https://www.yami.com/us/zh/p/maoge-ping-starlight-lock-makeup-cushion-foundation-obsidian-feather-wings-701-14g/1023637991",
        priceCurrent: "$60.29",
        priceOriginal: "$69.89",
      },
      {
        id: "maogeping-concealer",
        image: "maogeping-concealer.webp",
        title: "MAOGEPING毛戈平MGP 无瑕双色遮瑕 提亮眼部遮盖泪沟黑眼圈斑点痘印",
        titleEn: "MGP Flawless Two-Tone Concealer",
        href: "https://www.yami.com/us/zh/p/mao-geping-flawless-two-tone-concealer-1-8g-2/1023197321",
        priceCurrent: "$61.99",
        priceOriginal: "$84.99",
      },
    ],
  },
  {
    id: "bb-lab",
    title: "BB LAB",
    titleEn: "BB LAB",
    href: "https://www.yami.com/us/zh/b/bblab/16255",
    banner: "bb-lab-banner.webp",
    products: [
      {
        id: "bb-lab-glutathione",
        image: "bb-lab-glutathione.webp",
        title: "韩国BB LAB Glutathione Max谷胱甘肽鱼胶原蛋白粉 15条入",
        titleEn: "BB LAB Glutathione Max Collagen Powder, 15ct",
        href: "https://www.yami.com/us/zh/p/bb-lab-glutathione-max/1026147091",
        priceCurrent: "$14.40",
        priceOriginal: "$18.00",
      },
      {
        id: "bb-lab-biotin",
        image: "bb-lab-biotin.webp",
        title: "韩国BB LAB 强化生物素胶原蛋白V 2g*30包",
        titleEn: "BB LAB Intensive Biotin Collagen V, 30ct",
        href: "https://www.yami.com/us/zh/p/intensive-biotin-collagen-v-0-07-oz-x-30-packets/1026050911",
        priceCurrent: "$19.39",
        priceOriginal: "$31.00",
      },
      {
        id: "bb-lab-jelly",
        image: "bb-lab-jelly.webp",
        title: "韩国BB LAB 石榴S胶原蛋白果冻 美白抗氧化 组合装",
        titleEn: "BB LAB Pomegranate Collagen Jelly Set",
        href: "https://www.yami.com/us/zh/p/pomegranate-s-collagen-jelly-stick-brightening-antioxidant-0-7oz-14-stick-1-collagen-tangle-up-jellystick-grape-flavor-firming-anti-wrinkle-0-7oz-14stick-1-2-packs/1026213461",
        priceCurrent: "$29.09",
        priceOriginal: "$57.80",
      },
    ],
  },
  {
    id: "biodance",
    title: "BIODANCE",
    titleEn: "BIODANCE",
    href: "https://www.yami.com/us/zh/b/biodance/15445",
    banner: "biodance-banner.webp",
    products: [
      {
        id: "biodance-mask",
        image: "biodance-mask.webp",
        title: "韩国BIODANCE 粉色胶原蛋白水光焕亮凝胶面膜 34g*4片",
        titleEn: "BIODANCE Bio-Collagen Real Deep Mask, 4ct",
        href: "https://www.yami.com/us/zh/p/bio-collagen-real-deep-mask-4ea/1127098611",
        priceCurrent: "$16.00",
        priceOriginal: "$19.00",
      },
      {
        id: "biodance-cream",
        image: "biodance-cream.webp",
        title: "韩国BIODANCE 毛孔紧致胶原肽面霜 50ml",
        titleEn: "BIODANCE Pore Perfecting Collagen Peptide Cream, 50ml",
        href: "https://www.yami.com/us/zh/p/biodance-pore-perfecting-collagen-peptide-cream-50ml/1022633941",
        priceCurrent: "$27.00",
        priceOriginal: "$29.00",
      },
      {
        id: "biodance-pads",
        image: "biodance-pads.webp",
        title: "韩国BIODANCE 黄色维他命烟酰胺水凝胶湿敷棉片 60片",
        titleEn: "BIODANCE Vita Niacinamide Gel Toner Pads, 60ct",
        href: "https://www.yami.com/us/zh/p/biodance-vita-niacinamide-gel-toner-pad/1127125131",
        priceCurrent: "$24.29",
        priceOriginal: "$26.99",
      },
    ],
  },
  {
    id: "glow",
    title: "glow",
    titleEn: "glow",
    href: "https://www.yami.com/us/zh/b/glow/22359",
    banner: "glow-banner.webp",
    products: [
      {
        id: "glow-concealer",
        image: "glow-concealer.webp",
        title: "韩国GLOW 水润遮瑕膏 #浅米 #三文鱼色",
        titleEn: "GLOW Hydrating Concealer, Light Beige and Salmon",
        href: "https://www.yami.com/us/zh/p/not-dry-concealer-light-rosysalmon/1023775551",
        priceCurrent: "$29.00",
      },
      {
        id: "glow-patches",
        image: "glow-patches.webp",
        title: "韩国GLOW 钻石水滴净痘贴 水胶体痘痘贴 100枚",
        titleEn: "GLOW Diamond Drop Blemish Patch, 100ct",
        href: "https://www.yami.com/us/zh/p/diamond-drop-blemish-patch/1022664441",
        priceCurrent: "$24.00",
      },
      {
        id: "glow-bb",
        image: "glow-bb.webp",
        title: "韩国GLOW 透气修护BB霜 #柔白色",
        titleEn: "GLOW Breathable Blemish Balm, White",
        href: "https://www.yami.com/us/zh/p/breathable-blemish-balm-white/1023775501",
        priceCurrent: "$34.00",
      },
    ],
  },
  {
    id: "teabless",
    title: "TEABLESS",
    titleEn: "TEABLESS",
    href: "https://www.yami.com/us/zh/b/teabless/17003",
    banner: "teabless-banner.webp",
    products: [
      {
        id: "teabless-lotion",
        image: "teabless-lotion.webp",
        title: "韩国TEABLESS茶柏蕾诗 香氛身体乳 无花果桃子乌龙茶 480g",
        titleEn: "TEABLESS Fig Peach Oolong Perfume Body Lotion, 480g",
        href: "https://www.yami.com/us/zh/p/teabless-perfume-body-lotion-fig-peach-oolong-tea-480g/1191008531",
        priceCurrent: "$21.59",
        priceOriginal: "$26.99",
      },
      {
        id: "teabless-wash",
        image: "teabless-wash.webp",
        title: "韩国TEABLESS茶柏蕾诗 香氛沐浴露 紫茶香型 500g",
        titleEn: "TEABLESS Purple Tea Perfume Body Wash, 500g",
        href: "https://www.yami.com/us/zh/p/teabless-perfume-body-wash-sage-amber-purple-tea-500g/1191008491",
        priceCurrent: "$12.99",
        priceOriginal: "$26.99",
      },
      {
        id: "teabless-rose",
        image: "teabless-rose.webp",
        title: "韩国TEABLESS茶柏蕾诗 纯净麝香玫瑰茶香身体乳 250g",
        titleEn: "TEABLESS Pure Musk Rose Tea Body Lotion, 250g",
        href: "https://www.yami.com/us/zh/p/teabless-pure-musk-rose-tea-perfume-body-lotion-250g/1191033601",
        priceCurrent: "$9.29",
        priceOriginal: "$11.99",
      },
    ],
  },
  {
    id: "voolga",
    title: "敷尔佳",
    titleEn: "VOOLGA",
    href: "https://www.yami.com/us/zh/b/voolga/5381",
    banner: "voolga-banner.webp",
    products: [
      {
        id: "voolga-mask",
        image: "voolga-mask.webp",
        title: "VOOLGA敷尔佳 白膜医用透明质酸钠修复贴 5片装",
        titleEn: "VOOLGA Sodium Hyaluronate Repair Dressing, 5ct",
        href: "https://www.yami.com/us/zh/p/voolga-medical-sodium-hyaluronate-dressing-1-0-5pcs/1127032071",
        priceCurrent: "$19.99",
      },
      {
        id: "voolga-ampoule",
        image: "voolga-ampoule.webp",
        title: "VOOLGA敷尔佳 医用透明质酸钠修复液 1ml*30支",
        titleEn: "VOOLGA Sodium Hyaluronate Repair Ampoule, 30ct",
        href: "https://www.yami.com/us/zh/p/item/1022112801",
        priceCurrent: "$38.99",
      },
      {
        id: "voolga-gel",
        image: "voolga-gel.webp",
        title: "VOOLGA敷尔佳 水解海绵祛痘凝露 10g",
        titleEn: "VOOLGA Sponge Spicule Acne Gel, 10g",
        href: "https://www.yami.com/us/zh/p/voolga-sponge-spicule-ani-acne-gel-15g/1022116371",
        priceCurrent: "$22.99",
      },
    ],
  },
] as const;

export const brandProductRailCopy = {
  zh: {
    title: "美护调理 流行趋势",
    mobileTitle: "品牌官方合作",
    tabs: [
      "全部",
      "食品杂货",
      "饮料",
      "家居",
      "美妆",
      "零食",
      "保健",
      "家电",
      "母婴",
    ],
    viewAll: "查看全部",
    previousLabel: "上一组品牌",
    nextLabel: "下一组品牌",
  },
  en: {
    title: "Beauty Brands to Try",
    mobileTitle: "Official Partnership",
    tabs: [
      "All",
      "Grocery",
      "Beverage",
      "Home",
      "Beauty",
      "Snack",
      "Health",
      "Electronic",
      "Mom & Baby",
    ],
    viewAll: "View all",
    previousLabel: "Previous brands",
    nextLabel: "Next brands",
  },
} as const;

export function createBrandProductCampaigns(
  locale: BrandProductRailLocale,
): BrandProductCampaign[] {
  return campaignSources.map((campaign) => ({
    id: campaign.id,
    title: locale === "en" ? campaign.titleEn : campaign.title,
    href: campaign.href,
    banner: {
      src: asset(campaign.banner),
      alt: locale === "en" ? campaign.titleEn : campaign.title,
      badgeSrc: officialPartnership,
    },
    products: campaign.products.map(
      (product): ProductListItem => ({
        id: product.id,
        image: asset(product.image),
        imageAlt: locale === "en" ? product.titleEn : product.title,
        title: locale === "en" ? product.titleEn : product.title,
        href: product.href,
        priceCurrent: product.priceCurrent,
        ...("priceOriginal" in product
          ? { priceOriginal: product.priceOriginal }
          : {}),
      }),
    ),
  }));
}

/* The whole prop set, so a story and a page composition cannot drift apart —
 * the page used to build its own copy and silently omitted `onAddToCart`,
 * which is what decides whether the quick-add button renders at all. Only the
 * "view all" target differs per surface. */
export function createBrandProductRailProps(
  locale: BrandProductRailLocale,
  viewAllHref: string,
): BrandProductRailProps {
  const copy = brandProductRailCopy[locale];
  return {
    title: copy.title,
    mobileTitle: copy.mobileTitle,
    campaigns: createBrandProductCampaigns(locale),
    tabs: copy.tabs.map((label, index) => ({
      value: `brand-category-${index + 1}`,
      label,
    })),
    viewAllHref,
    viewAllLabel: copy.viewAll,
    previousLabel: copy.previousLabel,
    nextLabel: copy.nextLabel,
    onAddToCart: () => {},
  };
}
