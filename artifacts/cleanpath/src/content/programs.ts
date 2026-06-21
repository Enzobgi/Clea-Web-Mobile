export interface GuidedProgramStep {
  id: string;
  title: string;
  body: string;
  action: string;
}

export interface GuidedProgram {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: GuidedProgramStep[];
}

export const GUIDED_PROGRAMS: GuidedProgram[] = [
  {
    id: "declencheurs",
    title: "Comprendre mes déclencheurs",
    description: "Repérer les situations, émotions et habitudes qui précèdent une envie.",
    duration: "10 min",
    steps: [
      { id: "observer", title: "Observer sans juger", body: "Pense à une envie récente et décris simplement ce qui se passait.", action: "Noter le lieu, le moment et les personnes présentes." },
      { id: "emotion", title: "Nommer l'émotion", body: "Une émotion n'est pas une consigne. La nommer aide à créer un peu d'espace.", action: "Choisir l'émotion la plus présente." },
      { id: "plan", title: "Préparer une réponse", body: "Choisis une action réaliste à tester lorsque ce déclencheur revient.", action: "Ajouter cette action à ton plan de protection." },
    ],
  },
  {
    id: "envie",
    title: "Traverser une envie",
    description: "Comprendre la vague de l'envie et préparer une réponse courte.",
    duration: "8 min",
    steps: [
      { id: "vague", title: "Laisser passer la vague", body: "Une envie monte, atteint un sommet puis redescend.", action: "Lancer un minuteur de 10 minutes." },
      { id: "respirer", title: "Ralentir", body: "Allonge doucement l'expiration pour aider ton corps à ralentir.", action: "Faire cinq respirations lentes." },
      { id: "remplacer", title: "Changer d'action", body: "Une petite action concrète peut interrompre l'automatisme.", action: "Boire de l'eau ou changer de lieu." },
    ],
  },
  {
    id: "reduire",
    title: "Réduire progressivement",
    description: "Définir une réduction mesurable, réaliste et non culpabilisante.",
    duration: "12 min",
    steps: [
      { id: "mesure", title: "Choisir un repère", body: "Décide ce que tu veux observer: fréquence, quantité ou situations.", action: "Choisir un seul indicateur." },
      { id: "objectif", title: "Fixer une étape", body: "Une petite réduction tenue est plus utile qu'un objectif impossible.", action: "Créer un objectif pour cette semaine." },
      { id: "soutien", title: "Prévoir du soutien", body: "Repère une personne ou une stratégie à mobiliser.", action: "Choisir un contact de confiance." },
    ],
  },
  {
    id: "rechute",
    title: "Prévenir une rechute",
    description: "Identifier les signes précoces et préparer un plan simple.",
    duration: "12 min",
    steps: [
      { id: "signes", title: "Reconnaître les signes", body: "Fatigue, isolement ou pensées répétitives peuvent être des signaux à observer.", action: "Noter deux signes personnels." },
      { id: "proteger", title: "Réduire l'exposition", body: "Prépare une façon de quitter ou d'éviter une situation risquée.", action: "Choisir un lieu sûr." },
      { id: "contacter", title: "Ne pas rester seul", body: "Demander quelques minutes de présence peut changer le moment.", action: "Préparer un message à une personne de confiance." },
    ],
  },
  {
    id: "pression-sociale",
    title: "Gérer la pression sociale",
    description: "Préparer des réponses courtes et protéger ses limites.",
    duration: "7 min",
    steps: [
      { id: "phrase", title: "Préparer une phrase", body: "Une réponse simple évite d'avoir à se justifier longtemps.", action: "Choisir: « Non merci, pas ce soir. »" },
      { id: "allie", title: "Trouver un allié", body: "Préviens une personne qui peut soutenir ton choix.", action: "Identifier une personne présente." },
      { id: "sortie", title: "Prévoir une sortie", body: "Savoir comment partir réduit la sensation d'être coincé.", action: "Préparer ton moyen de retour." },
    ],
  },
  {
    id: "aide",
    title: "Demander de l'aide",
    description: "Préparer ce que tu souhaites dire à un proche ou un professionnel.",
    duration: "10 min",
    steps: [
      { id: "besoin", title: "Clarifier le besoin", body: "Tu peux demander une écoute, un rendez-vous ou une aide pratique.", action: "Écrire une phrase sur ton besoin." },
      { id: "faits", title: "Rassembler les faits", body: "Tes journaux et statistiques peuvent t'aider à expliquer la situation.", action: "Consulter le résumé des statistiques." },
      { id: "message", title: "Faire le premier pas", body: "Un message court suffit pour commencer.", action: "Préparer une demande de rendez-vous." },
    ],
  },
];
