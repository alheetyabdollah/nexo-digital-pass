"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import {
  HiOutlineArchiveBox,
  HiOutlineArrowRight,
  HiOutlineCreditCard,
  HiOutlineMagnifyingGlass,
  HiOutlinePrinter,
} from "react-icons/hi2";

import { supabase } from "@/lib/supabase";

type BatchRecord = {
  id: string;
  batch_code: string;
  quantity: number;
  status: string;
  created_at: string;
};

type CardRecord = {
  id: string;
  card_code: string;
  status: string | null;
};

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "غير متوفر";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير متوفر";
  }

  return new Intl.DateTimeFormat(
    "ar-IQ",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

function getStatusLabel(
  status: string | null
) {
  if (status === "Activated") {
    return "مفعلة";
  }

  if (status === "Disabled") {
    return "متوقفة";
  }

  return "غير مفعلة";
}

export default function AdminBatchDetailsPage() {
  const params = useParams();

  const rawBatchId = params.id;

  const batchId = Array.isArray(
    rawBatchId
  )
    ? rawBatchId[0]
    : rawBatchId;

  const [batch, setBatch] =
    useState<BatchRecord | null>(
      null
    );

  const [cards, setCards] =
    useState<CardRecord[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [showPrintConfirm, setShowPrintConfirm] =
    useState(false);

  const [confirmingPrint, setConfirmingPrint] =
    useState(false);

  const [printSuccess, setPrintSuccess] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBatchDetails() {
      if (!batchId) {
        setMessage(
          "معرّف الدفعة غير موجود"
        );

        setLoading(false);
        return;
      }

      try {
        const [
          batchResult,
          cardsResult,
        ] = await Promise.all([
          supabase
            .from("card_batches")
            .select(
              "id, batch_code, quantity, status, created_at"
            )
            .eq("id", batchId)
            .maybeSingle(),

          supabase
            .from("cards")
            .select(
              "id, card_code, status"
            )
            .eq(
              "batch_id",
              batchId
            )
            .order("card_code", {
              ascending: true,
            }),
        ]);

        if (batchResult.error) {
          throw batchResult.error;
        }

        if (cardsResult.error) {
          throw cardsResult.error;
        }

        if (cancelled) {
          return;
        }

        if (!batchResult.data) {
          setMessage(
            "لم يتم العثور على هذه الدفعة"
          );

          setBatch(null);
          setCards([]);
          return;
        }

        setBatch(
          batchResult.data as BatchRecord
        );

        setCards(
          (cardsResult.data ||
            []) as CardRecord[]
        );
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setMessage(
            "تعذر تحميل تفاصيل الدفعة"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBatchDetails();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  async function confirmBatchPrint() {
    if (!batchId || confirmingPrint) {
      return;
    }

    try {
      setConfirmingPrint(true);
      setMessage("");
      setPrintSuccess("");

      const response = await fetch(
        `/api/admin/batches/${encodeURIComponent(
          batchId
        )}/confirm-print`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "تعذر تأكيد عملية الطباعة"
        );
      }

      setPrintSuccess(
        `تم تأكيد طباعة ${result.printedCards} بطاقة بنجاح`
      );

      setShowPrintConfirm(false);

      setBatch((currentBatch) =>
        currentBatch
          ? {
              ...currentBatch,
              status: "Printed",
            }
          : currentBatch
      );
    } catch (error) {
      console.error(
        "Confirm print error:",
        error
      );

      setShowPrintConfirm(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر تأكيد عملية الطباعة"
      );
    } finally {
      setConfirmingPrint(false);
    }
  }

  const filteredCards =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return cards;
      }

      return cards.filter(
        (card) =>
          card.card_code
            .toLowerCase()
            .includes(
              normalizedSearch
            )
      );
    }, [cards, search]);
  const activatedCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.status === "Activated"
      ).length,
    [cards]
  );

  const inactiveCards =
    cards.length - activatedCards;

  const activationRate =
    cards.length === 0
      ? 0
      : Math.round(
          (activatedCards /
            cards.length) *
            100
        );
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/50">
            جاري تحميل تفاصيل الدفعة...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#030303] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[600px] border-x border-white/10 bg-[#070707] px-4 pb-12 pt-5 sm:px-6">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="relative z-10">
          <header className="mb-6 flex items-center gap-4">
            <Link
              href="/admin/batches"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-orange-500/30 hover:text-orange-300"
            >
              <HiOutlineArrowRight
                size={22}
              />
            </Link>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-orange-400/70">
                BATCH DETAILS
              </p>

              <h1
                dir="ltr"
                className="mt-1 text-right text-3xl font-black"
              >
                {batch?.batch_code ||
                  "تفاصيل الدفعة"}
              </h1>
            </div>
          </header>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-bold text-red-300">
              {message}
            </div>
          )}

          {printSuccess && (
            <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-center text-sm font-bold text-green-300">
              ✅ {printSuccess}
            </div>
          )}

          {batch && (
            <>
              <section className="rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.09] to-white/[0.025] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-500/10 text-orange-400">
                      <HiOutlineArchiveBox
                        size={29}
                      />
                    </div>

                    <div>
                      <p className="text-xs text-white/40">
                        رقم الدفعة
                      </p>

                      <h2
                        dir="ltr"
                        className="mt-1 text-left text-2xl font-black"
                      >
                        {
                          batch.batch_code
                        }
                      </h2>
                    </div>
                  </div>

                  <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[11px] font-black text-green-300">
                    {batch.status ===
                    "Ready"
                      ? "جاهزة"
                      : batch.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-[11px] text-white/35">
                      عدد البطاقات
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {batch.quantity} بطاقة
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-white/35">
                      تاريخ الإنشاء
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-left text-sm font-bold"
                    >
                      {formatDate(
                        batch.created_at
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <a
                href={`/api/admin/batches/${encodeURIComponent(
                  batch.id
                )}/print`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-orange-500 px-5 py-4 text-sm font-black text-black transition hover:bg-orange-400 active:scale-[0.98]"
              >
                <HiOutlinePrinter size={22} />
                تحميل ملف الطباعة PDF
              </a>

              {batch.status !== "Printed" ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowPrintConfirm(true)
                  }
                  disabled={confirmingPrint}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-black text-green-300 transition hover:bg-green-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <HiOutlinePrinter size={22} />

                  {confirmingPrint
                    ? "جاري تأكيد الطباعة..."
                    : "تأكيد الطباعة"}
                </button>
              ) : (
                <div className="mt-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-center">
  <p className="text-sm font-black text-green-300">
    ✅ تمت طباعة هذه الدفعة
  </p>

  <p className="mt-1 text-xs text-green-200/70">
    لا يمكن تأكيد الطباعة مرة أخرى.
  </p>
</div>
              )}
<a
  href={`/api/admin/batches/${encodeURIComponent(
    batch.id
  )}/csv`}
  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] border border-orange-500/30 bg-orange-500/10 px-5 py-4 text-sm font-black text-orange-300 transition hover:bg-orange-500/15 active:scale-[0.98]"
>
  📄 تصدير بطاقات الدفعة CSV
</a>
              <section className="mt-5 rounded-[28px] border border-white/10 bg-[#101010] p-5">
                <p className="text-xs font-bold tracking-[0.16em] text-orange-400">
                  STATISTICS
                </p>

                <h2 className="mt-2 text-xl font-black">
                  إحصائيات الدفعة
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">
                      المفعلة
                    </p>

                    <p className="mt-2 text-2xl font-black text-green-400">
                      {activatedCards}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">
                      غير المفعلة
                    </p>

                    <p className="mt-2 text-2xl font-black text-yellow-400">
                      {inactiveCards}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">
                      إجمالي البطاقات
                    </p>

                    <p className="mt-2 text-2xl font-black">
                      {cards.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <p className="text-xs text-white/45">
                      نسبة التفعيل
                    </p>

                    <p className="mt-2 text-2xl font-black text-orange-400">
                      {activationRate}%
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs font-bold text-white/45">
                    <span>التفعيل</span>
                    <span>{activationRate}%</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all duration-700"
                      style={{
                        width: `${activationRate}%`,
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="mt-7">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-orange-400/70">
                      BATCH CARDS
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      بطاقات الدفعة
                    </h2>
                  </div>

                  <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/45">
                    {
                      filteredCards.length
                    }{" "}
                    بطاقة
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
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="ابحث برقم البطاقة..."
                    className="h-14 w-full rounded-[20px] border border-white/10 bg-white/[0.035] pr-12 pl-4 text-sm font-bold outline-none transition placeholder:text-white/25 focus:border-orange-500/40"
                  />
                </div>
              </section>

              <section className="mt-5 space-y-3">
                {filteredCards.map(
                  (card) => (
                    <article
                      key={card.id}
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div>
                        <p className="text-[11px] text-white/35">
                          رقم البطاقة
                        </p>

                        <h3
                          dir="ltr"
                          className="mt-1 text-left text-lg font-black"
                        >
                          {
                            card.card_code
                          }
                        </h3>
                      </div>

                      <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-black text-yellow-300">
                        {getStatusLabel(
                          card.status
                        )}
                      </span>
                    </article>
                  )
                )}

                {filteredCards.length ===
                  0 && (
                  <div className="rounded-[26px] border border-white/10 bg-white/[0.025] p-8 text-center">
                    <HiOutlineCreditCard
                      size={40}
                      className="mx-auto text-white/25"
                    />

                    <p className="mt-4 font-black">
                      لا توجد بطاقات مطابقة
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {showPrintConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <HiOutlinePrinter size={32} />
            </div>

            <h2 className="mt-5 text-center text-xl font-black">
              تأكيد طباعة الدفعة
            </h2>

            <p className="mt-3 text-center text-sm leading-7 text-white/55">
              هل أنت متأكد أن بطاقات الدفعة{" "}
              <span
                dir="ltr"
                className="font-black text-white"
              >
                {batch?.batch_code}
              </span>{" "}
              تمت طباعتها فعليًا؟
            </p>

            <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center text-xs font-bold leading-6 text-yellow-300">
              بعد التأكيد سيعتبر النظام جميع بطاقات
              الدفعة مطبوعة، وسيمنع تأكيدها مرة ثانية.
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowPrintConfirm(false)
                }
                disabled={confirmingPrint}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-black text-white/70 transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={confirmBatchPrint}
                disabled={confirmingPrint}
                className="rounded-2xl bg-green-500 px-4 py-3.5 text-sm font-black text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmingPrint
                  ? "جاري التأكيد..."
                  : "نعم، تأكيد الطباعة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}