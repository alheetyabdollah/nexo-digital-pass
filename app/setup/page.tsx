"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function generateRecoveryKey() {
  const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NEXO-${part()}-${part()}-${part()}-${part()}`;
}

async function hashText(text: string) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardCode = searchParams.get("card");
useEffect(() => {
  if (!cardCode) {
    router.replace("/");
  }
}, [cardCode, router]);

if (!cardCode) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

        <p className="text-sm text-white/50">
          جاري التحقق من البطاقة...
        </p>
      </div>
    </main>
  );
}
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [status, setStatus] = useState("");

  const createVault = async () => {
    if (!cardCode) {
      setStatus("لم يتم العثور على البطاقة");
      return;
    }

    if (password.length < 6) {
      setStatus("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("كلمة المرور غير متطابقة");
      return;
    }

    setStatus("جاري إنشاء الخزنة...");

    const newRecoveryKey = generateRecoveryKey();
    const passwordHash = await hashText(password);
    const recoveryHash = await hashText(newRecoveryKey);

    const { error } = await supabase
      .from("cards")
      .update({
        status: "Activated",
        card_password_hash: passwordHash,
        recovery_key_hash: recoveryHash,
      })
      .eq("card_code", cardCode);

    if (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء إنشاء الخزنة");
      return;
    }

    setRecoveryKey(newRecoveryKey);
    setStatus("");
    setStep(3);
  };

  const copyRecoveryKey = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setStatus("تم نسخ مفتاح الخزنة ✅");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white p-8 flex items-center justify-center"
    >
      <div className="w-full max-w-xl rounded-3xl border border-orange-500/20 bg-[#151515] p-8 text-center shadow-[0_0_60px_rgba(255,106,0,0.18)]">
        {step === 1 && (
          <>
            <h1 className="text-5xl font-black text-orange-500">NEXO</h1>
            <p className="mt-2 tracking-[6px] text-orange-400">
              DIGITAL VAULT
            </p>

            <h2 className="mt-10 text-3xl font-bold">👋 أهلاً بك</h2>
            <p className="mt-4 text-gray-400">
              لنجهز خزنتك خلال أقل من دقيقة.
            </p>

            <button
              onClick={() => setStep(2)}
              className="mt-10 w-full rounded-3xl bg-orange-500 py-5 font-bold hover:bg-orange-600 transition"
            >
              ابدأ
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-3xl font-black text-orange-500">
              🔐 اختر كلمة مرور الخزنة
            </h2>

            <div className="mt-8 space-y-5">
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
              />

              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
              />
            </div>

            {status && (
              <p className="mt-5 text-orange-400 font-bold">{status}</p>
            )}

            <button
              onClick={createVault}
              className="mt-8 w-full rounded-3xl bg-orange-500 py-5 font-bold hover:bg-orange-600 transition"
            >
              إنشاء الخزنة
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-3xl font-black text-orange-500">
              🎉 تم إنشاء خزنتك
            </h2>

            <p className="mt-4 text-gray-400">
              هذا هو مفتاح الخزنة. احتفظ به في مكان آمن.
            </p>

            <div className="mt-6 rounded-2xl border border-orange-500/30 bg-black/50 p-5 text-xl font-bold text-orange-400">
              {recoveryKey}
            </div>

            <p className="mt-4 text-sm text-red-400">
              ⚠️ قد تحتاجه إذا نسيت كلمة مرور الخزنة.
            </p>

            {status && (
              <p className="mt-5 text-orange-400 font-bold">{status}</p>
            )}

            <button
              onClick={copyRecoveryKey}
              className="mt-8 w-full rounded-3xl bg-zinc-800 py-5 font-bold hover:bg-zinc-700 transition"
            >
              📋 نسخ مفتاح الخزنة
            </button>

            <button
              onClick={() => router.push(`/unlock?card=${cardCode}`)}
              className="mt-4 w-full rounded-3xl bg-orange-500 py-5 font-bold hover:bg-orange-600 transition"
            >
              دخول الخزنة
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0b0b0b]" />}>
      <SetupContent />
    </Suspense>
  );
}