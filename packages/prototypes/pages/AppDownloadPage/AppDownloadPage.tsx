"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Badge, Button, Card, Checkbox, Divider, Footer, HorizontalScrollList,
  ProductList, Tabs, TabsContent, TabsList, TabsTrigger, useHorizontalScrollList,
} from "@yami/design-system";
import {
  appStoreHref, asset, calculateSavings, campaignCopy, campaignProducts,
  categories, categoryLabels, downloadHref, featuredProducts,
  money, playStoreHref, productHref, productImage,
  type AppDownloadLocale,
} from "./fixtures";
import { createEcommerceHomeFixture } from "../EcommerceHome/fixtures";
import styles from "./AppDownloadPage.module.css";

const homeFooter = createEcommerceHomeFixture("en").footer;
const arrowDown = new URL("../../../design-system/assets/icons/system/arrow-down.svg", import.meta.url).href;
const localeFlag = new URL("../../../design-system/assets/icons/area/united-states.svg", import.meta.url).href;
const desktopLogo = new URL("../../../design-system/assets/logos/yami-ui-en-pc-fill.svg", import.meta.url).href;
const logo = new URL("../../../design-system/assets/logos/yami-ui-en-mobile-fill.svg", import.meta.url).href;
const sectionIds = ["welcome-coupon", "discount-products", "coupon-guide", "savings-calculator"];

function DownloadLinks() {
  return <div className={styles.downloadLinks}>
    <div className={styles.downloadButtons}>
    <a href={appStoreHref} aria-label="Download on the App Store"><img src={asset("Download_on_the_App_Store_Badge.svg")} alt="Download on the App Store" /></a>
    <a href={playStoreHref} aria-label="Get it on Google Play"><img src={asset("Google_Play_Store_badge_EN.svg")} alt="Get it on Google Play" /></a>
    </div>
    <a className={styles.qr} href={downloadHref} aria-label="Scan QR Code to download"><img src={asset("download-qr.svg")} alt="" /></a>
  </div>;
}

