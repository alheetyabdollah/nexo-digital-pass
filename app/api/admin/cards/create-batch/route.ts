import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

type CreateBatchBody = {
  quantity?: number;
};

type CardRecord = {
  id: string;
  card_code: string;
  status: string | null;
  created_at: string | null;
  activated_at?: string | null;
  crypto_version?: number | null;
  batch_id?: string | null;
};

type BatchRecord = {
  id: string;
  batch_number: number;
  batch_code: string;
  quantity: number;
  status: string;
  created_at: string;
};

type CreateBatchRpcResult = {
  batch?: BatchRecord;
  cards?: CardRecord[];
  quantity?: number;
};

const ALLOWED_QUANTITIES = new Set([50, 100, 200]);

export async function POST(request: NextRequest) {
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

    let body: CreateBatchBody;

    try {
      body =
        (await request.json()) as CreateBatchBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "بيانات طلب إنشاء الدفعة غير صالحة",
        },
        {
          status: 400,
        }
      );
    }

    const quantity = Number(body.quantity);

    if (
      !Number.isInteger(quantity) ||
      !ALLOWED_QUANTITIES.has(quantity)
    ) {
      return NextResponse.json(
        {
          error:
            "حجم الدفعة يجب أن يكون 50 أو 100 أو 200 بطاقة",
        },
        {
          status: 400,
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

    const { data, error } =
      await adminSupabase.rpc(
        "create_nexo_card_batch",
        {
          p_quantity: quantity,
        }
      );

    if (error) {
      console.error(
        "Create card batch error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "تعذر إنشاء دفعة البطاقات",
        },
        {
          status: 500,
        }
      );
    }

    const result =
      (data || {}) as CreateBatchRpcResult;

    if (!result.batch) {
      return NextResponse.json(
        {
          error:
            "لم تُرجع قاعدة البيانات معلومات الدفعة",
        },
        {
          status: 500,
        }
      );
    }

    const cards = Array.isArray(
      result.cards
    )
      ? result.cards
      : [];

    if (cards.length !== quantity) {
      console.error(
        `Expected ${quantity} cards but received ${cards.length}`
      );

      return NextResponse.json(
        {
          error:
            "لم تُرجع قاعدة البيانات جميع بطاقات الدفعة",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        batch: result.batch,
        cards,
        quantity: cards.length,
        message: `تم إنشاء الدفعة ${result.batch.batch_code} بنجاح`,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected create batch error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء إنشاء دفعة البطاقات",
      },
      {
        status: 500,
      }
    );
  }
}