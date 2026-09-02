"use client";

import { Badge, Button, Card, Checkbox, Input } from "@yami/design-system";
import { useState } from "react";

import type { Locale } from "../lib/locales";
import styles from "./ComponentShowcase.module.css";

export function ComponentShowcase({ locale }: { locale: Locale }) {
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [selected, setSelected] = useState(true);
  const copy = locale === "zh"
    ? {
        badge: "真实组件",
        title: "组件负责行为，Token 负责视觉。",
        description: "输入内容并触发操作，检查组件状态是否保持一致。",
        field: "预览内容",
        placeholder: "输入一个关键词",
        action: "更新预览",
        ready: "预览已更新",
        idle: "等待操作",
        contract: "当前 Catalog",
        components: "30 个组件",
        stable: "14 个稳定组件",
        selected: "选中状态",
        secondary: "次要操作",
      }
    : {
        badge: "Live Components",
        title: "Components own behavior. Tokens own presentation.",
        description: "Enter a value and trigger the action to check the shared component states.",
        field: "Preview Value",
        placeholder: "Enter a keyword",
        action: "Update Preview",
        ready: "Preview updated",
        idle: "Waiting for input",
        contract: "Current Catalog",
        components: "30 components",
        stable: "14 stable components",
        selected: "Selected state",
        secondary: "Secondary",
      };

  return (
    <Card className={styles.demo} padding="lg" surface="secondary">
      <div className={styles.stack}>
        <Badge color="neutral" emphasis="secondary">{copy.badge}</Badge>
        <div className={styles.copy}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
        <div className={styles.componentStrip}>
          <Badge color="red" emphasis="secondary">Badge</Badge>
          <Badge color="neutral" emphasis="secondary">Badge</Badge>
          <label className={styles.checkboxSample}>
            <Checkbox checked={selected} onCheckedChange={(checked) => setSelected(Boolean(checked))} />
            <span>{copy.selected}</span>
          </label>
          <Button variant="secondary" size="sm" onClick={() => setConfirmed(false)}>{copy.secondary}</Button>
        </div>
        <Input
          fullWidth
          label={copy.field}
          placeholder={copy.placeholder}
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            setConfirmed(false);
          }}
        />
        <div className={styles.actionRow}>
          <Button variant="primary" onClick={() => setConfirmed(true)}>{copy.action}</Button>
          <span role="status">{confirmed ? copy.ready : copy.idle}</span>
        </div>
        <div className={styles.catalog}>
          <div>
            <p>{copy.contract}</p>
            <strong>{copy.components}</strong>
          </div>
          <div className={styles.catalogMeta}>
            <span>{copy.stable}</span>
            <div className={styles.swatches} aria-hidden="true">
              <span data-tone="primary" />
              <span data-tone="secondary" />
              <span data-tone="inverse" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
