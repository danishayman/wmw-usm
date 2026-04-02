import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { createSupabaseServerAuthClient } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-[#d4c6e8] bg-white p-6 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-[#301a55]">Admin Sign In</h1>
        <p className="mt-2 text-sm text-[#5a4973]">
          Use your admin credentials to manage dispensers and building pins.
        </p>
        <div className="mt-5">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
