"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowPath,
  HiOutlineCheckBadge,
  HiOutlineCreditCard,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineRectangleStack,
  HiOutlineXMark,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import { createClient } from "@/lib/supabase/client";

type CardRecord = {
  id: string;
  card_code: string;
  status: string | null;
  created_at: string | null;
  activated_at?: string | null;
  crypto_version?: number | null;
};

type CreateCardResponse = {
  card?: CardRecord;
  error?: string;
};

type CreateBatchResponse = {
  cards?: CardRecord[];
  quantity?: number;
  message?: string;
  error?: string;
};

type BatchSize = 50 | 100 | 200;

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

function getStatusClasses(
  status: string | null
) {
  if (status === "Activated") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "Disabled") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
}

export default function AdminCardsPage() {
  const router = useRouter();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  
  const [cards, setCards] =
    useState<CardRecord[]>([]);

  const [
    accountsCount,
    setAccountsCount,
  ] = useState(0);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    creatingCard,
    setCreatingCard,
  ] = useState(false);

  const [
    batchModalOpen,
    setBatchModalOpen,
  ] = useState(false);

  const [
    creatingBatch,
    setCreatingBatch,
  ] = useState(false);

  const [selectedBatchSize, setSelectedBatchSize] =
    useState<BatchSize>(50);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | "info"
    >("info");

  const showMessage = (
    text: string,
    type:
      | "success"
      | "error"
      | "info" = "info"
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const loadDashboard = async (
    refresh = false
  ) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [
        cardsResult,
        accountsResult,
      ] = await Promise.all([
        supabase
          .from("cards")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("accounts")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

      if (cardsResult.error) {
        throw cardsResult.error;
      }

      if (accountsResult.error) {
        throw accountsResult.error;
      }

      setCards(
        (cardsResult.data ||
          []) as CardRecord[]
      );

      setAccountsCount(
        accountsResult.count || 0
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "تعذر تحميل معلومات لوحة التحكم",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const createCard = async () => {
    if (creatingCard) {
      return;
    }

    try {
      setCreatingCard(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/cards/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const result =
        (await response.json()) as CreateCardResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "تعذر إنشاء البطاقة"
        );
      }

      if (!result.card) {
        throw new Error(
          "لم يتم استلام معلومات البطاقة الجديدة"
        );
      }

      setCards((currentCards) => [
        result.card as CardRecord,
        ...currentCards,
      ]);

      showMessage(
        `تم إنشاء البطاقة ${result.card.card_code} بنجاح`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        error instanceof Error
          ? error.message
          : "فشل إنشاء البطاقة",
        "error"
      );
    } finally {
      setCreatingCard(false);
    }
  };

  const createBatch = async () => {
    if (creatingBatch) {
      return;
    }

    try {
      setCreatingBatch(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/cards/create-batch",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            quantity: selectedBatchSize,
          }),
        }
      );

      const result =
        (await response.json()) as CreateBatchResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "تعذر إنشاء دفعة البطاقات"
        );
      }

      if (
        !Array.isArray(result.cards) ||
        result.cards.length !== selectedBatchSize
      ) {
        throw new Error(
          "لم يتم استلام جميع بطاقات الدفعة"
        );
      }

      setCards((currentCards) => [
        ...result.cards!,
        ...currentCards,
      ]);

      setBatchModalOpen(false);

      showMessage(
        `تم إنشاء ${result.cards.length} بطاقة بنجاح`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showMessage(
        error instanceof Error
          ? error.message
          : "فشل إنشاء دفعة البطاقات",
        "error"
      );
    } finally {
      setCreatingBatch(false);
    }
  };

  const statistics = useMemo(() => {
    const activated = cards.filter(
      (card) =>
        card.status === "Activated"
    ).length;

    const disabled = cards.filter(
      (card) =>
        card.status === "Disabled"
    ).length;

    const inactive =
      cards.length -
      activated -
      disabled;

    return {
      total: cards.length,
      activated,
      inactive,
      disabled,
    };
  }, [cards]);

  const filteredCards = useMemo(() => {
    const normalizedSearch =
      search
        .trim()
        .toLowerCase();

    if (!normalizedSearch) {
      return cards;
    }

    return cards.filter((card) =>
      card.card_code
        .toLowerCase()
        .includes(
          normalizedSearch
        )
    );
  }, [cards, search]);

  const showUpcomingMessage = (
    feature: string
  ) => {
    showMessage(
      `${feature} ستكون الخطوة التالية في لوحة التحكم`,
      "info"
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/50">
            جاري تجهيز لوحة التحكم...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#030303] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[600px] overflow-hidden border-x border-white/10 bg-[#070707] px-4 pb-12 pt-5 shadow-[0_0_100px_rgba(0,0,0,0.9)] sm:px-6">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="pointer-events-none absolute bottom-0 right-[-120px] h-72 w-72 rounded-full bg-orange-500/[0.05] blur-[100px]" />

        <div className="relative z-10">
          {/* الهيدر */}
          <header className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-orange-400/70">
                ADMINISTRATION
              </p>

              <h1 className="mt-2 text-3xl font-black text-white">
                NEXO Control Panel
              </h1>

              <p className="mt-2 text-sm text-white/45">
                إدارة بطاقات NEXO والتحكم بها
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              disabled={
                refreshing ||
                creatingCard ||
                creatingBatch
              }
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 transition hover:bg-orange-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="تحديث المعلومات"
            >
              <HiOutlineArrowPath
                size={24}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </header>

          {/* الرسائل */}
          {message && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                messageType === "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : messageType === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-orange-500/20 bg-orange-500/10 text-orange-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* الإحصائيات */}
          <section className="grid grid-cols-2 gap-4">
            <article className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5">
              <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <HiOutlineCreditCard
                    size={26}
                  />
                </div>

                <p className="mt-5 text-xs text-white/40">
                  إجمالي البطاقات
                </p>

                <p className="mt-1 text-3xl font-black">
                  {statistics.total}
                </p>
              </div>
            </article>

            <article className="rounded-[26px] border border-green-500/15 bg-gradient-to-br from-green-500/[0.07] to-white/[0.025] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
                <HiOutlineCheckBadge
                  size={27}
                />
              </div>

              <p className="mt-5 text-xs text-white/40">
                البطاقات المفعلة
              </p>

              <p className="mt-1 text-3xl font-black text-green-300">
                {statistics.activated}
              </p>
            </article>

            <article className="rounded-[26px] border border-yellow-500/15 bg-gradient-to-br from-yellow-500/[0.06] to-white/[0.025] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300">
                <HiOutlineSquares2X2
                  size={26}
                />
              </div>

              <p className="mt-5 text-xs text-white/40">
                غير المفعلة
              </p>

              <p className="mt-1 text-3xl font-black text-yellow-300">
                {statistics.inactive}
              </p>
            </article>

            <article className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                <HiOutlineUserGroup
                  size={27}
                />
              </div>

              <p className="mt-5 text-xs text-white/40">
                الحسابات المحفوظة
              </p>

              <p className="mt-1 text-3xl font-black">
                {accountsCount}
              </p>
            </article>
          </section>

          {/* العمليات السريعة */}
          <section className="mt-6">
            <div className="mb-4">
              <p className="text-xs font-bold tracking-[0.18em] text-orange-400/70">
                QUICK ACTIONS
              </p>

              <h2 className="mt-1 text-2xl font-black">
                العمليات السريعة
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  void createCard();
                }}
                disabled={creatingCard}
                className="flex items-center gap-3 rounded-[24px] border border-orange-500/25 bg-orange-500/10 p-4 text-right transition hover:bg-orange-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-black">
                  {creatingCard ? (
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  ) : (
                    <HiOutlinePlus
                      size={27}
                    />
                  )}
                </div>

                <div>
                  <p className="text-sm font-black">
                    {creatingCard
                      ? "جاري الإنشاء..."
                      : "إنشاء بطاقة"}
                  </p>

                  <p className="mt-1 text-[11px] text-white/40">
                    إضافة بطاقة جديدة
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setBatchModalOpen(true)
                }
                disabled={
                  creatingCard ||
                  creatingBatch
                }
                className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-4 text-right transition hover:border-orange-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-orange-400">
                  {creatingBatch ? (
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400/20 border-t-orange-400" />
                  ) : (
                    <HiOutlineRectangleStack
                      size={27}
                    />
                  )}
                </div>

                <div>
                  <p className="text-sm font-black">
                    {creatingBatch
                      ? "جاري إنشاء الدفعة..."
                      : "إنشاء دفعة"}
                  </p>

                  <p className="mt-1 text-[11px] text-white/40">
                    50 أو 100 أو 200 بطاقة
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/admin/batches")
                }
                disabled={
                  creatingCard ||
                  creatingBatch
                }
                className="col-span-2 flex items-center gap-3 rounded-[24px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.10] to-white/[0.025] p-4 text-right transition hover:border-orange-500/40 hover:bg-orange-500/[0.14] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                  <HiOutlineRectangleStack
                    size={27}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">
                    دفعات البطاقات
                  </p>

                  <p className="mt-1 text-[11px] text-white/40">
                    عرض وإدارة جميع الدفعات
                  </p>
                </div>

                <span className="text-xl text-orange-400/70">
                  ←
                </span>
              </button>
            </div>
          </section>
