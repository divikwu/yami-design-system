import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import { Header } from "../../../packages/design-system/components/Header/Header";
import { createStorefrontHeader } from "../../../packages/prototypes/pages/storefront-header.fixture";

test('does not open categories while the pointer passes down through the rail', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const tick = (time: number) => flushSync(() => vi.advanceTimersByTime(time));
  try {
    flushSync(() => root.render(<Header {...createStorefrontHeader('en')} />));
    const trigger = container.querySelector<HTMLElement>('[data-category-trigger]')!;
    const bounds = trigger.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    trigger.dispatchEvent(new PointerEvent('pointerover', {
      bubbles: true, pointerType: 'mouse', clientX: x, clientY: bounds.top + 4,
    }));
    tick(200);
    trigger.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, pointerType: 'mouse', clientX: x, clientY: bounds.top + 12,
    }));
    tick(200);
    trigger.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, pointerType: 'mouse', clientX: x, clientY: bounds.top + 20,
    }));
    trigger.dispatchEvent(new PointerEvent('pointerout', {
      bubbles: true, pointerType: 'mouse', clientX: x, clientY: bounds.bottom,
    }));
    tick(300);
    expect(container.querySelector('[data-slot="header-category-menu"]')).toBeNull();
  } finally {
    vi.useRealTimers();
    root.unmount();
    container.remove();
  }
});

test('opens categories after the pointer settles on a rail item', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const tick = (time: number) => flushSync(() => vi.advanceTimersByTime(time));
  try {
    flushSync(() => root.render(<Header {...createStorefrontHeader('en')} />));
    const trigger = container.querySelector<HTMLElement>('[data-category-trigger]')!;
    const bounds = trigger.getBoundingClientRect();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    trigger.dispatchEvent(new PointerEvent('pointerover', {
      bubbles: true,
      pointerType: 'mouse',
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    }));
    tick(239);
    expect(container.querySelector('[data-slot="header-category-menu"]')).toBeNull();
    tick(1);
    expect(container.querySelector('[data-slot="header-category-menu"]')).not.toBeNull();
  } finally {
    vi.useRealTimers();
    root.unmount();
    container.remove();
  }
});

