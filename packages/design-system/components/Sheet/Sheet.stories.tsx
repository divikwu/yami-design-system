import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Sheet, type SheetProps } from "./Sheet";
import styles from "./Sheet.stories.module.css";

const brandOptions = ["SKIN1004", "COSRX", "Anua"];

function SheetDemo({ childView = false, ...args }: SheetProps & { childView?: boolean }) {
  const [open, setOpen] = useState(args.open);
  const [child, setChild] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const entry = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(args.open), [args.open]);
  const goBack = () => {
    setChild(false);
    requestAnimationFrame(() => entry.current?.focus());
  };
  return (
    <div className={styles.screen}>
      <Button onClick={() => { setChild(false); setOpen(true); }}>打开弹窗</Button>
      <Sheet
        {...args}
        open={open}
        title={child ? "品牌" : args.title}
        onClose={() => setOpen(false)}
        back={child ? { label: "返回全部筛选", onClick: goBack } : undefined}
        footer={childView ? (
          <div style={{ padding: "var(--space-200)", borderTop: "var(--stroke-default) solid var(--divider-default)" }}>
            <Button form="full" onClick={() => setOpen(false)}>查看结果</Button>
          </div>
        ) : undefined}
      >
        {childView ? (
          <>
            <div hidden={child}>
              <button ref={entry} className={styles.filterEntry} type="button" onClick={() => setChild(true)}>
                <strong>品牌</strong>
                {selectedBrands.length > 0 && <span className={styles.selectionCount}>已选 {selectedBrands.length} 项</span>}
              </button>
            </div>
            {child && (
              <div className={styles.optionList} role="group" aria-label="品牌选项">
                {brandOptions.map((brand) => (
                  <label className={styles.optionRow} key={brand}>
                    <Checkbox
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={(checked) => setSelectedBrands((current) => (
                        checked ? [...current, brand] : current.filter((item) => item !== brand)
                      ))}
                    />
                    {brand}
                  </label>
                ))}
              </div>
            )}
          </>
        ) : <p style={{ margin: 0 }}>用于在当前页面上方展示补充信息或操作。内容较少时保持半屏，超出最大高度后可在弹窗内滚动。</p>}
      </Sheet>
    </div>
  );
}

const meta = {
  title: "YAMI/Components/Layout/Sheet",
  component: Sheet,
  parameters: { layout: "fullscreen" },
  globals: { locale: "zh", viewport: { value: "yamiMobile", isRotated: false } },
  args: { open: false, title: "底部弹窗", closeLabel: "关闭底部弹窗", onClose: () => {} },
  argTypes: {
    size: { control: "select", options: ["content", "full"] },
    contentPadding: { control: "select", options: ["default", "compact", "none"] },
  },
  render: (args) => <SheetDemo {...args} />,
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = { name: "Mobile — Content" };

export const FullHeight: Story = { name: "Mobile — Full height", args: { size: "full" } };

export const ChildView: Story = {
  name: "Mobile — Child view",
  args: { title: "全部筛选", contentPadding: "compact" },
  render: (args) => <SheetDemo {...args} childView />,
};

export const Desktop: Story = {
  name: "PC — Centered",
  globals: { viewport: { value: "yamiDesktopLg", isRotated: false } },
};
