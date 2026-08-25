import { Database, TerminalSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

export function DatabaseSetupCard() {
  return (
    <Card className="max-w-3xl overflow-hidden border-[#15568a] bg-[linear-gradient(135deg,rgba(0,140,255,0.12),rgba(7,16,29,0.8)_52%)]">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#1778bd] bg-[#062a4d] text-[#5dcbff]">
          <Database className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#83d7ff]">Banco ainda não conectado</p>
          <h2 className="mt-1 text-xl font-bold">Interface pronta. Falta conectar dados.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Configure PostgreSQL em <code className="rounded bg-black/30 px-1.5 py-0.5 text-[#bfeaff]">DATABASE_URL</code> no arquivo
            <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5 text-[#bfeaff]">.env.local</code> para cadastrar produtos, ofertas e automações.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#8ba6c2]">
            <TerminalSquare className="h-4 w-4 text-[#49baff]" />
            Depois execute <code className="rounded bg-black/30 px-1.5 py-0.5 text-[#bfeaff]">npm run db:migrate</code>.
          </div>
        </div>
      </div>
    </Card>
  );
}
