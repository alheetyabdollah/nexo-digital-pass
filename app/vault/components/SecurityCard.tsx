import {
  HiOutlineClock,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

import NexoMark from "@/components/ui/NexoMark";

export default function SecurityCard() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.025] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">

      <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-orange-500/10 blur-[70px]" />

      <div className="relative flex items-center gap-4">

        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-orange-500/25 bg-orange-500/10 shadow-[0_0_30px_rgba(255,106,0,0.15)]">
          <NexoMark
            size={30}
            animated
            variant="premium"
          />
        </div>

        <div className="flex-1">

          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck
              size={18}
              className="text-green-400"
            />

            <h4 className="font-black text-white">
              الحماية التلقائية
            </h4>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/50">
            سيتم قفل الخزنة تلقائياً بعد
            <span className="mx-1 font-black text-orange-400">
              10 دقائق
            </span>
            من عدم النشاط.
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/25 text-white/40">
          <HiOutlineClock size={20} />
        </div>

      </div>

    </section>
  );
}