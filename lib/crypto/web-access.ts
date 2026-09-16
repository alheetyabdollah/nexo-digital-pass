const WEB_ACCESS_DOMAIN =
  "NEXO-WEB-ACCESS-V1";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

export async function deriveWebAccessSecret(
  vaultKeyBytes: Uint8Array
): Promise<string> {
  if (vaultKeyBytes.length !== 32) {
    throw new Error(
      "Invalid Vault Key length"
    );
  }

  const domainBytes =
    new TextEncoder().encode(
      WEB_ACCESS_DOMAIN
    );

  const input = new Uint8Array(
    domainBytes.length +
      vaultKeyBytes.length
  );

  input.set(domainBytes, 0);
  input.set(
    vaultKeyBytes,
    domainBytes.length
  );

  try {
    const digest =
      await crypto.subtle.digest(
        "SHA-256",
        input
      );

    return toHex(
      new Uint8Array(digest)
    );
  } finally {
    input.fill(0);
  }
}