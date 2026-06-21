import { Link } from "wouter";
import { BarChart2, BookOpen, CalendarDays, Heart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SECTIONS = [
  { href: "/journal-emotionnel", icon: Heart, title: "Check-in et émotions", text: "Humeur, stress, sommeil, énergie, gratitude et notes." },
  { href: "/journal-consommation", icon: BookOpen, title: "Consommations et envies", text: "Comprendre les contextes, déclencheurs et stratégies." },
  { href: "/calendrier", icon: CalendarDays, title: "Calendrier", text: "Voir les jours renseignés et les séries de progression." },
  { href: "/statistiques", icon: BarChart2, title: "Tendances", text: "Observer les évolutions sur tes données enregistrées." },
  { href: "/boite-a-outils", icon: Sparkles, title: "Gratitudes", text: "Retrouver les éléments positifs notés au quotidien." },
];

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header><h1 className="text-2xl font-medium">Journal</h1><p className="text-muted-foreground">Choisis le niveau de détail adapté au moment.</p></header>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 font-medium">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
