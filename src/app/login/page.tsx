import { redirect } from "next/navigation";
import { createSessionCookie, validateAdminCredentials } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  async function login(formData: FormData) {
    "use server";

    const redirectTarget = String(formData.get("redirectTo") ?? "/");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!(await validateAdminCredentials(email, password))) {
      redirect("/login?error=invalid_credentials");
    }

    await createSessionCookie(email);
    redirect(redirectTarget || "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-[#1a4e78] bg-[#07101d]/95 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#49baff]">Ofertas V1</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Entrar no painel</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Gerencie produtos, links e automações.</p>
        </div>
        <form action={login} className="grid gap-4">
          <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/"} />
          {params.error === "invalid_credentials" ? <p className="rounded-xl border border-[#7a2d43] bg-[#31121e] px-3 py-2 text-sm text-[#ffb4c2]">E-mail ou senha inválidos.</p> : null}
          <label className="grid gap-2 text-sm">
            E-mail
            <Input name="email" type="email" required />
          </label>
          <label className="grid gap-2 text-sm">
            Senha
            <Input name="password" type="password" required />
          </label>
          <Button type="submit" className="mt-2 w-full">Entrar</Button>
        </form>
      </Card>
    </main>
  );
}
