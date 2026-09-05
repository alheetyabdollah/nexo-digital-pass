import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حذف الحساب والبيانات | NEXO Digital Pass",
  description:
    "صفحة طلب حذف حساب NEXO Digital Pass أو حذف جزء من البيانات المرتبطة به.",
};

const supportEmail = "alheetyabdollah@gmail.com";

const deleteAllSubject = encodeURIComponent(
  "NEXO Digital Pass - Delete Account Request"
);

const deleteAllBody = encodeURIComponent(
  `مرحباً فريق NEXO,

أرغب بطلب حذف حسابي وبياناتي المرتبطة بتطبيق NEXO Digital Pass.

رقم بطاقة NEXO:
الاسم:

نوع الطلب: حذف الحساب والبيانات بالكامل.

ملاحظة: لن أرسل كلمة مرور الخزنة أو أي كلمات مرور لحساباتي.`
);

const deleteDataSubject = encodeURIComponent(
  "NEXO Digital Pass - Delete Data Request"
);

const deleteDataBody = encodeURIComponent(
  `مرحباً فريق NEXO,

أرغب بطلب حذف جزء من بياناتي المرتبطة بتطبيق NEXO Digital Pass.

رقم بطاقة NEXO:
الاسم:

يرجى وصف البيانات المطلوب حذفها هنا:

ملاحظة: لن أرسل كلمة مرور الخزنة أو أي كلمات مرور لحساباتي.`
);

export default function DeleteAccountPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] px-5 py-10 text-white"
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mb-2 text-4xl font-black text-[#ff6a00]">
            NEXO
          </div>

          <div className="text-xs font-bold tracking-[0.35em] text-white/40">
            DIGITAL PASS
          </div>

          <h1 className="mt-8 text-3xl font-black">
            حذف الحساب والبيانات
          </h1>

          <p className="mt-4 leading-8 text-white/55">
            يمكنك من هذه الصفحة طلب حذف حسابك في
            NEXO Digital Pass والبيانات المرتبطة به،
            أو طلب حذف جزء محدد من بياناتك.
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-black text-[#ff6a00]">
            حذف الحساب بالكامل
          </h2>

          <p className="mt-3 leading-8 text-white/60">
            عند طلب حذف الحساب بالكامل، سنقوم بمعالجة
            طلب حذف بيانات الخزنة والحسابات الرقمية
            المرتبطة ببطاقة NEXO بعد التحقق من أن الطلب
            صادر من صاحب الحساب.
          </p>

          <a
            href={`mailto:${supportEmail}?subject=${deleteAllSubject}&body=${deleteAllBody}`}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#ff6a00] px-5 text-center font-black text-white transition hover:brightness-110"
          >
            طلب حذف الحساب والبيانات بالكامل
          </a>
        </section>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-black">
            حذف جزء من البيانات
          </h2>

          <p className="mt-3 leading-8 text-white/60">
            إذا كنت لا تريد حذف الحساب بالكامل، يمكنك
            طلب حذف جزء محدد من بياناتك أو الحسابات
            المحفوظة داخل الخزنة.
          </p>

          <a
            href={`mailto:${supportEmail}?subject=${deleteDataSubject}&body=${deleteDataBody}`}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl border border-[#ff6a00]/50 bg-[#ff6a00]/10 px-5 text-center font-black text-[#ff8a3d] transition hover:bg-[#ff6a00]/15"
          >
            طلب حذف جزء من البيانات
          </a>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-black">
            معلومات مهمة
          </h2>

          <ul className="mt-4 space-y-3 text-sm leading-7 text-white/55">
            <li>
              • يرجى كتابة رقم بطاقة NEXO الخاصة بك
              داخل رسالة الطلب.
            </li>

            <li>
              • لا ترسل كلمة مرور الخزنة أو كلمات مرور
              حساباتك إلى فريق NEXO.
            </li>

            <li>
              • قد نطلب معلومات إضافية للتحقق من ملكية
              البطاقة قبل تنفيذ طلب الحذف.
            </li>

            <li>
              • يتم التعامل مع طلبات الحذف وفق متطلبات
              الأمان والخصوصية المعمول بها.
            </li>
          </ul>
        </section>

        <footer className="mt-10 text-center text-xs leading-6 text-white/30">
          NEXO Digital Pass
          <br />
          Secure • Private • Yours
        </footer>
      </div>
    </main>
  );
}