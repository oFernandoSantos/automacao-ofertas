import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:p-6", className)}
      {...props}
    />
  );
}
