import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BatchRecord = {
  id: string;
  batch_code: string;
  quantity: number;
  status: string;
  created_at: string;
};

type CardRecord = {
  id: string;
  card_code: string;
  status: string | null;
  batch_id: string | null;
};

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nexo-digital-pass.vercel.app";

// =====================================================
// NEXO PRINT SETTINGS — جميع القياسات بالمليمتر
// =====================================================

// ورقة الطباعة: عرض 200 × ارتفاع 300 ملم
const SHEET_WIDTH_MM = 200;
const SHEET_HEIGHT_MM = 300;

// تصميم البطاقة بعد زيادة مساحة النزف: 93 × 60 ملم
const CARD_WIDTH_MM = 93;
const CARD_HEIGHT_MM = 60;

// الترتيب: عمودان × خمسة صفوف = 10 بطاقات
const COLUMNS = 2;
const ROWS = 5;
const CARDS_PER_SHEET = COLUMNS * ROWS;

// الهوامش والفراغات
// عرضياً: 93 + 11 + 93 = 197 ملم، ويبقى 1.5 ملم لكل جانب
// طولياً: 60 × 5 = 300 ملم، لذلك بدون هامش أو فراغ بين الصفوف
const MARGIN_X_MM = 1.5;
const MARGIN_Y_MM = 0;
const GAP_X_MM = 11;
const GAP_Y_MM = 0;

// موضع وحجم QR داخل البطاقة
const QR_SIZE_MM = 22.6;
const QR_OFFSET_X_MM = 35.5;
const QR_OFFSET_Y_MM = 8.2;

// علامات القص
const CROP_MARK_LENGTH_MM = 2.5;
const CROP_MARK_GAP_MM = 0.8;
const CROP_MARK_THICKNESS = 0.35;

// نخليها false بالتجربة الأولى: ظهر بنفس ترتيب الوجه بدون عكس
const MIRROR_BACK = false;

const MM_TO_POINTS = 72 / 25.4;

function mm(value: number) {
  return value * MM_TO_POINTS;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    throw new Error("Invalid QR image");
  }

  return Uint8Array.from(Buffer.from(base64, "base64"));
}

async function loadImage(fileName: string) {
  const imagePath = path.join(
    process.cwd(),
    "public",
    "print",
    fileName
  );

  return fs.readFile(imagePath);
}

function getCardPosition(position: number) {
  const column = position % COLUMNS;
  const row = Math.floor(position / COLUMNS);

  const cardWidth = mm(CARD_WIDTH_MM);
  const cardHeight = mm(CARD_HEIGHT_MM);
  const pageHeight = mm(SHEET_HEIGHT_MM);

  const x =
    mm(MARGIN_X_MM) +
    column * (cardWidth + mm(GAP_X_MM));

  const y =
    pageHeight -
    mm(MARGIN_Y_MM) -
    cardHeight -
    row * (cardHeight + mm(GAP_Y_MM));

  return { x, y };
}

function getBackPosition(position: number) {
  if (!MIRROR_BACK) {
    return getCardPosition(position);
  }

  const row = Math.floor(position / COLUMNS);
  const column = position % COLUMNS;
  const mirroredColumn = COLUMNS - 1 - column;
  const mirroredPosition = row * COLUMNS + mirroredColumn;

  return getCardPosition(mirroredPosition);
}

