import { FaFacebook } from "react-icons/fa";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function FacebookPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="Facebook"
      title="Facebook"
      description="إدارة بيانات حساب Facebook بأمان"
      emailPlaceholder="example@gmail.com"
      icon={<FaFacebook size={58} className="text-blue-500" />}
      cardCode={card || null}
    />
  );
}