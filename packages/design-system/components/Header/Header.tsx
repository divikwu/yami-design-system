'use client'

/**
 * Header — YAMI PC global navigation bar.
 *
 * Mirrors the YAMI UI/UX Guidelines Figma file (`5777:562353`) and the
 * production www.yami.com/en chrome: a two-row band measuring 130.6px.
 *
 *   Row 1 (64px + 1px rule) — brand lockup · hall switcher · locale ·
 *                             deliver-to · search · account · cart
 *   Row 2 (63.6px + 2px rule) — category rail with edge paging
 *
 * Below 1024px (`--breakpoints-desktop`) the band swaps to the mobile chrome
 * from Figma `2725:151904` — a 56px brand bar (lockup · deliver-to · inbox)
 * over a 36px search field on its own row. It is a different anatomy, not a
 * reflow of the PC one: no hall switcher, no locale flag, no account, no cart,
 * and no category rail. Both trees are rendered and `@media` picks one, so the
 * component stays server-renderable with no width probe.
 *
 * Category entries are `<img>` artwork driven by `categories[].image`, not
 * icon components — campaign teams reskin categories without a code change.
 * The leading "Categories" entry is the sole exception and uses a glyph,
 * matching production.
 *
 * See meta.json for the structured spec, usage.md for narrative.
 */

import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import { ResponsiveImage } from '../ResponsiveImage'

import styles from './Header.module.css'
import { HeaderCategoryRail } from './HeaderCategoryRail'
import { HeaderCategoryMenu } from './HeaderCategoryMenu'
import { HeaderSearch } from './HeaderSearch'
import type { HeaderImage, HeaderProps } from './Header.types'

const accountIcon = new URL('../../assets/icons/base/account.svg', import.meta.url).href
const cartIcon = new URL('../../assets/icons/base/cart.svg', import.meta.url).href
const zipcodeIcon = new URL('../../assets/icons/base/zipcode.svg', import.meta.url).href
const messageIcon = new URL('../../assets/icons/base/message.svg', import.meta.url).href
const searchIcon = new URL('../../assets/icons/action/search.svg', import.meta.url).href

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Brand lockup with a dark-surface counterpart.
 *
 * The lockup stays one locked asset per theme — the mark and wordmark are never
 * assembled in code, which the brand guidelines forbid. Only *which file* is
 * shown varies, and `.dark` picks it in CSS so the component needs no theme
 * probe. Both carry the real `alt`: the hidden one is `display: none` and so is
 * out of the accessibility tree, leaving exactly one accessible name.
 */
