import type {
  BrandProductCampaign,
  ProductListItem,
  ReviewCardProps,
  ThemeProductListTheme,
} from "@yami/design-system";

import type { TopicLandingPageLocale } from "./fixtures";

interface LocalizedText {
  en: string;
  zh: string;
}

type BrandKey = "ito-en" | "marukyu-koyamaen" | "tsujiri" | "glico";

interface MatchaProductSource {
  id: keyof typeof productImages;
  title: LocalizedText;
  price: number;
  brand?: BrandKey;
}

const productImages = {
  "1020005241": new URL(
    "./assets/matcha/products/1020005241.webp",
    import.meta.url,
  ).href,
  "1020051271": new URL(
    "./assets/matcha/products/1020051271.webp",
    import.meta.url,
  ).href,
  "1020056571": new URL(
    "./assets/matcha/products/1020056571.webp",
    import.meta.url,
  ).href,
  "1020065241": new URL(
    "./assets/matcha/products/1020065241.webp",
    import.meta.url,
  ).href,
  "1157010241": new URL(
    "./assets/matcha/products/1157010241.webp",
    import.meta.url,
  ).href,
  "1157040151": new URL(
    "./assets/matcha/products/1157040151.webp",
    import.meta.url,
  ).href,
  "1157087711": new URL(
    "./assets/matcha/products/1157087711.webp",
    import.meta.url,
  ).href,
  "1158009201": new URL(
    "./assets/matcha/products/1158009201.webp",
    import.meta.url,
  ).href,
  "5157065631": new URL(
    "./assets/matcha/products/5157065631.webp",
    import.meta.url,
  ).href,
  "5157069441": new URL(
    "./assets/matcha/products/5157069441.webp",
    import.meta.url,
  ).href,
  "5157082961": new URL(
    "./assets/matcha/products/5157082961.webp",
    import.meta.url,
  ).href,
  "1016006971": new URL(
    "./assets/matcha/products/1016006971.webp",
    import.meta.url,
  ).href,
  "1016017461": new URL(
    "./assets/matcha/products/1016017461.webp",
    import.meta.url,
  ).href,
  "3016222151": new URL(
    "./assets/matcha/products/3016222151.webp",
    import.meta.url,
  ).href,
  "1017167281": new URL(
    "./assets/matcha/products/1017167281.webp",
    import.meta.url,
  ).href,
  "1016378441": new URL(
    "./assets/matcha/products/1016378441.webp",
    import.meta.url,
  ).href,
  "1018215361": new URL(
    "./assets/matcha/products/1018215361.webp",
    import.meta.url,
  ).href,
  "5018220131": new URL(
    "./assets/matcha/products/5018220131.webp",
    import.meta.url,
  ).href,
  "1018172321": new URL(
    "./assets/matcha/products/1018172321.webp",
    import.meta.url,
  ).href,
  "1016057371": new URL(
    "./assets/matcha/products/1016057371.webp",
    import.meta.url,
  ).href,
  "1016347971": new URL(
    "./assets/matcha/products/1016347971.webp",
    import.meta.url,
  ).href,
  "1016200951": new URL(
    "./assets/matcha/products/1016200951.webp",
    import.meta.url,
  ).href,
  "1017114241": new URL(
    "./assets/matcha/products/1017114241.webp",
    import.meta.url,
  ).href,
  "1018105771": new URL(
    "./assets/matcha/products/1018105771.webp",
    import.meta.url,
  ).href,
  "5029290231": new URL(
    "./assets/matcha/products/5029290231.webp",
    import.meta.url,
  ).href,
  "1029313261": new URL(
    "./assets/matcha/products/1029313261.webp",
    import.meta.url,
  ).href,
  "1029215511": new URL(
    "./assets/matcha/products/1029215511.webp",
    import.meta.url,
  ).href,
} as const;

export const matchaImages = {
  hero: new URL("./assets/matcha/hero.webp", import.meta.url).href,
  whisk: new URL("./assets/matcha/scene-whisk.webp", import.meta.url).href,
  latte: new URL("./assets/matcha/scene-latte.webp", import.meta.url).href,
  sweets: new URL("./assets/matcha/scene-sweets.webp", import.meta.url).href,
} as const;