function drawCropMarks(
  page: PDFPage,
  x: number,
  y: number,
  cardWidth: number,
  cardHeight: number
) {
  const length = mm(CROP_MARK_LENGTH_MM);
  const gap = mm(CROP_MARK_GAP_MM);
  const color = rgb(0.55, 0.55, 0.55);

  const line = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      thickness: CROP_MARK_THICKNESS,
      color,
    });
  };

  // الزاوية السفلية اليسرى
  line(x - gap - length, y, x - gap, y);
  line(x, y - gap - length, x, y - gap);

  // الزاوية السفلية اليمنى
  line(
    x + cardWidth + gap,
    y,
    x + cardWidth + gap + length,
    y
  );
  line(
    x + cardWidth,
    y - gap - length,
    x + cardWidth,
    y - gap
  );

  // الزاوية العلوية اليسرى
  line(
    x - gap - length,
    y + cardHeight,
    x - gap,
    y + cardHeight
  );
  line(
    x,
    y + cardHeight + gap,
    x,
    y + cardHeight + gap + length
  );

  // الزاوية العلوية اليمنى
  line(
    x + cardWidth + gap,
    y + cardHeight,
    x + cardWidth + gap + length,
    y + cardHeight
  );
  line(
    x + cardWidth,
    y + cardHeight + gap,
    x + cardWidth,
    y + cardHeight + gap + length
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: batchId } = await context.params;

    if (!batchId) {
      return NextResponse.json(
        { error: "معرّف الدفعة غير موجود" },
        { status: 400 }
      );
    }

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
        { status: 500 }
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

    const [batchResult, cardsResult] = await Promise.all([
      adminSupabase
        .from("card_batches")
        .select(
          "id, batch_code, quantity, status, created_at"
        )
        .eq("id", batchId)
        .maybeSingle(),

      adminSupabase
        .from("cards")
        .select("id, card_code, status, batch_id")
        .eq("batch_id", batchId)
        .order("card_code", { ascending: true }),
    ]);

    if (batchResult.error) {
      throw batchResult.error;
    }

    if (cardsResult.error) {
      throw cardsResult.error;
    }

    if (!batchResult.data) {
      return NextResponse.json(
        { error: "لم يتم العثور على الدفعة" },
        { status: 404 }
      );
    }

    const batch = batchResult.data as BatchRecord;
    const cards = (cardsResult.data || []) as CardRecord[];

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "لا توجد بطاقات داخل الدفعة" },
        { status: 400 }
      );
    }

    const pdfDocument = await PDFDocument.create();

    const [frontImageBytes, backImageBytes] =
      await Promise.all([
        loadImage("card-front.png"),
        loadImage("card-back.png"),
      ]);

    const frontImage = await pdfDocument.embedPng(
      frontImageBytes
    );

    const backImage = await pdfDocument.embedPng(
      backImageBytes
    );

    const pageWidth = mm(SHEET_WIDTH_MM);
    const pageHeight = mm(SHEET_HEIGHT_MM);
    const cardWidth = mm(CARD_WIDTH_MM);
    const cardHeight = mm(CARD_HEIGHT_MM);
    const qrSize = mm(QR_SIZE_MM);

    for (
      let sheetStart = 0;
      sheetStart < cards.length;
      sheetStart += CARDS_PER_SHEET
    ) {
      const sheetCards = cards.slice(
        sheetStart,
        sheetStart + CARDS_PER_SHEET
      );

      // الصفحة الأمامية
      const frontPage = pdfDocument.addPage([
        pageWidth,
        pageHeight,
      ]);

      for (
        let position = 0;
        position < sheetCards.length;
        position += 1
      ) {
        const card = sheetCards[position];
        const { x, y } = getCardPosition(position);

        frontPage.drawImage(frontImage, {
          x,
          y,
          width: cardWidth,
          height: cardHeight,
        });

        const cardUrl =
          `${SITE_ORIGIN}/card/` +
          encodeURIComponent(card.card_code);

        const qrDataUrl = await QRCode.toDataURL(cardUrl, {
          errorCorrectionLevel: "H",
          margin: 1,
          width: 700,
          color: {
            dark: "#111111",
            light: "#FFFFFF",
          },
        });

        const qrImage = await pdfDocument.embedPng(
          dataUrlToBytes(qrDataUrl)
        );

        frontPage.drawImage(qrImage, {
          x: x + mm(QR_OFFSET_X_MM),
          y: y + mm(QR_OFFSET_Y_MM),
          width: qrSize,
          height: qrSize,
        });

        drawCropMarks(
          frontPage,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }

      // الصفحة الخلفية — نفس المواقع بدون عكس بالتجربة الأولى
      const backPage = pdfDocument.addPage([
        pageWidth,
        pageHeight,
      ]);

      for (
        let position = 0;
        position < sheetCards.length;
        position += 1
      ) {
        const { x, y } = getBackPosition(position);

        backPage.drawImage(backImage, {
          x,
          y,
          width: cardWidth,
          height: cardHeight,
        });

        drawCropMarks(
          backPage,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }
    }

    pdfDocument.setTitle(`NEXO ${batch.batch_code}`);
    pdfDocument.setSubject(`${cards.length} NEXO cards`);
    pdfDocument.setCreator("NEXO Digital Pass");
    pdfDocument.setProducer("NEXO Digital Pass");

    const pdfBytes = await pdfDocument.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="${batch.batch_code}-NEXO-Cards.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Generate batch PDF error:", error);

    return NextResponse.json(
      { error: "تعذر إنشاء ملف الطباعة" },
      { status: 500 }
    );
  }
}