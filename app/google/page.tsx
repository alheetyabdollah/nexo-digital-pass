import { SiGoogleplay } from "react-icons/si";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function GooglePage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="Google"
      title="Google Play"
      description="إدارة بيانات حساب Google Play بأمان"
      emailPlaceholder="example@gmail.com"
      icon={<SiGoogleplay size={58} className="text-white" />}
      cardCode={card || null}
      showRecovery
    />
  );
}