function SavingsCalculator({ locale, onGuide }: { locale: AppDownloadLocale; onGuide: () => void }) {
  const [mode, setMode] = useState<"welcome" | "app">("welcome");
  const [amount, setAmount] = useState(30);
  const [selected, setSelected] = useState<string[]>([]);
  const { listRef, state: railState, updateState, scrollByPage } = useHorizontalScrollList({ enabled: mode === "app", itemCount: featuredProducts.length, minimumPageDistance: 128 });
  const t = campaignCopy[locale].calculator;
  const ko = locale === "ko";
  const result = calculateSavings(mode, amount, featuredProducts.filter((product) => selected.includes(product.sku)));
  return <section id="savings-calculator" className={styles.calculatorSection}>
    <div className={styles.calculator}>
      <div className={styles.calculatorHeading}>
      <h2>{ko ? "내 혜택 미리 계산해보기" : "Calculate My Savings"}</h2>
      <p className={styles.subtitle}>{ko ? "쿠폰과 배송비 혜택을 직접 확인해보세요" : "Check your exact discount and shipping benefits live"}</p>
      </div>
      <Tabs value={mode} onValueChange={(value) => setMode(value as "welcome" | "app")}>
        <TabsList variant="primary" styleVariant="b" fullWidth className={styles.calculatorTabs} aria-label={ko ? "쿠폰 선택" : "Choose coupon"}>
          <TabsTrigger value="welcome"><span className={styles.couponTab}><span>{ko ? "쿠폰 1" : "Coupon 1"}</span>{t.tab1Title_combo1010}</span></TabsTrigger>
          <TabsTrigger value="app"><span className={styles.couponTab}><span>{ko ? "쿠폰 2" : "Coupon 2"}</span>{t.tab2Title}</span></TabsTrigger>
        </TabsList>
        <p className={styles.modeHint}>{mode === "welcome" ? t.tab1Badge : t.tab2Badge}</p>
        <Card padding="lg" className={styles.calculatorCard}>
          <div className={styles.calculatorInput}>
          <div className={styles.amountHeading}>
            <div><h3>{mode === "welcome" ? t.card1Title : t.card2Title}</h3><p>{mode === "welcome" ? t.sliderHint : selected.length ? t.selectedCount.replace("{count}", String(selected.length)) : (ko ? "상품을 선택하면 할인과 최종 결제 금액을 확인할 수 있어요." : "Select products to see your discount and final payment.")}</p></div>
            <strong>{money(result.subtotal)}</strong>
          </div>
          <TabsContent value="welcome" className={styles.calculatorControls}>
            <label className={styles.srOnly} htmlFor="campaign-order-amount">{t.card1Title}</label>
            <input id="campaign-order-amount" className={styles.slider} type="range" min={12} max={100} step={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} aria-valuetext={money(amount)} />
            <div className={styles.ticks} aria-hidden="true">{[12, 25, 50, 75, 100].map((value) => <span key={value} style={{ left: `${(value - 12) / 88 * 100}%` }}>{money(value).replace(".00", "")}</span>)}</div>
          </TabsContent>
          <TabsContent value="app" className={styles.calculatorControls}>
            <div className={styles.selectionNavigation}>
              <span>{ko ? `추천 상품 ${featuredProducts.length}개` : `${featuredProducts.length} featured products`}</span>
              <div>
                <Button variant="secondary" form="icon" size="sm" disabled={railState.atStart} onClick={() => scrollByPage(-1)} aria-label={ko ? "이전 추천 상품" : "Previous featured products"}><img src={asset("chevron-left.svg")} alt="" /></Button>
                <Button variant="secondary" form="icon" size="sm" disabled={railState.atEnd} onClick={() => scrollByPage(1)} aria-label={ko ? "다음 추천 상품" : "Next featured products"}><img src={asset("chevron-right.svg")} alt="" /></Button>
              </div>
            </div>
            <HorizontalScrollList as="ul" ref={listRef} onScroll={updateState} className={styles.selectionRail} aria-label={ko ? "혜택 계산 상품" : "Products for savings calculation"}>
              {featuredProducts.map((product) => <li key={product.sku} className={styles.selectionProduct} data-selected={selected.includes(product.sku)}>
                <label>
                  <img src={productImage(product)} alt="" loading="lazy" />
                  <span className={styles.selectionCheck}><Checkbox checked={selected.includes(product.sku)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, product.sku] : current.filter((sku) => sku !== product.sku))} aria-label={product.name[locale]} /></span>
                  <span className={styles.selectionTitle}>{product.name[locale]}</span>
                  <strong>{money(product.yamiPrice)}</strong>
                  <small>{ko ? "(할인 전 가격)" : "(Before discount)"}</small>
                </label>
                <a href={productHref(product, locale)}>{ko ? "웹 가격과 비교해보기" : "Compare Web Price"}</a>
              </li>)}
            </HorizontalScrollList>
            <p className={styles.moreDeals}>{ko ? "추천 상품 일부입니다. 더 많은 혜택 상품은 " : "These are a few featured picks. See more deals "}<a href="#discount-products">{ko ? "여기" : "here"}</a></p>
          </TabsContent>
          </div>
          <div className={styles.calculatorDetails}>
          <dl className={styles.breakdown}>
            <div><dt>{mode === "welcome" ? t.card1Title : t.card2Title}</dt><dd>{money(result.subtotal)}</dd></div>
            <div><dt>{mode === "welcome" ? t.tab1Title_combo1010 : t.tab2Title}</dt><dd className={styles.saving}>−{money(result.discount)}</dd></div>
          </dl>
          {mode === "welcome" && <button type="button" className={styles.textAction} onClick={onGuide}>{ko ? "영상 속 숨은 추가 혜택까지 포함" : "Hidden extra perk in the video included"}</button>}
          <dl className={styles.breakdown}>
            <div><dt>{ko ? "배송비" : "Shipping Fee"} <Badge color={result.freeShipping ? "green" : "red"} emphasis="secondary">{result.freeShipping ? (ko ? "$49 이상 무료" : "Free over $49") : (ko ? "$49 미만" : "Under $49")}</Badge></dt><dd>{result.shipping ? "+" : ""}{money(result.shipping)}</dd></div>
          </dl>
          </div>
          <Divider />
          <div className={styles.calculatorResult}>
          {mode === "app" && <dl className={styles.breakdown}><div className={styles.saving}><dt>{ko ? "총 절약 금액" : "TOTAL SAVINGS"}</dt><dd data-testid="total-savings">{money(result.saved)}</dd></div></dl>}
          <div className={styles.total} aria-live="polite"><span>{ko ? "예상 최종 결제 금액" : "Est. Final Payment"}</span><output data-testid="final-payment">{money(result.total)}</output></div>
          </div>
          <div className={styles.shippingProgress}>
          {!result.freeShipping && <p className={styles.shippingHint}>{result.subtotal === 0 ? (ko ? "상품을 선택하고 혜택을 확인해보세요!" : "Select items to see how much you can save!") : ko ? `상품할인 ${money(result.discount)} 절약 중 (할인 적용 후 $49 이상 담으면 $5.99 추가 절감!)` : `Saving ${money(result.discount)} on items (Reach $49 after discounts to save another $5.99!)`}</p>}
          <progress className={styles.progress} max={1} value={result.progress} aria-label={ko ? "무료 배송까지" : "Progress to free shipping"} />
          </div>
        </Card>
      </Tabs>
    </div>
  </section>;
}

