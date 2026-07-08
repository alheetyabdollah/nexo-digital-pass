import { FaWhatsapp } from "react-icons/fa";
import AccountServicePage from "@/components/forms/AccountServicePage";

export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <AccountServicePage
      service="WhatsApp"
      title="WhatsApp"
      description="إدارة بيانات حساب WhatsApp بأمان"
      emailPlaceholder="+964..."
      icon={<FaWhatsapp size={58} className="text-green-500" />}
      cardCode={card || null}
    />
  );
}