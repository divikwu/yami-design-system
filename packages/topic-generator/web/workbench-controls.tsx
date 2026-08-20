"use client";

import { Select } from "@base-ui/react/select";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import styles from "./workbench-controls.module.css";

export interface WorkbenchSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface WorkbenchTextFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export function WorkbenchTextField({
  label,
  id,
  className,
  ...props
}: WorkbenchTextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputClassName = [styles.textInput, className].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label
        className={styles.label}
        data-slot="workbench-field-label"
        htmlFor={inputId}
      >
        {label}
      </label>
      <input {...props} id={inputId} className={inputClassName} />
    </div>
  );
}
export interface WorkbenchSelectProps {
  label: ReactNode;
  options: readonly WorkbenchSelectOption[];
  value: string;
  onValueChange(value: string): void;
  disabled?: boolean;
  name?: string;
}

export function WorkbenchSelect({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  name,
}: WorkbenchSelectProps) {
  return (
    <div className={styles.field}>
      <Select.Root
        items={options}
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onValueChange(nextValue);
        }}
        disabled={disabled}
        name={name}
      >
        <Select.Label className={styles.label} data-slot="workbench-field-label">
          {label}
        </Select.Label>
        <Select.Trigger
          className={styles.selectTrigger}
          data-slot="workbench-select-trigger"
          data-value={value}
        >
          <Select.Value className={styles.selectValue} />
          <Select.Icon className={styles.selectIcon}>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              aria-hidden="true"
              data-slot="workbench-select-icon"
              size={12}
              strokeWidth={1.5}
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.selectPositioner}
            sideOffset={4}
            align="start"
            alignItemWithTrigger={false}
          >
            <Select.Popup className={styles.selectPopup} data-slot="workbench-select-popup">
              <Select.List className={styles.selectList}>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={styles.selectItem}
                    data-value={option.value}
                  >
                    <Select.ItemText className={styles.selectItemText}>
                      {option.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export type WorkbenchButtonVariant = "secondary" | "emphasis";
export type WorkbenchButtonSize = "compact" | "default";

export interface WorkbenchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: WorkbenchButtonVariant;
  size?: WorkbenchButtonSize;
}

export function WorkbenchButton({
  variant = "secondary",
  size = "compact",
  type = "button",
  className,
  ...props
}: WorkbenchButtonProps) {
  const buttonClassName = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return <button {...props} type={type} className={buttonClassName} />;
}

export interface WorkbenchLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: WorkbenchButtonVariant;
  size?: WorkbenchButtonSize;
}

export function WorkbenchLink({
  variant = "secondary",
  size = "compact",
  className,
  ...props
}: WorkbenchLinkProps) {
  const linkClassName = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return <a {...props} className={linkClassName} />;
}

export interface WorkbenchTabOption<Value extends string> {
  value: Value;
  label: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  id?: string;
  controls?: string;
}

export interface WorkbenchTabsProps<Value extends string> {
  label: string;
  options: readonly WorkbenchTabOption<Value>[];
  value: Value;
  onValueChange(value: Value): void;
  variant?: "default" | "inset" | "stage";
  className?: string;
  children?: ReactNode;
}

export function WorkbenchTabs<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  variant = "default",
  className,
  children,
}: WorkbenchTabsProps<Value>) {
  const rootClassName = [
    styles.tabsRoot,
    variant === "stage" ? styles.tabsRootStage : null,
    className,
  ].filter(Boolean).join(" ");
  const listClassName = [
    styles.tabList,
    variant === "inset" ? styles.tabListInset : null,
  ].filter(Boolean).join(" ");

  return (
    <Tabs.Root
      className={rootClassName}
      data-slot="workbench-tabs"
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") onValueChange(nextValue as Value);
      }}
    >
      <Tabs.List
        className={listClassName}
        data-slot="workbench-tab-list"
        aria-label={label}
      >
        {options.map((option) => (
          <Tabs.Tab
            key={option.value}
            id={option.id}
            className={styles.tab}
            data-slot="workbench-tab"
            value={option.value}
            disabled={option.disabled}
            aria-controls={option.controls}
          >
            <span className={styles.tabLabel}>{option.label}</span>
            {option.meta === undefined ? null : (
              <span className={styles.tabMeta}>{option.meta}</span>
            )}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
}

export function WorkbenchTabPanel({
  ...props
}: ComponentProps<typeof Tabs.Panel>) {
  return <Tabs.Panel {...props} data-slot="workbench-tab-panel" />;
}

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  label: ReactNode;
  options: readonly SegmentedOption[];
  value: string;
  onValueChange(value: string): void;
  name?: string;
  disabled?: boolean;
}

export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  name,
  disabled = false,
}: SegmentedControlProps) {
  const generatedName = useId();

  return (
    <fieldset className={styles.segmentedFieldset} disabled={disabled}>
      <legend className={styles.label} data-slot="workbench-field-label">{label}</legend>
      <div className={styles.segmentedOptions}>
        {options.map((option) => (
          <label className={styles.segmentedOption} key={option.value}>
            <input
              className={styles.segmentedInput}
              type="radio"
              name={name ?? generatedName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
            />
            <span className={styles.segmentedLabel}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