const brands = {
  "ito-en": {
    name: "ITO EN",
    slug: "ito-en",
    id: "643",
  },
  "marukyu-koyamaen": {
    name: "MARUKYU KOYAMAEN",
    slug: "marukyu-koyamaen",
    id: "13583",
  },
  tsujiri: {
    name: "TSUJIRI",
    slug: "tsujiri",
    id: "7482",
  },
  glico: {
    name: "GLICO",
    slug: "glico",
    id: "46",
  },
} as const;

// Availability and prices were verified with Yami search on 2026-08-11.
const products = {
  itoUnsweetened: {
    id: "1020051271",
    title: {
      en: "Unsweetened Japanese Matcha Green Tea Powder, 2 oz",
      zh: "日本无糖抹茶绿茶粉 2oz",
    },
    price: 12.99,
    brand: "ito-en",
  },
  itoAlmondLatte: {
    id: "1158009201",
    title: {
      en: "Matcha Love Matcha Almond Latte, 9.47 fl oz",
      zh: "Matcha Love 抹茶杏仁拿铁 9.47fl oz",
    },
    price: 2.79,
    brand: "ito-en",
  },
  itoEnergyShot: {
    id: "1020005241",
    title: {
      en: "Matcha Love Unsweetened Matcha Energy Shot, 5.24 fl oz",
      zh: "Matcha Love 无糖抹茶能量饮 5.24fl oz",
    },
    price: 2.19,
    brand: "ito-en",
  },
  marukyuIsuzu: {
    id: "1157010241",
    title: {
      en: "Isuzu Premium Japanese Matcha Powder, 1.41 oz",
      zh: "五十铃高级日本抹茶粉 1.41oz",
    },
    price: 35.99,
    brand: "marukyu-koyamaen",
  },
  marukyuYugen: {
    id: "1157087711",
    title: {
      en: "Yugen Ceremonial Grade Matcha Powder, 0.70 oz",
      zh: "又玄茶道级抹茶粉 0.70oz",
    },
    price: 27.79,
    brand: "marukyu-koyamaen",
  },
  marukyuAyame: {
    id: "1157040151",
    title: {
      en: "Ayame Culinary Japanese Matcha Powder, 17.6 oz",
      zh: "菖蒲烘焙用日本抹茶粉 17.6oz",
    },
    price: 70.99,
    brand: "marukyu-koyamaen",
  },
  tsujiriUji: {
    id: "1020065241",
    title: {
      en: "Unsweetened Uji Matcha Powder, 1.41 oz",
      zh: "无糖宇治抹茶粉 1.41oz",
    },
    price: 9.99,
    brand: "tsujiri",
  },
  tsujiriPoundCake: {
    id: "1016378441",
    title: {
      en: "Matcha Pound Cake, 1.41 oz",
      zh: "浓郁抹茶磅蛋糕 1.41oz",
    },
    price: 3.19,
    brand: "tsujiri",
  },
  tsujiriMatchaMilk: {
    id: "5157082961",
    title: {
      en: "Extra Rich Matcha Milk Powder, 5.29 oz",
      zh: "浓茶风味抹茶牛奶粉 5.29oz",
    },
    price: 11.99,
    brand: "tsujiri",
  },
  ujiLatte: {
    id: "1020056571",
    title: {
      en: "Uji Matcha Latte with Milk, 8.79 fl oz",
      zh: "宇治抹茶牛奶拿铁 8.79fl oz",
    },
    price: 2.49,
  },
  instantLatte: {
    id: "5157069441",
    title: {
      en: "Uji Matcha Latte Powder, 4.23 oz",
      zh: "宇治浓茶抹茶拿铁粉 4.23oz",
    },
    price: 9.99,
  },
  royalMilkTea: {
    id: "5157065631",
    title: {
      en: "Hokkaido Royal Milk Tea Instant Matcha Latte, 8 sticks",
      zh: "北海道皇家奶茶即溶抹茶拿铁 8条",
    },
    price: 6.98,
  },
  glicoPejoy: {
    id: "1016006971",
    title: {
      en: "Pejoy Matcha Cream Filled Cookie Sticks, 1.97 oz",
      zh: "百醇抹茶注心饼干棒 1.97oz",
    },
    price: 2.49,
    brand: "glico",
  },
  glicoPocky: {
    id: "1016017461",
    title: {
      en: "Pocky Double Rich Matcha Cookie Sticks, 1.73 oz",
      zh: "Pocky 双重浓郁抹茶饼干棒 1.73oz",
    },
    price: 2.49,
    brand: "glico",
  },
  glicoDarkPocky: {
    id: "3016222151",
    title: {
      en: "Pocky Deep Matcha Cookie Sticks, 2 packs",
      zh: "Pocky 深浓抹茶饼干棒 2包",
    },
    price: 2.85,
    brand: "glico",
  },
  turtleChips: {
    id: "1017167281",
    title: {
      en: "Turtle Chips Matcha Chocolate Flavor, 5.64 oz",
      zh: "乌龟玉米脆片 抹茶巧克力味 5.64oz",
    },
    price: 4.49,
  },
  hokkaidoChocolate: {
    id: "1018215361",
    title: {
      en: "Hokkaido Fresh Cream Chocolate, Matcha, 4.02 oz",
      zh: "北海道鲜奶油抹茶巧克力 4.02oz",
    },
    price: 5.19,
  },
  ghanaSable: {
    id: "5018220131",
    title: {
      en: "Ghana Sablé Chocolat, Deep Uji Matcha, 1.73 oz",
      zh: "Ghana 深宇治抹茶莎布蕾巧克力 1.73oz",
    },
    price: 5.5,
  },
  darkChocolate: {
    id: "1018172321",
    title: {
      en: "Velvety Matcha Dark Chocolate, 0.53 oz",
      zh: "丝滑抹茶黑巧克力 0.53oz",
    },
    price: 2.59,
  },
  filledMochi: {
    id: "1016057371",
    title: {
      en: "Mochi with Matcha Filling, 6.35 oz",
      zh: "抹茶夹心麻薯 6.35oz",
    },
    price: 2.59,
  },
  daifuku: {
    id: "1016347971",
    title: {
      en: "Matcha Mochi Daifuku, 4.2 oz",
      zh: "日式抹茶大福 4.2oz",
    },
    price: 2.39,
  },
  latteMochi: {
    id: "1016200951",
    title: {
      en: "Rich Matcha Latte Mochi, 6.35 oz",
      zh: "浓郁抹茶拿铁麻薯 6.35oz",
    },
    price: 4.19,
  },
  kitkat: {
    id: "1017114241",
    title: {
      en: "KitKat Matcha Latte Wafer Bars, 9 pieces",
      zh: "KitKat 抹茶拿铁威化巧克力 9枚",
    },
    price: 5.99,
  },
  matchaCandy: {
    id: "1018105771",
    title: {
      en: "Puchao Matcha Soft Jelly Candy, 3.17 oz",
      zh: "Puchao 抹茶软糖 3.17oz",
    },
    price: 2.79,
  },
  teaSet: {
    id: "5029290231",
    title: {
      en: "Sakura Matcha Bowl and Whisk Set, 4 pieces",
      zh: "樱花渐变抹茶碗与茶筅套装 4件",
    },
    price: 33.99,
  },
  greenTeaSet: {
    id: "1029313261",
    title: {
      en: "Light Green Matcha Bowl, Whisk and Scoop Set",
      zh: "浅绿色抹茶碗、茶筅与茶勺套装",
    },
    price: 14.99,
  },
  bambooWhisk: {
    id: "1029215511",
    title: {
      en: "Japanese Matcha Bamboo Whisk",
      zh: "日式百本立抹茶竹茶筅",
    },
    price: 7.99,
  },
} satisfies Record<string, MatchaProductSource>;

