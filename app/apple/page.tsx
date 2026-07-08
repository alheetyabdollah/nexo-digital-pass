import { FaApple } from "react-icons/fa";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function ApplePage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="Apple"
      title="Apple ID"
      description="إدارة بيانات حساب Apple بأمان"
      emailPlaceholder="example@icloud.com"
      icon={<FaApple size={62} className="text-white" />}
      cardCode={card || null}
      showRecovery
    />
  );
}