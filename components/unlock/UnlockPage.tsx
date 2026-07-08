"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function hashText(text: string) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type UnlockPageProps = {
  cardCode: string | null;
};

export default function UnlockPage({ cardCode }: UnlockPageProps) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const unlockVault = async () => {
    if (!cardCode) {
      setStatus("البطاقة غير موجودة");
      return;
    }

    localStorage.removeItem(`nexo_unlocked_${cardCode}`);
    sessionStorage.removeItem(`nexo_vault_password_${cardCode}`);

    setStatus("جاري التحقق...");

    const passwordHash = await hashText(password);

    const { data, error } = await supabase
      .from("cards")
      .select("card_password_hash")
      .eq("card_code", cardCode)
      .single();

    if (error || !data) {
      setStatus("تعذر العثور على البطاقة");
      return;
    }

    if (passwordHash !== data.card_password_hash) {
      setStatus("❌ كلمة المرور غير صحيحة");
      return;
    }

    localStorage.setItem(`nexo_unlocked_${cardCode}`, "true");
sessionStorage.setItem(`nexo_unlocked_${cardCode}`, "true");
sessionStorage.setItem(`nexo_vault_password_${cardCode}`, password);
    setPassword("");

    router.push(`/vault?card=${cardCode}`);
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white flex items-center justify-center p-8"
    >
      <div className="w-full max-w-lg rounded-3xl border border-orange-500/20 bg-[#151515] p-8">
        <h1 className="text-center text-4xl font-black text-orange-500">
          🔓 افتح خزنتك
        </h1>

        <p className="mt-3 text-center text-gray-400">
          أدخل كلمة مرور البطاقة.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="mt-8 h-16 w-full rounded-2xl border border-white/10 bg-black/40 px-5 text-right outline-none focus:border-orange-500"
        />

        {status && (
          <p className="mt-5 text-center font-bold text-orange-400">
            {status}
          </p>
        )}

        <button
          onClick={unlockVault}
          className="mt-8 w-full rounded-3xl bg-orange-500 py-5 font-bold hover:bg-orange-600 transition"
        >
          فتح الخزنة
        </button>
      </div>
    </main>
  );
}