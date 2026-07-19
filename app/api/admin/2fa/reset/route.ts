import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ResetTwoFactorBody = {
  factorId?: string;
};

export async function POST(request: Request) {
  try {
    /*
     * أولًا: نتحقق من جلسة المستخدم الحالية
     * باستخدام عميل Supabase المرتبط بالكوكيز.
     */
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ثانيًا: نتحقق أن المستخدم هو Owner
     * المسجل داخل جدول admin_users.
     */
    const {
      data: adminUser,
      error: adminError,
    } = await supabase
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json(
        {
          error: "غير مخوّل بتنفيذ هذه العملية",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ثالثًا: إعادة تعيين 2FA مسموحة فقط
     * بعد دخول المستخدم بالمصادقة الثنائية الحالية.
     */
    const {
      data: aalData,
      error: aalError,
    } =
      await supabase.auth.mfa
        .getAuthenticatorAssuranceLevel();

    if (
      aalError ||
      aalData.currentLevel !== "aal2"
    ) {
      return NextResponse.json(
        {
          error:
            "يجب إكمال المصادقة الثنائية قبل إعادة تعيينها",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * رابعًا: قراءة معرف عامل المصادقة
     * المرسل من صفحة إعدادات الأمان.
     */
    const body =
      (await request.json()) as ResetTwoFactorBody;

    const factorId =
      typeof body.factorId === "string"
        ? body.factorId.trim()
        : "";

    if (!factorId) {
      return NextResponse.json(
        {
          error: "معرّف المصادقة الثنائية غير موجود",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * خامسًا: حذف عامل المصادقة باستخدام
     * Service Role من جهة السيرفر فقط.
     */
    const adminSupabase =
      createAdminClient();

    const {
      error: deleteError,
    } =
      await adminSupabase.auth.admin.mfa
        .deleteFactor({
          id: factorId,
          userId: user.id,
        });

    if (deleteError) {
      console.error(
        "Delete admin MFA factor error:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            "تعذر إعادة تعيين المصادقة الثنائية",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "تم حذف المصادقة الثنائية بنجاح",
    });
  } catch (error) {
    console.error(
      "Reset admin 2FA API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء إعادة التعيين",
      },
      {
        status: 500,
      }
    );
  }
}