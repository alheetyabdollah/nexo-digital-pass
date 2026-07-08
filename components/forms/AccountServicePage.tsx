"use client";

import Link from "next/link";
import { useState } from "react";
import InputCard from "@/components/forms/InputCard";
import PasswordCard from "@/components/forms/PasswordCard";
import SaveButton from "@/components/buttons/SaveButton";
import { supabase } from "@/lib/supabase";
import {
  isEmptyAccount,
  checkDuplicateAccount,
  encryptAccountFields,
  hashText,
} from "@/lib/accountRules";

type AccountServicePageProps = {
  service: string;
  title: string;
  description: string;
  emailPlaceholder: string;
  icon: React.ReactNode;
  cardCode: string | null;
  showRecovery?: boolean;
};

export default function AccountServicePage({
  service,
  title,
  description,
  emailPlaceholder,
  icon,
  cardCode,
  showRecovery = false,
}: AccountServicePageProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [recovery, setRecovery] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEmptyAccount([email, username, password, phone, recovery, notes])) {
      setStatus("لا يمكن حفظ حساب فارغ. أدخل معلومة واحدة على الأقل.");
      return;
    }

    setStatus("جاري الحفظ...");

    if (!cardCode) {
      setStatus("لم يتم العثور على البطاقة");
      return;
    }

    const vaultPassword = sessionStorage.getItem(
      `nexo_vault_password_${cardCode}`
    );

    if (!vaultPassword) {
      setStatus("انتهت جلسة الخزنة");
      return;
    }

    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("id")
      .eq("card_code", cardCode)
      .single();

    if (cardError || !card) {
      setStatus("البطاقة غير موجودة");
      return;
    }

    try {
      const isDuplicate = await checkDuplicateAccount({
        cardId: card.id,
        service,
        email,
      });

      if (isDuplicate) {
        setStatus(`هذا الحساب موجود مسبقًا داخل ${service}.`);
        return;
      }
    } catch (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء فحص التكرار");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailHash = cleanEmail ? await hashText(cleanEmail) : null;

    const encrypted = await encryptAccountFields(
      {
        email,
        username,
        password,
        phone,
        recovery: showRecovery ? recovery : "",
        notes,
      },
      vaultPassword
    );

    const { error } = await supabase.from("accounts").insert({
      card_id: card.id,
      service,
      ...encrypted,
      email_hash: emailHash,
    });

    if (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء الحفظ");
      return;
    }

    setEmail("");
    setUsername("");
    setPassword("");
    setPhone("");
    setRecovery("");
    setNotes("");

    setStatus("تم حفظ الحساب بنجاح ✅");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white p-8"
    >
      <div className="relative mx-auto max-w-3xl">
        <Link
          href={`/vault?card=${cardCode}`}
          className="inline-block text-gray-400 transition hover:text-orange-400"
        >
          ← رجوع إلى خزنتك الرقمية
        </Link>

        <section className="mt-10 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[36px] bg-gradient-to-br from-zinc-700 to-black shadow-[0_0_55px_rgba(255,255,255,0.14)]">
            {icon}
          </div>

          <h1 className="mt-7 text-6xl font-black">{title}</h1>

          <p className="mt-4 text-xl text-gray-400">
            {description}
          </p>
        </section>

        <form onSubmit={saveAccount} className="mt-12 space-y-6">
          <InputCard
            label="البريد الإلكتروني"
            placeholder={emailPlaceholder}
            value={email}
            onChange={setEmail}
          />

          <InputCard
            label="اسم المستخدم"
            placeholder="NEXO_TEST"
            value={username}
            onChange={setUsername}
          />

          <PasswordCard
            label="كلمة المرور"
            value={password}
            onChange={setPassword}
          />

          <InputCard
            label="رقم الهاتف"
            placeholder="+964..."
            value={phone}
            onChange={setPhone}
          />

          {showRecovery && (
            <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
              <label className="block text-right text-lg font-bold text-white">
                بيانات الاسترداد
              </label>

              <textarea
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
                placeholder="اكتب بيانات الاسترداد أو الأسئلة الأمنية..."
                className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-black/50 p-5 text-right text-white outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
            <label className="block text-right text-lg font-bold text-white">
              الملاحظات
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات مهمة عن الحساب..."
              className="mt-4 min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/50 p-5 text-right text-white outline-none focus:border-orange-500"
            />
          </div>

          <SaveButton text="حفظ الحساب" />

          {status && (
            <p className="text-center font-bold text-orange-400">
              {status}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}