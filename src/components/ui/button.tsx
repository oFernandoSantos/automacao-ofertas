import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_22px_rgba(0,140,255,0.28)] hover:bg-[#00a6ff]",
        variant === "secondary" && "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[#102946]",
        variant === "ghost" && "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
        variant === "danger" && "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}