export type MatchaProductKey = keyof typeof products;

function productHref(product: MatchaProductSource, locale: TopicLandingPageLocale) {
  return `https://www.yami.com/us/${locale}/p/matcha/${product.id}`;
}

function brandHref(brand: BrandKey, locale: TopicLandingPageLocale) {
  const source = brands[brand];
  return `https://www.yami.com/us/${locale}/b/${source.slug}/${source.id}`;
}

export function createMatchaProduct(
  key: MatchaProductKey,
  locale: TopicLandingPageLocale,
): ProductListItem {
  const source: MatchaProductSource = products[key];
  const brand = source.brand ? brands[source.brand] : undefined;
  return {
    id: `matcha-${source.id}`,
    image: productImages[source.id],
    imageAlt: source.title[locale],
    title: source.title[locale],
    priceCurrent: `$${source.price.toFixed(2)}`,
    href: productHref(source, locale),
    ...(brand && source.brand
      ? {
          brand: brand.name,
          brandHref: brandHref(source.brand, locale),
        }
      : {}),
  };
}

export const matchaCategoryValues = [
  "powder",
  "latte",
  "snacks",
  "chocolate",
  "sweets",
  "tools",
] as const;

const categoryProductKeys: Record<
  (typeof matchaCategoryValues)[number],
  MatchaProductKey[]
