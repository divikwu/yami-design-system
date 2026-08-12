import styles from "./EmailLegalFooter.module.css";

import type { TopicLandingEmailLocale } from "./TopicLandingEmail";

const socialIcons = {
  tiktok: new URL("./assets/social-tiktok.png", import.meta.url).href,
  instagram: new URL("./assets/social-instagram.svg", import.meta.url).href,
  youtube: new URL("./assets/social-youtube.png", import.meta.url).href,
  community: new URL("./assets/social-message.png", import.meta.url).href,
  redbook: new URL(
    "../../../design-system/assets/icons/social/redbook.svg",
    import.meta.url,
  ).href,
} as const;

const socialLinks = {
  zh: [
    { id: "redbook", label: "小红书", icon: socialIcons.redbook },
    { id: "tiktok", label: "TikTok", icon: socialIcons.tiktok },
    {
      id: "instagram",
      label: "Instagram",
      icon: socialIcons.instagram,
    },
    { id: "youtube", label: "YouTube", icon: socialIcons.youtube },
    {
      id: "community",
      label: "YAMI Community",
      icon: socialIcons.community,
    },
  ],
  en: [
  { id: "tiktok", label: "TikTok", icon: socialIcons.tiktok },
  {
    id: "instagram",
    label: "Instagram",
    icon: socialIcons.instagram,
  },
  { id: "youtube", label: "YouTube", icon: socialIcons.youtube },
  {
    id: "community",
    label: "YAMI Community",
    icon: socialIcons.community,
  },
  ],
} as const;

const copy = {
  zh: { socialHeading: "关注我们 随时随地获得最新资讯" },
  en: { socialHeading: "Follow Us On" },
} as const;

interface EmailLegalFooterProps {
  locale: TopicLandingEmailLocale;
}

export function EmailLegalFooter({ locale }: EmailLegalFooterProps) {
  const localizedCopy = copy[locale];

  return (
    <footer className={styles.root} data-slot="email-legal-footer">
      <section aria-labelledby="email-follow-heading" className={styles.socialSection}>
        <h2 className={styles.heading} id="email-follow-heading">
          {localizedCopy.socialHeading}
        </h2>
        <ul aria-label="Follow YAMI" className={styles.socialList}>
          {socialLinks[locale].map((social) => (
            <li key={social.id}>
              <span
                aria-label={social.label}
                className={[
                  styles.socialLink,
                  social.id === "redbook" ? styles.socialLinkRedbook : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-slot="email-social-item"
                role="img"
              >
                <img alt="" className={styles[`socialIcon${social.id}`]} src={social.icon} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Email terms" className={styles.legalSection}>
        <p>This message was sent to divik.wu@yami.com.</p>
        <p>
          *Free Same-Day Delivery when you spend $49+ before taxes. Same-Day delivery is
          only available in select areas. See site for details.
        </p>
        <p>
          *Pricing, promotions, and availability are subject to change without notice.
          Descriptive, typographic and photographic errors are subject to correction and
          Yami shall have no liability for such errors. Discounted prices and/or promo
          codes are limited time only or while supplies last.
        </p>
        <p>
          To ensure you receive our emails in your inbox, add
          donotreply@email.yamibuy.com to your address book.
        </p>
        <p>© Copyright 2012-2023 Yami. All Rights Reserved.</p>
        <p>
          140 South State College Blvd Suite 300,
          <br />
          Brea, CA 92821
        </p>
        <nav aria-label="Legal">
          <span>Contact Us</span> | <span>Privacy Policy</span> | <span>Unsubscribe</span>
        </nav>
      </section>
    </footer>
  );
}
