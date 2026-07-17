"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] =
    useState(false);

  const handleLogout = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const supabase = createClient();

      const { error } =
        await supabase.auth.signOut({
          scope: "local",
        });

      if (error) {
        throw error;
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Admin logout error:",
        error
      );

      alert(
        "تعذر تسجيل الخروج، حاول مرة أخرى"
      );

      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="fixed left-4 top-4 z-[100] rounded-2xl border border-red-500/25 bg-[#111111]/95 px-4 py-3 text-sm font-black text-red-300 shadow-xl backdrop-blur transition hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "جاري الخروج..."
        : "تسجيل الخروج"}
    </button>
  );
}