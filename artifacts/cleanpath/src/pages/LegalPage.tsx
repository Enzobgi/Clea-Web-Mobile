import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CONTENT: Record<string, { title: string; sections: Array<{ title: string; text: string }> }> = {
  "/confidentialite": {
    title: "Politique de confidentialité",
    sections: [
      { title: "Éditeur", text: "TODO: renseigner le nom légal de l'éditeur, l'adresse de contact et les coordonnées applicables." },
      { title: "Données enregistrées", text: "CleanPath enregistre les informations saisies par l'utilisateur: compte, journaux, suivis, objectifs, plan de protection, contacts de confiance et réglages." },
      { title: "Synchronisation", text: "Les données du compte sont synchronisées avec le serveur de l'application lorsque l'utilisateur est connecté. Le coffre PIN concerne cet appareil." },
      { title: "IA", text: "Le chat peut utiliser un résumé statistique agrégé si l'option est activée. Les notes complètes ne doivent pas être envoyées automatiquement." },
      { title: "Droits et suppression", text: "TODO: préciser les modalités d'accès, de rectification, d'export et de suppression définitive selon le cadre juridique applicable." },
    ],
  },
  "/conditions": {
    title: "Conditions d'utilisation",
    sections: [
      { title: "Objet", text: "CleanPath est un outil personnel de suivi et d'accompagnement. Il ne remplace pas un médecin, un centre de soins, un thérapeute ou les secours." },
      { title: "Urgence", text: "En cas de danger immédiat, de symptômes graves ou d'impossibilité de rester en sécurité, l'utilisateur doit contacter les services d'urgence." },
      { title: "Responsabilités", text: "TODO: compléter les règles d'utilisation, limites du service, disponibilité, support et responsabilités applicables." },
    ],
  },
  "/mentions-legales": {
    title: "Mentions légales",
    sections: [
      { title: "Éditeur", text: "TODO: nom légal, forme juridique, adresse, email de contact." },
      { title: "Hébergement", text: "TODO: renseigner l'hébergeur de production et les informations requises." },
      { title: "Propriété intellectuelle", text: "TODO: préciser les droits sur le contenu, le code et les marques." },
    ],
  },
};

export default function LegalPage() {
  const content = CONTENT[window.location.pathname] ?? CONTENT["/conditions"];
  return (
    <div className="min-h-[100dvh] bg-background p-6">
      <main className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="outline" size="sm">
          <a href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </a>
        </Button>
        <header className="space-y-1">
          <h1 className="text-2xl font-medium">{content.title}</h1>
          <p className="text-sm text-muted-foreground">Document à compléter avant usage public définitif.</p>
        </header>
        <Card>
          <CardContent className="space-y-5 p-5">
            {content.sections.map(section => (
              <section key={section.title} className="space-y-1">
                <h2 className="font-medium">{section.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{section.text}</p>
              </section>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
