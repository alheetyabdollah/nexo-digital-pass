import { notFound } from "next/navigation";

import AdminCardDetailsPage from "@/components/admin/AdminCardDetailsPage";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  const { data: card, error } =
    await supabaseAdmin
      .from("cards")
      .select(
        `
          id,
          card_code,
          status,
          created_at,
          updated_at,
          crypto_version,
          kdf_algorithm,
          batch_id,
          card_password_hash,
          recovery_key_hash,
          encrypted_vault_key
        `
      )
      .eq("id", id)
      .maybeSingle();

  if (error) {
    console.error(
      "Admin card details error:",
      error
    );

    throw new Error(
      "تعذر تحميل معلومات البطاقة"
    );
  }

  if (!card) {
    notFound();
  }

  return (
    <AdminCardDetailsPage
      card={card}
    />
  );
}