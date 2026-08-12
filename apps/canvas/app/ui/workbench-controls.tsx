"use client";

import { Select } from "@base-ui/react/select";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import styles from "./workbench-controls.module.css";

const arrowDownIcon = new URL(
  "../../../../packages/design-system/assets/icons/system/arrow-down.svg",
  import.meta.url,
).href;

export interface WorkbenchSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
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
            <img
              src={arrowDownIcon}
              alt=""
              aria-hidden="true"
              data-slot="workbench-select-icon"
              width="12"
              height="12"
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
