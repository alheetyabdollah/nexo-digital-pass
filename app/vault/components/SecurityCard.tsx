import { HiOutlineLockClosed } from "react-icons/hi2";
import NexoMark from "@/components/ui/NexoMark";

export default function SecurityCard() {
  return (
    <section className="mt-5 flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
        <NexoMark
          size={28}
          animated
          variant="premium"
        />
      </div>

      <div>
        <h4 className="font-black text-orange-400">
          حماية تلقائية
        </h4>

        <p className="mt-1 text-xs leading-6 text-white/50">
          سيتم قفل الخزنة تلقائيًا بعد 10 دقائق من عدم النشاط.
        </p>
      </div>

      <HiOutlineLockClosed
        size={18}
        className="mr-auto shrink-0 text-white/20"
      />
    </section>
  );
}