export interface AppDownloadPageProps { initialLocale?: AppDownloadLocale; contentMaxWidth?: number | string }

export function AppDownloadPage({ initialLocale = "ko", contentMaxWidth = 1920 }: AppDownloadPageProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [category, setCategory] = useState<string>("beauty");
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const [showSticky, setShowSticky] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pendingSection = useRef<string | null>(null);
  const contentWidth = typeof contentMaxWidth === "number" ? `${contentMaxWidth}px` : contentMaxWidth;
  const pageStyle = { "--campaign-content-max-width": contentWidth } as CSSProperties;
  const t = campaignCopy[locale];
  const ko = locale === "ko";
  const labels = [t.nav.categories.welcomeCoupon, t.nav.categories.discountProducts, t.nav.categories.couponGuide, ko ? "혜택 계산기" : "Calculator"];

  useEffect(() => {
    const update = () => {
      const hero = root.current?.querySelector<HTMLElement>("[data-campaign-hero]");
      const protectedContentVisible = ["coupon-guide", "savings-calculator", "bottom-cta-section"].some((id) => {
        const bounds = root.current?.querySelector(`#${id}`)?.getBoundingClientRect();
        return bounds && bounds.top < window.innerHeight && bounds.bottom > 128;
      });
      const bottom = root.current?.querySelector("#bottom-cta-section")?.getBoundingClientRect();
      setShowSticky((hero?.getBoundingClientRect().bottom ?? Infinity) < 64 && !protectedContentVisible && (bottom?.bottom ?? Infinity) > 128);
      if (pendingSection.current) return;
      let active = sectionIds[0];
      for (const id of sectionIds) {
        if ((root.current?.querySelector(`#${id}`)?.getBoundingClientRect().top ?? Infinity) <= 180) active = id;
      }
      setActiveSection(active);
    };
    const resumeTracking = () => {
      pendingSection.current = null;
      update();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) resumeTracking();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scrollend", resumeTracking);
    window.addEventListener("wheel", resumeTracking, { passive: true });
    window.addEventListener("touchstart", resumeTracking, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("scrollend", resumeTracking);
      window.removeEventListener("wheel", resumeTracking);
      window.removeEventListener("touchstart", resumeTracking);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        void player.play().catch(() => { /* The native play control remains available. */ });
      } else {
        player.pause();
      }
    }, { threshold: 0.25 });
    observer.observe(player);
    return () => observer.disconnect();
  }, []);

  const showGuide = (time: number) => {
    const player = video.current;
    root.current?.querySelector("#coupon-guide")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    if (player) {
      player.currentTime = time;
      void player.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
    }
  };

  return <><div className={styles.root} style={pageStyle} lang={locale} ref={root} data-slot="app-download-page">
    <header className={styles.header}><div>
      <a href={`https://www.yami.com/${locale}`} aria-label="Yami Home"><picture><source media="(min-width: 1024px)" srcSet={desktopLogo} /><img className={styles.logo} src={logo} alt="YAMI" /></picture></a>
      <div className={styles.headerActions}>
        <Button className={styles.languageButton} variant="secondary" leftIcon={<img className={styles.flag} src={localeFlag} alt="" />} onClick={() => setLocale(ko ? "en" : "ko")} aria-label={ko ? "Switch to English" : "한국어로 전환"}>{ko ? "KO" : "EN"}</Button>
        <a className={styles.shopLink} href={`https://www.yami.com/${locale}`}>{t.nav.shopNow}</a>
      </div>
    </div></header>
    <main>
      <section className={styles.hero} data-campaign-hero>
        <div className={styles.heroCopy}>
          <div className={styles.heroHeading}>
          <span className={styles.offerBadge}>{t.hero.badge}</span>
          <div className={styles.heroTitleGroup}>
            <h1>{t.hero.headline}</h1>
            <p className={styles.heroDescription}>{t.hero.subheadline}</p>
          </div>
          </div>
          <p className={styles.appNotice}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>{t.hero.appOnlyNotice}</p>
        </div>
        <DownloadLinks />
      </section>
      <nav className={styles.sectionNav} aria-label={ko ? "페이지 섹션" : "Page sections"}>
        <Tabs value={activeSection} onValueChange={(id) => {
          pendingSection.current = id;
          setActiveSection(id);
          root.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
        }}>
          <TabsList centerActiveTab align="center" edgePadding variant="primary" styleVariant="a" inverse aria-label={ko ? "페이지 섹션" : "Page sections"}>
            {sectionIds.map((id, index) => <TabsTrigger key={id} value={id} controls={id}>{labels[index]}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </nav>
      <section id="welcome-coupon" className={styles.couponSection}>
        <Card padding="none" className={styles.couponPanel}>
          <div className={styles.couponHeading}>
            <p className={styles.eyebrow}>{t.coupon.preTitle}</p>
            <div className={styles.couponTitleGroup}>
              <h2>{t.coupon.title}</h2>
              <p>{t.coupon.subtitle}</p>
            </div>
          </div>
          <div className={styles.coupons}>
            {[t.coupon.first, t.coupon.returning].map((coupon, index) => <div className={styles.coupon} key={coupon.code}>
              <Badge className={styles.couponBadge} color="yellow" emphasis="secondary">{coupon.badge}</Badge>
              <h3>{coupon.title}</h3><div className={styles.couponCode}>APP ONLY <span aria-hidden="true">|</span> {ko ? "쿠폰코드 :" : "Code:"} <button type="button" onClick={() => showGuide(index ? 23 : 0)}>{coupon.code}</button><button type="button" onClick={() => showGuide(index ? 23 : 0)}>{ko ? "적용법 보기" : "How to use"}</button></div>
            </div>)}
          </div>
          <div className={styles.terms}>
            <Divider />
            <div className={styles.termsCopy}>
            <p>{t.coupon.eligibility}</p>
            <p><strong>{ko ? "이용 방법: " : "How to use: "}</strong>{ko ? "앱 다운로드 후 첫 주문 시 KOREA 코드를 사용하세요. WELCOME26은 다음 주문에 사용 가능해요. 아래 " : "Download the app and use KOREA on your first order. Use WELCOME26 on your next order. Watch the "}<button type="button" className={styles.textAction} onClick={() => showGuide(12)}>{ko ? "영상" : "video"}</button>{ko ? " 재생 시 숨겨진 추가 혜택을 확인할 수 있어요." : " below to unlock hidden extra benefits."}</p>
            <p><strong>{ko ? "주의사항: " : "Note: "}</strong>{t.coupon.notice}</p><p>{t.coupon.details}</p>
            </div>
          </div>
          <a className={styles.dealsLink} href="#discount-products">{ko ? "앱 전용 혜택 상품 보러가기" : "Explore App-Only Deals"}<img src={arrowDown} alt="" /></a>
        </Card>
      </section>
        <ProductList
          id="discount-products"
          title={t.nav.categories.discountProducts}
          description={ko ? "웰컴 쿠폰팩 적용으로 상상 초월 폭풍 할인!" : "Unlock incredible savings with your welcome coupon pack!"}
          appearance="background" headingAlign="center" layout="rail" dividerPosition="none"
          backgroundColor="var(--brand-tertiary)"
          tabs={categories.map((value, index) => ({ value, label: categoryLabels[locale][index] }))}
          value={category} onValueChange={setCategory}
          previousLabel={ko ? "이전 상품" : "Previous products"} nextLabel={ko ? "다음 상품" : "Next products"}
          products={campaignProducts.filter((product) => product.category === category).map((product) => ({
            id: product.sku, title: product.name[locale], image: productImage(product), imageAlt: product.name[locale],
            href: productHref(product, locale), brand: product.brand[locale], brandHref: productHref(product, locale),
            priceCurrent: money(product.appPrice), priceOriginal: money(product.originalPrice),
            badges: [{ type: "discount" as const, label: `${product.discountPercent}% OFF` }],
          }))}
        />
      <section id="coupon-guide" className={styles.guideSection}>
        <div className={styles.guideHeading}>
          <h2>{t.nav.categories.couponGuide}</h2>
          <p>{ko ? "영상 속에 숨겨진 추가 혜택을 확인해보세요" : "Watch the video to discover hidden extra benefits"}</p>
        </div>
        <video className={styles.video} ref={video} controls muted loop playsInline preload="metadata" aria-label={ko ? "쿠폰 적용 안내 영상" : "Coupon redemption tutorial"}><source src={asset("Final_video_0811.mp4")} type="video/mp4" /></video>
      </section>
      <SavingsCalculator locale={locale} onGuide={() => showGuide(12)} />
      <section className={styles.bottom} id="bottom-cta-section">
        <div className={styles.heroHeading}>
          <span className={styles.offerBadge}>{t.bottom.badge_combo1010}</span>
          <div className={styles.heroTitleGroup}>
            <h2>{t.bottom.title}</h2>
            <p className={styles.heroDescription}>{t.bottom.subtitle}</p>
          </div>
        </div>
        <DownloadLinks />
      </section>
    </main>
    {showSticky && <a className={styles.stickyCta} href={downloadHref}>{ko ? "앱 전용 첫 구매 혜택 받기" : "Claim Your App-Only Deal"}<img src={asset("chevron-right.svg")} alt="" /></a>}
  </div><div className={styles.footerContainer} style={pageStyle} lang="en"><Footer {...homeFooter} /></div></>;
}