function BrandLockup({
  className,
  darkImage,
  height,
  image,
}: {
  className: string
  darkImage: HeaderImage | undefined
  height: number
  image: HeaderImage
}) {
  if (!darkImage) {
    return <ResponsiveImage className={className} source={image.src} alt={image.alt} height={height} />
  }

  return (
    <>
      <ResponsiveImage
        className={cx(className, styles.logoLight)}
        data-theme="light"
        source={image.src}
        alt={image.alt}
        height={height}
      />
      <ResponsiveImage
        className={cx(className, styles.logoDark)}
        data-theme="dark"
        source={darkImage.src}
        alt={darkImage.alt}
        height={height}
      />
    </>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m3 4.5 3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Header({
  mobileVariant = 'default',
  logo,
  mobileLogo,
  darkLogo,
  darkMobileLogo,
  homeHref,
  halls = [],
  hallId,
  onHallChange,
  zipcode,
  categories,
  categoryMenu,
  searchPlaceholder = 'Search',
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
  searchPanel,
  mobileSearchHref,
  onScan,
  account,
  locale,
  cart,
  inbox,
  ariaLabel = 'YAMI',
  hallsLabel = 'Storefront',
  categoriesLabel = 'Shop by category',
  searchLabel = 'Search',
  scanLabel = 'Search by photo',
  nextCategoriesLabel = 'More categories',
  previousCategoriesLabel = 'Previous categories',
  imageLoadingStrategy = 'native',
  className,
  style,
  ref: forwardedRef,
  ...rest
}: HeaderProps) {
  const [uncontrolledHallId, setUncontrolledHallId] = useState(() => halls[0]?.id)
  const isHallControlled = hallId !== undefined
  const activeHallId = isHallControlled ? hallId : uncontrolledHallId
  const [overlay, setOverlay] = useState<'search' | 'categories' | null>(null)
  const [categoryMenuAutoFocus, setCategoryMenuAutoFocus] = useState(false)
  const [categoryMenuKeyboard, setCategoryMenuKeyboard] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string>()
  const [activeCategoryMenuItemId, setActiveCategoryMenuItemId] = useState<string>()
  const [categoryMenuTriggerElement, setCategoryMenuTriggerElement] = useState<HTMLElement | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  useImperativeHandle(forwardedRef, () => headerRef.current!, [])
  const categoryMenuAnchorRef = useRef<HTMLButtonElement>(null)
  const categoryPanelId = useId()
  const hasCategoryMenu = Boolean(categoryMenu?.items.length && categories.some((item) => item.id === categoryMenu.triggerId))

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnMobile = () => { if (!desktop.matches) setOverlay(null) }
    desktop.addEventListener('change', closeOnMobile)
    return () => desktop.removeEventListener('change', closeOnMobile)
  }, [])

  const closeCategories = useCallback((restoreFocus = false) => {
    setOverlay(null)
    setActiveCategoryId(undefined)
    setActiveCategoryMenuItemId(undefined)
    if (restoreFocus) categoryMenuTriggerElement?.focus()
  }, [categoryMenuTriggerElement])

  function openCategories(
    categoryId: string,
    menuItemId: string | undefined,
    triggerElement: HTMLElement,
    focusMenu: boolean,
    keyboard = false,
  ) {
    setActiveCategoryId(categoryId)
    setActiveCategoryMenuItemId(menuItemId)
    setCategoryMenuTriggerElement(triggerElement)
    setCategoryMenuAutoFocus(focusMenu)
    setCategoryMenuKeyboard(keyboard)
    setOverlay('categories')
  }

  function selectHall(id: string) {
    if (!isHallControlled) setUncontrolledHallId(id)
    onHallChange?.(id)
  }

  return (
    <header
      {...rest}
      ref={headerRef}
      className={cx(
        styles.root,
        mobileVariant === 'pdp' && styles.rootPdpMobile,
        className,
      )}
      data-slot="header"
      data-overlay={overlay ?? undefined}
      aria-label={ariaLabel}
      style={style}
    >
      <div
        className={cx(styles.mobileBand, mobileVariant === 'pdp' && styles.mobileBandPdp)}
        data-slot="header-mobile"
        data-mobile-variant={mobileVariant}
      >
        <div className={styles.mobileBar} data-slot="header-mobile-bar">
          <a className={styles.mobileBrand} href={homeHref} data-slot="header-mobile-brand">
            <BrandLockup
              className={styles.mobileLogo}
              height={28}
              image={mobileLogo ?? logo}
              darkImage={darkMobileLogo ?? darkLogo}
            />
          </a>

          <div
            className={cx(styles.mobileActions, styles.mobileDefaultActions)}
            data-slot="header-mobile-actions"
          >
            {zipcode && (
              <a
                className={styles.mobileAction}
                href={zipcode.href}
                data-slot="header-mobile-zipcode"
                aria-label={`${zipcode.label} ${zipcode.code}`}
              >
                <span
                  className={styles.mobileActionIcon}
                  aria-hidden="true"
                  style={{ ['--mobile-action-icon' as string]: `url("${zipcodeIcon}")` }}
                />
                <span className={styles.mobileActionLabel} aria-hidden="true">
                  {zipcode.code}
                </span>
              </a>
            )}

            {inbox && (
              <a
                className={styles.mobileAction}
                href={inbox.href}
                data-slot="header-mobile-inbox"
                aria-label={inbox.label}
              >
                <span
                  className={styles.mobileActionIcon}
                  aria-hidden="true"
                  style={{ ['--mobile-action-icon' as string]: `url("${messageIcon}")` }}
                />
                <span className={styles.mobileActionLabel} aria-hidden="true">
                  {inbox.label}
                </span>
              </a>
            )}
          </div>

          {mobileVariant === 'pdp' && (
            <div
              className={cx(styles.mobileActions, styles.mobilePdpActions)}
              data-slot="header-mobile-pdp-actions"
            >
              {zipcode && (
                <a
                  className={styles.mobileAction}
                  href={zipcode.href}
                  data-slot="header-mobile-pdp-zipcode"
                  aria-label={`${zipcode.label} ${zipcode.code}`}
                >
                  <span
                    className={styles.mobileActionIcon}
                    aria-hidden="true"
                    style={{ ['--mobile-action-icon' as string]: `url("${zipcodeIcon}")` }}
                  />
                  <span className={styles.mobileActionLabel} aria-hidden="true">
                    {zipcode.code}
                  </span>
                </a>
              )}
              <a
                className={styles.mobileAction}
                href={mobileSearchHref}
                data-slot="header-mobile-search-action"
                aria-label={searchLabel}
              >
                <span
                  className={styles.mobileActionIcon}
                  aria-hidden="true"
                  style={{ ['--mobile-action-icon' as string]: `url("${searchIcon}")` }}
                />
              </a>
              <a
                className={styles.mobileAction}
                href={cart.href}
                data-slot="header-mobile-cart"
                aria-label={`${cart.label}, ${cart.count ?? 0}`}
              >
                <span
                  className={styles.mobileActionIcon}
                  aria-hidden="true"
                  style={{ ['--mobile-action-icon' as string]: `url("${cartIcon}")` }}
                />
              </a>
            </div>
          )}
        </div>

        <div className={styles.mobileSearchRow} data-slot="header-mobile-search-row">
          <HeaderSearch
            variant="mobile"
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={onSearchValueChange}
            onSubmit={onSearchSubmit}
            searchLabel={searchLabel}
            openHref={mobileSearchHref}
            scanLabel={scanLabel}
            onScan={onScan}
          />
        </div>
      </div>

      <div className={styles.utilityRow} data-slot="header-utility">
        <div className={styles.brandGroup} data-slot="header-brand-group">
          <a className={styles.brand} href={homeHref} data-slot="header-brand">
            <BrandLockup
              className={styles.logo}
              height={52}
              image={logo}
              darkImage={darkLogo}
            />
          </a>

          {halls.length === 0 && zipcode && (
            <span className={styles.brandDivider} aria-hidden="true" />
          )}

          {halls.length > 0 && (
            <div className={styles.halls} role="radiogroup" aria-label={hallsLabel} data-slot="header-halls">
              {halls.map((hall) => (
                <button
                  key={hall.id}
                  className={styles.hallButton}
                  type="button"
                  role="radio"
                  aria-checked={hall.id === activeHallId}
                  data-selected={hall.id === activeHallId || undefined}
                  onClick={() => selectHall(hall.id)}
                >
                  {hall.label}
                </button>
              ))}
            </div>
          )}

          <div className={styles.locationGroup} data-slot="header-location-group">
            <a
              className={styles.locale}
              href={locale.href}
              data-slot="header-locale"
              aria-label={locale.label}
            >
              <ResponsiveImage
                className={styles.flag}
                source={locale.flag.src}
                alt={locale.flag.alt}
                width={20}
                height={20}
              />
              <span className={styles.localeLabel} aria-hidden="true">
                {locale.label}
              </span>
            </a>

            {zipcode && (
              <a
                className={styles.zipcode}
                href={zipcode.href}
                data-slot="header-zipcode"
                aria-label={`${zipcode.label} ${zipcode.code}`}
              >
                <span
                  className={styles.zipcodeIcon}
                  data-slot="header-zipcode-icon"
                  aria-hidden="true"
                  style={{ ['--zipcode-icon' as string]: `url("${zipcodeIcon}")` }}
                />
                <span aria-hidden="true">{zipcode.code}</span>
              </a>
            )}
          </div>
        </div>

        <HeaderSearch
          placeholder={searchPlaceholder}
          value={searchValue}
          onValueChange={onSearchValueChange}
          onSubmit={onSearchSubmit}
          searchLabel={searchLabel}
          panel={searchPanel}
          open={overlay === 'search'}
          onOpenChange={(open) => setOverlay(open ? 'search' : null)}
        />

        <div className={styles.actions} data-slot="header-actions">
          <a className={styles.account} href={account.href} data-slot="header-account">
            <span
              className={styles.accountIcon}
              data-slot="header-account-icon"
              aria-hidden="true"
              style={{ ['--account-icon' as string]: `url("${accountIcon}")` }}
            />
            <span className={styles.accountLabel}>{account.label}</span>
            <ChevronDownIcon />
          </a>

          <a
            className={styles.cart}
            href={cart.href}
            data-slot="header-cart"
            aria-label={`${cart.label}, ${cart.count ?? 0}`}
          >
            <span
              className={styles.cartIcon}
              data-slot="header-cart-icon"
              aria-hidden="true"
              style={{ ['--cart-icon' as string]: `url("${cartIcon}")` }}
            />
          </a>
        </div>
      </div>

      <div className={styles.railRow} data-slot="header-rail-row">
        <HeaderCategoryRail
          categories={categories}
          ariaLabel={categoriesLabel}
          previousLabel={previousCategoriesLabel}
          nextLabel={nextCategoriesLabel}
          imageLoadingStrategy={imageLoadingStrategy}
          menuTrigger={hasCategoryMenu && categoryMenu ? {
            id: categoryMenu.triggerId,
            panelId: categoryPanelId,
            open: overlay === 'categories',
            activeCategoryId,
            anchorRef: categoryMenuAnchorRef,
            onOpen: (categoryId, menuItemId, triggerElement, focusMenu) => {
              openCategories(categoryId, menuItemId, triggerElement, focusMenu, focusMenu)
            },
            onToggle: (triggerElement, keyboard) => {
              if (
                overlay === 'categories' &&
                activeCategoryId === categoryMenu.triggerId &&
                categoryMenuAutoFocus
              ) {
                closeCategories()
              } else {
                openCategories(categoryMenu.triggerId, undefined, triggerElement, true, keyboard)
              }
            },
            onClose: () => closeCategories(),
          } : undefined}
        />
      </div>
      {hasCategoryMenu && categoryMenu && overlay === 'categories' && (
        <HeaderCategoryMenu
          id={categoryPanelId}
          data={categoryMenu}
          headerRef={headerRef}
          anchorRef={categoryMenuAnchorRef}
          triggerElement={categoryMenuTriggerElement}
          initialItemId={activeCategoryMenuItemId}
          autoFocus={categoryMenuAutoFocus}
          keyboardOpen={categoryMenuKeyboard}
          onClose={closeCategories}
        />
      )}
    </header>
  )
}