<button
  type="button"
  onClick={() => router.push("/admin")}
  className="mt-3 flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.035] px-5 py-4 transition hover:border-orange-500/30 hover:bg-orange-500/[0.05]"
>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-black">
      الإحصائيات
    </p>

    <p className="mt-1 text-[11px] text-white/40">
      لوحة الإحصائيات الرئيسية
    </p>
  </div>

  <span className="text-xl text-orange-400/70">
    ←
  </span>
</button>
<button
  type="button"
  onClick={() => router.push("/admin/security")}
  className="mt-3 flex w-full items-center justify-between rounded-[22px] border border-orange-500/20 bg-orange-500/[0.05] px-5 py-4 transition hover:border-orange-500/40 hover:bg-orange-500/[0.10]"
>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-black">
      إعدادات الأمان
    </p>

    <p className="mt-1 text-[11px] text-white/40">
      إدارة المصادقة الثنائية وإعدادات الحماية
    </p>
  </div>

  <span className="text-xl text-orange-400/70">
    🛡️
  </span>
</button>
          {/* البحث */}
          <section className="mt-7">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-orange-400/70">
                  CARDS
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  جميع البطاقات
                </h2>
              </div>

              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/45">
                {filteredCards.length} بطاقة
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
                className="h-14 w-full rounded-[20px] border border-white/10 bg-white/[0.035] pr-12 pl-4 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/40 focus:bg-orange-500/[0.04]"
              />
            </div>
          </section>

          {/* قائمة البطاقات */}
          <section className="mt-5 space-y-4">
            {filteredCards.length ===
            0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-8 text-center">
                <HiOutlineCreditCard
                  size={42}
                  className="mx-auto text-white/25"
                />

                <h3 className="mt-4 text-lg font-black">
                  لا توجد بطاقات
                </h3>

                <p className="mt-2 text-sm text-white/40">
                  لم يتم العثور على بطاقة مطابقة للبحث.
                </p>
              </div>
            ) : (
              filteredCards.map(
                (card) => (
                  <article
                    key={card.id}
                    className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-orange-500/[0.02] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.35)]"
                  >
                    <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-orange-500/[0.07] blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-orange-500/20 bg-orange-500/10 text-orange-400">
                          <HiOutlineCreditCard
                            size={28}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-white/40">
                            رقم البطاقة
                          </p>

                          <h3
                            dir="ltr"
                            className="mt-1 truncate text-left text-xl font-black tracking-[0.08em]"
                          >
                            {
                              card.card_code
                            }
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${getStatusClasses(
                          card.status
                        )}`}
                      >
                        {getStatusLabel(
                          card.status
                        )}
                      </span>
                    </div>

                    <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[11px] text-white/35">
                          تاريخ الإنشاء
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 text-left text-xs font-bold text-white/70"
                        >
                          {formatDate(
                            card.created_at
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-white/35">
                          تاريخ التفعيل
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 text-left text-xs font-bold text-white/70"
                        >
                          {formatDate(
                            card.activated_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[11px] text-white/35">
                          إصدار التشفير
                        </p>

                        <p className="mt-1 text-xs font-bold text-white/70">
                          {card.crypto_version
                            ? `Crypto v${card.crypto_version}`
                            : "غير محدد"}
                        </p>
                      </div>

                     <button
  type="button"
  onClick={() =>
    router.push(`/admin/cards/${card.id}`)
  }
  className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black text-orange-300 transition hover:bg-orange-500/20 active:scale-95"
>
  إدارة البطاقة
</button>
                    </div>
                  </article>
                )
              )
            )}
          </section>
        </div>

        {batchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[30px] border border-orange-500/20 bg-[#0b0b0b] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-orange-400/70">
                    CREATE BATCH
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    إنشاء دفعة بطاقات
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/45">
                    اختر عدد البطاقات التي تريد إنشاءها دفعة واحدة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBatchModalOpen(false)
                  }
                  disabled={creatingBatch}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:text-white disabled:opacity-40"
                  aria-label="إغلاق"
                >
                  <HiOutlineXMark size={22} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {([50, 100, 200] as BatchSize[]).map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setSelectedBatchSize(size)
                      }
                      disabled={creatingBatch}
                      className={`rounded-[20px] border px-3 py-5 text-center transition active:scale-95 ${
                        selectedBatchSize === size
                          ? "border-orange-500 bg-orange-500 text-black"
                          : "border-white/10 bg-white/[0.035] text-white hover:border-orange-500/30"
                      }`}
                    >
                      <span className="block text-2xl font-black">
                        {size}
                      </span>

                      <span className="mt-1 block text-[11px] font-bold opacity-70">
                        بطاقة
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 rounded-[20px] border border-orange-500/15 bg-orange-500/[0.06] p-4 text-xs leading-6 text-orange-100/70">
                سيتم إنشاء {selectedBatchSize} بطاقة بأرقام متسلسلة وإضافتها إلى لوحة التحكم تلقائيًا.
              </div>

              <button
                type="button"
                onClick={() => {
                  void createBatch();
                }}
                disabled={creatingBatch}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-[20px] bg-orange-500 px-5 py-4 text-sm font-black text-black transition hover:bg-orange-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingBatch ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    جاري إنشاء {selectedBatchSize} بطاقة...
                  </>
                ) : (
                  <>
                    <HiOutlineRectangleStack
                      size={22}
                    />
                    إنشاء الدفعة
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}