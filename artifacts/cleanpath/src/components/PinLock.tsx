import { useState } from "react";
import { useVault } from "@/store/VaultContext";
import { useAppStore } from "@/store/useAppStore";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export function PinLock({ children }: { children: React.ReactNode }) {
  const { vaultPresent, isUnlocked, unlock } = useVault();
  const { settings } = useAppStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleVerify = async () => {
    if (pin.length !== 4) return;
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (ok) {
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  if (!vaultPresent || isUnlocked) return <>{children}</>;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-foreground">
            {settings.discreteMode ? "Journal" : "CleanPath"}
          </h1>
          <p className="text-muted-foreground">Veuillez entrer votre code PIN</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <InputOTP maxLength={4} value={pin} onChange={setPin} onComplete={handleVerify}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
              <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
              <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
              <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-destructive text-sm">Code incorrect, veuillez réessayer.</p>}

          <Button onClick={handleVerify} disabled={pin.length !== 4 || busy} className="w-full max-w-xs">
            {busy ? "Vérification…" : "Déverrouiller"}
          </Button>
        </div>
      </div>
    </div>
  );
}
