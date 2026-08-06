import type {
  SocialMediaGalleryProps,
  SocialVideoCardProps,
} from "./SocialMediaGallery.types";

export type SocialMediaGalleryLocale = "zh" | "en";

const assets = {
  instagram:
    "https://cdn.yamibuy.net/mkt/a37da925bdf1ad011a80eeb801c38b52_0x0.png",
  posters: [
    new URL("./assets/social-1.jpg", import.meta.url).href,
    new URL("./assets/social-2.jpg", import.meta.url).href,
    new URL("./assets/social-3.jpg", import.meta.url).href,
    new URL("./assets/social-4.jpg", import.meta.url).href,
    new URL("./assets/social-5.jpg", import.meta.url).href,
    new URL("./assets/social-6.jpg", import.meta.url).href,
  ],
  products: [
    new URL("./assets/product-1.png", import.meta.url).href,
    new URL("./assets/product-2.png", import.meta.url).href,
    new URL("./assets/product-3.png", import.meta.url).href,
    new URL("./assets/product-4.png", import.meta.url).href,
    new URL("./assets/product-5.png", import.meta.url).href,
  ],
};

const copy = {
  zh: {
    title: "社交媒体热门",
    mobileTitle: "真实用户，真实分享",
    viewAll: "查看全部",
    previous: "上一组社交视频",
    next: "下一组社交视频",
    captions: [
      "黑五正是焕新家居的好时机！",
      "深夜拉面也能做出餐厅级满足感。",
      "这盘眼影的日常配色太实用了。",
      "火鸡面这样搭配，辣得更有层次。",
      "户外也要记得补涂防晒。",
      "香菜爱好者一定要试试这道菜。",
    ],
  },
  en: {
    title: "Real People, Real Reviews",
    // Same as the desktop title now, so English reads one line at every width.
    // Chinese still swaps, which is what the prop is for.
    mobileTitle: "Real People, Real Reviews",
    viewAll: "See all",
    previous: "Previous social videos",
    next: "Next social videos",
    captions: [
      "Black Friday is the moment to give your home a refresh!",
      "Your ramen is in its flop era — this fixes it.",
      "An everyday palette that works for every look.",
      "Love Buldak but cannot handle the heat? Try this.",
      "Keep your skin protected all day outdoors.",
      "When the recipe says add cilantro, add more.",
    ],
  },
} as const;

export function createSocialVideoCards(
  locale: SocialMediaGalleryLocale,
): SocialVideoCardProps[] {
  const localeCopy = copy[locale];

  return Array.from({ length: 8 }, (_, index) => {
    const assetIndex = index % assets.posters.length;
    const withoutProducts = index % 4 === 3;
    const singleProduct = index % 3 === 0;
    const products = withoutProducts
      ? []
      : singleProduct
      ? [
          {
            id: `social-product-${index + 1}`,
            imageSrc: assets.products[assetIndex % assets.products.length],
            imageAlt: locale === "en" ? "Featured product" : "视频同款商品",
            title:
              locale === "en"
                ? "Daily moisture and sun care favorite"
                : "日常补水防晒人气单品",
            href: `#social-product-${index + 1}`,
          },
        ]
      : Array.from({ length: 3 }, (_, productIndex) => ({
          id: `social-product-${index + 1}-${productIndex + 1}`,
          imageSrc:
            assets.products[(assetIndex + productIndex) % assets.products.length],
          imageAlt:
            locale === "en"
              ? `Featured product ${productIndex + 1}`
              : `视频同款商品 ${productIndex + 1}`,
          href: `#social-product-${index + 1}-${productIndex + 1}`,
        }));

    return {
      id: `social-video-${index + 1}`,
      posterSrc: assets.posters[assetIndex],
      posterAlt: localeCopy.captions[assetIndex],
      username: index % 2 === 0 ? "@yamibuy" : "@yamiselect",
      platformIconSrc: assets.instagram,
      caption: localeCopy.captions[assetIndex],
      href: `#social-video-${index + 1}`,
      products,
      ...(!withoutProducts && !singleProduct
        ? { additionalProductCount: 2 }
        : {}),
    };
  });
}

export function createSocialMediaGalleryFixture(
  locale: SocialMediaGalleryLocale,
): SocialMediaGalleryProps {
  const localeCopy = copy[locale];
  return {
    title: localeCopy.title,
    mobileTitle: localeCopy.mobileTitle,
    cards: createSocialVideoCards(locale),
    viewAllHref: "#all-social-videos",
    viewAllLabel: localeCopy.viewAll,
    previousLabel: localeCopy.previous,
    nextLabel: localeCopy.next,
  };
}
