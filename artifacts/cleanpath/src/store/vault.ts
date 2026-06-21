import { generateSalt, deriveKey, encryptJson, decryptJson } from "./crypto";

const SENSITIVE_SUFFIXES = [
  "_sessions",
  "_dayEntries",
  "_consumptions",
  "_emotions",
  "_gratitudes",
  "_cravings",
  "_safetyPlan",
  "_contacts",
  "_goals",
  "_profile",
  "_weeklyGoals",
  "_programProgress",
  "_chatMemory",
] as const;

export type VaultRecord = Record<string, unknown>;

export function getVaultKey(prefix: string): string { return `${prefix}_vault`; }
export function getSaltKey(prefix: string): string { return `${prefix}_salt`; }

export function getSensitiveKeys(prefix: string): string[] {
  return SENSITIVE_SUFFIXES.map(s => `${prefix}${s}`);
}

export function isVaultPresent(prefix: string): boolean {
  return !!localStorage.getItem(getVaultKey(prefix));
}

export function readPlaintextData(prefix: string): VaultRecord {
  const data: VaultRecord = {};
  for (const key of getSensitiveKeys(prefix)) {
    try {
      const raw = localStorage.getItem(key);
      data[key] = raw ? JSON.parse(raw) : null;
    } catch {
      data[key] = null;
    }
  }
  return data;
}

export function writePlaintextData(data: VaultRecord, prefix: string): void {
  for (const key of getSensitiveKeys(prefix)) {
    const value = data[key];
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }
}

function removePlaintextData(prefix: string): void {
  for (const key of getSensitiveKeys(prefix)) {
    localStorage.removeItem(key);
  }
}

export async function initVault(pin: string, data: VaultRecord, prefix: string): Promise<CryptoKey> {
  const salt = await generateSalt();
  const key = await deriveKey(pin, salt);
  const ciphertext = await encryptJson(key, data);
  localStorage.setItem(getSaltKey(prefix), btoa(String.fromCharCode(...salt)));
  localStorage.setItem(getVaultKey(prefix), ciphertext);
  removePlaintextData(prefix);
  return key;
}

export async function openVault(pin: string, prefix: string): Promise<{ data: VaultRecord; key: CryptoKey }> {
  const saltB64 = localStorage.getItem(getSaltKey(prefix));
  const ciphertext = localStorage.getItem(getVaultKey(prefix));
  if (!saltB64 || !ciphertext) throw new Error("No vault found");
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await deriveKey(pin, salt);
  const data = (await decryptJson(key, ciphertext)) as VaultRecord;
  return { data, key };
}

export async function saveVault(key: CryptoKey, data: VaultRecord, prefix: string): Promise<void> {
  const ciphertext = await encryptJson(key, data);
  localStorage.setItem(getVaultKey(prefix), ciphertext);
}

export function destroyVault(prefix: string): void {
  localStorage.removeItem(getVaultKey(prefix));
  localStorage.removeItem(getSaltKey(prefix));
}
