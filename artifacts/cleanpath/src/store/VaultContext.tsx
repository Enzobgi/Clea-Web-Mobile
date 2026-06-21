import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useUser, getUserStoragePrefix } from "./UserContext";
import {
  isVaultPresent,
  openVault,
  initVault,
  saveVault,
  destroyVault,
  readPlaintextData,
  writePlaintextData,
  VaultRecord,
} from "./vault";

interface VaultContextValue {
  vaultPresent: boolean;
  isUnlocked: boolean;
  vaultData: VaultRecord | null;
  cryptoKey: CryptoKey | null;
  prefix: string;
  unlock: (pin: string) => Promise<boolean>;
  saveData: (data: VaultRecord) => Promise<void>;
  enableVault: (pin: string) => Promise<void>;
  disableVault: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const prefix = user ? getUserStoragePrefix(`account_${user.id}`) : "cleanpath_guest";

  const [vaultPresent, setVaultPresent] = useState<boolean>(() => isVaultPresent(prefix));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultData, setVaultData] = useState<VaultRecord | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    setVaultPresent(isVaultPresent(prefix));
    setIsUnlocked(false);
    setVaultData(null);
    setCryptoKey(null);
  }, [prefix]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const { data, key } = await openVault(pin, prefix);
      setVaultData(data);
      setCryptoKey(key);
      setIsUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [prefix]);

  const saveData = useCallback(async (data: VaultRecord) => {
    if (!cryptoKey) return;
    await saveVault(cryptoKey, data, prefix);
    setVaultData(data);
  }, [cryptoKey, prefix]);

  const enableVault = useCallback(async (pin: string) => {
    const plaintext = readPlaintextData(prefix);
    const key = await initVault(pin, plaintext, prefix);
    setVaultData(plaintext);
    setCryptoKey(key);
    setIsUnlocked(true);
    setVaultPresent(true);
  }, [prefix]);

  const disableVault = useCallback(() => {
    if (vaultData) {
      writePlaintextData(vaultData, prefix);
    }
    destroyVault(prefix);
    setVaultPresent(false);
    setIsUnlocked(false);
    setVaultData(null);
    setCryptoKey(null);
  }, [vaultData, prefix]);

  return (
    <VaultContext.Provider value={{
      vaultPresent,
      isUnlocked,
      vaultData,
      cryptoKey,
      prefix,
      unlock,
      saveData,
      enableVault,
      disableVault,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
