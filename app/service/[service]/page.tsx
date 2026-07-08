"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { decryptText } from "@/lib/accountRules";

import { FaApple, FaFacebook, FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { SiGoogleplay, SiInstagram, SiTiktok } from "react-icons/si";
import { HiOutlineSquares2X2 } from "react-icons/hi2";

type Account = {
  id: string;
  service: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  created_at: string;
};

function getServiceIcon(service: string) {
  if (service === "Apple") return <FaApple size={56} className="text-white" />;
  if (service === "Google") return <SiGoogleplay size={56} className="text-white" />;
  if (service === "Instagram") return <SiInstagram size={56} className="text-pink-500" />;
  if (service === "Facebook") return <FaFacebook size={56} className="text-blue-500" />;
  if (service === "WhatsApp") return <FaWhatsapp size={56} className="text-green-500" />;
  if (service === "TikTok") return <SiTiktok size={56} className="text-white" />;
  if (service === "Telegram") return <FaTelegramPlane size={56} className="text-sky-400" />;

  return <HiOutlineSquares2X2 size={56} className="text-orange-400" />;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-CA");
}

export default function ServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const service = decodeURIComponent(params.service as string);
  const cardCode = searchParams.get("card");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadAccounts() {
      if (!cardCode) {
        setLoading(false);
        return;
      }

      const unlocked = localStorage.getItem(`nexo_unlocked_${cardCode}`);
      const vaultPassword = sessionStorage.getItem(
        `nexo_vault_password_${cardCode}`
      );

      if (!unlocked || !vaultPassword) {
        window.location.href = `/unlock?card=${cardCode}`;
        return;
      }

      const { data: card } = await supabase
        .from("cards")
        .select("id")
        .eq("card_code", cardCode)
        .single();

      if (!card) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("accounts")
        .select("id, service, email, username, phone, created_at")
        .eq("card_id", card.id)
        .order("created_at", { ascending: false });

      if (service !== "all") {
        query = query.eq("service", service);
      }

      const { data } = await query;

            const decryptField = async (value: string | null) => {
        if (!value) return null;

        try {
          return await decryptText(value, vaultPassword);
        } catch {
          return "تعذر فك التشفير";
        }
      };

      if (data) {
        const decryptedAccounts = await Promise.all(
          data.map(async (account) => ({
            ...account,
            email: await decryptField(account.email),
            username: await decryptField(account.username),
            phone: await decryptField(account.phone),
          }))
        );

        setAccounts(decryptedAccounts);
      }

      setLoading(false);
    }

    loadAccounts();
  }, [cardCode, service]);

  const deleteAccount = async (id: string) => {
    const confirmDelete = confirm("هل أنت متأكد من حذف هذا الحساب؟");
    if (!confirmDelete) return;

    setStatus("جاري حذف الحساب...");

    const { error, count } = await supabase
      .from("accounts")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء الحذف");
      return;
    }

    if (count === 0) {
      setStatus("لم يتم حذف الحساب من قاعدة البيانات");
      return;
    }

    setAccounts((prev) => prev.filter((account) => account.id !== id));
    setStatus("تم حذف الحساب بنجاح ✅");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white p-8"
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/vault?card=${cardCode}`}
          className="text-gray-400 hover:text-orange-400 transition"
        >
          ← رجوع إلى الخزنة
        </Link>

        <section className="mt-8 text-center">
          <h1 className="text-5xl font-black text-orange-500">
            {service === "all" ? "الخزنة" : service} ({accounts.length})
          </h1>

          <p className="mt-3 text-gray-400">
            الحسابات المحفوظة داخل هذه الخدمة
          </p>
        </section>

        {status && (
          <div className="mt-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-center font-bold text-orange-400">
            {status}
          </div>
        )}

        {loading ? (
          <div className="mt-10 text-center text-gray-400">
            جاري تحميل الحسابات...
          </div>
        ) : accounts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-[#151515] p-8 text-center text-gray-400">
            لا توجد حسابات محفوظة بعد.
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {accounts.map((account) => {
              const mainTitle =
                account.email || account.username || account.phone || "حساب بدون اسم";

              return (
                <div
                  key={account.id}
                  className="rounded-3xl border border-white/10 bg-[#151515] p-5 shadow-[0_0_35px_rgba(0,0,0,0.35)]"
                >
                  <div className="grid gap-6 md:grid-cols-[130px_1fr_190px] md:items-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-black/40">
                        {getServiceIcon(account.service)}
                      </div>

                      <div className="mt-3 rounded-full border border-white/10 px-4 py-1 text-sm font-bold text-white">
                        {account.service}
                      </div>
                    </div>

                    <div className="text-right">
                      <h3 className="text-2xl font-black text-white">
                        {mainTitle}
                      </h3>

                      {account.email && (
                        <p className="mt-4 text-gray-300">
                          📧 البريد الإلكتروني: {account.email}
                        </p>
                      )}

                      {account.username && (
                        <p className="mt-2 text-gray-300">
                          👤 اسم المستخدم: {account.username}
                        </p>
                      )}

                      {account.phone && (
                        <p className="mt-2 text-gray-300">
                          📱 رقم الهاتف: {account.phone}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-gray-300">📅 تاريخ الإنشاء</p>
                      <p className="mt-1 text-white">
                        {formatDate(account.created_at)}
                      </p>

                      <p className="mt-5 font-bold text-orange-400">
                        {account.service}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <Link
                      href={`/account/${account.id}?card=${cardCode}`}
                      className="rounded-2xl bg-orange-500 py-4 text-center font-bold hover:bg-orange-600 transition"
                    >
                      ✏️ تعديل
                    </Link>

                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="rounded-2xl bg-red-600 py-4 font-bold hover:bg-red-700 transition"
                    >
                      🗑 حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}