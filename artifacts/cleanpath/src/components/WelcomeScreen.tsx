import { useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/store/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";

function passwordStrength(password: string) {
  const issues: string[] = [];
  if (password.length < 12) issues.push("12 caractères minimum recommandés.");
  if (!/[a-z]/.test(password)) issues.push("Ajoute une minuscule.");
  if (!/[A-Z]/.test(password)) issues.push("Ajoute une majuscule.");
  if (!/[0-9]/.test(password)) issues.push("Ajoute un chiffre.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Ajoute un symbole.");
  if (/^[a-z]+$/.test(password)) issues.push("Uniquement des minuscules : trop faible.");
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (/^[a-z]+$/.test(password)) score = Math.min(score, 1);
  score = Math.max(0, Math.min(4, score));
  return {
    score,
    label: score >= 4 ? "Robuste" : score >= 3 ? "Correct" : score >= 2 ? "Fragile" : "Trop faible",
    valid: score >= 3 && !/^[a-z]+$/.test(password),
    issues,
  };
}

export function WelcomeScreen() {
  const { login, register, isLoading, authNotice } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(password);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register(displayName.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de continuer.");
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async () => {
    setError("");
    setForgotSent(false);
    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setForgotSent(true);
    } catch {
      setError("Impossible de préparer la réinitialisation pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-7"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-md bg-primary/10">
            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-light text-foreground">CleanPath</h1>
          <p className="text-muted-foreground">
            {mode === "login" ? "Retrouve ton espace personnel." : "Crée ton espace confidentiel."}
          </p>
          {isLoading && (
            <p className="text-xs text-muted-foreground" role="status">
              Vérification rapide de la session en cours…
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 border border-border rounded-md p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`h-9 text-sm font-medium rounded-sm transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`h-9 text-sm font-medium rounded-sm transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Inscription
          </button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Prénom</Label>
              <Input
                id="account-name"
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                autoComplete="given-name"
                placeholder="Ton prénom"
                data-testid="input-register-name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="toi@exemple.com"
              data-testid="input-auth-email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="account-password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={event => setPassword(event.target.value)}
                onKeyDown={event => event.key === "Enter" && void submit()}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "register" ? "Mot de passe robuste" : "Ton mot de passe"}
                className="pr-10"
                data-testid="input-auth-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => setPasswordVisible(value => !value)}
                aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "register" && password && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(12, strength.score * 25)}%` }} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
                </div>
                {strength.issues.slice(0, 2).map(issue => (
                  <p key={issue} className="text-xs text-muted-foreground">{issue}</p>
                ))}
              </div>
            )}
            {mode === "login" && (
              <button
                type="button"
                className="text-xs text-primary underline-offset-4 hover:underline"
                onClick={() => void requestReset()}
                disabled={!email.trim() || busy}
              >
                Mot de passe oublié ?
              </button>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {authNotice && <p className="text-sm text-muted-foreground">{authNotice}</p>}
          {forgotSent && (
            <p className="text-sm text-primary">
              Si un compte existe avec cette adresse, la procédure de réinitialisation est préparée. L'envoi email reste à configurer côté serveur.
            </p>
          )}

          <Button
            className="w-full h-11"
            onClick={() => void submit()}
            disabled={busy || !email.trim() || password.length < 1 || (mode === "register" && (displayName.trim().length < 2 || !strength.valid))}
            data-testid="button-auth-submit"
          >
            {busy ? "Un instant..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <a
            href="/demo"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
            data-testid="link-demo"
          >
            <Eye className="h-4 w-4" />
            Consulter la démo
          </a>
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Tes données sont associées à ton compte et transmises via une connexion sécurisée.
          {mode === "register" && (
            <>
              {" "}En créant un compte, consulte les documents légaux :
              {" "}<a className="underline underline-offset-4" href="/confidentialite">confidentialité</a>,
              {" "}<a className="underline underline-offset-4" href="/conditions">conditions</a>,
              {" "}<a className="underline underline-offset-4" href="/mentions-legales">mentions légales</a>.
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
