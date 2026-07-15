export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  if (!value) {
    throw new Error("قيمة Base64 فارغة");
  }

  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    throw new Error("قيمة Base64 غير صالحة");
  }
}

export function textToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function bytesToText(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}