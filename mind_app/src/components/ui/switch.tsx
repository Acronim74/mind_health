// src/components/ui/switch.tsx
"use client";
import { FC } from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled,
  className = "",
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onCheckedChange}
    className={
      `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ` +
      `${checked ? "bg-indigo-500" : "bg-gray-300"} ` +
      `${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ` +
      className
    }
  >
    <span
      className={
        `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ` +
        `${checked ? "translate-x-5" : "translate-x-1"}`
      }
    />
  </button>
);
