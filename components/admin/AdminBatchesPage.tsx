"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineArchiveBox,
  HiOutlineCheckBadge,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";

type BatchRecord = {
  id: string;
  batch_number: number;
  batch_code: string;
  quantity: number;
  status: string;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "غير متوفر";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متوفر";

  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "Ready") return "جاهزة";
  if (status === "Creating") return "قيد الإنشاء";
  if (status === "Failed") return "فشلت";
  return status || "غير محدد";
}

function getStatusClasses(status: string) {
  if (status === "Ready") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "Creating") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  if (status === "Failed") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/50";
}

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadBatches(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setMessage("");

    try {
      const { data, error } = await supabase
        .from("card_batches")
        .select("id, batch_number, batch_code, quantity, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBatches((data || []) as BatchRecord[]);
    } catch (error) {
      console.error(error);
      setMessage("تعذر تحميل دفعات البطاقات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadBatches();
  }, []);

  const statistics = useMemo(() => {
    const ready = batches.filter((batch) => batch.status === "Ready").length;
    const totalCards = batches.reduce(
      (sum, batch) => sum + (batch.quantity || 0),
      0
    );

    return {
      totalBatches: batches.length,
      ready,
      totalCards,
    };
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return batches;

    return batches.filter((batch) =>
      batch.batch_code.toLowerCase().includes(normalizedSearch)
    );
  }, [batches, search]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
          <p className="text-sm text-white/50">
            جاري تحميل دفعات البطاقات...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden bg-[#030303] text-white">
      <div className="relative mx-auto min-h-screen w-full max-w-[600px] overflow-hidden border-x border-white/10 bg-[#070707] px-4 pb-12 pt-5 shadow-[0_0_100px_rgba(0,0,0,0.9)] sm:px-6">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-[-120px] h-72 w-72 rounded-full bg-orange-500/[0.05] blur-[100px]" />

        <div className="relative z-10">
          <header className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-orange-400/70">
                CARD BATCHES
              </p>
              <h1 className="mt-2 text-3xl font-black">دفعات البطاقات</h1>
              <p className="mt-2 text-sm text-white/45">
                عرض الدفعات وإدارتها وتجهيزها للطباعة
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadBatches(true)}
              disabled={refreshing}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 transition hover:bg-orange-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="تحديث الدفعات"
            >
              <HiOutlineArrowPath
                size={24}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </header>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-300">
              {message}
            </div>
          )}

          <section className="grid grid-cols-3 gap-3">
            <article className="rounded-[24px] border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.08] to-white/[0.025] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                <HiOutlineArchiveBox size={24} />
              </div>
              <p className="mt-4 text-[11px] text-white/40">الدفعات</p>
              <p className="mt-1 text-2xl font-black">{statistics.totalBatches}</p>
            </article>

            <article className="rounded-[24px] border border-green-500/15 bg-gradient-to-br from-green-500/[0.07] to-white/[0.025] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
                <HiOutlineCheckBadge size={24} />
              </div>
              <p className="mt-4 text-[11px] text-white/40">الجاهزة</p>
              <p className="mt-1 text-2xl font-black text-green-300">
                {statistics.ready}
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-orange-400">
                <HiOutlineCreditCard size={24} />
              </div>
              <p className="mt-4 text-[11px] text-white/40">البطاقات</p>
              <p className="mt-1 text-2xl font-black">{statistics.totalCards}</p>
            </article>
          </section>

          <section className="mt-7">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-orange-400/70">
                  ALL BATCHES
                </p>
                <h2 className="mt-1 text-2xl font-black">جميع الدفعات</h2>
              </div>

              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/45">
                {filteredBatches.length} دفعة
              </span>
            </div>

            <div className="relative">
              <HiOutlineMagnifyingGlass
                size={21}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث برقم الدفعة..."
                className="h-14 w-full rounded-[20px] border border-white/10 bg-white/[0.035] pr-12 pl-4 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/40 focus:bg-orange-500/[0.04]"
              />
            </div>
          </section>

          <section className="mt-5 space-y-4">
            {filteredBatches.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-8 text-center">
                <HiOutlineArchiveBox
                  size={42}
                  className="mx-auto text-white/25"
                />
                <h3 className="mt-4 text-lg font-black">لا توجد دفعات</h3>
                <p className="mt-2 text-sm text-white/40">
                  لم يتم العثور على دفعة مطابقة للبحث.
                </p>
              </div>
            ) : (
              filteredBatches.map((batch) => (
                <article
                  key={batch.id}
                  className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-orange-500/[0.025] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.35)]"
                >
                  <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-orange-500/[0.08] blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-orange-500/20 bg-orange-500/10 text-orange-400">
                        <HiOutlineArchiveBox size={28} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-white/40">رقم الدفعة</p>
                        <h3
                          dir="ltr"
                          className="mt-1 truncate text-left text-xl font-black tracking-[0.08em]"
                        >
                          {batch.batch_code}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${getStatusClasses(
                        batch.status
                      )}`}
                    >
                      {getStatusLabel(batch.status)}
                    </span>
                  </div>

                  <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[11px] text-white/35">عدد البطاقات</p>
                      <p className="mt-1 text-sm font-black text-white/80">
                        {batch.quantity} بطاقة
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-white/35">تاريخ الإنشاء</p>
                      <p
                        dir="ltr"
                        className="mt-1 text-left text-xs font-bold text-white/70"
                      >
                        {formatDate(batch.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4 border-t border-white/10 pt-4">
                    <Link
                      href={`/admin/batches/${encodeURIComponent(batch.id)}`}
                      className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-orange-500 px-4 py-3.5 text-sm font-black text-black transition hover:bg-orange-400 active:scale-[0.98]"
                    >
                      <HiOutlineEye size={21} />
                      عرض الدفعة
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>

          <div className="mt-6">
            <Link
              href="/admin/cards"
              className="flex w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm font-black text-white/65 transition hover:border-orange-500/25 hover:text-orange-300 active:scale-[0.98]"
            >
              الرجوع إلى إدارة البطاقات
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}