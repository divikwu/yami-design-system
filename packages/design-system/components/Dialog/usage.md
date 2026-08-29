# Dialog

居中模态弹窗，适用于确认、提醒和短表单。移动端与桌面端都保持居中；筛选、详情、子页面和长内容使用 `Sheet`。

## 基本使用

从 `@yami/design-system` 导入 `Dialog`。传入受控的 `open`、可见标题 `title` 和 `onClose`；默认变体还需传入本地化 `closeLabel`。正文通过 `children` 传入，底部操作通过 `footer` 传入。

确认类弹窗使用 `variant="confirmation"`：标题使用 16px `heading-sm`，标题和短说明共用一个 message 容器并居中显示，不显示关闭按钮，也不使用信息区与 footer 之间的分隔线；用户通过 footer 中的明确操作完成或取消。普通提醒和短任务保持默认变体，并提供 `closeLabel`。

删除、清空等不可恢复操作使用 `role="alertdialog"`，并将唯一的确认操作设为红色 `Button variant="emphasis"`。普通确认和可撤销操作继续使用黑色 `primary`；非破坏性的注意事项不使用红色按钮。

移动端双操作使用等宽双列。出现三个及以上操作时，由 footer 内容改为单列竖排，顺序为主要操作、次要操作、取消；视觉上只保留两个层级，一个 `primary`，其余均使用 `secondary`。不要继续压缩横向按钮。长标题允许自然换行并保持居中。

- 移动端左右保留 16px，弹窗最大宽度为 400px。
- 上下至少保留 48px 及安全区，正文超出后独立滚动，header 与 footer 保持固定。
- footer 统一提供 16px 四周留白并兼容底部安全区；业务传入的操作布局只负责按钮排列和间距。
- `confirmation` 使用更紧凑的间距：message 左右 12px，footer 四周 12px，message 底部保持 8px。
- 默认 `role="dialog"`；需要立即宣读的关键提醒可使用 `role="alertdialog"`。
- 关闭按钮为 32 × 32px、图标为 20 × 20px，并由 Button 保留 44 × 44px 点击热区。

原生 `dialog.showModal()` 提供背景 inert。组件统一处理焦点循环、Esc、遮罩关闭、关闭后的焦点归还和页面滚动锁定。业务层负责操作按钮、确认逻辑和异步状态。

Standalone Figma mapping is not assigned; do not publish a placeholder Code Connect node.