test.each(['text', 'images'] as const)('%s keeps the selected root category visible when the menu opens from the rail', async presentation => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await page.viewport(1280, 900);
    const props = createStorefrontHeader('en');
    props.categoryMenu!.presentation = presentation;
    flushSync(() => root.render(<Header {...props} />));
    const gifts = container.querySelector<HTMLElement>('[data-category-id="gifts"]')!;
    const menuItemId = gifts.dataset.categoryMenuItem!;
    await page.elementLocator(gifts).hover();
    await expect.poll(() =>
      container.querySelector<HTMLElement>('[data-slot="header-category-menu"]'),
    ).not.toBeNull();
    const rootColumn = container.querySelector<HTMLElement>('[data-level="0"]')!;
    const selected = rootColumn.querySelector<HTMLElement>(`[data-item-id="${menuItemId}"]`)!;
    await expect.poll(() => selected.getAttribute('aria-expanded')).toBe('true');
    expect(rootColumn.scrollTop).toBeGreaterThan(0);
    const scrollPaddingBottom = parseFloat(getComputedStyle(rootColumn).scrollPaddingBottom);
    expect(scrollPaddingBottom).toBe(12);
    expect(selected.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      rootColumn.getBoundingClientRect().top,
    );
    expect(selected.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      rootColumn.getBoundingClientRect().bottom - scrollPaddingBottom,
    );
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each(['text', 'images'] as const)('%s keeps the current branch while the pointer moves diagonally into its submenu', async presentation => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const tick = (time: number) => flushSync(() => vi.advanceTimersByTime(time));
  try {
    await page.viewport(1280, 900);
    const props = createStorefrontHeader('en');
    props.categoryMenu!.presentation = presentation;
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole('button', { name: 'Categories', exact: true }).click();
    const menu = container.querySelector<HTMLElement>('[data-slot="header-category-menu"]')!;
    const activeRoot = menu.querySelector<HTMLElement>('[data-level="0"] [aria-expanded="true"]')!;
    const activeChild = menu.querySelector<HTMLElement>('[data-level="1"] [aria-expanded="true"]')!;
    const candidate = Array.from(menu.querySelectorAll<HTMLElement>('[data-level="0"] button'))
      .find((item) => item.textContent === 'Summer Picks')!;
    await page.elementLocator(activeRoot).hover({ position: { x: 20, y: 10 } });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await page.elementLocator(candidate).hover({
      position: { x: candidate.getBoundingClientRect().width - 20, y: 10 },
    });
    tick(299);
    expect(activeRoot).toHaveAttribute('aria-expanded', 'true');
    await page.elementLocator(activeChild).hover();
    tick(300);
    expect(activeRoot).toHaveAttribute('aria-expanded', 'true');
  } finally {
    vi.useRealTimers();
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each(['text', 'images'] as const)('%s switches sibling categories quickly while the pointer moves vertically', async presentation => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const tick = (time: number) => flushSync(() => vi.advanceTimersByTime(time));
  try {
    await page.viewport(1280, 900);
    const props = createStorefrontHeader('en');
    props.categoryMenu!.presentation = presentation;
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole('button', { name: 'Categories', exact: true }).click();
    const menu = container.querySelector<HTMLElement>('[data-slot="header-category-menu"]')!;
    const activeRoot = menu.querySelector<HTMLElement>('[data-level="0"] [aria-expanded="true"]')!;
    const candidate = Array.from(menu.querySelectorAll<HTMLElement>('[data-level="0"] button'))
      .find((item) => item.textContent === 'Summer Picks')!;
    await page.elementLocator(activeRoot).hover();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await page.elementLocator(candidate).hover();
    tick(59);
    expect(activeRoot).toHaveAttribute('aria-expanded', 'true');
    tick(1);
    expect(candidate).toHaveAttribute('aria-expanded', 'true');
  } finally {
    vi.useRealTimers();
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test('V2 keeps the V1 list-column rhythm and reserves the third column for images', async () => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader('en');
  props.categoryMenu!.presentation = 'images';
  try {
    await page.viewport(1280, 900);
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole('button', { name: 'Categories', exact: true }).click();
    const menu = container.querySelector<HTMLElement>('[data-slot="header-category-menu"]')!;
    const columns = Array.from(menu.querySelectorAll<HTMLElement>('[data-level]'));
    expect(columns).toHaveLength(3);
    expect(columns[0]!.getBoundingClientRect().width).toBe(248);
    expect(columns[1]!.getBoundingClientRect().width).toBe(248);
    expect(columns[2]!.getBoundingClientRect().width).toBe(440);
    expect(columns[2]!.querySelectorAll('img').length).toBeGreaterThan(0);
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each(['text', 'images'] as const)('%s keeps a diagonal route into the panel open', async presentation => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader('en');
  props.categoryMenu!.presentation = presentation;
  const menu = () => container.querySelector<HTMLElement>('[data-slot="header-category-menu"]');
  const tick = (time: number) => flushSync(() => vi.advanceTimersByTime(time));
  function pointer(target: Element, type: string, x: number, y: number, relatedTarget: Element | null = null) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: type === 'pointermove', pointerType: 'mouse', clientX: x, clientY: y, relatedTarget }));
  }
  try {
    await page.viewport(1280, 900);
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole('button', { name: 'Categories', exact: true }).hover();
    await expect.poll(menu).not.toBeNull();
    const trigger = container.querySelector<HTMLElement>('[data-category-trigger]')!;
    const neighbor = container.querySelector<HTMLAnchorElement>('[data-category-id="greater-china"]')!;
    const bounds = trigger.getBoundingClientRect();
    const origin = { x: bounds.left + bounds.width / 2, y: bounds.top + 8 };
    const gap = menu()!.getBoundingClientRect().top - origin.y;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const startRoute = () => {
      pointer(trigger, 'pointermove', origin.x, origin.y);
      pointer(trigger, 'pointerleave', origin.x + 24, origin.y + gap * 0.3, neighbor);
      pointer(neighbor, 'pointermove', origin.x + 24, origin.y + gap * 0.3);
    };
    startRoute();
    tick(250);
    expect(menu()).not.toBeNull();
    pointer(neighbor, 'pointermove', origin.x + 70, origin.y + gap * 0.6);
    tick(250);
    expect(menu()).not.toBeNull();
    pointer(menu()!, 'pointerenter', origin.x + 100, menu()!.getBoundingClientRect().top + 12);
    tick(400);
    expect(menu()).not.toBeNull();

    startRoute();
    tick(349);
    expect(menu()).not.toBeNull();
    tick(1);
    expect(menu()).toBeNull();
    vi.useRealTimers();
    await page.elementLocator(neighbor).hover();
    await page.getByRole('button', { name: 'Categories', exact: true }).hover();
    await expect.poll(menu).not.toBeNull();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    startRoute();
    pointer(neighbor, 'pointermove', origin.x + 70, origin.y - 12);
    tick(199);
    expect(menu()).not.toBeNull();
    tick(1);
    expect(menu()).toBeNull();
    vi.useRealTimers();

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    pointer(menu()!, 'pointerleave', 1000, 850, neighbor);
    tick(500);
    expect(menu()).not.toBeNull();
    vi.useRealTimers();
    await userEvent.keyboard('{Escape}');
    let clicked = false;
    neighbor.addEventListener('click', event => { event.preventDefault(); clicked = true; }, { once: true });
    await page.elementLocator(neighbor).click();
    expect(clicked).toBe(true);
  } finally {
    vi.useRealTimers();
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each(['text', 'images'] as const)('%s Categories opens on mouse hover without stealing focus', async presentation => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader('en');
  props.categoryMenu!.presentation = presentation;
  const menu = () => container.querySelector<HTMLElement>('[data-slot="header-category-menu"]');
  try {
    await page.viewport(1920, 900);
    flushSync(() => root.render(<><Header {...props} /><button>After header</button></>));
    const trigger = page.getByRole('button', { name: 'Categories', exact: true });
    const triggerElement = container.querySelector<HTMLButtonElement>('[data-category-trigger]')!;
    const header = container.querySelector<HTMLElement>('[data-slot="header"]')!;
    const after = container.lastElementChild as HTMLButtonElement;
    after.focus();
    triggerElement.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' }));
    expect(menu()).toBeNull();
    await trigger.hover();
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menu()).not.toBeNull();
    await expect.poll(() => menu()!.dataset.columns).toBe('3');
    expect(menu()!.querySelector('[data-level="1"] [aria-expanded="true"]')).not.toBeNull();
    expect(menu()!.querySelectorAll('[data-level="2"] li').length).toBeGreaterThan(0);
    expect(menu()!.getBoundingClientRect().left).toBeCloseTo(triggerElement.getBoundingClientRect().left, 0);
    expect(menu()!.getBoundingClientRect().top).toBeCloseTo(header.getBoundingClientRect().bottom - 4, 0);
    expect(document.activeElement).toBe(after);
    const homeTrigger = container.querySelector<HTMLAnchorElement>('[data-category-id="home"]')!;
    await page.elementLocator(homeTrigger).hover();
    await expect.poll(() => menu()!.querySelector('[data-level="1"]')!.getBoundingClientRect().left).toBeCloseTo(homeTrigger.getBoundingClientRect().left, 0);
    await expect.poll(() => menu()!.dataset.columns).toBe('3');
    expect(menu()!.getBoundingClientRect().left).toBeGreaterThan(triggerElement.getBoundingClientRect().left);
    await page.getByRole('button', { name: 'Beauty', exact: true }).hover();
    await expect.poll(() => menu()!.querySelector('[data-level="1"]')!.textContent).toContain('Skincare');
    const stableLeft = menu()!.getBoundingClientRect().left;
    await page.getByRole('button', { name: 'Skincare', exact: true }).click();
    await expect.poll(() => menu()!.dataset.columns).toBe('3');
    expect(menu()!.getBoundingClientRect().left).toBeCloseTo(stableLeft, 0);
    expect(menu()!.getBoundingClientRect().right).toBeLessThanOrEqual(
      window.innerWidth - triggerElement.getBoundingClientRect().left,
    );
    const snackTrigger = container.querySelector<HTMLAnchorElement>('[data-category-id="snack"]')!;
    await page.elementLocator(snackTrigger).hover();
    await expect.poll(() => menu()!.getBoundingClientRect().left).toBe(48);
    await trigger.click();
    expect(menu()).not.toBeNull();
    expect(document.activeElement).toBe(menu()!.querySelector('button'));
    await userEvent.keyboard('{Escape}');
    await expect.element(trigger).toHaveFocus();
    expect(menu()).toBeNull();

    await page.getByRole('combobox', { name: 'Search', exact: true }).click();
    expect(container.querySelector('[data-slot="header-search-panel"]')).not.toBeNull();
    // Search's scrim covers the category rail until search is dismissed.
    await userEvent.keyboard('{Escape}');
    await trigger.hover();
    await expect.poll(menu).not.toBeNull();
    expect(container.querySelector('[data-slot="header-search-panel"]')).toBeNull();
    triggerElement.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(menu()!.querySelector('button'));
    await page.viewport(375, 812);
    await expect.poll(menu).toBeNull();
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each([1024, 1280, 1920])("navigates PC categories and preserves mobile behavior at %ipx", async (width) => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const url = window.location.href;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader("en");
  try {
    await page.viewport(width, 900);
    flushSync(() => root.render(<><Header {...props} /><button>After header</button></>));
    const trigger = page.getByRole("button", { name: "Categories", exact: true });
    const getMenu = () => container.querySelector<HTMLElement>('[data-slot="header-category-menu"]');
    const first = () => getMenu()!.querySelector<HTMLElement>('[data-level="0"]')!;
    const second = () => getMenu()!.querySelector<HTMLElement>('[data-level="1"]')!;
    const beautyData = props.categoryMenu!.items.find((item) => item.label === "Beauty")!;
    const beautyIcon = () => Array.from(first().querySelectorAll('button')).find((item) => item.textContent === "Beauty")!.querySelector('img')!;
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect.poll(() => getMenu()?.dataset.columns).toBe("3");
    expect(beautyIcon().getAttribute('src')).toBe(beautyData.image!.src);
    expect(getComputedStyle(beautyIcon().closest('button')!).color).toBe('rgb(34, 34, 34)');
    await page.getByRole("button", { name: "Beauty", exact: true }).hover();
    await expect.poll(() => beautyIcon().getAttribute('src')).toBe(beautyData.activeImage!.src);
    expect(getComputedStyle(beautyIcon().closest('button')!).color).toBe('rgb(34, 34, 34)');
    expect(beautyIcon().getAttribute('src')).toBe(beautyData.activeImage!.src);
    await expect.poll(() => beautyIcon().naturalWidth).toBeGreaterThan(0);
    expect(beautyIcon().getBoundingClientRect().width).toBe(20);
    expect(second().textContent).toContain("Skincare");
    await page.getByRole("button", { name: "Skincare", exact: true }).click();
    await expect.poll(() => getMenu()?.dataset.columns).toBe("3");
    expect(beautyIcon().getAttribute('src')).toBe(beautyData.activeImage!.src);
    expect(getMenu()!.getBoundingClientRect().right).toBeLessThanOrEqual(width);
    expect(getComputedStyle(beautyIcon().closest('button')!).color).toBe('rgb(34, 34, 34)');
    expect(getMenu()!.getBoundingClientRect().height).toBeLessThanOrEqual(548);
    expect(getComputedStyle(first()).overflowY).toBe("auto");
    expect(getComputedStyle(second()).overflowY).toBe("auto");
    const tonerLink = Array.from(getMenu()!.querySelectorAll<HTMLAnchorElement>('a')).find((link) => link.textContent === "Toners")!;
    expect(new URL(tonerLink.href).pathname).toBe("/en/c/toners-skincare/130");
    // Verify the real destination without leaving the test runner for the store.
    tonerLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await page.getByRole("link", { name: "Toners", exact: true }).click();
    expect(getMenu()).toBeNull();

    // Changing a parent must replace the previous third-level panel with its default branch.
    await trigger.click();
    await page.getByRole("button", { name: "Beauty", exact: true }).click();
    await page.getByRole("button", { name: "Skincare", exact: true }).click();
    await page.getByRole("button", { name: "Beverage", exact: true }).hover();
    await expect.poll(() => beautyIcon().getAttribute('src')).toBe(beautyData.image!.src);
    expect(beautyIcon().getAttribute('src')).toBe(beautyData.image!.src);
    expect(getComputedStyle(beautyIcon().closest('button')!).color).toBe('rgb(34, 34, 34)');
    await expect.poll(() => getMenu()?.dataset.columns).toBe("3");
    expect(second().textContent).toContain("All Beverage");
    expect(second().querySelectorAll('li')).toHaveLength(12);
    expect(second().querySelector('[aria-expanded="true"]')).not.toBeNull();
    await page.getByRole("button", { name: "Close categories", exact: true }).click({ position: { x: width - 16, y: 16 } });
    expect(getMenu()).toBeNull();
    expect(document.activeElement).toBe(container.querySelector('[data-category-trigger]'));

    // Keyboard can open and traverse levels without a pointer.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("All Beauty");
    expect(getComputedStyle(beautyIcon().closest('button')!).color).toBe('rgb(34, 34, 34)');
    expect(beautyIcon().getAttribute('src')).toBe(beautyData.activeImage!.src);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    await expect.poll(() => document.activeElement?.textContent).toBe("Makeup Remover");
    await userEvent.keyboard("{End}");
    expect(document.activeElement?.textContent).toBe("Men's Grooming");
    await userEvent.keyboard("{Home}{ArrowLeft}");
    expect(document.activeElement?.textContent).toBe("Skincare");
    await userEvent.keyboard("{Escape}");
    expect(getMenu()).toBeNull();
    await expect.element(trigger).toHaveFocus();

    // Language feeds have different navigation IDs; no stale English column.
    await trigger.click();
    flushSync(() => root.render(<><Header {...createStorefrontHeader("zh")} /><button>After header</button></>));
    await expect.poll(() => first().textContent).toContain("月饼");
    expect(first().querySelector('[aria-expanded="true"]')?.textContent).toBe("月饼");
    expect(second().querySelectorAll('li').length).toBeGreaterThan(0);
    await userEvent.keyboard("{Escape}");
    flushSync(() => root.render(<><Header {...props} /><button>After header</button></>));

    await trigger.click();
    await page.getByRole("combobox", { name: "Search", exact: true }).click();
    expect(getMenu()).toBeNull();
    expect(container.querySelector('[data-slot="header-search-panel"]')).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await trigger.click();
    expect(container.querySelector('[data-slot="header-search-panel"]')).toBeNull();

    await page.viewport(375, 812);
    await expect.poll(getMenu).toBeNull();
    expect(container.querySelector('[data-category-trigger]')).not.toBeVisible();
    // Returning to desktop with the pointer on Categories legitimately reopens it.
    await page.elementLocator(container.querySelector('[data-slot="header-mobile-brand"]')!).hover();
    await page.viewport(width, 900);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    // Opt-out preserves the previous linked category rail.
    flushSync(() => root.render(<Header {...props} categoryMenu={undefined} />));
    expect(container.querySelector('[data-category-trigger]')).toBeNull();
    expect(container.querySelectorAll('[data-slot="header-category"]')).toHaveLength(props.categories.length);
  } finally {
    root.unmount();
    container.remove();
    window.history.replaceState(null, "", url);
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each(['text', 'images'] as const)("%s categories underline hovered labels without changing API colors", async presentation => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader("en");
  props.categoryMenu!.presentation = presentation;
  const element = (name: string) => Array.from(container.querySelectorAll<HTMLElement>('[data-slot="header-category-menu"] button, [data-slot="header-category-menu"] a')).find((item) => item.textContent === name)!;
  const decoration = (item: HTMLElement) => getComputedStyle(item.querySelector('span')!).textDecorationLine;
  try {
    await page.viewport(1280, 900);
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole("button", { name: "Categories", exact: true }).click();
    await page.getByRole("button", { name: "Snack", exact: true }).hover();
    await expect.poll(() => Boolean(element('Back to School Essentials'))).toBe(true);
    expect(getComputedStyle(element('Snack')).color).toBe('rgb(34, 34, 34)');
    expect(decoration(element('Snack'))).toBe('underline');
    expect(getComputedStyle(element('Back to School Essentials')).color).toBe('rgb(0, 145, 255)');
    await page.getByRole("button", { name: "Back to School Essentials", exact: true }).hover();
    expect(getComputedStyle(element('Back to School Essentials')).color).toBe('rgb(0, 145, 255)');
    expect(decoration(element('Back to School Essentials'))).toBe('underline');
    await page.getByRole("button", { name: "Cookies, Cakes, Desserts", exact: true }).hover();
    await expect.poll(() => Boolean(element('Pineapple Cakes & Mochi'))).toBe(true);
    // Empty active_font_color keeps the configured default.
    expect(getComputedStyle(element('Cookies, Cakes, Desserts')).color).toBe('rgb(34, 34, 34)');
    const leaf = element('Pineapple Cakes & Mochi');
    expect(getComputedStyle(leaf).color).toBe('rgb(34, 34, 34)');
    await page.getByRole("link", { name: "Pineapple Cakes & Mochi", exact: true }).hover();
    expect(getComputedStyle(leaf).color).toBe('rgb(34, 34, 34)');
    expect(getComputedStyle(leaf.lastElementChild!).textDecorationLine).toBe('underline');
    await page.getByRole("link", { name: "Cakes, Bread, Pies", exact: true }).hover();
    expect(getComputedStyle(leaf).color).toBe('rgb(34, 34, 34)');
    expect(getComputedStyle(leaf.lastElementChild!).textDecorationLine).toBe('none');
    element('Cookies, Cakes, Desserts').focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => document.activeElement).toBe(leaf);
    expect(getComputedStyle(leaf).color).toBe('rgb(34, 34, 34)');
    await userEvent.keyboard('{Escape}');

    // Callers without API colors retain the existing neutral text style.
    props.categoryMenu!.items = [{ id: 'plain', label: 'Plain category', href: '#' }];
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole("button", { name: "Categories", exact: true }).click();
    const plain = element('Plain category');
    const inheritedColor = getComputedStyle(container.querySelector('[data-slot="header-category-menu"]')!).color;
    expect(getComputedStyle(plain).color).toBe(inheritedColor);
    await page.getByRole("link", { name: "Plain category", exact: true }).hover();
    expect(getComputedStyle(plain).color).toBe(inheritedColor);
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test("keeps the default icon when a caller omits active artwork", async () => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader("en");
  const beauty = props.categoryMenu!.items.find((item) => item.label === "Beauty")!;
  beauty.activeImage = undefined;
  try {
    await page.viewport(1280, 900);
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole("button", { name: "Categories", exact: true }).click();
    await page.getByRole("button", { name: "Beauty", exact: true }).hover();
    await expect.poll(() =>
      container.querySelector<HTMLElement>('[data-level="0"] [aria-expanded="true"]')?.textContent,
    ).toBe('Beauty');
    const icon = container.querySelector<HTMLImageElement>('[data-level="0"] [aria-expanded="true"] img')!;
    expect(icon.getAttribute('src')).toBe(beauty.image!.src);
    await expect.poll(() => icon.naturalWidth).toBeGreaterThan(0);
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test("supports localized categories, viewport height, tab dismissal and sticky headers", async () => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  container.style.minHeight = "1800px";
  document.body.append(container);
  const root = createRoot(container);
  try {
    await page.viewport(1024, 600);
    flushSync(() => root.render(<><Header {...createStorefrontHeader("zh")} style={{ position: "sticky", top: 0 }} /><button>After header</button></>));
    await page.getByRole("button", { name: "全部分类", exact: true }).click();
    await page.getByRole("button", { name: "美妆", exact: true }).click();
    await page.getByRole("button", { name: "面部护肤", exact: true }).click();
    const menu = container.querySelector<HTMLElement>('[data-slot="header-category-menu"]')!;
    const header = container.querySelector<HTMLElement>('[data-slot="header"]')!;
    window.scrollTo({ top: 200, behavior: "instant" });
    await expect.poll(() => menu.getBoundingClientRect().top).toBeCloseTo(header.getBoundingClientRect().bottom - 4, 0);
    expect(menu.getBoundingClientRect().bottom).toBeLessThanOrEqual(600);
    Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-level="2"] a')).at(-1)!.focus();
    await userEvent.tab();
    expect(container.querySelector('[data-slot="header-category-menu"]')).toBeNull();
    await expect.element(page.getByRole("button", { name: "After header" })).toHaveFocus();
  } finally {
    root.unmount();
    container.remove();
    window.scrollTo({ top: 0, behavior: "instant" });
    await page.viewport(viewport.width, viewport.height);
  }
});
