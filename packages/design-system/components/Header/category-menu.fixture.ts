import type { HeaderCategoryMenuData, HeaderCategoryMenuItem } from './Header.types'
import english from './category-menu.en.json'
import chinese from './category-menu.zh.json'
import { categoryMenuImages } from './category-menu.images'

/** V1 API snapshots; no live preview-environment dependency in the storefront. */
export function createHeaderCategoryMenu(locale: 'en' | 'zh'): HeaderCategoryMenuData {
  function item(node: HeaderCategoryMenuItem): HeaderCategoryMenuItem {
    return {
      ...node,
      ...(node.image ? { image: { ...node.image, src: categoryMenuImages[node.image.src as string] ?? node.image.src } } : {}),
      ...(node.activeImage ? { activeImage: { ...node.activeImage, src: categoryMenuImages[node.activeImage.src as string]! } } : {}),
      // Keep original API copy in JSON; navigation follows the DS no-emoji rule.
      label: node.label.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu, '').trim(),
      ...(node.children ? { children: node.children.map(item) } : {}),
    }
  }
  return {
    triggerId: 'categories',
    label: locale === 'en' ? 'Browse categories' : '浏览分类',
    closeLabel: locale === 'en' ? 'Close categories' : '关闭分类',
    items: (locale === 'en' ? english : chinese).items.map(item),
  }
}
