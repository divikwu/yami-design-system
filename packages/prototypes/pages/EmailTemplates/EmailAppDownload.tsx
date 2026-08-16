import styles from "./EmailAppDownload.module.css";

import type { TopicLandingEmailLocale } from "./TopicLandingEmail";

const phoneArtwork = new URL("./assets/app-download-phone.png", import.meta.url).href;
const appStoreIcon = new URL("./assets/app-store.svg", import.meta.url).href;
const googlePlayIcon = new URL("./assets/google-play.svg", import.meta.url).href;

const appLinks = [
  {
    id: "app-store",
    label: "App Store",
    icon: appStoreIcon,
    iconClassName: styles.appStoreIcon,
  },
  {
    id: "google-play",
    label: "Google Play",
    icon: googlePlayIcon,
    iconClassName: undefined,
  },
] as const;

const copy = {
  zh: {
    heading: "下载YAMI App",
    description: "体验最优专属购物体验和最低优惠",
  },
  en: {
    heading: "Collect Points and Earn Rewards",
    description:
      "Order in the app to earn free rewards, get exclusive offers, and track your points.",
  },
} as const;

interface EmailAppDownloadProps {
  locale: TopicLandingEmailLocale;
}

export function EmailAppDownload({ locale }: EmailAppDownloadProps) {
  const localizedCopy = copy[locale];

  return (
    <section
      aria-labelledby="email-app-download-heading"
      className={styles.root}
      data-slot="email-app-download"
    >
      <div className={styles.content}>
        <h2 className={styles.heading} id="email-app-download-heading">
          {localizedCopy.heading}
        </h2>
        <p className={styles.description}>
          {locale === "zh" ? (
            <>
              体验最优专属购物体验
              <br />
              和最低优惠
            </>
          ) : (
            localizedCopy.description
          )}
        </p>
        <div className={styles.appList}>
          {appLinks.map((app) => (
            <div
              className={styles.appButton}
              data-slot="email-app-download-button"
              key={app.id}
            >
              <img
                alt=""
                className={[styles.appIcon, app.iconClassName].filter(Boolean).join(" ")}
                src={app.icon}
              />
              <span>{app.label}</span>
            </div>
          ))}
        </div>
      </div>
      <img alt="YAMI mobile app" className={styles.phoneArtwork} src={phoneArtwork} />
    </section>
  );
}
