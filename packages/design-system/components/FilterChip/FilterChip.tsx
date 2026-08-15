import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Popover } from "@base-ui/react/popover";

import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";

import styles from "./FilterChip.module.css";

const closeIcon = new URL(
  "../../assets/icons/system/close.svg",
  import.meta.url,
).href;

export type FilterChipVariant = "filled" | "outlined";

export interface FilterChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FilterChipVariant;
  selected?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  function FilterChip(
    {
      variant = "outlined",
      selected,
      leftIcon,
      rightIcon,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        {...rest}
        ref={ref}
        type={rest.type ?? "button"}
        className={[styles.chip, styles[variant], className]
          .filter(Boolean)
          .join(" ")}
        data-slot="filter-chip"
        data-variant={variant}
        aria-pressed={selected}
      >
        {leftIcon && (
          <span className={styles.icon} data-slot="filter-chip-left-icon">
            {leftIcon}
          </span>
        )}
        <span className={styles.label}>{children}</span>
        {rightIcon && (
          <span className={styles.icon} data-slot="filter-chip-right-icon">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

export type FilterChipGroupProps = HTMLAttributes<HTMLDivElement>;

export const FilterChipGroup = forwardRef<
  HTMLDivElement,
  FilterChipGroupProps
>(function FilterChipGroup({ className, ...rest }, ref) {
  return (
    <div
      {...rest}
      ref={ref}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-slot="filter-chip-group"
    />
  );
});

export interface FilterChipMenuOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FilterChipMenuCommonProps {
  label: string;
  options: readonly FilterChipMenuOption[];
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  popupAriaLabel?: string;
  closeLabel?: string;
}

export interface FilterChipSingleMenuProps extends FilterChipMenuCommonProps {
  selectionMode: "single";
  value: string;
  onValueChange: (value: string) => void;
}

export interface FilterChipMultipleMenuProps extends FilterChipMenuCommonProps {
  selectionMode: "multiple";
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  clearLabel: string;
  applyLabel: string;
}

export type FilterChipMenuProps =
  | FilterChipSingleMenuProps
  | FilterChipMultipleMenuProps;

export interface FilterChipCategoryOption {
  label: string;
  value: string;
  children?: readonly FilterChipCategoryOption[];
}

export interface FilterChipCategoryMenuProps {
  label: string;
  options: readonly FilterChipCategoryOption[];
  value: string;
  onValueChange: (value: string) => void;
  clearLabel: string;
  applyLabel: string;
  popupAriaLabel?: string;
  rightIcon?: ReactNode;
  expandIcon?: ReactNode;
  collapseIcon?: ReactNode;
  className?: string;
  closeLabel?: string;
}

export function FilterChipMenu(props: FilterChipMenuProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<string[]>(
    props.selectionMode === "multiple" ? [...props.value] : [],
  );

  const selected =
    props.selectionMode === "multiple"
      ? props.value.length > 0
      : false;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && props.selectionMode === "multiple") {
          setDraftValue([...props.value]);
        }
        setOpen(nextOpen);
      }}
    >
      <Popover.Trigger
        render={
          <FilterChip
            className={props.className}
            selected={selected}
            leftIcon={props.leftIcon}
            rightIcon={props.rightIcon}
          >
            {props.label}
          </FilterChip>
        }
      />
      <Popover.Portal>
        <div
          className={styles.menuBackdrop}
          data-slot="filter-chip-menu-backdrop"
          aria-hidden="true"
        />
        <Popover.Positioner
          className={styles.menuPositioner}
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={16}
        >
          <Popover.Popup
            className={styles.menuPopup}
            aria-label={props.popupAriaLabel ?? props.label}
            data-slot="filter-chip-menu"
            data-selection-mode={props.selectionMode}
          >
            <header
              className={styles.mobileMenuHeader}
              data-slot="filter-chip-menu-title"
            >
              <button
                className={styles.mobileMenuClose}
                type="button"
                aria-label={props.closeLabel ?? `Close ${props.label}`}
                onClick={() => setOpen(false)}
              >
                <img src={closeIcon} alt="" width={24} height={24} />
              </button>
              <h2>{props.label}</h2>
            </header>
            {props.selectionMode === "single" ? (
              <RadioGroup
                className={styles.optionList}
                data-filter-chip-menu-options="true"
                value={props.value}
                onValueChange={(value) => {
                  props.onValueChange(String(value));
                  setOpen(false);
                }}
                aria-label={props.popupAriaLabel ?? props.label}
              >
                {props.options.map((option) => (
                  <label key={option.value} className={styles.optionRow}>
                    <span className={styles.optionControl}>
                      <RadioGroupItem
                        value={option.value}
                        disabled={option.disabled}
                      />
                    </span>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            ) : (
              <>
                <div
                  className={styles.optionList}
                  role="group"
                  aria-label={props.popupAriaLabel ?? props.label}
                  data-filter-chip-menu-options="true"
                >
                  {props.options.map((option) => {
                    const checked = draftValue.includes(option.value);
                    return (
                      <label key={option.value} className={styles.optionRow}>
                        <span className={styles.optionControl}>
                          <Checkbox
                            checked={checked}
                            disabled={option.disabled}
                            onCheckedChange={(nextChecked) =>
                              setDraftValue((current) =>
                                nextChecked
                                  ? [...current, option.value]
                                  : current.filter((value) => value !== option.value),
                              )
                            }
                          />
                        </span>
                        <span className={styles.optionLabel}>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div
                  className={styles.menuFooter}
                  data-filter-chip-menu-footer="true"
                >
                  <button
                    className={styles.clearButton}
                    type="button"
                    onClick={() => setDraftValue([])}
                  >
                    {props.clearLabel}
                  </button>
                  <Button
                    className={styles.applyButton}
                    variant="primary"
                    size="md"
                    onClick={() => {
                      props.onValueChange(draftValue);
                      setOpen(false);
                    }}
                  >
                    {props.applyLabel}
                  </Button>
                </div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CategoryOptions({
  options,
  expanded,
  onToggle,
  onExpand,
  expandIcon,
  collapseIcon,
}: {
  options: readonly FilterChipCategoryOption[];
  expanded: ReadonlySet<string>;
  onToggle: (value: string) => void;
  onExpand: (value: string) => void;
  expandIcon?: ReactNode;
  collapseIcon?: ReactNode;
}) {
  return options.map((option) => {
    const hasChildren = Boolean(option.children?.length);
    const isExpanded = hasChildren && expanded.has(option.value);

    return (
      <div key={option.value} className={styles.categoryBranch}>
        <div className={styles.categoryRow}>
          <label
            className={styles.categoryChoice}
            onClick={() => {
              if (hasChildren) onExpand(option.value);
            }}
          >
            <span className={styles.optionControl}>
              <RadioGroupItem value={option.value} />
            </span>
            <span className={styles.optionLabel}>{option.label}</span>
          </label>
          {hasChildren && (
            <button
              className={styles.categoryToggle}
              type="button"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${option.label}`}
              aria-expanded={isExpanded}
              onClick={() => onToggle(option.value)}
            >
              {isExpanded ? collapseIcon : expandIcon}
            </button>
          )}
        </div>
        {isExpanded && option.children && (
          <div className={styles.categoryChildren}>
            <CategoryOptions
              options={option.children}
              expanded={expanded}
              onToggle={onToggle}
              onExpand={onExpand}
              expandIcon={expandIcon}
              collapseIcon={collapseIcon}
            />
          </div>
        )}
      </div>
    );
  });
}

export function FilterChipCategoryMenu(props: FilterChipCategoryMenuProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(props.value);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraftValue(props.value);
        setOpen(nextOpen);
      }}
    >
      <Popover.Trigger
        render={
          <FilterChip
            className={props.className}
            selected={Boolean(props.value)}
            rightIcon={props.rightIcon}
          >
            {props.label}
          </FilterChip>
        }
      />
      <Popover.Portal>
        <div
          className={styles.menuBackdrop}
          data-slot="filter-chip-menu-backdrop"
          aria-hidden="true"
        />
        <Popover.Positioner
          className={styles.menuPositioner}
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={16}
          collisionAvoidance={{
            side: "none",
            align: "shift",
            fallbackAxisSide: "none",
          }}
        >
          <Popover.Popup
            className={[styles.menuPopup, styles.categoryPopup].join(" ")}
            aria-label={props.popupAriaLabel ?? props.label}
            data-slot="filter-chip-category-menu"
          >
            <header
              className={styles.mobileMenuHeader}
              data-slot="filter-chip-menu-title"
            >
              <button
                className={styles.mobileMenuClose}
                type="button"
                aria-label={props.closeLabel ?? `Close ${props.label}`}
                onClick={() => setOpen(false)}
              >
                <img src={closeIcon} alt="" width={24} height={24} />
              </button>
              <h2>{props.label}</h2>
            </header>
            <RadioGroup
              className={styles.categoryList}
              value={draftValue}
              onValueChange={(value) => setDraftValue(String(value))}
              aria-label={props.popupAriaLabel ?? props.label}
            >
              <CategoryOptions
                options={props.options}
                expanded={expanded}
                onToggle={(value) =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(value)) next.delete(value);
                    else next.add(value);
                    return next;
                  })
                }
                onExpand={(value) =>
                  setExpanded((current) => {
                    if (current.has(value)) return current;
                    const next = new Set(current);
                    next.add(value);
                    return next;
                  })
                }
                expandIcon={props.expandIcon}
                collapseIcon={props.collapseIcon}
              />
            </RadioGroup>
            <div
              className={styles.menuFooter}
              data-filter-chip-menu-footer="true"
            >
              <button
                className={styles.clearButton}
                type="button"
                onClick={() => setDraftValue("")}
              >
                {props.clearLabel}
              </button>
              <Button
                className={styles.applyButton}
                variant="primary"
                size="md"
                onClick={() => {
                  props.onValueChange(draftValue);
                  setOpen(false);
                }}
              >
                {props.applyLabel}
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
