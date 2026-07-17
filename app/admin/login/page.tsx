"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage(
        "يرجى إدخال البريد الإلكتروني وكلمة المرور"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
  console.error("Supabase login error:", {
    message: loginError.message,
    code: loginError.code,
    status: loginError.status,
  });

  throw new Error(
    `${loginError.message}${
      loginError.code
        ? ` — ${loginError.code}`
        : ""
    }`
  );
}

      const user = loginData.user;

      if (!user) {
        throw new Error(
          "تعذر التحقق من حساب المستخدم"
        );
      }

      const {
        data: adminUser,
        error: adminError,
      } = await supabase
        .from("admin_users")
        .select("user_id, role")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle();

      if (adminError) {
        throw adminError;
      }

      if (!adminUser) {
        await supabase.auth.signOut();

        throw new Error(
          "هذا الحساب غير مخول للدخول إلى لوحة الإدارة"
        );
      }

      router.replace("/admin/cards");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل الدخول"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-10 text-white"
    >
      <div className="w-full max-w-md">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#111111] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="border-b border-white/10 bg-gradient-to-l from-orange-500/15 via-transparent to-transparent px-7 py-8">
            <p className="text-sm font-bold tracking-[0.28em] text-orange-400">
              NEXO
            </p>

            <h1 className="mt-3 text-3xl font-black">
              لوحة الإدارة
            </h1>

            <p className="mt-3 text-sm leading-7 text-white/55">
              سجل الدخول بحساب المالك للوصول
              إلى إدارة البطاقات والدفعات.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5 px-7 py-8"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-bold text-white/75"
              >
                البريد الإلكتروني
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-bold text-white/75"
              >
                كلمة المرور
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60"
                dir="ltr"
              />
            </div>

            {message && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-base font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "جاري التحقق..."
                : "تسجيل الدخول"}
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-xs leading-6 text-white/35">
          الدخول مخصص لمالك نظام NEXO فقط.
        </p>
      </div>
    </main>
  );
}