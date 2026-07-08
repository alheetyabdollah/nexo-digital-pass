"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import AppCard from "@/components/cards/AppCard";
import { supabase } from "@/lib/supabase";

import { FaApple, FaFacebook, FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { SiGoogleplay, SiInstagram, SiTiktok } from "react-icons/si";
import { HiOutlineSquares2X2 } from "react-icons/hi2";

const apps = [
  { icon: <FaApple size={42} className="text-white" />, name: "Apple ID", desc: "إدارة حساب Apple", href: "/apple", featured: true },
  { icon: <SiGoogleplay size={40} className="text-white" />, name: "Google Play", desc: "إدارة حساب Google Play", href: "/google" },
  { icon: <SiInstagram size={40} className="text-pink-500" />, name: "Instagram", desc: "إدارة حساب Instagram", href: "/instagram" },
  { icon: <FaFacebook size={40} className="text-blue-500" />, name: "Facebook", desc: "إدارة حساب Facebook", href: "/facebook" },
  { icon: <FaWhatsapp size={40} className="text-green-500" />, name: "WhatsApp", desc: "إدارة حساب WhatsApp", href: "/whatsapp" },
  { icon: <SiTiktok size={40} className="text-white" />, name: "TikTok", desc: "إدارة حساب TikTok", href: "/tiktok" },
  { icon: <FaTelegramPlane size={40} className="text-sky-400" />, name: "Telegram", desc: "إدارة حساب Telegram", href: "/telegram" },
  { icon: <HiOutlineSquares2X2 size={40} className="text-orange-400" />, name: "أخرى", desc: "PlayStation, Xbox أو أي حساب آخر", href: "/other" },
];

export default function VaultPage() {
  const searchParams = useSearchParams();
  const cardCode = searchParams.get("card");

  const closeVault = () => {
    if (!cardCode) {
      window.location.href = "/";
      return;
    }

    localStorage.removeItem(`nexo_unlocked_${cardCode}`);
    sessionStorage.removeItem(`nexo_unlocked_${cardCode}`);
    window.location.href = `/card/${cardCode}`;
  };

  useEffect(() => {
    async function checkAccess() {
      if (!cardCode) return;
sessionStorage.setItem("nexo_last_card", cardCode);
      const unlocked = sessionStorage.getItem(`nexo_unlocked_${cardCode}`);

      if (!unlocked) {
        window.location.href = `/unlock?card=${cardCode}`;
        return;
      }

      const { data: card, error } = await supabase
        .from("cards")
        .select("id")
        .eq("card_code", cardCode)
        .maybeSingle();

      if (error || !card) {
        window.location.href = `/card/${cardCode}`;
      }
    }

    checkAccess();
  }, [cardCode]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white p-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-[180px] -z-10" />

        <PageHeader
          title="خزنتك الرقمية"
          subtitle="أضف حسابًا جديدًا أو اختر الخدمة التي تريد إدارتها."
        />

        <div className="mb-8 flex justify-center">
          <button
            onClick={closeVault}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-bold text-red-300 transition hover:bg-red-500/20"
          >
            إغلاق الخزنة
          </button>
        </div>

        <Link
          href={`/service/all?card=${cardCode}`}
          className="mb-10 flex items-center justify-center gap-3 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6 text-2xl font-bold text-orange-400 transition hover:bg-orange-500/20"
        >
          📦 الخزنة
        </Link>

        {!cardCode && (
          <div className="mb-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
            لم يتم تحديد البطاقة. افتح الخزنة من رابط البطاقة.
          </div>
        )}

        <h2 className="mb-6 text-right text-3xl font-bold text-orange-400">
          ➕ إضافة حساب جديد
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {apps.map((app) => (
            <AppCard
              key={app.name}
              name={app.name}
              desc={app.desc}
              href={cardCode ? `${app.href}?card=${cardCode}` : app.href}
              icon={app.icon}
              featured={app.featured}
            />
          ))}
        </div>
      </div>
    </main>
  );
}