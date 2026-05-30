import type { ButtonHTMLAttributes } from "react";

import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",
  secondary:
    "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 focus-visible:ring-primary-500",
  ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-primary-500",
  danger: "bg-danger-600 text-white hover:bg-red-700 focus-visible:ring-danger-600",
};

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}

