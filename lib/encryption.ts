function bufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function getEncryptionKey(password: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );

  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(text: string, password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey(password);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  );

  return `${bufferToBase64(iv.buffer)}:${bufferToBase64(encrypted)}`;
}

export async function decryptText(encryptedText: string, password: string) {
  const [ivBase64, dataBase64] = encryptedText.split(":");

  if (!ivBase64 || !dataBase64) return encryptedText;

  const key = await getEncryptionKey(password);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(ivBase64)) },
    key,
    base64ToBuffer(dataBase64)
  );

  return new TextDecoder().decode(decrypted);
}