import { LogOut, Sparkles } from "lucide-react";
import { destroySessionCookie } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  async function logout() {
    "use server";
    await destroySessionCookie();
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1440px] gap-5 px-4 py-4 lg:grid-cols-[252px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="flex flex-col rounded-[28px] border border-[#124674] bg-[#030914]/95 p-4 text-[var(--foreground)] shadow-[0_20px_55px_rgba(0,0,0,0.45)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:p-5">
          <div className="mb-5 flex items-center gap-3 lg:mb-8">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#1d70ac] bg-[#06345d] text-[#68d0ff] shadow-[0_0_24px_rgba(0,140,255,0.22)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#40b7ff]">Ofertas V1</p>
              <h1 className="mt-1 text-base font-extrabold">Central de afiliados</h1>
            </div>
          </div>
          <SidebarNav />
          <div className="mt-5 hidden rounded-2xl border border-[#123e64] bg-[#041324] p-4 lg:block">
            <p className="text-xs font-bold text-[#83d7ff]">Fluxo seguro</p>
            <p className="mt-1 text-xs leading-5 text-[#86a6c1]">Link afiliado, aprovação e reserva antes da publicação.</p>
          </div>
          <form action={logout} className="mt-5 lg:mt-auto">
            <Button type="submit" variant="secondary" className="w-full justify-center border border-[#17446f] bg-[#071a2f] text-[#d9f1ff] hover:bg-[#0b2c4e]">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </aside>
        <main className="min-w-0 py-2 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
