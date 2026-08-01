import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import {
  PDFDocument,
  PDFPage,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
} from "pdf-lib";
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

const SHEET_WIDTH_MM = 200;
const SHEET_HEIGHT_MM = 300;

// قياس القص النهائي للبطاقة
const CARD_WIDTH_MM = 93;
const CARD_HEIGHT_MM = 60;

const COLUMNS = 2;
const ROWS = 5;
const CARDS_PER_SHEET = COLUMNS * ROWS;

const MARGIN_X_MM = 1.5;
const MARGIN_Y_MM = 0;

const GAP_X_MM = 11;
const GAP_Y_MM = 0;

// تمديد خلفية البطاقة باتجاه المنتصف
// البطاقة اليسرى تتمدد لليمين 1.5 ملم
// البطاقة اليمنى تتمدد لليسار 1.5 ملم
// بذلك تنخفض المسافة المطبوعة بالوسط بمجموع 3 ملم
const INNER_BLEED_MM = 1.5;

const QR_SIZE_MM = 22.6;
const QR_OFFSET_X_MM = 35.5;
const QR_OFFSET_Y_MM = 8.2;

// إعدادات رقم البطاقة
const CARD_ID_FONT_SIZE_PT = 5.8;
const CARD_ID_OFFSET_Y_MM = 3.2;

const CROP_MARK_LENGTH_MM = 2.5;
const CROP_MARK_GAP_MM = 0.8;
const CROP_MARK_THICKNESS = 0.35;

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

/**
 * يرجع مكان القص الحقيقي للبطاقة.
 *
 * هذا المكان لا يتغير حتى تبقى علامات القص
 * والـQR ورقم البطاقة على قياس 93 × 60 ملم.
 */
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

  return {
    x,
    y,
    column,
  };
}

/**
 * يرجع حدود صورة التصميم مع زيادة Bleed باتجاه الوسط فقط.
 *
 * العمود الأيسر:
 * يبقى من جهة اليسار كما هو ويتمدد 1.5 ملم لليمين.
 *
 * العمود الأيمن:
 * يتحرك 1.5 ملم لليسار ويتمدد عرضه 1.5 ملم.
 *
 * قياس القص لا يتغير.
 */
