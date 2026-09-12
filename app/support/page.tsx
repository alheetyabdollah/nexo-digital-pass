import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الدعم الفني | NEXO Digital Pass",
  description:
    "صفحة الدعم والمساعدة الخاصة بتطبيق NEXO Digital Pass.",
};

const supportEmail = "nexodigitalpass.support@gmail.com";

export default function SupportPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] px-5 py-10 text-white"
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-10 text-center">
          <div className="text-4xl font-black text-[#ff6a00]">
            NEXO
          </div>

          <div className="mt-1 text-xs font-bold tracking-[0.35em] text-white/40">
            DIGITAL PASS
          </div>

          <h1 className="mt-8 text-3xl font-black">
            الدعم والمساعدة
          </h1>

          <p className="mt-3 leading-7 text-white/50">
            نحن هنا لمساعدتك في استخدام NEXO Digital Pass
          </p>
        </header>

        <div className="space-y-6">
          <Section title="التواصل مع الدعم">
            إذا واجهتك مشكلة في تفعيل البطاقة، فتح الخزنة،
            أو استخدام أي من ميزات التطبيق، يمكنك التواصل
            معنا عبر البريد الإلكتروني.
            <div className="mt-5">
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex rounded-2xl bg-[#ff6a00] px-5 py-3 font-bold text-white transition hover:brightness-110"
              >
                مراسلة دعم NEXO
              </a>
            </div>

            <div className="mt-4 break-all font-bold text-[#ff7a1a]">
              {supportEmail}
            </div>
          </Section>

          <Section title="كيف يمكننا مساعدتك؟">
            يمكنك التواصل معنا بخصوص مشاكل ربط بطاقة NEXO،
            الدخول إلى الخزنة، إضافة أو تعديل الحسابات،
            أو أي مشكلة تقنية متعلقة بالتطبيق.
          </Section>

          <Section title="الخصوصية والبيانات">
            يمكنك مراجعة سياسة الخصوصية أو طلب حذف حسابك
            وبياناتك من خلال الروابط التالية.

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/privacy-policy"
                className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/5"
              >
                سياسة الخصوصية
              </a>

              <a
                href="/delete-account"
                className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/5"
              >
                حذف الحساب والبيانات
              </a>
            </div>
          </Section>
        </div>

        <footer className="mt-12 text-center text-xs leading-6 text-white/30">
          NEXO Digital Pass
          <br />
          Secure • Private • Yours
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="mb-3 text-xl font-black text-[#ff6a00]">
        {title}
      </h2>

      <div className="leading-8 text-white/60">
        {children}
      </div>
    </section>
  );
}
