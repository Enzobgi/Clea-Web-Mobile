import { useLocalStorage } from "./use-local-storage";
import { useUser, getUserStoragePrefix } from "./UserContext";

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

const defaultSettings: AppSettings = {
  pin: null,
  discreteMode: false,
  costPerDay: 15,
  reminderSettings: {}
};

const defaultSafetyPlan: SafetyPlan = {
  reasons: "",
  risks: "",
  gains: "",
  triggers: "",
  strategies: "",
  contacts: "",
  placesToAvoid: "",
  helpfulPhrases: "Cette envie va passer.",
  calmingActivities: ""
};

const defaultGoals: Goal[] = [
  { days: 1, reward: "", achievedDate: null },
  { days: 7, reward: "", achievedDate: null },
  { days: 30, reward: "", achievedDate: null },
  { days: 90, reward: "", achievedDate: null },
];

export function useAppStore() {
  const { currentUser } = useUser();
  const prefix = currentUser ? getUserStoragePrefix(currentUser) : "cleanpath_guest";

  const [sessions, setSessions] = useLocalStorage<AbstractionSession[]>(`${prefix}_sessions`, []);
  const [dayEntries, setDayEntries] = useLocalStorage<DayEntry[]>(`${prefix}_dayEntries`, []);
  const [consumptions, setConsumptions] = useLocalStorage<ConsumptionEntry[]>(`${prefix}_consumptions`, []);
  const [emotions, setEmotions] = useLocalStorage<EmotionalEntry[]>(`${prefix}_emotions`, []);
  const [cravings, setCravings] = useLocalStorage<CravingEvent[]>(`${prefix}_cravings`, []);
  const [safetyPlan, setSafetyPlan] = useLocalStorage<SafetyPlan>(`${prefix}_safetyPlan`, defaultSafetyPlan);
  const [contacts, setContacts] = useLocalStorage<TrustedContact[]>(`${prefix}_contacts`, []);
  const [goals, setGoals] = useLocalStorage<Goal[]>(`${prefix}_goals`, defaultGoals);
  const [settings, setSettings] = useLocalStorage<AppSettings>(`${prefix}_settings`, defaultSettings);

  return {
    prefix,
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
