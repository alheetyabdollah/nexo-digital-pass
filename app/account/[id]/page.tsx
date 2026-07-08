"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { decryptText, encryptText, hashText } from "@/lib/accountRules";
import AccountInfoCard from "@/components/account/AccountInfoCard";
import PasswordSection from "@/components/account/PasswordSection";
import AccountActions from "@/components/account/AccountActions";
import DeleteDialog from "@/components/account/DeleteDialog";

type Account = {
  id: string;
  card_id: string;
  service: string;
  email: string | null;
  username: string | null;
  password: string | null;
  phone: string | null;
  recovery: string | null;
  notes: string | null;
};

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const cardCode = searchParams.get("card");
  const id = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadAccount() {
      if (!cardCode) {
        router.push("/");
        return;
      }

      const unlocked = localStorage.getItem(`nexo_unlocked_${cardCode}`);
      const vaultPassword = sessionStorage.getItem(
        `nexo_vault_password_${cardCode}`
      );

      if (!unlocked || !vaultPassword) {
        router.push(`/unlock?card=${cardCode}`);
        return;
      }

      const { data: card } = await supabase
        .from("cards")
        .select("id")
        .eq("card_code", cardCode)
        .single();

      if (!card) {
        router.push(`/card/${cardCode}`);
        return;
      }

      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .eq("card_id", card.id)
        .single();

      if (!data) {
        router.push(`/service/all?card=${cardCode}`);
        return;
      }

      const decryptField = async (value: string | null) => {
        if (!value) return null;

        try {
          return await decryptText(value, vaultPassword);
        } catch (error) {
          console.error(error);
          return "تعذر فك التشفير";
        }
      };

      setAccount({
        ...data,
        email: await decryptField(data.email),
        username: await decryptField(data.username),
        password: await decryptField(data.password),
        phone: await decryptField(data.phone),
        recovery: await decryptField(data.recovery),
        notes: await decryptField(data.notes),
      });

      setLoading(false);
    }

    loadAccount();
  }, [id, cardCode, router]);

  if (loading || !account) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center">
        جاري تحميل الحساب...
      </main>
    );
  }

  const updateField = (field: keyof Account, value: string) => {
    setAccount({ ...account, [field]: value });
  };

  const saveChanges = async () => {
    setStatus("جاري حفظ التعديلات...");

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

    const encryptField = async (value: string | null) => {
      if (!value) return null;
      return await encryptText(value, vaultPassword);
    };
const cleanEmail = account.email?.trim().toLowerCase();
const emailHash = cleanEmail ? await hashText(cleanEmail) : null;
    const { error } = await supabase
      .from("accounts")
      .update({email_hash: emailHash,
        email: await encryptField(account.email),
        username: await encryptField(account.username),
        password: await encryptField(account.password),
        phone: await encryptField(account.phone),
        recovery: await encryptField(account.recovery),
        notes: await encryptField(account.notes),
      })
      .eq("id", account.id)
      .eq("card_id", account.card_id);

    if (error) {
      setStatus("حدث خطأ أثناء حفظ التعديلات");
      console.error(error);
      return;
    }

    setEditing(false);
    setStatus("تم تحديث الحساب بنجاح ✅");
  };

  const deleteAccount = async () => {
    setStatus("جاري حذف الحساب...");

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", account.id)
      .eq("card_id", account.card_id);

    if (error) {
      setStatus("حدث خطأ أثناء الحذف");
      console.error(error);
      return;
    }

    setStatus("تم حذف الحساب بنجاح ✅");

    setTimeout(() => {
      router.push(`/service/all?card=${cardCode}`);
    }, 1000);
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white p-8"
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/service/all?card=${cardCode}`}
          className="text-gray-400 hover:text-orange-400 transition"
        >
          ← رجوع إلى الخزنة
        </Link>

        <section className="mt-10 text-center">
          <h1 className="text-5xl font-black text-orange-500">
            {account.service}
          </h1>

          <p className="mt-3 text-gray-400">
            تفاصيل الحساب المحفوظ داخل NEXO
          </p>
        </section>

        {status && (
          <div className="mt-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-center font-bold text-orange-400">
            {status}
          </div>
        )}

        <div className="mt-10 space-y-5">
          <AccountInfoCard
            label="البريد الإلكتروني"
            value={account.email}
            editing={editing}
            onChange={(value) => updateField("email", value)}
          />

          <AccountInfoCard
            label="اسم المستخدم"
            value={account.username}
            editing={editing}
            onChange={(value) => updateField("username", value)}
          />

          <PasswordSection
            password={account.password}
            editing={editing}
            onChange={(value) => updateField("password", value)}
          />

          <AccountInfoCard
            label="رقم الهاتف"
            value={account.phone}
            editing={editing}
            onChange={(value) => updateField("phone", value)}
          />

          <AccountInfoCard
            label="بيانات الاسترداد"
            value={account.recovery}
            editing={editing}
            onChange={(value) => updateField("recovery", value)}
          />

          <AccountInfoCard
            label="الملاحظات"
            value={account.notes}
            editing={editing}
            onChange={(value) => updateField("notes", value)}
          />

          <AccountActions
            editing={editing}
            onEdit={() => setEditing(true)}
            onSave={saveChanges}
            onCancel={() => setEditing(false)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </div>
      </div>

      <DeleteDialog
        open={showDeleteConfirm}
        service={account.service}
        accountName={
          account.email || account.username || account.phone || "بدون بيانات ظاهرة"
        }
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={deleteAccount}
      />
    </main>
  );
}