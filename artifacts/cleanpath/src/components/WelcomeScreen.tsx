import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/store/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, UserCircle2 } from "lucide-react";

export function WelcomeScreen() {
  const { users, setUser, switchUser } = useUser();
  const [step, setStep] = useState<"choose" | "new">(users.length > 0 ? "choose" : "new");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Merci d'entrer ton prénom.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Ton prénom doit avoir au moins 2 caractères.");
      return;
    }
    if (users.map(u => u.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError("Ce prénom est déjà utilisé sur cet appareil.");
      return;
    }
    setUser(trimmed);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background">
      <AnimatePresence mode="wait">
        {step === "choose" ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-light text-foreground">CleanPath</h1>
              <p className="text-muted-foreground">Qui es-tu ?</p>
            </div>

            <div className="space-y-3">
              {users.map(u => (
                <button
                  key={u}
                  onClick={() => switchUser(u)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-primary font-medium text-lg">
                      {u.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{u}</p>
                    <p className="text-xs text-muted-foreground">Continuer</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep("new")}
            >
              <UserCircle2 className="mr-2 h-4 w-4" />
              Créer un nouveau profil
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-light text-foreground">Bienvenue</h1>
              <p className="text-muted-foreground leading-relaxed">
                CleanPath est un espace confidentiel, rien qu'à toi.<br />
                Tout reste sur ton appareil.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Quel est ton prénom ?
                </label>
                <Input
                  autoFocus
                  placeholder="Ton prénom..."
                  value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  className="text-base h-12"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ton prénom sert uniquement à retrouver tes données sur cet appareil.
                </p>
              </div>

              <Button
                className="w-full h-12 text-base"
                onClick={handleCreate}
                disabled={!name.trim()}
              >
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {users.length > 0 && (
              <button
                onClick={() => setStep("choose")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← Retour
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
