import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import '@yami/design-system/styles/fonts.css';
import '@yami/design-system/tokens.css';
import '@yami/design-system/styles/base.css';
import { Header } from '../../../packages/design-system/components/Header/Header';
import { createStorefrontHeader } from '../../../packages/prototypes/pages/storefront-header.fixture';

test.each([1024, 1920])('V2 fills image height for API 2:1 artwork at %i px', async width => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader('en');
  props.categoryMenu!.presentation = 'images';
  async function verifyImageHover(image: HTMLImageElement) {
    const frame = image.parentElement!;
    const label = frame.parentElement!.lastElementChild!;
    const bounds = frame.getBoundingClientRect();
    const scale = () => new DOMMatrixReadOnly(getComputedStyle(image).transform).a;
    await page.elementLocator(frame).hover();
    await expect.poll(scale).toBeCloseTo(1.03, 3);
    expect(frame.getBoundingClientRect().toJSON()).toEqual(bounds.toJSON());
    expect(getComputedStyle(frame).overflow).toBe('hidden');
    await page.elementLocator(label).hover();
    await expect.poll(scale).toBe(1);
    expect(getComputedStyle(label).textDecorationLine).toBe('underline');
  }
  try {
    await page.viewport(width, 800);
    flushSync(() => root.render(<Header {...props} />));
    await page.getByRole('button', { name: 'Categories', exact: true }).click();
    await page.getByRole('button', { name: 'By Brand', exact: true }).click();
    const images = container.querySelectorAll<HTMLImageElement>('[data-level="2"] img');
    expect(images).toHaveLength(5);
    images.forEach(image => {
      const frame = image.parentElement!;
      const bounds = image.getBoundingClientRect();
      const frameBounds = frame.getBoundingClientRect();
      expect(frame.dataset.imageRatio).toBe('2');
      expect(bounds.width).toBe(160);
      expect(bounds.height).toBe(80);
      expect(bounds.top).toBe(frameBounds.top);
      expect(bounds.bottom).toBe(frameBounds.bottom);
      expect(bounds.left + bounds.width / 2).toBeCloseTo(frameBounds.left + frameBounds.width / 2, 1);
      expect(getComputedStyle(frame).overflow).toBe('hidden');
      expect(getComputedStyle(image).objectFit).toBe('contain');
    });
    await verifyImageHover(images[0]!);
    await page.getByRole('button', { name: 'By Region', exact: true }).click();
    container.querySelectorAll<HTMLImageElement>('[data-level="2"] img').forEach(image => {
      expect(image.parentElement!.dataset.imageRatio).toBe('1');
      expect(image.getBoundingClientRect().width).toBe(80);
      expect(image.getBoundingClientRect().height).toBe(80);
    });
    await verifyImageHover(container.querySelector<HTMLImageElement>('[data-level="2"] img')!);
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test.each([
  { width: 1024, locale: 'en' },
  { width: 1280, locale: 'en' },
  { width: 1920, locale: 'en' },
  { width: 1024, locale: 'zh' },
] as const)('V2 image categories at $width px in $locale', async ({ width, locale }) => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const props = createStorefrontHeader(locale);
  props.categoryMenu!.presentation = 'images';
  const menu = () => container.querySelector<HTMLElement>('[data-slot="header-category-menu"]')!;
  const grid = () => menu().querySelector<HTMLElement>('[data-level="2"]')!;
  const links = () => Array.from(grid().querySelectorAll<HTMLAnchorElement>('a'));
  const rootName = locale === 'en' ? 'Beauty' : '美妆';
  const branchName = locale === 'en' ? 'Makeup & Fragrance' : '彩妆香水';
  const branch = props.categoryMenu!.items.find(item => item.label === rootName)!.children!.find(item => item.label === branchName)!;
  try {
    await page.viewport(width, 650);
    flushSync(() => root.render(<Header {...props} />));
    const trigger = page.getByRole('button', { name: locale === 'en' ? 'Categories' : '全部分类', exact: true });
    await trigger.click();
    await page.getByRole('button', { name: rootName, exact: true }).hover();
    await page.getByRole('button', { name: branchName, exact: true }).click();
    expect(menu().dataset.presentation).toBe('images');
    expect(menu().getBoundingClientRect().width).toBe(938);
    expect(menu().getBoundingClientRect().right).toBeLessThanOrEqual(width);
    expect(menu().getBoundingClientRect().bottom).toBeLessThanOrEqual(650);
    expect(getComputedStyle(grid()).gridTemplateColumns.split(' ')).toHaveLength(3);
    expect(getComputedStyle(grid()).overflowY).toBe('auto');
    expect(links()).toHaveLength(branch.children!.length);
    links().forEach((link, index) => {
      expect(link.href).toBe(branch.children![index]!.href);
      expect(link.title).toBe(branch.children![index]!.label);
      const image = link.querySelector('img')!;
      expect(image.getAttribute('src')).toBe(branch.children![index]!.image!.src);
      expect(image.alt).toBe('');
      expect(image.getBoundingClientRect().width).toBe(80);
      expect(image.getBoundingClientRect().height).toBe(80);
    });
    expect(links()[0]!.getBoundingClientRect().top).toBe(links()[2]!.getBoundingClientRect().top);
    expect(links()[3]!.getBoundingClientRect().top).toBeGreaterThan(links()[0]!.getBoundingClientRect().top);

    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => document.activeElement).toBe(links()[0]);
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    expect(document.activeElement).toBe(links()[4]);
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
    expect(document.activeElement).toBe(links()[0]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toBe(branchName);
    await userEvent.keyboard('{ArrowRight}{End}');
    await expect.poll(() => document.activeElement).toBe(links().at(-1));
    // English labels wrap to taller rows; Chinese cards can fit without scrolling.
    if (locale === 'en') expect(grid().scrollTop).toBeGreaterThan(0);
    expect(links().at(-1)!.getBoundingClientRect().bottom).toBeLessThanOrEqual(grid().getBoundingClientRect().bottom);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(links()[0]);

    // Real destination, without navigating the browser test runner away.
    links()[0]!.addEventListener('click', event => event.preventDefault(), { once: true });
    await userEvent.keyboard('{Enter}');
    expect(menu()).toBeNull();

    await trigger.click();
    await page.getByRole('button', { name: rootName, exact: true }).click();
    await page.getByRole('button', { name: branchName, exact: true }).click();
    await page.getByRole('button', { name: locale === 'en' ? 'Skincare' : '面部护肤', exact: true }).hover();
    await expect.poll(() => links()[0]?.textContent).toBe(locale === 'en' ? 'Makeup Remover' : '卸妆');
    expect(grid().scrollTop).toBe(0);
    await page.getByRole('button', { name: locale === 'en' ? 'Beverage' : '饮料', exact: true }).hover();
    await expect.poll(() => menu().dataset.columns).toBe('3');
    await expect.poll(() =>
      menu().querySelector<HTMLElement>('[data-level="1"] [aria-expanded="true"]')?.textContent,
    ).toBe(locale === 'en' ? 'Back to School Essentials' : '返校季特辑');
    expect(grid()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await expect.element(trigger).toHaveFocus();

    await trigger.click();
    await page.viewport(375, 812);
    await expect.poll(menu).toBeNull();
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});
