import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[#52708a] hover:border-[#265278] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/20",
        className,
      )}
      {...props}
    />
  );
}
