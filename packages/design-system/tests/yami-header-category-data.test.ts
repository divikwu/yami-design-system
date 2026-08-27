import { describe, expect, it } from 'vitest'
import { createHeaderCategoryMenu } from '../components/Header/category-menu.fixture'
import type { HeaderCategoryMenuItem } from '../components/Header/Header.types'
import english from '../components/Header/category-menu.en.json'
import chinese from '../components/Header/category-menu.zh.json'
import { categoryMenuImages } from '../components/Header/category-menu.images'

describe('V1 category API snapshots', () => {
  it.each([['en', 111, 448], ['zh', 116, 459]] as const)('preserves the complete %s tree', (locale, secondCount, thirdCount) => {
    const menu = createHeaderCategoryMenu(locale)
    const second = menu.items.flatMap((item) => item.children ?? [])
    const third = second.flatMap((item) => item.children ?? [])
    expect([menu.items.length, second.length, third.length]).toEqual([14, secondCount, thirdCount])
    expect(menu.presentation).toBeUndefined()
    expect(third.every((item) => typeof item.image?.src === 'string' && item.image.src.startsWith('https://cdn.yamibuy.net/'))).toBe(true)
    expect((locale === 'en' ? english : chinese).source.version).toBe('V1')
    function verify(items: HeaderCategoryMenuItem[]) {
      expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
      for (const item of items) {
        expect(item.label).not.toMatch(/[\p{Extended_Pictographic}\p{Regional_Indicator}]/u)
        if (item.href) expect(new URL(item.href).protocol).toMatch(/^https?:$/)
        for (const color of [item.fontColor, item.activeFontColor]) {
          if (color) expect(color).toMatch(/^#(?:[\da-f]{3}|[\da-f]{6})$/i)
        }
        if (item.children) verify(item.children)
        else expect(item.href).toBeTruthy()
      }
    }
    verify(menu.items)
  })

  it('includes the screenshot seasonal branch and real category destinations', () => {
    const menu = createHeaderCategoryMenu('en')
    expect(menu.items.slice(0, 2).map((item) => item.label)).toEqual(['Mooncake', 'Summer Picks'])
    const summer = menu.items[1]
    expect(summer.children?.[0].children?.map((item) => item.label)).toEqual(['Non-alcoholic drinks', 'Fruity Finds', 'Iced Coffee Picks', 'Low-Sugar Drinks'])
    expect(summer.image?.src).toBe(categoryMenuImages['https://cdn.yamibuy.net/itemdescription/3c31ad371785a2911257cbd6b953fe74_0x0.png'])
    const beauty = menu.items.find((item) => item.label === 'Beauty')!
    const toner = beauty.children?.find((item) => item.label === 'Skincare')?.children?.find((item) => item.label === 'Toners')
    expect(new URL(toner?.href ?? '').pathname).toBe('/en/c/toners-skincare/130')
  })

  it('preserves the API image ratios for V2 without inferring them from filenames', () => {
    const englishThird = createHeaderCategoryMenu('en').items.flatMap(item => item.children ?? []).flatMap(item => item.children ?? [])
    const chineseThird = createHeaderCategoryMenu('zh').items.flatMap(item => item.children ?? []).flatMap(item => item.children ?? [])
    expect(englishThird.filter(item => item.imageRatio === 2)).toHaveLength(61)
    expect(englishThird.find(item => item.label === 'Meixin')?.imageRatio).toBe(2)
    expect(englishThird.find(item => item.label === 'Toners')?.imageRatio).toBe(1)
    expect(chineseThird.every(item => item.imageRatio === 1)).toBe(true)
  })

  it.each(['en', 'zh'] as const)('bundles both image states for every %s root', (locale) => {
    const snapshot = locale === 'en' ? english : chinese
    const menu = createHeaderCategoryMenu(locale)
    menu.items.forEach((item, index) => {
      for (const state of ['image', 'activeImage'] as const) {
        const original = snapshot.items[index]![state].src
        expect(item[state]?.src).toBe(categoryMenuImages[original])
        expect(item[state]?.src).toContain('/assets/category-menu/api/')
        expect(item[state]?.src).not.toContain('cdn.yamibuy.net')
      }
      expect(item.activeImage?.src).not.toBe(item.image?.src)
    })
  })

  it('uses the independent Chinese taxonomy and leaves raw copy untouched', () => {
    const menu = createHeaderCategoryMenu('zh')
    expect(menu.items.slice(0, 2).map((item) => item.label)).toEqual(['月饼', '凉夏好物'])
    expect(menu.items[7].label).toBe('厨电家电')
    expect(createHeaderCategoryMenu('en').items[7].label).toBe('Home')
    expect(chinese.items.find((item) => item.label === '美妆')?.children?.[1].label).toBe('返校季特辑✨')
    expect(menu.items.find((item) => item.label === '美妆')?.children?.[1].label).toBe('返校季特辑')
  })

  it('preserves API text colors rather than replacing them with design tokens', () => {
    const menu = createHeaderCategoryMenu('en')
    const beauty = menu.items.find((item) => item.label === 'Beauty')!
    expect(beauty.fontColor).toBe('#222222')
    expect(beauty.activeFontColor).toBe('#ed0000')
    const snack = menu.items.find((item) => item.label === 'Snack')!
    const campaign = snack.children!.find((item) => item.label === 'Back to School Essentials')!
    expect([campaign.fontColor, campaign.activeFontColor]).toEqual(['#0091ff', '#0091ff'])
    const cookies = snack.children!.find((item) => item.label === 'Cookies, Cakes, Desserts')!
    expect(cookies.fontColor).toBe('#222222')
    expect(cookies.activeFontColor).toBeUndefined()
    expect(cookies.children?.[0].activeFontColor).toBe('#ED0000')
  })
})
