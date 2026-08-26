import styles from "./ActivityPageHeader.module.css";
import type {
  ActivityPageHeaderLocale,
  ActivityPageHeaderProps,
} from "./ActivityPageHeader.types";

const logoEn = new URL(
  "../../assets/logos/yami-ui-en-mobile-fill.svg",
  import.meta.url,
).href;
const searchIcon = new URL(
  "../../assets/icons/action/search.svg",
  import.meta.url,
).href;
const cartIcon = new URL(
  "../../assets/icons/base/cart.svg",
  import.meta.url,
).href;

const mobileLogo = { src: logoEn, alt: "YAMI", width: 73.5 };
const logos: Record<ActivityPageHeaderLocale, typeof mobileLogo> = {
  en: mobileLogo,
  zh: mobileLogo,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Mobile navigation for campaign and editorial landing pages. */
export function ActivityPageHeader({
  title,
  locale = "en",
  homeHref,
  searchLabel = "Search",
  cartLabel = "Shopping cart",
  onSearch,
  onCart,
  className,
  ...rest
}: ActivityPageHeaderProps) {
  const logo = logos[locale];
  const logoImage = (
    <img
      className={styles.logo}
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={28}
    />
  );

  return (
    <header
      {...rest}
      className={cx(styles.root, className)}
      data-slot="activity-page-header"
    >
      <div className={styles.bar} data-slot="activity-page-header-bar">
        <div className={styles.branding} data-slot="activity-page-header-branding">
          {homeHref ? (
            <a
              className={styles.brand}
              href={homeHref}
              data-slot="activity-page-header-brand"
            >
              {logoImage}
            </a>
          ) : (
            <span className={styles.brand} data-slot="activity-page-header-brand">
              {logoImage}
            </span>
          )}
        </div>

        <div className={styles.titleArea}>
          <h1 className={styles.title} data-slot="activity-page-header-title">
            {title}
          </h1>
        </div>

        <div className={styles.actions} data-slot="activity-page-header-actions">
          <button
            className={styles.action}
            type="button"
            aria-label={searchLabel}
            onClick={onSearch}
            data-slot="activity-page-header-search"
          >
            <span
              className={styles.icon}
              aria-hidden="true"
              style={{ ["--activity-header-icon" as string]: `url("${searchIcon}")` }}
            />
          </button>
          <button
            className={styles.action}
            type="button"
            aria-label={cartLabel}
            onClick={onCart}
            data-slot="activity-page-header-cart"
          >
            <span
              className={styles.icon}
              aria-hidden="true"
              style={{ ["--activity-header-icon" as string]: `url("${cartIcon}")` }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
