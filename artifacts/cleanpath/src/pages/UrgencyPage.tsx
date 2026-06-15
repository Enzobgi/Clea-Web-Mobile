import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { Droplets, PersonStanding, Phone, Music, PenLine, Wind, Check } from "lucide-react";

const BREATHING_STEPS = [
  { label: "Inspire", duration: 4, scale: 1.3 },
  { label: "Retiens", duration: 7, scale: 1.3 },
  { label: "Expire", duration: 8, scale: 1.0 },
];

export default function UrgencyPage() {
  const { cravings, setCravings } = useAppStore();
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [feeling, setFeeling] = useState("");
  const [success, setSuccess] = useState(false);
  const startTime = useRef<number | null>(null);

  const [breathStep, setBreathStep] = useState(0);
  const [breathCount, setBreathCount] = useState(BREATHING_STEPS[0].duration);
  const [breathing, setBrething] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    if (!startTime.current) startTime.current = Date.now();
    if (timeLeft <= 0) { setIsRunning(false); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (!breathingActive()) return;
    if (breathCount <= 0) {
      const next = (breathStep + 1) % BREATHING_STEPS.length;
      setBreathStep(next);
      setBreathCount(BREATHING_STEPS[next].duration);
      return;
    }
    const id = setTimeout(() => setBreathCount(c => c - 1), 1000);
    return () => clearTimeout(id);
  });

  function breathingActive() { return breathingRef.current; }
  const breathingRef = useRef(false);

  const toggleBreathing = () => {
    breathingRef.current = !breathingRef.current;
    setBrething(breathingRef.current);
    if (breathingRef.current) { setBreathStep(0); setBreathCount(BREATHING_STEPS[0].duration); }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const elapsed = 600 - timeLeft;
  const progress = elapsed / 600;

  const handleSuccess = () => {
    const duration = startTime.current ? Math.round((Date.now() - startTime.current) / 60000) : 0;
    setCravings([...cravings, {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      outcome: "tenu_bon",
      feeling,
      durationMinutes: duration,
    }]);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-foreground">Tu as tenu bon.</h1>
          <p className="text-muted-foreground">Cette victoire est réelle, même si personne ne la voit. Tu peux en être fier(e).</p>
        </div>
        <Link href="/">
          <Button className="w-full max-w-xs" data-testid="button-back-home">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-medium text-foreground">Respire.</h1>
        <p className="text-muted-foreground">Cette envie va passer. Elle passe toujours.</p>
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" className="stroke-muted" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              className="stroke-primary transition-all duration-1000"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-light tabular-nums">{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</p>
              <p className="text-xs text-muted-foreground mt-1">{timeLeft === 0 ? "Terminé !" : "reste"}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsRunning(v => !v)} data-testid="button-timer-toggle">
            {isRunning ? "Pause" : "Démarrer"}
          </Button>
          <Button variant="ghost" onClick={() => { setTimeLeft(600); setIsRunning(false); startTime.current = null; }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium text-center">Exercice de respiration</h3>
          <div
            className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-1000"
            style={{ transform: breathingRef.current ? `scale(${BREATHING_STEPS[breathStep].scale})` : "scale(1)" }}
          >
            <Wind className="h-8 w-8 text-primary" />
          </div>
          {breathingRef.current && (
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-primary">{BREATHING_STEPS[breathStep].label}</p>
              <p className="text-3xl font-light tabular-nums">{breathCount}</p>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={toggleBreathing} data-testid="button-breathing">
            {breathingRef.current ? "Arrêter la respiration" : "Commencer la respiration 4-7-8"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-medium">Actions immédiates</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Droplets, label: "Boire un verre d'eau" },
            { icon: PersonStanding, label: "Marcher 5 minutes" },
            { icon: Phone, label: "Appeler quelqu'un" },
            { icon: Music, label: "Écouter une musique calme" },
            { icon: PenLine, label: "Écrire ce que je ressens" },
          ].map(({ icon: Icon, label }) => (
            <Button key={label} variant="secondary" className="h-14 justify-start text-sm gap-2">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-left leading-tight">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Ce que je ressens maintenant</h3>
        <Textarea
          placeholder="Écris ce que tu traverses en ce moment..."
          value={feeling}
          onChange={e => setFeeling(e.target.value)}
          className="min-h-[100px]"
          data-testid="textarea-urgency-feeling"
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <Button
          className="w-full h-14 text-base"
          onClick={handleSuccess}
          data-testid="button-held-strong"
        >
          J'ai tenu bon
        </Button>
        <Link href="/journal-consommation">
          <Button
            variant="ghost"
            className="w-full h-12 text-muted-foreground"
            data-testid="button-consumed"
          >
            J'ai consommé (sans jugement, tu es courageux/se d'être ici)
          </Button>
        </Link>
      </div>
    </div>
  );
}
