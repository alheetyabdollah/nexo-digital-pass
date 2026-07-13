"use client";

import {
  HiOutlineCheckBadge,
  HiOutlineIdentification,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
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
    <section className="relative mb-5 overflow-hidden rounded-[32px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.10] via-white/[0.045] to-black/20 p-6 shadow-[0_30px_80px_rgba(255,106,0,0.12)] backdrop-blur-xl">

      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-[80px]" />

      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />

      <div className="relative flex items-center justify-between">

        <div>

          <div className="flex items-center gap-2 text-orange-400">
            <HiOutlineIdentification size={18} />
            <span className="text-xs font-bold tracking-[0.15em]">
              DIGITAL PASS
            </span>
          </div>

          <p
            dir="ltr"
            className="mt-3 text-2xl font-black tracking-[0.18em] text-white"
          >
            {cardCode || "UNKNOWN"}
          </p>

        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-orange-500/30 bg-black/30 shadow-[0_0_35px_rgba(255,106,0,0.16)]">
          <NexoMark
            size={42}
            animated
            variant="premium"
          />
        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">

        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">

          <div className="flex items-center gap-2 text-orange-400">
            <HiOutlineSquares2X2 size={18} />
            <span className="text-xs text-white/55">
              الحسابات
            </span>
          </div>

          <p className="mt-3 text-4xl font-black text-white">
            {totalAccounts}
          </p>

        </div>

        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">

          <div className="flex items-center gap-2 text-green-400">
            <HiOutlineCheckBadge size={18} />
            <span className="text-xs text-white/55">
              الحماية
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">

            <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />

            <span className="font-bold text-green-300">
              نشطة
            </span>

          </div>

        </div>

      </div>

    </section>
  );
}