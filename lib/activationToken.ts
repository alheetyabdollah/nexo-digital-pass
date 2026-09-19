import "server-only";
import { createHash, createHmac } from "node:crypto";

function getActivationMasterKey() {
  const key = process.env.NEXO_ACTIVATION_MASTER_KEY?.trim();

  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("NEXO_ACTIVATION_MASTER_KEY is missing or invalid");
  }

  return Buffer.from(key, "hex");
}

export function deriveActivationSecret(cardId: string) {
  return createHmac("sha256", getActivationMasterKey())
    .update(`nexo-activation-v1:${cardId}`)
    .digest("hex");
}

export function hashActivationSecret(secret: string) {
  return createHash("sha256")
    .update(secret)
    .digest("hex");
}