import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log("Admin user session error:", userError);

    redirect("/admin/login");
  }

  const {
    data: adminUser,
    error: adminError,
  } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("Admin authorization check:", {
    userId: user.id,
    adminUser,
    adminError,
  });

  if (
    adminError ||
    !adminUser ||
    adminUser.role !== "owner"
  ) {
    redirect(
      "/admin/login?error=unauthorized"
    );
  }

  return (
    <>
      <AdminLogoutButton />
      {children}
    </>
  );
}