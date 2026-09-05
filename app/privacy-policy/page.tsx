import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | NEXO Digital Pass",
  description:
    "سياسة الخصوصية الخاصة بتطبيق وخدمة NEXO Digital Pass.",
};

const supportEmail = "nexodigitalpass.support@gmail.com";

export default function PrivacyPolicyPage() {
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
            سياسة الخصوصية
          </h1>

          <p className="mt-3 text-sm text-white/40">
            آخر تحديث: 6 سبتمبر 2026
          </p>
        </header>

        <div className="space-y-6">
          <Section title="مقدمة">
            نحترم خصوصيتك في NEXO Digital Pass. توضح هذه
            السياسة أنواع البيانات التي تتم معالجتها عند
            استخدام التطبيق، والغرض من استخدامها، وكيفية
            حمايتها وإدارتها.
          </Section>

          <Section title="البيانات التي قد يتم جمعها">
            قد يقوم NEXO Digital Pass بمعالجة البيانات التي
            يضيفها المستخدم إلى خزنته الرقمية، مثل الاسم،
            وعناوين البريد الإلكتروني، وأسماء المستخدمين أو
            معرّفات الحسابات، وأرقام الهاتف، ومعلومات
            الاسترداد، والملاحظات والبيانات الأخرى التي
            يختار المستخدم حفظها داخل الخزنة.
          </Section>

          <Section title="البيانات التقنية والأمنية">
            لأغراض الحماية ومنع إساءة الاستخدام، قد تتم
            معالجة بعض المعلومات التقنية مثل عنوان IP،
            والموقع الجغرافي التقريبي المستنتج منه،
            ومعرّفات تقنية مؤقتة أو معلومات مرتبطة بالجهاز.
            تستخدم هذه البيانات لأغراض الأمان والتحقق فقط،
            وليس للإعلانات الموجّهة.
          </Section>

          <Section title="كيفية استخدام البيانات">
            نستخدم البيانات لتشغيل وظائف NEXO Digital Pass،
            وربط بطاقة NEXO بالخزنة، وحفظ وإدارة الحسابات،
            وتوفير الوصول إلى البيانات المحفوظة، وتحسين
            أمان الخدمة ومنع الاستخدام غير المصرح به.
          </Section>

          <Section title="تشفير بيانات الخزنة">
            يتم تصميم NEXO Digital Pass بحيث تتم حماية
            بيانات الخزنة وتشفير البيانات الحساسة قبل
            تخزينها. الهدف من هذا التصميم هو المحافظة على
            خصوصية المستخدم وتقليل إمكانية الوصول إلى
            محتوى الخزنة من أي طرف غير مخوّل.
          </Section>

          <Section title="مشاركة البيانات">
            لا نبيع بيانات المستخدمين ولا نشارك بيانات
            الخزنة لأغراض الإعلانات أو التسويق. قد تتم
            معالجة بعض البيانات بواسطة مزودي البنية
            التحتية والخدمات التقنية الضرورية لتشغيل NEXO
            Digital Pass أو توفير الحماية الأمنية، وذلك
            بالقدر اللازم لتقديم الخدمة.
          </Section>

          <Section title="الاحتفاظ بالبيانات">
            يتم الاحتفاظ بالبيانات طالما كانت مطلوبة لتوفير
            الخدمة للمستخدم، أو إلى أن يقوم المستخدم بحذف
            البيانات من داخل الخزنة أو يطلب حذف حسابه
            والبيانات المرتبطة به، ما لم يكن الاحتفاظ ببعض
            المعلومات مطلوباً لأسباب أمنية أو قانونية.
          </Section>

          <Section title="حذف البيانات والحساب">
            يمكن للمستخدم حذف الحسابات والبيانات المحفوظة
            داخل الخزنة من خلال التطبيق، كما يمكنه طلب حذف
            حسابه والبيانات المرتبطة به أو طلب حذف جزء محدد
            من بياناته من خلال صفحة الحذف المخصصة.
            <div className="mt-5">
              <a
                href="/delete-account"
                className="inline-flex rounded-2xl bg-[#ff6a00] px-5 py-3 font-bold text-white transition hover:brightness-110"
              >
                حذف الحساب أو البيانات
              </a>
            </div>
          </Section>

          <Section title="أمان البيانات">
            نستخدم إجراءات تقنية وتنظيمية لحماية البيانات
            من الوصول أو الاستخدام أو التعديل غير المصرح
            به. ومع ذلك، لا توجد وسيلة نقل أو تخزين إلكتروني
            يمكن ضمان أمانها بنسبة 100%.
          </Section>

          <Section title="خصوصية الأطفال">
            NEXO Digital Pass غير مخصص للأطفال الصغار
            لإنشاء واستخدام خزائن رقمية بصورة مستقلة. إذا
            علمنا بجمع بيانات بطريقة غير مناسبة، فسنتخذ
            الإجراءات اللازمة لمعالجتها وفق المتطلبات
            المعمول بها.
          </Section>

          <Section title="التغييرات على سياسة الخصوصية">
            قد نقوم بتحديث هذه السياسة عند إضافة ميزات جديدة
            أو تغيير طريقة عمل الخدمة. سيتم نشر النسخة
            المحدثة على هذه الصفحة مع تحديث تاريخ آخر تعديل.
          </Section>

          <Section title="التواصل معنا">
            إذا كان لديك سؤال بخصوص الخصوصية أو بياناتك،
            يمكنك التواصل معنا عبر البريد الإلكتروني:
            <div className="mt-4">
              <a
                href={`mailto:${supportEmail}`}
                className="font-bold text-[#ff7a1a]"
              >
                {supportEmail}
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