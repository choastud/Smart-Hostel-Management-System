import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonVariantProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function buttonVariants({ variant = "default", size = "default" }: ButtonVariantProps = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    // Variants
    variant === "default" && "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
    variant === "destructive" && "bg-red-500 text-white hover:bg-red-600",
    variant === "outline" && "border border-slate-200 dark:border-zinc-800 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-900 dark:text-white",
    variant === "secondary" && "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700",
    variant === "ghost" && "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300",
    variant === "link" && "text-slate-900 dark:text-white underline-offset-4 hover:underline",
    // Sizes
    size === "default" && "h-11 px-6 py-2.5",
    size === "sm" && "h-9 px-4 rounded-lg",
    size === "lg" && "h-14 px-8 rounded-2xl",
    size === "icon" && "h-10 w-10"
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

