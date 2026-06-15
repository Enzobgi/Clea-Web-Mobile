import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { useLocalStorage } from "./use-local-storage";
import { useUser, getUserStoragePrefix } from "./UserContext";
import { useVault } from "./VaultContext";
import { subDays } from "date-fns";

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
  discreteMode: boolean;
  costPerDay: number;
  reminderSettings: { [key: string]: boolean };
}

const defaultSettings: AppSettings = {
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

function readFromStorage<T>(key: string, fallback: T, vaultData: Record<string, unknown> | null, vaultPresent: boolean): T {
  if (vaultPresent && vaultData) {
    const v = vaultData[key];
    return v !== undefined && v !== null ? (v as T) : fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeSetter<T>(key: string, setter: Dispatch<SetStateAction<T>>, vaultPresent: boolean) {
  return (value: T) => {
    setter(value);
    if (!vaultPresent) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch { /* ignore */ }
    }
  };
}

export function useAppStore() {
  const { currentUser } = useUser();
  const prefix = currentUser ? getUserStoragePrefix(currentUser) : "cleanpath_guest";
  const { vaultPresent, vaultData, saveData } = useVault();

  const [sessions, setSessions_] = useState<AbstractionSession[]>(
    () => readFromStorage(`${prefix}_sessions`, [], vaultData, vaultPresent)
  );
  const [dayEntries, setDayEntries_] = useState<DayEntry[]>(
    () => readFromStorage(`${prefix}_dayEntries`, [], vaultData, vaultPresent)
  );
  const [consumptions, setConsumptions_] = useState<ConsumptionEntry[]>(
    () => readFromStorage(`${prefix}_consumptions`, [], vaultData, vaultPresent)
  );
  const [emotions, setEmotions_] = useState<EmotionalEntry[]>(
    () => readFromStorage(`${prefix}_emotions`, [], vaultData, vaultPresent)
  );
  const [cravings, setCravings_] = useState<CravingEvent[]>(
    () => readFromStorage(`${prefix}_cravings`, [], vaultData, vaultPresent)
  );
  const [safetyPlan, setSafetyPlan_] = useState<SafetyPlan>(
    () => readFromStorage(`${prefix}_safetyPlan`, defaultSafetyPlan, vaultData, vaultPresent)
  );
  const [contacts, setContacts_] = useState<TrustedContact[]>(
    () => readFromStorage(`${prefix}_contacts`, [], vaultData, vaultPresent)
  );
  const [goals, setGoals_] = useState<Goal[]>(
    () => readFromStorage(`${prefix}_goals`, defaultGoals, vaultData, vaultPresent)
  );

  const [settings, setSettings] = useLocalStorage<AppSettings>(`${prefix}_settings`, defaultSettings);

  const setSessions = makeSetter(`${prefix}_sessions`, setSessions_, vaultPresent);
  const setDayEntries = makeSetter(`${prefix}_dayEntries`, setDayEntries_, vaultPresent);
  const setConsumptions = makeSetter(`${prefix}_consumptions`, setConsumptions_, vaultPresent);
  const setEmotions = makeSetter(`${prefix}_emotions`, setEmotions_, vaultPresent);
  const setCravings = makeSetter(`${prefix}_cravings`, setCravings_, vaultPresent);
  const setSafetyPlan = makeSetter(`${prefix}_safetyPlan`, setSafetyPlan_, vaultPresent);
  const setContacts = makeSetter(`${prefix}_contacts`, setContacts_, vaultPresent);
  const setGoals = makeSetter(`${prefix}_goals`, setGoals_, vaultPresent);

  const stateRef = useRef({ sessions, dayEntries, consumptions, emotions, cravings, safetyPlan, contacts, goals });
  stateRef.current = { sessions, dayEntries, consumptions, emotions, cravings, safetyPlan, contacts, goals };

  useEffect(() => {
    if (!vaultPresent) return;
    const timer = setTimeout(() => {
      saveData({
        [`${prefix}_sessions`]: stateRef.current.sessions,
        [`${prefix}_dayEntries`]: stateRef.current.dayEntries,
        [`${prefix}_consumptions`]: stateRef.current.consumptions,
        [`${prefix}_emotions`]: stateRef.current.emotions,
        [`${prefix}_cravings`]: stateRef.current.cravings,
        [`${prefix}_safetyPlan`]: stateRef.current.safetyPlan,
        [`${prefix}_contacts`]: stateRef.current.contacts,
        [`${prefix}_goals`]: stateRef.current.goals,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [sessions, dayEntries, consumptions, emotions, cravings, safetyPlan, contacts, goals, vaultPresent, saveData, prefix]);

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
