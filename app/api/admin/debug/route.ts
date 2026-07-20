import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        stage: "getUser",
        user: null,
        userError: userError?.message || null,
      });
    }

    const {
      data: adminUser,
      error: adminError,
    } = await supabaseAdmin
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      stage: "adminCheck",
      authUserId: user.id,
      authEmail: user.email,
      adminUser,
      adminError: adminError
        ? {
            message: adminError.message,
            code: adminError.code,
            details: adminError.details,
            hint: adminError.hint,
          }
        : null,
      roleValue: adminUser?.role || null,
      roleMatchesOwner:
        adminUser?.role === "owner",
      supabaseProject:
        process.env.NEXT_PUBLIC_SUPABASE_URL
          ?.replace("https://", "")
          .split(".")[0] || null,
      serviceKeyExists:
        Boolean(
          process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        stage: "unexpected",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}