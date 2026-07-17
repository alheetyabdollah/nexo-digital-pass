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

export default function AdminCardDetailsPage({
  card,
}: Props) {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] text-white"
    >
      <div className="mx-auto w-full max-w-[600px] px-5 py-6">
        <p className="text-xs font-bold tracking-[0.2em] text-orange-400">
          NEXO CONTROL PANEL
        </p>

        <h1 className="mt-3 text-3xl font-black">
          إدارة البطاقة
        </h1>

        <section className="mt-8 rounded-[30px] border border-orange-500/20 bg-[#111111] p-6">
          <p className="text-xs text-white/40">
            رقم البطاقة
          </p>

          <p
            dir="ltr"
            className="mt-2 text-left text-2xl font-black text-orange-400"
          >
            {card.card_code}
          </p>

          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">
                الحالة
              </span>

              <span className="text-sm font-black">
                {card.status || "غير محددة"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">
                إصدار التشفير
              </span>

              <span className="text-sm font-black">
                {card.crypto_version
                  ? `Crypto v${card.crypto_version}`
                  : "غير محدد"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">
                خوارزمية الاشتقاق
              </span>

              <span
                dir="ltr"
                className="text-left text-sm font-black"
              >
                {card.kdf_algorithm ||
                  "غير محددة"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">
                رقم الدفعة
              </span>

              <span
                dir="ltr"
                className="max-w-[230px] truncate text-left text-sm font-black"
              >
                {card.batch_id ||
                  "بطاقة منفردة"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}