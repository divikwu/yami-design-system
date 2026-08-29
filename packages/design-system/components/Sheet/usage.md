# Sheet

统一的模态容器：移动端底部弹窗，桌面端居中弹窗。商品详情说明、搜索全部筛选、快捷筛选共用此组件。

## 基本使用

从 `@yami/design-system` 导入 `Sheet`。传入 `open`、`title`、本地化的 `closeLabel` 和 `onClose`；在 `onClose` 中将 `open` 设为 `false`。正文通过 `children` 传入，固定底部操作通过 `footer` 传入。组件不管理业务数据或应用/取消逻辑。

- `size="content"`：移动端至少占动态可见视口的一半，内容可增长到顶部安全区域下方；顶部至少保留 48px，超出后正文内部滚动。
- `size="full"`：移动端填满同一高度上限，顶部保留 48px 或更大的安全区。适用于商品规格、配料、营养成分表和免责声明。
- `contentPadding="compact"`：正文四周使用 8px 内边距，适合内部行也保留 8px 的紧凑列表。
- `contentPadding="none"`：正文由列表自行提供内边距；默认正文有 16px 水平内边距。
- 桌面端统一为最大 560px 的居中弹窗。PDP 由业务适配层在进入桌面断点时关闭弹窗，恢复页内说明。

## 子弹窗

子弹窗是同一个 Sheet 的子页面，不新增遮罩。更新 `title` 和正文并传入 `back={{ label, onClick }}`，关闭按钮会替换为返回按钮。进入子页面时聚焦返回按钮并将正文滚动到顶部；返回按钮与 Escape 都回到父页面，点击遮罩关闭整个弹层。

筛选草稿、返回后的入口焦点和父页面滚动位置由业务页面维护；保持父页面内容挂载但隐藏，可以保留其控件状态。搜索全部筛选已提供这套接入示例。

## 交互与边界

原生 `dialog.showModal()` 提供顶层展示和背景 inert；组件统一处理 Tab 循环、关闭后的焦点归还、背景滚动锁定、独立正文滚动与安全区。标题和按钮使用 YAMI tokens；关闭/返回按钮的可见尺寸为 32 × 32px，内部图标为 20 × 20px，并由 Button 的透明扩展层保留 44 × 44px 点击热区。

主题由语义 tokens 继承，不传 `dark`。传入实际内容语言的 `lang` 或放在有 `lang` 的父节点内。搜索快捷筛选在桌面仍用锚点 Popover，在移动端使用 Sheet。图片预览保留独立组件，不属于此次统一范围。

Standalone Figma mapping is not assigned; do not publish a placeholder Code Connect node.
