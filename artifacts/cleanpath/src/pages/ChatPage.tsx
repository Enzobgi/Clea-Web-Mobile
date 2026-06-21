import { useState } from "react";
import { Link } from "wouter";
import { Brain, Heart, ListChecks, MessageCircle, ShieldAlert } from "lucide-react";
import type { ChatMode } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODES: Array<{ id: ChatMode; label: string; icon: typeof Heart }> = [
  { id: "ecoute", label: "Écoute", icon: Heart },
  { id: "plan", label: "Plan d'action", icon: ListChecks },
  { id: "comprendre", label: "Comprendre", icon: Brain },
  { id: "discussion", label: "Préparer une discussion", icon: MessageCircle },
  { id: "envie", label: "Faire face à une envie", icon: ShieldAlert },
];

const RESPONSES: Record<ChatMode, { title: string; steps: string[] }> = {
  ecoute: { title: "Je suis là pour t'écouter", steps: ["Prends le temps de nommer ce que tu ressens.", "Tu n'as pas besoin de tout résoudre maintenant.", "Quelle serait la chose la plus utile dans les dix prochaines minutes ?"] },
  plan: { title: "Construisons une prochaine étape", steps: ["Décris le problème en une phrase.", "Choisis une action petite et réalisable.", "Décide quand et avec quel soutien la faire."] },
  comprendre: { title: "Observer le contexte", steps: ["Que s'est-il passé juste avant ?", "Quelle émotion était présente ?", "Qu'est-ce qui a aidé, même un peu ?"] },
  urgence: { title: "Ta sécurité passe en premier", steps: ["Si tu es en danger immédiat, contacte les services d'urgence.", "Ne reste pas seul.", "Utilise le mode SOS pour des outils immédiats."] },
  discussion: { title: "Préparer ce que tu veux dire", steps: ["Commence par les faits.", "Explique ce dont tu as besoin.", "Tu peux montrer tes statistiques si tu le souhaites."] },
  envie: { title: "Traverser les prochaines minutes", steps: ["Éloigne-toi si possible de la situation à risque.", "Lance un minuteur de dix minutes.", "Contacte une personne de confiance."] },
};

export default function ChatPage() {
  const [mode, setMode] = useState<ChatMode>("ecoute");
  const response = RESPONSES[mode];
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header><h1 className="text-2xl font-medium">Chat</h1><p className="text-muted-foreground">Un accompagnement structuré, sans diagnostic ni jugement.</p></header>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {MODES.map(({ id, label, icon: Icon }) => <Button key={id} variant={mode === id ? "default" : "outline"} className="shrink-0" onClick={() => setMode(id)}><Icon className="mr-2 h-4 w-4" />{label}</Button>)}
      </div>
      <Card><CardContent className="space-y-4 p-5"><h2 className="text-lg font-medium">{response.title}</h2>{response.steps.map((step, index) => <div key={step} className="flex gap-3 rounded-md bg-muted/40 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{index + 1}</span><p className="text-sm">{step}</p></div>)}</CardContent></Card>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/urgence"><Button className="w-full" variant="destructive">J'ai une envie forte</Button></Link>
        <Link href="/journal"><Button className="w-full" variant="outline">Écrire dans mon journal</Button></Link>
      </div>
      <p className="text-xs text-muted-foreground">Cette version fonctionne localement et ne transmet pas tes messages à un service d'intelligence artificielle externe.</p>
    </div>
  );
}
