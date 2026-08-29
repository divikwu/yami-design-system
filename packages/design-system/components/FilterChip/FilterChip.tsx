import {
  forwardRef,
  useState,
  useId,
  useLayoutEffect,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Popover } from "@base-ui/react/popover";

import { Button } from "../Button";
import { Sheet } from "../Sheet";
import { Checkbox } from "../Checkbox";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";

import styles from "./FilterChip.module.css";

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

function FilterChipPopup({
  open, onOpenChange, trigger, title, closeLabel, ariaLabel, category = false, selectionMode, children, footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactElement<FilterChipProps>;
  title: string;
  closeLabel: string;
  ariaLabel: string;
  category?: boolean;
  selectionMode?: "single" | "multiple";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  const id = useId();
  useLayoutEffect(() => {
    const viewport = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setMobile(viewport.matches);
    update();
    viewport.addEventListener("change", update);
    return () => viewport.removeEventListener("change", update);
  }, []);
  const slot = category ? "filter-chip-category-menu" : "filter-chip-menu";

  if (mobile) {
    return (
      <>
        <FilterChip {...trigger.props} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => onOpenChange(!open)} />
        <Sheet open={open} id={id} title={title} closeLabel={closeLabel} onClose={() => onOpenChange(false)} contentPadding="none" footer={footer} data-slot={slot} data-selection-mode={selectionMode}>
          {children}
        </Sheet>
      </>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger render={trigger} />
      <Popover.Portal>
        <Popover.Positioner className={styles.menuPositioner} side="bottom" align="start" sideOffset={4} collisionPadding={16} collisionAvoidance={category ? { side: "none", align: "shift", fallbackAxisSide: "none" } : undefined}>
          <Popover.Popup className={[styles.menuPopup, category && styles.categoryPopup].filter(Boolean).join(" ")} aria-label={ariaLabel} data-slot={slot} data-selection-mode={selectionMode}>
            {children}
            {footer}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
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
    <FilterChipPopup
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && props.selectionMode === "multiple") setDraftValue([...props.value]);
        setOpen(nextOpen);
      }}
      title={props.label}
      closeLabel={props.closeLabel ?? `Close ${props.label}`}
      ariaLabel={props.popupAriaLabel ?? props.label}
      selectionMode={props.selectionMode}
      trigger={<FilterChip className={props.className} selected={selected} leftIcon={props.leftIcon} rightIcon={props.rightIcon}>{props.label}</FilterChip>}
      footer={props.selectionMode === "multiple" ? (
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
      ) : undefined}
    >
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
      )}
    </FilterChipPopup>
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
    <FilterChipPopup
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraftValue(props.value);
        setOpen(nextOpen);
      }}
      title={props.label}
      closeLabel={props.closeLabel ?? `Close ${props.label}`}
      ariaLabel={props.popupAriaLabel ?? props.label}
      category
      trigger={<FilterChip className={props.className} selected={Boolean(props.value)} rightIcon={props.rightIcon}>{props.label}</FilterChip>}
      footer={
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
      }
    >
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
    </FilterChipPopup>
  );
}
