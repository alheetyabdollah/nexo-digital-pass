import { HiOutlineSquares2X2 } from "react-icons/hi2";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function OtherPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="Other"
      title="حساب آخر"
      description="أضف أي حساب غير موجود ضمن الخدمات الأساسية، مثل Netflix أو Xbox أو Steam أو أي خدمة أخرى."
      emailPlaceholder="مثال: Netflix أو Xbox أو Steam"
      icon={
        <HiOutlineSquares2X2
          size={58}
          className="text-orange-400"
        />
      }
      cardCode={card || null}
    />
  );
}