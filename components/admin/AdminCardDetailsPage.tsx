"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

type CardDetails = {
  id: string;
  card_code: string;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  crypto_version: number | null;
  kdf_algorithm: string | null;
  batch_id: string | null;
  card_password_hash: string | null;
  recovery_key_hash: string | null;
  encrypted_vault_key: unknown | null;
};

type Props = {
  card: CardDetails;
};

function SecurityRow({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-4 py-3">
      <span className="text-sm text-white/65">{label}</span>

      <span
        className={`text-xs font-black ${
          available ? "text-green-400" : "text-red-400"
        }`}
      >
        {available ? "موجود" : "غير موجود"}
      </span>
    </div>
  );
}

export default function AdminCardDetailsPage({ card }: Props) {
  const router = useRouter();
  const isActivated = card.status === "Activated";

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [copyStatus, setCopyStatus] = useState("نسخ");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const cardUrl = `https://nexo-digital-pass.vercel.app/card/${card.card_code}`;

  useEffect(() => {
    async function createQr() {
      try {
        const dataUrl = await QRCode.toDataURL(cardUrl, {
          width: 700,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error("QR generation error:", error);
      }
    }

    createQr();
  }, [cardUrl]);

  const copyCardLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopyStatus("تم النسخ");

      window.setTimeout(() => {
        setCopyStatus("نسخ");
      }, 1800);
    } catch {
      setCopyStatus("تعذر النسخ");
    }
  };

  const printQr = () => {
    if (!qrDataUrl) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=700,height=850");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${card.card_code}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: white;
              color: black;
            }

            .card {
              width: 420px;
              padding: 32px;
              text-align: center;
              border: 2px solid #111;
              border-radius: 24px;
            }

            .brand {
              margin: 0;
              font-size: 32px;
              font-weight: 900;
              letter-spacing: 3px;
            }

            .subtitle {
              margin: 6px 0 24px;
              font-size: 13px;
              color: #555;
            }

            img {
              width: 300px;
              height: 300px;
              display: block;
              margin: 0 auto;
            }

            .code {
              margin: 22px 0 0;
              font-size: 26px;
              font-weight: 900;
              direction: ltr;
            }

            .note {
              margin: 10px 0 0;
              font-size: 13px;
              color: #555;
            }

            @media print {
              body {
                min-height: auto;
              }

              .card {
                border: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="card">
            <h1 class="brand">NEXO</h1>
            <p class="subtitle">DIGITAL PASS</p>

            <img src="${qrDataUrl}" alt="QR Code" />

            <p class="code">${card.card_code}</p>
            <p class="note">امسح الرمز لفتح بطاقة NEXO</p>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const deleteCard = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/cards/${card.id}/delete`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "تعذر حذف البطاقة");
      }

      router.push("/admin/cards?deleted=1");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "تعذر حذف البطاقة"
      );
      setIsDeleting(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[600px] px-5 py-6">
        <button
          type="button"
          onClick={() => router.push("/admin/cards")}
          className="mb-5 flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 transition hover:bg-orange-500/20 active:scale-95"
        >
          <span aria-hidden="true">←</span>
          <span>رجوع إلى البطاقات</span>
        </button>

        <p className="text-xs font-bold tracking-[0.2em] text-orange-400">
          NEXO CONTROL PANEL
        </p>

        <h1 className="mt-3 text-3xl font-black">إدارة البطاقة</h1>

        <section className="mt-8 rounded-[30px] border border-orange-500/20 bg-[#111111] p-6">
          <p className="text-xs text-white/40">رقم البطاقة</p>

          <p
            dir="ltr"
            className="mt-2 text-left text-2xl font-black text-orange-400"
          >
            {card.card_code}
          </p>

          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">الحالة</span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${
                  isActivated
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {isActivated ? "مفعلة" : "غير مفعلة"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">إصدار التشفير</span>

              <span className="text-sm font-black">
                {card.crypto_version
                  ? `Crypto v${card.crypto_version}`
                  : "غير محدد"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">خوارزمية الاشتقاق</span>

              <span dir="ltr" className="text-left text-sm font-black">
                {card.kdf_algorithm || "غير محددة"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">رقم الدفعة</span>

              <span
                dir="ltr"
                className="max-w-[230px] truncate text-left text-sm font-black"
              >
                {card.batch_id || "بطاقة منفردة"}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-[#111111] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-orange-400">
                SECURITY
              </p>

              <h2 className="mt-2 text-xl font-black">حالة الأمان</h2>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${
                isActivated
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {isActivated ? "مفعلة" : "غير مفعلة"}
            </span>
          </div>

          {!isActivated ? (
            <div className="mt-5 rounded-[22px] border border-yellow-500/15 bg-yellow-500/[0.06] p-4">
              <p className="text-sm font-bold text-yellow-300">
                لم يتم تفعيل البطاقة بعد
              </p>

              <p className="mt-1 text-xs leading-6 text-white/45">
                ستظهر تفاصيل الحماية بعد أن ينشئ العميل الخزنة.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <SecurityRow
                label="كلمة مرور الخزنة"
                available={Boolean(card.card_password_hash)}
              />

              <SecurityRow
                label="مفتاح الاسترداد"
                available={Boolean(card.recovery_key_hash)}
              />

              <SecurityRow
                label="مفتاح الخزنة المشفر"
                available={Boolean(card.encrypted_vault_key)}
              />
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-[#111111] p-6">
          <p className="text-xs font-bold tracking-[0.16em] text-orange-400">
            TOOLS
          </p>

          <h2 className="mt-2 text-xl font-black">الأدوات</h2>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-orange-500/40 hover:bg-orange-500/10"
            >
              <span className="font-bold">👁️ عرض QR</span>
              <span className="text-lg text-white/45">←</span>
            </button>

            <button
              type="button"
              onClick={copyCardLink}
              className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-orange-500/40 hover:bg-orange-500/10"
            >
              <span className="font-bold">🔗 نسخ رابط البطاقة</span>

              <span
                className={`text-xs font-bold ${
                  copyStatus === "تم النسخ" ? "text-green-400" : "text-white/45"
                }`}
              >
                {copyStatus}
              </span>
            </button>

            <button
              type="button"
              onClick={printQr}
              disabled={!qrDataUrl}
              className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-orange-500/40 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="font-bold">🖨️ طباعة QR</span>
              <span className="text-lg text-white/45">←</span>
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-[30px] border border-red-500/15 bg-[#111111] p-6">
          <p className="text-xs font-bold tracking-[0.16em] text-red-400">
            OPERATIONS
          </p>

          <h2 className="mt-2 text-xl font-black">العمليات</h2>

          <p className="mt-2 text-xs leading-6 text-white/40">
            استخدم الحذف فقط عندما تكون متأكدًا أن البطاقة لم تعد مطلوبة.
          </p>

          <button
            type="button"
            onClick={() => {
              setDeleteError("");
              setShowDeleteDialog(true);
            }}
            className="mt-5 flex w-full items-center justify-between rounded-[18px] border border-red-500/25 bg-red-500/[0.07] px-5 py-4 text-red-300 transition hover:border-red-500/50 hover:bg-red-500/[0.12]"
          >
            <span className="font-black">حذف البطاقة</span>
            <span aria-hidden="true">🗑️</span>
          </button>
        </section>
      </div>

      {showQr && (
        <div
          onClick={() => setShowQr(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[390px] rounded-[30px] border border-orange-500/25 bg-[#111111] p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold tracking-[0.2em] text-orange-400">
              NEXO DIGITAL PASS
            </p>

            <h2 dir="ltr" className="mt-3 text-2xl font-black">
              {card.card_code}
            </h2>

            <div className="mt-5 rounded-[24px] bg-white p-5">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${card.card_code}`}
                  className="mx-auto h-auto w-full"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-sm font-bold text-black/50">
                  جاري إنشاء QR...
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-5 w-full rounded-[18px] bg-orange-500 px-5 py-4 font-black text-black transition hover:bg-orange-400"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteDialog(false);
            }
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-5 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-[30px] border border-red-500/25 bg-[#111111] p-6"
          >
            <p className="text-xs font-bold tracking-[0.16em] text-red-400">
              DELETE CARD
            </p>

            <h2 className="mt-3 text-2xl font-black">حذف البطاقة؟</h2>

            <p className="mt-3 text-sm leading-7 text-white/55">
              سيتم حذف البطاقة{" "}
              <strong dir="ltr" className="text-white">
                {card.card_code}
              </strong>{" "}
              وجميع الحسابات المرتبطة بها نهائيًا.
            </p>

            <div className="mt-4 rounded-[18px] border border-red-500/15 bg-red-500/[0.06] p-4">
              <p className="text-xs font-bold leading-6 text-red-300">
                لا يمكن التراجع عن هذه العملية.
              </p>
            </div>

            {deleteError && (
              <p className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {deleteError}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-4 font-black transition hover:bg-white/[0.08] disabled:opacity-40"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={deleteCard}
                className="rounded-[18px] bg-red-500 px-4 py-4 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "جاري الحذف..." : "حذف نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}