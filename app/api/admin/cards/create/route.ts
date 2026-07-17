import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "إعدادات Supabase الخاصة بالسيرفر غير مكتملة",
        },
        {
          status: 500,
        }
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data,
      error,
    } = await adminSupabase.rpc(
      "create_nexo_card"
    );

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "تعذر إنشاء بطاقة جديدة",
        },
        {
          status: 500,
        }
      );
    }

    const createdCard =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!createdCard) {
      return NextResponse.json(
        {
          error:
            "لم تُرجع قاعدة البيانات معلومات البطاقة",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        card: createdCard,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء إنشاء البطاقة",
      },
      {
        status: 500,
      }
    );
  }
}