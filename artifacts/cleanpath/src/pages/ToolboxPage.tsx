import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wind, Heart, BookOpen, Lightbulb, Leaf } from "lucide-react";

const QUOTES = [
  "La patience est la clé de la guérison. Sois doux avec toi-même aujourd'hui.",
  "Chaque jour sans consommer est une victoire, même si tu ne la ressens pas encore.",
  "Tu n'as pas à tout réparer en une journée. Un pas à la fois suffit.",
  "La rechute n'est pas une fin. C'est une information qui t'aide à mieux te connaître.",
  "Tu mérites ta propre bienveillance autant que tu l'offres aux autres.",
  "Ce chemin est le tien. Personne d'autre ne peut le marcher à ta place — et c'est une force.",
  "Chaque moment difficile que tu traverses te montre ta capacité de résilience.",
  "La guérison n'est pas une ligne droite. Et c'est tout à fait normal.",
  "Prendre soin de toi n'est pas de l'égoïsme. C'est une nécessité.",
  "Tu as survécu à tous tes jours difficiles jusqu'ici. Celui-ci aussi passera.",
];

const ALTERNATIVES = [
  "Faire une promenade dans la nature",
  "Écouter de la musique qui me fait du bien",
  "Appeler ou écrire à un ami",
  "Préparer un repas nourrissant",
  "Regarder une série ou un film",
  "Méditer ou faire de la respiration",
  "Prendre un bain ou une douche chaude",
  "Écrire dans mon journal",
  "Faire de l'exercice léger",
  "Lire un livre ou un article inspirant",
  "Dessiner, peindre ou créer quelque chose",
  "Passer du temps avec un animal",
  "Ranger ou nettoyer un espace",
  "Apprendre quelque chose de nouveau",
];

const MEDITATION_STEPS = [
  "Installe-toi confortablement, assis(e) ou allongé(e). Ferme les yeux doucement.",
  "Prends une grande inspiration par le nez... et expire lentement par la bouche. Encore une fois.",
  "Remarque les sensations de ton corps au contact de la chaise ou du sol. Tu es ici, maintenant.",
  "Sans te juger, observe tes pensées qui passent, comme des nuages dans le ciel. Tu n'as pas à les suivre.",
  "Pose une main sur ton cœur. Sens-le battre. Ce cœur t'accompagne depuis toujours.",
  "Répète intérieurement : 'Je mérite d'être bien. Je fais de mon mieux. C'est suffisant.'",
  "Prends encore une grande inspiration... et expire tout doucement. Reste ici quelques instants.",
  "Quand tu es prêt(e), ouvre les yeux. Tu as pris soin de toi. Bien joué.",
];

function BreathingGuide() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(4);
  const steps = [
    { label: "Inspire", seconds: 4 },
    { label: "Retiens", seconds: 7 },
    { label: "Expire", seconds: 8 },
  ];

  const tick = () => {
    if (!active) return;
    if (count <= 1) {
      const next = (step + 1) % steps.length;
      setStep(next);
      setCount(steps[next].seconds);
    } else {
      setCount(c => c - 1);
    }
  };

  if (!active) {
    return (
      <Button variant="outline" className="w-full" onClick={() => { setActive(true); setStep(0); setCount(4); }}>
        Commencer la respiration 4-7-8
      </Button>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground text-sm">Inspire 4 · Retiens 7 · Expire 8</p>
      <div
        className="mx-auto w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer"
        style={{ transition: "transform 1s ease-in-out", transform: step === 0 ? "scale(1.3)" : step === 1 ? "scale(1.3)" : "scale(1.0)" }}
        onClick={tick}
      >
        <Wind className="h-10 w-10 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-primary">{steps[step].label}</p>
        <p className="text-4xl font-light tabular-nums mt-1">{count}</p>
        <p className="text-xs text-muted-foreground mt-2">Appuie sur le cercle pour avancer</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setActive(false)}>Arrêter</Button>
    </div>
  );
}

function MeditationGuide() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  if (!started) {
    return (
      <Button variant="outline" className="w-full" onClick={() => { setStarted(true); setStep(0); }}>
        Commencer la méditation de 3 minutes
      </Button>
    );
  }

  if (step >= MEDITATION_STEPS.length) {
    return (
      <div className="text-center space-y-3">
        <p className="text-primary font-medium">Méditation terminée.</p>
        <p className="text-muted-foreground text-sm">Tu as pris soin de toi. Bien joué.</p>
        <Button variant="ghost" size="sm" onClick={() => { setStarted(false); setStep(0); }}>Recommencer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Étape {step + 1} / {MEDITATION_STEPS.length}</p>
      <div className="min-h-[80px] flex items-center justify-center p-4 bg-muted/30 rounded-xl">
        <p className="text-center leading-relaxed">{MEDITATION_STEPS[step]}</p>
      </div>
      <div className="flex gap-2">
        {step > 0 && <Button variant="ghost" className="flex-1" onClick={() => setStep(s => s - 1)}>Précédent</Button>}
        <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
          {step < MEDITATION_STEPS.length - 1 ? "Suivant" : "Terminer"}
        </Button>
      </div>
    </div>
  );
}

export default function ToolboxPage() {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [gratitude, setGratitude] = useState("");

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Boîte à outils</h1>
        <p className="text-muted-foreground">Des ressources pour t'accompagner au quotidien.</p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Wind className="h-4 w-4 text-primary" /> Exercice de respiration</CardTitle>
        </CardHeader>
        <CardContent>
          <BreathingGuide />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Méditation guidée (3 min)</CardTitle>
        </CardHeader>
        <CardContent>
          <MeditationGuide />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Compassion envers soi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Pose la main sur ton cœur et répète doucement :</p>
          <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
            <p className="italic text-center">"Je suis humain(e) et j'ai le droit de souffrir."</p>
            <p className="italic text-center">"Je ne suis pas seul(e) dans cette expérience."</p>
            <p className="italic text-center">"Je m'offre la même douceur que j'offrirais à un ami."</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Au lieu de consommer, je peux...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ALTERNATIVES.map(a => (
              <div key={a} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-sm">{a}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Message d'encouragement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="italic text-center text-foreground leading-relaxed">"{QUOTES[quoteIdx]}"</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setQuoteIdx(i => (i + 1) % QUOTES.length)}
            data-testid="button-next-quote"
          >
            Un autre message
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Espace de gratitude</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Pour quoi es-tu reconnaissant(e) en ce moment ?</p>
          <Textarea
            placeholder="Même une toute petite chose compte..."
            value={gratitude}
            onChange={e => setGratitude(e.target.value)}
            className="min-h-[80px]"
            data-testid="textarea-gratitude-toolbox"
          />
        </CardContent>
      </Card>
    </div>
  );
}
