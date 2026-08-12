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
  "1017181931":
    "https://cdn.yamibuy.net/item/16277a5ed23c5b87a72ec2772f13d4fe_300x300.webp",
  "1159008391":
    "https://cdn.yamibuy.net/item/965fcb23f9185f15426afe783f01672f_300x300.webp",
  "1021014881":
    "https://cdn.yamibuy.net/item/55b502e5cd63bf47ca13f225916768f5_300x300.webp",
  "1159008381":
    "https://cdn.yamibuy.net/item/dbd4cde8aec657f9ca7401717f293b54_300x300.webp",
  "5021181231":
    "https://cdn.yamibuy.net/item/4b9e09e69a77d33d48138c73a4f89c54_300x300.webp",
  "1149004421":
    "https://cdn.yamibuy.net/item/bc7d7fd9c62f5adbf4fabbd9a82b5afa_300x300.webp",
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
  shortcutScenes: {
    powder: new URL(
      "./assets/matcha/shortcut-scenes/shortcut-powder.webp",
      import.meta.url,
    ).href,
    latte: new URL(
      "./assets/matcha/shortcut-scenes/shortcut-latte.webp",
      import.meta.url,
    ).href,
    snacks: new URL(
      "./assets/matcha/shortcut-scenes/shortcut-snacks.webp",
      import.meta.url,
    ).href,
    chocolate: new URL(
      "./assets/matcha/shortcut-scenes/shortcut-chocolate.webp",
      import.meta.url,
    ).href,
    sweets: new URL(
      "./assets/matcha/shortcut-scenes/shortcut-sweets.webp",
      import.meta.url,
    ).href,
    tools: new URL(
      "./assets/matcha/shortcut-scenes/shortcut-tools.webp",
      import.meta.url,
    ).href,
  },
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
  unsweetenedSoyMilk: {
    id: "1017181931",
    title: {
      en: "Unsweetened Soy Milk, 9.46 fl oz",
      zh: "无糖豆奶 9.46fl oz",
    },
    price: 1.69,
  },
  cannedCoconutMilk: {
    id: "1159008391",
    title: {
      en: "Coconut Milk for Drinks and Desserts, 13.52 fl oz",
      zh: "饮品甜点用椰奶 13.52fl oz",
    },
    price: 2.19,
  },
  sweetRedBeanPaste: {
    id: "1021014881",
    title: {
      en: "Sweet Red Bean Paste, 17.64 oz",
      zh: "甜红豆馅 17.64oz",
    },
    price: 3.69,
  },
  condensedCreamer: {
    id: "1159008381",
    title: {
      en: "Sweetened Condensed Creamer, 45.3 oz",
      zh: "甜炼乳 45.3oz",
    },
    price: 6.49,
  },
  brownSugarSyrup: {
    id: "5021181231",
    title: {
      en: "Liquid Brown Sugar Syrup, 280g",
      zh: "液体黑糖浆 280g",
    },
    price: 8.88,
  },
  glutinousRiceFlour: {
    id: "1149004421",
    title: {
      en: "Green Elephant Glutinous Rice Flour, 1 lb",
      zh: "绿象糯米粉 1lb",
    },
    price: 1.99,
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

export const matchaWaterfallValues = [
  "pairings",
  ...matchaCategoryValues,
] as const;

const categoryProductKeys: Record<
  (typeof matchaWaterfallValues)[number],
  MatchaProductKey[]
> = {
  pairings: [
    "unsweetenedSoyMilk",
    "cannedCoconutMilk",
    "sweetRedBeanPaste",
    "condensedCreamer",
    "brownSugarSyrup",
    "glutinousRiceFlour",
  ],
  powder: ["marukyuIsuzu", "tsujiriUji", "itoUnsweetened", "marukyuYugen"],
  latte: ["ujiLatte", "itoAlmondLatte", "instantLatte", "royalMilkTea"],
  snacks: ["glicoPocky", "glicoPejoy", "turtleChips", "tsujiriPoundCake"],
  chocolate: ["hokkaidoChocolate", "ghanaSable", "darkChocolate", "kitkat"],
  sweets: ["filledMochi", "daifuku", "latteMochi", "matchaCandy"],
  tools: ["teaSet", "greenTeaSet", "bambooWhisk", "marukyuAyame"],
};

export function createMatchaProductsByCategory(locale: TopicLandingPageLocale) {
  return Object.fromEntries(
    matchaWaterfallValues.map((value) => [
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
        value: "pure-matcha",
        label: "Pure Matcha",
        title: "Whisk a pure bowl of matcha",
        description:
          "Compare unsweetened powders by grade, flavor and everyday use, then whisk your preferred matcha with warm water.",
        image: matchaImages.whisk,
        imageAlt: "Bamboo whisk resting in a bowl of freshly whisked matcha",
        products: [
          "marukyuIsuzu",
          "tsujiriUji",
          "itoUnsweetened",
          "marukyuYugen",
        ],
      },
      {
        value: "matcha-drinks",
        label: "Matcha Drinks",
        title: "From lattes to refreshing matcha drinks",
        description:
          "Explore ready-to-drink matcha, instant mixes and creamy latte formats for an easy everyday cup.",
        image: matchaImages.latte,
        imageAlt: "Layered iced matcha drink with a bamboo whisk and matcha powder",
        products: [
          "itoAlmondLatte",
          "instantLatte",
          "royalMilkTea",
          "ujiLatte",
          "tsujiriMatchaMilk",
          "itoEnergyShot",
        ],
      },
      {
        value: "matcha-treats",
        label: "Matcha Treats",
        title: "Discover matcha tea-time treats",
        description:
          "Browse mochi, cookies, cake and chocolate that make matcha flavor the centerpiece of an afternoon treat.",
        image: matchaImages.sweets,
        imageAlt: "Matcha cake, wagashi, mochi and chocolate arranged beside tea",
        products: [
          "filledMochi",
          "glicoPocky",
          "hokkaidoChocolate",
          "daifuku",
          "tsujiriPoundCake",
          "ghanaSable",
        ],
      },
    ],
    zh: [
      {
        value: "pure-matcha",
        label: "纯饮点茶",
        title: "从一碗纯抹茶开始",
        description: "按等级、风味与日常用途比较无糖抹茶粉，选择适合自己的茶粉加水点饮。",
        image: matchaImages.whisk,
        imageAlt: "竹茶筅置于刚打好的抹茶碗中",
        products: [
          "marukyuIsuzu",
          "tsujiriUji",
          "itoUnsweetened",
          "marukyuYugen",
        ],
      },
      {
        value: "matcha-drinks",
        label: "抹茶调饮",
        title: "从拿铁到冰饮，轻松喝抹茶",
        description: "探索即饮抹茶、冲调粉与顺滑拿铁等形态，选择更适合日常节奏的喝法。",
        image: matchaImages.latte,
        imageAlt: "分层冰抹茶饮、竹茶筅与抹茶粉",
        products: [
          "itoAlmondLatte",
          "instantLatte",
          "royalMilkTea",
          "ujiLatte",
          "tsujiriMatchaMilk",
          "itoEnergyShot",
        ],
      },
      {
        value: "matcha-treats",
        label: "抹茶茶点",
        title: "发现抹茶风味茶点",
        description: "从麻薯、饼干到蛋糕与巧克力，让抹茶本身成为下午茶的风味主角。",
        image: matchaImages.sweets,
        imageAlt: "抹茶蛋糕、和果子、麻薯与巧克力搭配茶饮",
        products: [
          "filledMochi",
          "glicoPocky",
          "hokkaidoChocolate",
          "daifuku",
          "tsujiriPoundCake",
          "ghanaSable",
        ],
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
        theme.value === "pure-matcha"
          ? "powder"
          : theme.value === "matcha-drinks"
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
    banner: {
      src: definition.banner,
      alt: definition.bannerAlt[locale],
    },
    products: definition.products.map((key) => createMatchaProduct(key, locale)),
  }));
}

// Customer reviews supplied from Yami for the products linked below.
export function createMatchaEditorialNotes(
  locale: TopicLandingPageLocale,
): ReviewCardProps[] {
  const notes = {
    en: [
      {
        key: "marukyuIsuzu" as const,
        review:
          "If matcha tastes like grass, then ...... I’m a cow. Good quality, a good price, and after tasting the matcha latte made from this, you will never be able to tolerant Starbucks match latte again.",
      },
      {
        key: "itoAlmondLatte" as const,
        review:
          "This was good but the panna cotta is one big chunk. You have to drink it with a straw. Definitely taste better chilled.",
      },
      {
        key: "tsujiriUji" as const,
        review:
          "Great color, fresh aroma, and smooth texture. The taste is rich with mild bitterness and a nice umami kick — perfect",
      },
    ],
    zh: [
      {
        key: "marukyuIsuzu" as const,
        review:
          "If matcha tastes like grass, then ...... I’m a cow. Good quality, a good price, and after tasting the matcha latte made from this, you will never be able to tolerant Starbucks match latte again.",
      },
      {
        key: "itoAlmondLatte" as const,
        review:
          "This was good but the panna cotta is one big chunk. You have to drink it with a straw. Definitely taste better chilled.",
      },
      {
        key: "tsujiriUji" as const,
        review:
          "Great color, fresh aroma, and smooth texture. The taste is rich with mild bitterness and a nice umami kick — perfect",
      },
    ],
  } as const;

  return notes[locale].map(({ key, review }, index) => {
    const source = products[key];
    const product = createMatchaProduct(key, locale);
    return {
      id:
        index === 0
          ? "matcha-customer-review-1157010241"
          : index === 1
            ? "matcha-customer-review-1158009201"
            : "matcha-customer-review-1020065241",
      rating: 5,
      review,
      reviewer:
        index === 0
          ? "tasha奶奶"
          : index === 1
            ? "Kimmunicate"
            : "user11579032227...",
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
