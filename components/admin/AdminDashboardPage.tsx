"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineCheckBadge,
  HiOutlineCreditCard,
  HiOutlineRectangleStack,
  HiOutlineUserGroup,
} from "react-icons/hi2";

type DashboardStats = {
  totalCards: number;
  activatedCards: number;
  inactiveCards: number;
  totalAccounts: number;
  totalBatches: number;
};

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 text-orange-400">
        {icon}
      </div>

      <div className="text-3xl font-bold text-white">
        {value}
      </div>

      <div className="mt-2 text-sm text-gray-400">
        {title}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] =
    useState<DashboardStats>({
      totalCards: 0,
      activatedCards: 0,
      inactiveCards: 0,
      totalAccounts: 0,
      totalBatches: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(
          "/api/admin/dashboard",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "تعذر تحميل الإحصائيات"
          );
        }

        const data =
          (await response.json()) as DashboardStats;

        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-screen max-w-7xl bg-[#050505] p-6 text-white"
    >
      <div className="mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/cards")
          }
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-orange-500/30 hover:bg-orange-500/10 active:scale-95"
          aria-label="الرجوع إلى لوحة التحكم"
        >
          <HiOutlineArrowRight
            size={22}
          />
        </button>

        <h1 className="text-center text-2xl font-black text-white sm:text-3xl">
          NEXO Control Panel
        </h1>

        <div className="h-11 w-11" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي البطاقات"
          value={
            loading
              ? 0
              : stats.totalCards
          }
          icon={
            <HiOutlineCreditCard
              size={34}
            />
          }
        />

        <StatCard
          title="البطاقات المفعلة"
          value={
            loading
              ? 0
              : stats.activatedCards
          }
          icon={
            <HiOutlineCheckBadge
              size={34}
            />
          }
        />

        <StatCard
          title="إجمالي الحسابات"
          value={
            loading
              ? 0
              : stats.totalAccounts
          }
          icon={
            <HiOutlineUserGroup
              size={34}
            />
          }
        />

        <StatCard
          title="عدد الدفعات"
          value={
            loading
              ? 0
              : stats.totalBatches
          }
          icon={
            <HiOutlineRectangleStack
              size={34}
            />
          }
        />
      </div>
    </main>
  );
}