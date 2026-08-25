import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#49baff]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </section>
  );
}