function getArtworkBounds(
  position: number,
  x: number,
  y: number
) {
  const column = position % COLUMNS;

  const cardWidth = mm(CARD_WIDTH_MM);
  const cardHeight = mm(CARD_HEIGHT_MM);
  const innerBleed = mm(INNER_BLEED_MM);

  if (column === 0) {
    return {
      x,
      y,
      width: cardWidth + innerBleed,
      height: cardHeight,
    };
  }

  return {
    x: x - innerBleed,
    y,
    width: cardWidth + innerBleed,
    height: cardHeight,
  };
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
      start: {
        x: startX,
        y: startY,
      },
      end: {
        x: endX,
        y: endY,
      },
      thickness: CROP_MARK_THICKNESS,
      color,
    });
  };

  // الزاوية السفلية اليسرى
  line(
    x - gap - length,
    y,
    x - gap,
    y
  );

  line(
    x,
    y - gap - length,
    x,
    y - gap
  );

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
        {
          error: "معرّف الدفعة غير موجود",
        },
        {
          status: 400,
        }
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

    const [batchResult, cardsResult] =
      await Promise.all([
        adminSupabase
          .from("card_batches")
          .select(
            "id, batch_code, quantity, status, created_at"
          )
          .eq("id", batchId)
          .maybeSingle(),

        adminSupabase
          .from("cards")
          .select(
            "id, card_code, status, batch_id"
          )
          .eq("batch_id", batchId)
          .order("card_code", {
            ascending: true,
          }),
      ]);

    if (batchResult.error) {
      throw batchResult.error;
    }

    if (cardsResult.error) {
      throw cardsResult.error;
    }

    if (!batchResult.data) {
      return NextResponse.json(
        {
          error: "لم يتم العثور على الدفعة",
        },
        {
          status: 404,
        }
      );
    }

    const batch =
      batchResult.data as BatchRecord;

    const cards =
      (cardsResult.data || []) as CardRecord[];

    if (cards.length === 0) {
      return NextResponse.json(
        {
          error: "لا توجد بطاقات داخل الدفعة",
        },
        {
          status: 400,
        }
      );
    }

    const pdfDocument =
      await PDFDocument.create();

    const [frontImageBytes, backImageBytes] =
      await Promise.all([
        loadImage("card-front.png"),
        loadImage("card-back.png"),
      ]);

    const frontImage =
      await pdfDocument.embedPng(
        frontImageBytes
      );

    const backImage =
      await pdfDocument.embedPng(
        backImageBytes
      );

    const cardIdFont =
      await pdfDocument.embedFont(
        StandardFonts.HelveticaBold
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

      // =================================================
      // الصفحة الأمامية — انعكاس أفقي كامل مثل المرآة
      // =================================================

      const frontPage =
        pdfDocument.addPage([
          pageWidth,
          pageHeight,
        ]);

      frontPage.pushOperators(
        pushGraphicsState()
      );

      frontPage.pushOperators(
        concatTransformationMatrix(
          -1,
          0,
          0,
          1,
          pageWidth,
          0
        )
      );

      for (
        let position = 0;
        position < sheetCards.length;
        position += 1
      ) {
        const card = sheetCards[position];

        const { x, y } =
          getCardPosition(position);

        const artwork =
          getArtworkBounds(
            position,
            x,
            y
          );

        // صورة الوجه مع امتداد 1.5 ملم باتجاه الوسط
        frontPage.drawImage(frontImage, {
          x: artwork.x,
          y: artwork.y,
          width: artwork.width,
          height: artwork.height,
        });

        const cardUrl =
          `${SITE_ORIGIN}/card/` +
          encodeURIComponent(
            card.card_code
          );

        const qrDataUrl =
          await QRCode.toDataURL(
            cardUrl,
            {
              errorCorrectionLevel: "H",
              margin: 1,
              width: 700,
              color: {
                dark: "#111111",
                light: "#FFFFFF",
              },
            }
          );

        const qrImage =
          await pdfDocument.embedPng(
            dataUrlToBytes(qrDataUrl)
          );

        const qrX =
          x + mm(QR_OFFSET_X_MM);

        const qrY =
          y + mm(QR_OFFSET_Y_MM);

        frontPage.drawImage(qrImage, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });

        // =================================================
        // رقم البطاقة الحقيقي
        // مثال: CARD ID: NX-000107
        // =================================================

        const cardIdText =
          `CARD ID: ${card.card_code}`;

        const cardIdTextWidth =
          cardIdFont.widthOfTextAtSize(
            cardIdText,
            CARD_ID_FONT_SIZE_PT
          );

        // توسيط الرقم تحت الـQR
        const cardIdX =
          qrX +
          (qrSize - cardIdTextWidth) / 2;

        const cardIdY =
          y + mm(CARD_ID_OFFSET_Y_MM);

        frontPage.drawText(
          cardIdText,
          {
            x: cardIdX,
            y: cardIdY,
            size: CARD_ID_FONT_SIZE_PT,
            font: cardIdFont,
            color: rgb(
              0.92,
              0.92,
              0.92
            ),
          }
        );

        // علامات القص تبقى حسب القياس الأصلي
        drawCropMarks(
          frontPage,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }

      frontPage.pushOperators(
        popGraphicsState()
      );

      // =================================================
      // الصفحة الخلفية — انعكاس أفقي كامل مثل المرآة
      // =================================================

      const backPage =
        pdfDocument.addPage([
          pageWidth,
          pageHeight,
        ]);

      backPage.pushOperators(
        pushGraphicsState()
      );

      backPage.pushOperators(
        concatTransformationMatrix(
          -1,
          0,
          0,
          1,
          pageWidth,
          0
        )
      );

      for (
        let position = 0;
        position < sheetCards.length;
        position += 1
      ) {
        const { x, y } =
          getCardPosition(position);

        const artwork =
          getArtworkBounds(
            position,
            x,
            y
          );

        // صورة الظهر مع امتداد 1.5 ملم باتجاه الوسط
        backPage.drawImage(backImage, {
          x: artwork.x,
          y: artwork.y,
          width: artwork.width,
          height: artwork.height,
        });

        // علامات القص تبقى حسب القياس الأصلي
        drawCropMarks(
          backPage,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }

      backPage.pushOperators(
        popGraphicsState()
      );
    }

    pdfDocument.setTitle(
      `NEXO ${batch.batch_code}`
    );

    pdfDocument.setSubject(
      `${cards.length} NEXO cards`
    );

    pdfDocument.setCreator(
      "NEXO Digital Pass"
    );

    pdfDocument.setProducer(
      "NEXO Digital Pass"
    );

    const pdfBytes =
      await pdfDocument.save();

    return new NextResponse(
      Buffer.from(pdfBytes),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${batch.batch_code}-NEXO-Cards.pdf"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Generate batch PDF error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر إنشاء ملف الطباعة",
      },
      {
        status: 500,
      }
    );
  }
}