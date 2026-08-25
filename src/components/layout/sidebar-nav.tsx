"use client";

import Link from "next/link";
import { Bot, Boxes, LayoutDashboard, Link2, Tag } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Boxes },
  { href: "/offers", label: "Ofertas", icon: Tag },
  { href: "/settings/affiliates", label: "Afiliados", icon: Link2 },
  { href: "/settings/automation", label: "Automação", icon: Bot },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-[#06345d] text-white shadow-[inset_0_0_0_1px_rgba(64,183,255,0.35),0_0_20px_rgba(0,140,255,0.14)]"
                : "text-[#9ec4df] hover:bg-[#071f38] hover:text-[#e7f6ff]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
