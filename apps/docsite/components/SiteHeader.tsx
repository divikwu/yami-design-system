"use client";

import {
  Github01Icon,
  LanguageSquareIcon,
  Menu01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@yami/design-system";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";

import type { SiteCopy } from "../content/site";
import type { Locale } from "../lib/locales";
import { localizedPath, swapLocalePathname } from "../lib/locales";
import type { SearchEntry } from "../lib/search";
import { githubUrl, storybookUrl } from "../lib/site-config";
import { logoAssets } from "./assets";
import { DocsSidebarNav } from "./DocsSidebarNav";
import type { DocNavItem } from "./DocsMobileControls";
import { NavigationDrawer } from "./NavigationDrawer";
import { SearchPanel } from "./SearchPanel";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteHeader.module.css";

type HeaderCopy = Pick<SiteCopy, "nav" | "utilities" | "docs">;

interface SiteHeaderProps {
  locale: Locale;
  copy: HeaderCopy;
  searchEntries: SearchEntry[];
  docNavigation: DocNavItem[];
}

function activeNav(pathname: string, locale: Locale): "home" | "docs" | "blog" {
  if (pathname.startsWith(`/${locale}/docs`)) return "docs";
  if (pathname.startsWith(`/${locale}/blog`)) return "blog";
  return "home";
}

export function SiteHeader({ locale, copy, searchEntries, docNavigation }: SiteHeaderProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [homeSurfaceMode, setHomeSurfaceMode] = useState(false);
  const current = activeNav(pathname, locale);
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const otherLocale: Locale = locale === "zh" ? "en" : "zh";
  const languageHref = swapLocalePathname(pathname, otherLocale);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    setMenuReady(true);
    const desktop = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setHomeSurfaceMode(false);
      return;
    }

    let frame: number | undefined;
    const updateSurface = () => {
      if (frame !== undefined) return;
      frame = window.requestAnimationFrame(() => {
        const header = document.querySelector<HTMLElement>('[data-testid="site-header"]');
        const showcase = document.querySelector<HTMLElement>("[data-home-showcase]");
        if (header && showcase) {
          setHomeSurfaceMode(showcase.getBoundingClientRect().top <= header.getBoundingClientRect().height);
        }
        frame = undefined;
      });
    };

    updateSurface();
    window.addEventListener("scroll", updateSurface, { passive: true });
    window.addEventListener("resize", updateSurface, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateSurface);
      window.removeEventListener("resize", updateSurface);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [isHome]);

  const navItems = [
    { key: "home" as const, label: copy.nav.home, href: localizedPath(locale) },
    { key: "docs" as const, label: copy.nav.docs, href: localizedPath(locale, "/docs/getting-started") },
    { key: "blog" as const, label: copy.nav.blog, href: localizedPath(locale, "/blog") },
  ];

  function preserveHash(event: MouseEvent<HTMLAnchorElement>): void {
    if (!window.location.hash) return;
    event.preventDefault();
    window.location.assign(`${languageHref}${window.location.hash}`);
  }

  return (
    <>
      <header
        className={styles.header}
        data-home={isHome ? "true" : undefined}
        data-surface={isHome ? (homeSurfaceMode ? "page" : "hero") : undefined}
        data-testid="site-header"
      >
        <a className="skip-link" href="#main-content">
          {locale === "zh" ? "跳至正文" : "Skip to Content"}
        </a>
        <div className={styles.inner}>
          <Link className={styles.brand} href={localizedPath(locale)} aria-label="YAMI Design System">
            <img className={`${styles.logo} ${styles.logoLight}`} src={logoAssets.en.mobile.light} alt="YAMI" />
            <img className={`${styles.logo} ${styles.logoDark}`} src={logoAssets.en.mobile.dark} alt="YAMI" />
          </Link>

          <nav className={styles.desktopNav} aria-label={copy.nav.label}>
            {navItems.map((item) => (
              <Link
                key={item.key}
                className={styles.navLink}
                href={item.href}
                aria-current={current === item.key ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.tools}>
            <Button
              variant="tertiary"
              form="icon"
              size="sm"
              aria-label={copy.utilities.search}
              title={copy.utilities.search}
              onClick={() => setSearchOpen(true)}
            >
              <HugeiconsIcon
                className={styles.actionIcon}
                icon={Search01Icon}
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Button>
            <Link
              className={styles.utilityIconLink}
              href={languageHref}
              hrefLang={otherLocale}
              aria-label={copy.utilities.language}
              title={copy.utilities.language}
              onClick={preserveHash}
            >
              <HugeiconsIcon
                className={styles.actionIcon}
                icon={LanguageSquareIcon}
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
            <ThemeToggle
              compact
              lightLabel={copy.utilities.lightMode}
              darkLabel={copy.utilities.darkMode}
              themeLabel={copy.utilities.theme}
            />
            <a
              className={styles.utilityIconLink}
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={copy.utilities.github}
              title={copy.utilities.github}
            >
              <HugeiconsIcon
                className={styles.actionIcon}
                icon={Github01Icon}
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </a>
            <Button
              className={styles.menuButton}
              variant="tertiary"
              form="icon"
              size="sm"
              aria-label={copy.utilities.menu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              disabled={!menuReady}
              onClick={() => setMenuOpen(true)}
            >
              <HugeiconsIcon
                className={styles.actionIcon}
                icon={Menu01Icon}
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </header>

      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        entries={searchEntries}
        copy={{
          title: copy.utilities.search,
          placeholder: copy.utilities.searchPlaceholder,
          hint: copy.utilities.searchHint,
          navigate: copy.utilities.searchNavigate,
          select: copy.utilities.searchSelect,
          noResults: copy.utilities.noResults,
          close: copy.utilities.close,
          groupLabels: { page: copy.nav.home, doc: copy.nav.docs, blog: copy.nav.blog },
        }}
      />

      <NavigationDrawer
        open={menuOpen}
        title={copy.utilities.menu}
        closeLabel={copy.utilities.close}
        onClose={() => setMenuOpen(false)}
        homeHref={localizedPath(locale)}
      >
        <nav className={styles.mobileNav} aria-label={copy.nav.label}>
          {navItems.map((item) => (
            <Link
              key={item.key}
              className={styles.mobileNavLink}
              href={item.href}
              aria-current={current === item.key ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {current === "docs" ? (
          <div className={styles.drawerDocs}>
            <DocsSidebarNav
              label={copy.docs.label}
              groups={copy.docs.groups}
              items={docNavigation.map((item) => ({ ...item, current: pathname === item.href }))}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        ) : null}
        <div className={styles.mobileUtilities}>
          <Link className={styles.mobileNavLink} href={languageHref} onClick={preserveHash}>{copy.utilities.language}</Link>
          <ThemeToggle
            compact
            lightLabel={copy.utilities.lightMode}
            darkLabel={copy.utilities.darkMode}
            themeLabel={copy.utilities.theme}
          />
          <a className={styles.mobileNavLink} href={storybookUrl} target="_blank" rel="noreferrer">{copy.utilities.storybook}</a>
          <a className={styles.mobileNavLink} href={githubUrl} target="_blank" rel="noreferrer">{copy.utilities.github}</a>
        </div>
      </NavigationDrawer>
    </>
  );
}