> = {
  powder: ["marukyuIsuzu", "tsujiriUji", "itoUnsweetened", "marukyuYugen"],
  latte: ["ujiLatte", "itoAlmondLatte", "instantLatte", "royalMilkTea"],
  snacks: ["glicoPocky", "glicoPejoy", "turtleChips", "tsujiriPoundCake"],
  chocolate: ["hokkaidoChocolate", "ghanaSable", "darkChocolate", "kitkat"],
  sweets: ["filledMochi", "daifuku", "latteMochi", "matchaCandy"],
  tools: ["teaSet", "greenTeaSet", "bambooWhisk", "marukyuAyame"],
};

export function createMatchaProductsByCategory(locale: TopicLandingPageLocale) {
  return Object.fromEntries(
    matchaCategoryValues.map((value) => [
      value,
      categoryProductKeys[value].map((key) => createMatchaProduct(key, locale)),
    ]),
  );
}

export function createMatchaPopularProducts(locale: TopicLandingPageLocale) {
  return [
    "marukyuIsuzu",
    "itoAlmondLatte",
    "glicoPocky",
    "filledMochi",
    "tsujiriUji",
    "hokkaidoChocolate",
    "teaSet",
    "tsujiriPoundCake",
  ].map((key) => createMatchaProduct(key as MatchaProductKey, locale));
}

export function createMatchaThemes(
  locale: TopicLandingPageLocale,
): ThemeProductListTheme[] {
  const copy = {
    en: [
      {
        value: "whisk-at-home",
        label: "Whisk at Home",
        title: "Start with a simple bowl",
        description:
          "Choose an unsweetened powder, sift it, then whisk with warm water for a bright, smooth cup.",
        image: matchaImages.whisk,
        imageAlt: "Bamboo whisk resting in a bowl of freshly whisked matcha",
        products: ["marukyuIsuzu", "tsujiriUji", "bambooWhisk"],
      },
      {
        value: "make-a-latte",
        label: "Make a Latte",
        title: "Build a creamy matcha latte",
        description:
          "Use a balanced powder or ready-to-drink option, then pair vivid tea flavor with your preferred milk.",
        image: matchaImages.latte,
        imageAlt: "Layered iced matcha latte with a bamboo whisk and matcha powder",
        products: ["itoAlmondLatte", "instantLatte", "royalMilkTea"],
      },
      {
        value: "pair-with-sweets",
        label: "Pair with Sweets",
        title: "Match earthy tea with soft sweetness",
        description:
          "Mochi, cake and chocolate soften matcha's gentle bitterness for an easy afternoon pairing.",
        image: matchaImages.sweets,
        imageAlt: "Matcha cake, wagashi, mochi and chocolate arranged beside tea",
        products: ["filledMochi", "glicoPocky", "hokkaidoChocolate"],
      },
    ],
    zh: [
      {
        value: "whisk-at-home",
        label: "在家点茶",
        title: "从一碗简单抹茶开始",
        description: "选择无糖抹茶粉，过筛后加入温水打匀，获得明亮顺滑的茶汤。",
        image: matchaImages.whisk,
        imageAlt: "竹茶筅置于刚打好的抹茶碗中",
        products: ["marukyuIsuzu", "tsujiriUji", "bambooWhisk"],
      },
      {
        value: "make-a-latte",
        label: "制作拿铁",
        title: "调一杯顺滑抹茶拿铁",
        description: "选择平衡型抹茶粉或即饮产品，再搭配喜欢的牛奶呈现鲜明茶味。",
        image: matchaImages.latte,
        imageAlt: "分层冰抹茶拿铁、竹茶筅与抹茶粉",
        products: ["itoAlmondLatte", "instantLatte", "royalMilkTea"],
      },
      {
        value: "pair-with-sweets",
        label: "搭配甜点",
        title: "用柔和甜味衬托茶香",
        description: "麻薯、蛋糕与巧克力能够缓和抹茶的轻微苦韵，适合下午茶搭配。",
        image: matchaImages.sweets,
        imageAlt: "抹茶蛋糕、和果子、麻薯与巧克力搭配茶饮",
        products: ["filledMochi", "glicoPocky", "hokkaidoChocolate"],
      },
    ],
  } as const;

  return copy[locale].map((theme) => ({
    value: theme.value,
    label: theme.label,
    content: {
      image: { src: theme.image, alt: theme.imageAlt },
      backgroundColor: "#e6e3d8",
      title: theme.title,
      description: theme.description,
      href: `#explore-more-${
        theme.value === "whisk-at-home"
          ? "powder"
          : theme.value === "make-a-latte"
            ? "latte"
            : "sweets"
      }`,
    },
    products: theme.products.map((key) => createMatchaProduct(key, locale)),
  }));
}

