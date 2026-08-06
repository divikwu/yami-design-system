import type { ComponentProps } from "react";

import { Button } from "./Button";
import styles from "./RailNavigation.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "m10 3-5 5 5 5" : "m6 3 5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface RailNavigationButtonProps {
  direction: "left" | "right";
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export function RailNavigationButton({
  direction,
  label,
  disabled = false,
  onClick,
  className,
}: RailNavigationButtonProps) {
  return (
    <Button
      className={cx(styles.button, className)}
      form="icon"
      size="md"
      variant="secondary"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <ArrowIcon direction={direction} />
    </Button>
  );
}

interface RailNavigationProps
  extends Omit<ComponentProps<"div">, "children"> {
  previousLabel: string;
  nextLabel: string;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  buttonClassName?: string;
}

export function RailNavigation({
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  buttonClassName,
  className,
  ...rest
}: RailNavigationProps) {
  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="rail-navigation"
    >
      <RailNavigationButton
        className={buttonClassName}
        direction="left"
        label={previousLabel}
        disabled={previousDisabled}
        onClick={onPrevious}
      />
      <RailNavigationButton
        className={buttonClassName}
        direction="right"
        label={nextLabel}
        disabled={nextDisabled}
        onClick={onNext}
      />
    </div>
  );
}
