import { supabase } from "@/lib/supabase";

import {
  encryptText as legacyEncryptText,
  decryptText as legacyDecryptText,
} from "@/lib/encryption";

import {
  decryptOptionalVaultText,
  encryptOptionalVaultText,
} from "@/lib/crypto/access";

/*
 * تصدير مؤقت للتوافق مع الصفحات القديمة.
 * نحذفه بعد اكتمال نقل جميع الصفحات إلى Crypto v2.
 */
export const encryptText = legacyEncryptText;
export const decryptText = legacyDecryptText;

export type AccountSecureFields = {
  email?: string | null;
  username?: string | null;
  password?: string | null;
  phone?: string | null;
  recovery?: string | null;
  notes?: string | null;
};

export type EncryptedAccountFields = {
  email: string | null;
  username: string | null;
  password: string | null;
  phone: string | null;
  recovery: string | null;
  notes: string | null;
};

export function cleanValue(
  value: string
): string | null {
  const cleaned = value.trim();

  return cleaned || null;
}

export function isEmptyAccount(
  fields: string[]
): boolean {
  return fields.every(
    (field) => !field.trim()
  );
}

/*
 * يستخدم حاليًا لإنشاء email_hash
 * ومنع تكرار البريد داخل نفس الخدمة.
 */
export async function hashText(
  text: string
): Promise<string> {
  const normalized = text
    .trim()
    .toLowerCase();

  const data = new TextEncoder().encode(
    normalized
  );

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

export async function checkDuplicateAccount(
  params: {
    cardId: string;
    service: string;
    email: string;
    excludeAccountId?: string;
  }
): Promise<boolean> {
  const cleanEmail =
    params.email.trim();

  if (!cleanEmail) {
    return false;
  }

  const emailHash =
    await hashText(cleanEmail);

  let query = supabase
    .from("accounts")
    .select("id")
    .eq("card_id", params.cardId)
    .eq("service", params.service)
    .eq("email_hash", emailHash)
    .limit(1);

  /*
   * عند تعديل حساب موجود نستثني الحساب نفسه،
   * حتى لا يعتبر بريده الحالي نسخة مكررة.
   */
  if (params.excludeAccountId) {
    query = query.neq(
      "id",
      params.excludeAccountId
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return Boolean(data?.length);
}

/* ======================================================
   Crypto v2
   الحسابات تُشفّر باستخدام Vault Key الموجود في الذاكرة.
   cardCode يستخدم للتحقق من أن الجلسة تخص البطاقة نفسها.
====================================================== */

export async function encryptAccountFieldsV2(
  account: AccountSecureFields,
  cardCode: string
): Promise<EncryptedAccountFields> {
  const cleanedCardCode =
    cardCode.trim();

  if (!cleanedCardCode) {
    throw new Error(
      "رقم البطاقة غير صالح"
    );
  }

  return {
    email:
      await encryptOptionalVaultText(
        account.email,
        cleanedCardCode
      ),

    username:
      await encryptOptionalVaultText(
        account.username,
        cleanedCardCode
      ),

    password:
      await encryptOptionalVaultText(
        account.password,
        cleanedCardCode
      ),

    phone:
      await encryptOptionalVaultText(
        account.phone,
        cleanedCardCode
      ),

    recovery:
      await encryptOptionalVaultText(
        account.recovery,
        cleanedCardCode
      ),

    notes:
      await encryptOptionalVaultText(
        account.notes,
        cleanedCardCode
      ),
  };
}

export async function decryptAccountFieldsV2(
  account: AccountSecureFields,
  cardCode: string
): Promise<EncryptedAccountFields> {
  const cleanedCardCode =
    cardCode.trim();

  if (!cleanedCardCode) {
    throw new Error(
      "رقم البطاقة غير صالح"
    );
  }

  /*
   * لا نعيد النص المشفر عند الفشل.
   * أي خطأ بفك التشفير يجب أن يظهر بوضوح،
   * حتى لا تُعامل البيانات التالفة كنص عادي.
   */
  return {
    email:
      await decryptOptionalVaultText(
        account.email,
        cleanedCardCode
      ),

    username:
      await decryptOptionalVaultText(
        account.username,
        cleanedCardCode
      ),

    password:
      await decryptOptionalVaultText(
        account.password,
        cleanedCardCode
      ),

    phone:
      await decryptOptionalVaultText(
        account.phone,
        cleanedCardCode
      ),

    recovery:
      await decryptOptionalVaultText(
        account.recovery,
        cleanedCardCode
      ),

    notes:
      await decryptOptionalVaultText(
        account.notes,
        cleanedCardCode
      ),
  };
}

/* ======================================================
   Legacy Crypto v1 — مؤقت فقط
   يبقى حتى ننقل جميع الصفحات القديمة بأمان.
====================================================== */

async function encryptLegacyField(
  value: string | null | undefined,
  password: string
): Promise<string | null> {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return legacyEncryptText(
    cleaned,
    password
  );
}

async function decryptLegacyField(
  value: string | null | undefined,
  password: string
): Promise<string | null> {
  if (!value) {
    return null;
  }

  try {
    return await legacyDecryptText(
      value,
      password
    );
  } catch {
    throw new Error(
      "فشل فك تشفير بيانات Crypto v1"
    );
  }
}

/*
 * هذه الأسماء القديمة تبقى مؤقتًا حتى لا
 * تنكسر الصفحات التي لم تُنقل بعد.
 */
export async function encryptAccountFields(
  account: AccountSecureFields,
  password: string
): Promise<EncryptedAccountFields> {
  return {
    email:
      await encryptLegacyField(
        account.email,
        password
      ),

    username:
      await encryptLegacyField(
        account.username,
        password
      ),

    password:
      await encryptLegacyField(
        account.password,
        password
      ),

    phone:
      await encryptLegacyField(
        account.phone,
        password
      ),

    recovery:
      await encryptLegacyField(
        account.recovery,
        password
      ),

    notes:
      await encryptLegacyField(
        account.notes,
        password
      ),
  };
}

export async function decryptAccountFields(
  account: AccountSecureFields,
  password: string
): Promise<EncryptedAccountFields> {
  return {
    email:
      await decryptLegacyField(
        account.email,
        password
      ),

    username:
      await decryptLegacyField(
        account.username,
        password
      ),

    password:
      await decryptLegacyField(
        account.password,
        password
      ),

    phone:
      await decryptLegacyField(
        account.phone,
        password
      ),

    recovery:
      await decryptLegacyField(
        account.recovery,
        password
      ),

    notes:
      await decryptLegacyField(
        account.notes,
        password
      ),
  };
}