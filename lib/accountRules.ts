import { supabase } from "@/lib/supabase";
import { encryptText, decryptText } from "@/lib/encryption";
export { encryptText, decryptText } from "@/lib/encryption";
export type AccountSecureFields = {
  email?: string | null;
  username?: string | null;
  password?: string | null;
  phone?: string | null;
  recovery?: string | null;
  notes?: string | null;
};

export function cleanValue(value: string) {
  const cleaned = value.trim();
  return cleaned || null;
}

export function isEmptyAccount(fields: string[]) {
  return fields.every((field) => !field.trim());
}

export async function hashText(text: string) {
  const normalized = text.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkDuplicateAccount(params: {
  cardId: string;
  service: string;
  email: string;
}) {
  const cleanEmail = params.email.trim();

  if (!cleanEmail) return false;

  const emailHash = await hashText(cleanEmail);

  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("card_id", params.cardId)
    .eq("service", params.service)
    .eq("email_hash", emailHash)
    .limit(1);

  if (error) {
    throw error;
  }

  return data.length > 0;
}

export async function hashVaultKey(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptField(value: string | null | undefined, password: string) {
  if (!value) return null;

  const cleaned = value.trim();
  if (!cleaned) return null;

  return await encryptText(cleaned, password);
}

async function decryptField(value: string | null | undefined, password: string) {
  if (!value) return null;

  try {
    return await decryptText(value, password);
  } catch {
    return value;
  }
}

export async function encryptAccountFields(
  account: AccountSecureFields,
  password: string
) {
  return {
    email: await encryptField(account.email, password),
    username: await encryptField(account.username, password),
    password: await encryptField(account.password, password),
    phone: await encryptField(account.phone, password),
    recovery: await encryptField(account.recovery, password),
    notes: await encryptField(account.notes, password),
  };
}

export async function decryptAccountFields(
  account: AccountSecureFields,
  password: string
) {
  return {
    email: await decryptField(account.email, password),
    username: await decryptField(account.username, password),
    password: await decryptField(account.password, password),
    phone: await decryptField(account.phone, password),
    recovery: await decryptField(account.recovery, password),
    notes: await decryptField(account.notes, password),
  };
}