export function createMatchaBrandCampaigns(
  locale: TopicLandingPageLocale,
): BrandProductCampaign[] {
  const definitions: Array<{
    brand: BrandKey;
    banner: string;
    bannerAlt: LocalizedText;
    products: MatchaProductKey[];
  }> = [
    {
      brand: "ito-en",
      banner: matchaImages.latte,
      bannerAlt: {
        en: "Iced matcha latte in a sunlit cafe setting",
        zh: "阳光下的冰抹茶拿铁",
      },
      products: ["itoUnsweetened", "itoAlmondLatte", "itoEnergyShot"],
    },
    {
      brand: "marukyu-koyamaen",
      banner: matchaImages.whisk,
      bannerAlt: {
        en: "Fresh matcha whisked in a ceramic tea bowl",
        zh: "陶碗中刚打好的抹茶",
      },
      products: ["marukyuIsuzu", "marukyuYugen", "marukyuAyame"],
    },
    {
      brand: "tsujiri",
      banner: matchaImages.sweets,
      bannerAlt: {
        en: "Matcha sweets arranged for afternoon tea",
        zh: "下午茶抹茶甜点组合",
      },
      products: ["tsujiriUji", "tsujiriMatchaMilk", "tsujiriPoundCake"],
    },
    {
      brand: "glico",
      banner: matchaImages.hero,
      bannerAlt: {
        en: "Matcha tea and sweets on a stone table",
        zh: "石桌上的抹茶与甜点",
      },
      products: ["glicoPejoy", "glicoPocky", "glicoDarkPocky"],
    },
  ];

  return definitions.map((definition) => ({
    id: `matcha-${definition.brand}`,
    title: brands[definition.brand].name,
    href: brandHref(definition.brand, locale),
    banner: {
      src: definition.banner,
      alt: definition.bannerAlt[locale],
    },
    products: definition.products.map((key) => createMatchaProduct(key, locale)),
  }));
}

// Editorial sample copy for the prototype; these are not imported customer reviews.
export function createMatchaEditorialNotes(
  locale: TopicLandingPageLocale,
): ReviewCardProps[] {
  const notes = {
    en: [
      {
        key: "marukyuIsuzu" as const,
        review:
          "A focused choice for whisking: vivid color, clean tea character and enough depth to drink simply with water.",
      },
      {
        key: "itoAlmondLatte" as const,
        review:
          "An easy chilled entry point when you want creamy texture without measuring powder or milk.",
      },
      {
        key: "glicoPocky" as const,
        review:
          "Crisp biscuit and sweet matcha coating make this a friendly pairing for a stronger cup of tea.",
      },
    ],
    zh: [
      {
        key: "marukyuIsuzu" as const,
        review: "适合点茶入门：色泽明亮、茶味干净，直接兑水也有足够层次。",
      },
      {
        key: "itoAlmondLatte" as const,
        review: "无需称量抹茶粉和牛奶，就能获得冰凉顺滑的拿铁体验。",
      },
      {
        key: "glicoPocky" as const,
        review: "酥脆饼干与甜抹茶涂层，适合搭配一杯茶味更浓的抹茶。",
      },
    ],
  } as const;

  return notes[locale].map(({ key, review }, index) => {
    const source = products[key];
    const product = createMatchaProduct(key, locale);
    return {
      id: `matcha-editorial-note-${index + 1}`,
      rating: 5,
      review,
      reviewer: locale === "zh" ? "Yami 编辑示例" : "Yami editorial sample",
      product: {
        imageSrc: productImages[source.id],
        imageAlt: source.title[locale],
        brand: source.brand ? brands[source.brand].name : "MATCHA",
        name: source.title[locale],
        href: product.href,
      },
    };
  });
}
