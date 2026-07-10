"use client";

import NexoMark from "@/components/ui/NexoMark";

type VaultSummaryCardProps = {
  cardCode: string | null;
  totalAccounts: number;
};

export default function VaultSummaryCard({
  cardCode,
  totalAccounts,
}: VaultSummaryCardProps) {
  return (
    <section className="mb-4 rounded-[28px] border border-orange-500/35 bg-gradient-to-br from-orange-500/10 via-white/[0.035] to-transparent p-5 shadow-[0_20px_70px_rgba(255,106,0,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/45">
            رقم البطاقة
          </p>

          <p
            dir="ltr"
            className="mt-1 text-xl font-black tracking-wider text-white"
          >
            {cardCode || "غير محدد"}
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-black/40 shadow-[0_0_28px_rgba(255,106,0,0.16)]">
          <NexoMark
            size={38}
            animated
            variant="premium"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-xs text-white/45">
            إجمالي الحسابات
          </p>

          <p className="mt-2 text-3xl font-black text-orange-500">
            {totalAccounts}
          </p>
        </div>

        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-xs text-white/45">
            حالة الخزنة
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.7)]" />

            <span className="font-bold text-green-300">
              محمية
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}