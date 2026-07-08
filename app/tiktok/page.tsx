import { SiTiktok } from "react-icons/si";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function TikTokPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="TikTok"
      title="TikTok"
      description="إدارة بيانات حساب TikTok بأمان"
      emailPlaceholder="example@gmail.com"
      icon={<SiTiktok size={58} className="text-white" />}
      cardCode={card || null}
    />
  );
}