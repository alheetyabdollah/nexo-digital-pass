import "server-only";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AdminAuthSuccess = {
  authorized: true;
  userId: string;
  role: string;
};

type AdminAuthFailure = {
  authorized: false;
  status: 401 | 403;
  error: string;
};

export type AdminAuthResult =
  | AdminAuthSuccess
  | AdminAuthFailure;

export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      authorized: false,
      status: 401,
      error: "يجب تسجيل الدخول أولًا",
    };
  }

  const { data: adminUser, error: adminError } =
    await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError || !adminUser) {
    return {
      authorized: false,
      status: 403,
      error: "ليس لديك صلاحية للوصول",
    };
  }

  if (adminUser.role !== "owner") {
    return {
      authorized: false,
      status: 403,
      error: "صلاحية الأدمن غير كافية",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    role: adminUser.role,
  };
}