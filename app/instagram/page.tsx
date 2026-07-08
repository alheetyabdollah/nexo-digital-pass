import { SiInstagram } from "react-icons/si";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function InstagramPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="Instagram"
      title="Instagram"
      description="إدارة بيانات حساب Instagram بأمان"
      emailPlaceholder="example@gmail.com"
      icon={<SiInstagram size={58} className="text-pink-500" />}
      cardCode={card || null}
    />
  );
}