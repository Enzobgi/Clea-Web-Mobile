import { useLocalStorage } from "./use-local-storage";
import { subDays, format } from "date-fns";

export type DayStatus = "abstinent" | "consommation" | "envie_forte" | "non_renseigne";

export interface AbstractionSession {
  id: string;
  startDate: string;
  endDate: string | null;
  note: string;
}

export interface DayEntry {
  date: string;
  status: DayStatus;
}

export interface ConsumptionEntry {
  id: string;
  date: string;
  time: string;
  substance: string;
  quantity: string;
  context: string;
  emotionBefore: string;
  emotionAfter: string;
  trigger: string;
  cravingLevel: number;
  note: string;
  type: "consommation" | "envie_seulement";
}

export interface EmotionalEntry {
  id: string;
  date: string;
  mood: number;
  anxiety: number;
  sleepQuality: number;
  energy: number;
  gratitude: string;
  whatHelped: string;
  whatWasDifficult: string;
  intentionForTomorrow: string;
}

export interface CravingEvent {
  id: string;
  date: string;
  outcome: "tenu_bon" | "consomme";
  feeling: string;
  durationMinutes: number;
}

export interface SafetyPlan {
  reasons: string;
  risks: string;
  gains: string;
  triggers: string;
  strategies: string;
  contacts: string;
  placesToAvoid: string;
  helpfulPhrases: string;
  calmingActivities: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Goal {
  days: number;
  reward: string;
  achievedDate: string | null;
}

export interface AppSettings {
  pin: string | null;
  discreteMode: boolean;
  costPerDay: number;
  reminderSettings: { [key: string]: boolean };
}

const defaultStartDate = subDays(new Date(), 12).toISOString();

const defaultSessions: AbstractionSession[] = [
  { id: "1", startDate: defaultStartDate, endDate: null, note: "" }
];

const defaultSettings: AppSettings = {
  pin: null,
  discreteMode: false,
  costPerDay: 15,
  reminderSettings: {}
};

const defaultSafetyPlan: SafetyPlan = {
  reasons: "Retrouver ma liberté, améliorer ma santé.",
  risks: "Perte de contrôle, isolement.",
  gains: "Plus d'énergie, meilleure humeur.",
  triggers: "Stress au travail, ennui le soir.",
  strategies: "Aller marcher, appeler un ami, respirer.",
  contacts: "",
  placesToAvoid: "Bars du centre-ville",
  helpfulPhrases: "Cette envie va passer.",
  calmingActivities: "Écouter de la musique douce, prendre un bain chaud."
};

const defaultGoals: Goal[] = [
  { days: 1, reward: "Un bon repas", achievedDate: subDays(new Date(), 11).toISOString() },
  { days: 3, reward: "Un film sans culpabilité", achievedDate: subDays(new Date(), 9).toISOString() },
  { days: 7, reward: "Un petit cadeau", achievedDate: subDays(new Date(), 5).toISOString() },
  { days: 14, reward: "Un livre", achievedDate: null },
  { days: 30, reward: "Un massage", achievedDate: null },
];

const defaultContacts: TrustedContact[] = [
  { id: "1", name: "Sophie (Sœur)", phone: "0612345678", relationship: "Sœur" },
];

export function useAppStore() {
  const [sessions, setSessions] = useLocalStorage<AbstractionSession[]>("cleanpath_sessions", defaultSessions);
  const [dayEntries, setDayEntries] = useLocalStorage<DayEntry[]>("cleanpath_dayEntries", []);
  const [consumptions, setConsumptions] = useLocalStorage<ConsumptionEntry[]>("cleanpath_consumptions", []);
  const [emotions, setEmotions] = useLocalStorage<EmotionalEntry[]>("cleanpath_emotions", []);
  const [cravings, setCravings] = useLocalStorage<CravingEvent[]>("cleanpath_cravings", []);
  const [safetyPlan, setSafetyPlan] = useLocalStorage<SafetyPlan>("cleanpath_safetyPlan", defaultSafetyPlan);
  const [contacts, setContacts] = useLocalStorage<TrustedContact[]>("cleanpath_contacts", defaultContacts);
  const [goals, setGoals] = useLocalStorage<Goal[]>("cleanpath_goals", defaultGoals);
  const [settings, setSettings] = useLocalStorage<AppSettings>("cleanpath_settings", defaultSettings);

  return {
    sessions, setSessions,
    dayEntries, setDayEntries,
    consumptions, setConsumptions,
    emotions, setEmotions,
    cravings, setCravings,
    safetyPlan, setSafetyPlan,
    contacts, setContacts,
    goals, setGoals,
    settings, setSettings
  };
}
