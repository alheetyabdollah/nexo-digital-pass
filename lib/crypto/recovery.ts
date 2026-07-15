import {
  deriveWrappingKey,
} from "./kdf";

import {
  decryptVaultKey,
  encryptVaultKey,
} from "./vault";

export async function recoverVaultKey(params: {
  recoveryKey: string;
  recoverySalt: string;
  recoveryIterations: number;
  encryptedRecoveryVaultKey: string;
}) {
  const wrappingKey =
    await deriveWrappingKey({
      secret: params.recoveryKey,
      salt: params.recoverySalt,
      iterations:
        params.recoveryIterations,
    });

  return decryptVaultKey(
    params.encryptedRecoveryVaultKey,
    wrappingKey
  );
}

export async function wrapVaultKeyWithPassword(params: {
  vaultKey: Uint8Array;
  password: string;
  passwordSalt: string;
  passwordIterations: number;
}) {
  const wrappingKey =
    await deriveWrappingKey({
      secret: params.password,
      salt: params.passwordSalt,
      iterations:
        params.passwordIterations,
    });

  return encryptVaultKey(
    params.vaultKey,
    wrappingKey
  );
}