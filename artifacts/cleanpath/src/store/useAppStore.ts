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

const memoryCache = new Map<string, unknown>();
const STORE_UPDATE_EVENT = "cleanpath-store-update";
const remoteLoadPromises = new Map<string, Promise<Record<string, unknown>>>();
const remoteSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

const dataSuffixes = [
  "sessions",
  "dayEntries",
  "consumptions",
  "emotions",
  "cravings",
  "safetyPlan",
  "contacts",
  "goals",
  "settings",
] as const;

function readFromStorage<T>(key: string, fallback: T, vaultData: Record<string, unknown> | null, vaultPresent: boolean): T {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }
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
    memoryCache.set(key, value);
    setter(value);
    if (!vaultPresent) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch { /* ignore */ }
    }
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT, { detail: { key, value } }));
  };
}

function readLocalSnapshot(prefix: string) {
  const snapshot: Record<string, unknown> = {};
  for (const suffix of dataSuffixes) {
    try {
      const raw = window.localStorage.getItem(`${prefix}_${suffix}`);
      if (raw) snapshot[suffix] = JSON.parse(raw);
    } catch {
      // Ignore malformed legacy values.
    }
  }
  return snapshot;
}

function hasMeaningfulData(data: Record<string, unknown>) {
  return Object.entries(data).some(([key, value]) => {
    if (key === "settings") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some(item => Boolean(item));
    }
    return Boolean(value);
  });
}

async function saveRemoteData(userId: string, data: Record<string, unknown>) {
  const response = await fetch("/api/data", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error("Impossible de synchroniser les données.");
}

function scheduleRemoteSave(userId: string, data: Record<string, unknown>) {
  const existingTimer = remoteSaveTimers.get(userId);
  if (existingTimer) clearTimeout(existingTimer);
  remoteSaveTimers.set(userId, setTimeout(() => {
    remoteSaveTimers.delete(userId);
    void saveRemoteData(userId, data).catch(() => {
      // The local copy remains available and a later edit will retry.
    });
  }, 600));
}

function loadRemoteData(userId: string, accountPrefix: string, legacyPrefix: string) {
  const existingPromise = remoteLoadPromises.get(userId);
  if (existingPromise) return existingPromise;

  const promise = fetch("/api/data", { credentials: "include" })
    .then(async response => {
      if (!response.ok) throw new Error("Impossible de charger les données.");
      const result = await response.json() as { data?: Record<string, unknown> };
      const remoteData = result.data ?? {};
      if (hasMeaningfulData(remoteData)) return remoteData;

      const accountData = readLocalSnapshot(accountPrefix);
      const legacyData = readLocalSnapshot(legacyPrefix);
      const migrationData = hasMeaningfulData(accountData) ? accountData : legacyData;

      if (hasMeaningfulData(migrationData)) {
        await saveRemoteData(userId, migrationData);
        return migrationData;
      }
      return remoteData;
    })
    .catch(error => {
      remoteLoadPromises.delete(userId);
      throw error;
    });

  remoteLoadPromises.set(userId, promise);
  return promise;
}

export function useAppStore() {
  const { currentUser, user } = useUser();
  const prefix = user ? getUserStoragePrefix(`account_${user.id}`) : "cleanpath_guest";
  const legacyPrefix = currentUser ? getUserStoragePrefix(currentUser) : "cleanpath_guest";
  const { vaultPresent, vaultData, saveData } = useVault();
  const [remoteReady, setRemoteReady] = useState(false);

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

  const [settings, setSettings_] = useLocalStorage<AppSettings>(`${prefix}_settings`, defaultSettings);

  const setSessions = makeSetter(`${prefix}_sessions`, setSessions_, vaultPresent);
  const setDayEntries = makeSetter(`${prefix}_dayEntries`, setDayEntries_, vaultPresent);
  const setConsumptions = makeSetter(`${prefix}_consumptions`, setConsumptions_, vaultPresent);
  const setEmotions = makeSetter(`${prefix}_emotions`, setEmotions_, vaultPresent);
  const setCravings = makeSetter(`${prefix}_cravings`, setCravings_, vaultPresent);
  const setSafetyPlan = makeSetter(`${prefix}_safetyPlan`, setSafetyPlan_, vaultPresent);
  const setContacts = makeSetter(`${prefix}_contacts`, setContacts_, vaultPresent);
  const setGoals = makeSetter(`${prefix}_goals`, setGoals_, vaultPresent);
  const setSettings = (value: AppSettings) => {
    memoryCache.set(`${prefix}_settings`, value);
    setSettings_(value);
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT, {
      detail: { key: `${prefix}_settings`, value },
    }));
  };

  const stateRef = useRef({ sessions, dayEntries, consumptions, emotions, cravings, safetyPlan, contacts, goals, settings });
  stateRef.current = { sessions, dayEntries, consumptions, emotions, cravings, safetyPlan, contacts, goals, settings };

  useEffect(() => {
    if (!user) {
      setRemoteReady(false);
      return;
    }

    let active = true;
    setRemoteReady(false);

    loadRemoteData(user.id, prefix, legacyPrefix)
      .then(data => {
        if (!active) return;

        const nextSessions = (data.sessions as AbstractionSession[] | undefined) ?? [];
        const nextDayEntries = (data.dayEntries as DayEntry[] | undefined) ?? [];
        const nextConsumptions = (data.consumptions as ConsumptionEntry[] | undefined) ?? [];
        const nextEmotions = (data.emotions as EmotionalEntry[] | undefined) ?? [];
        const nextCravings = (data.cravings as CravingEvent[] | undefined) ?? [];
        const nextSafetyPlan = (data.safetyPlan as SafetyPlan | undefined) ?? defaultSafetyPlan;
        const nextContacts = (data.contacts as TrustedContact[] | undefined) ?? [];
        const nextGoals = (data.goals as Goal[] | undefined) ?? defaultGoals;
        const nextSettings = (data.settings as AppSettings | undefined) ?? defaultSettings;

        const values: Array<[string, unknown]> = [
          [`${prefix}_sessions`, nextSessions],
          [`${prefix}_dayEntries`, nextDayEntries],
          [`${prefix}_consumptions`, nextConsumptions],
          [`${prefix}_emotions`, nextEmotions],
          [`${prefix}_cravings`, nextCravings],
          [`${prefix}_safetyPlan`, nextSafetyPlan],
          [`${prefix}_contacts`, nextContacts],
          [`${prefix}_goals`, nextGoals],
          [`${prefix}_settings`, nextSettings],
        ];
        values.forEach(([key, value]) => {
          memoryCache.set(key, value);
          if (!vaultPresent) window.localStorage.setItem(key, JSON.stringify(value));
        });

        setSessions_(nextSessions);
        setDayEntries_(nextDayEntries);
        setConsumptions_(nextConsumptions);
        setEmotions_(nextEmotions);
        setCravings_(nextCravings);
        setSafetyPlan_(nextSafetyPlan);
        setContacts_(nextContacts);
        setGoals_(nextGoals);
        setSettings_(nextSettings);
        setRemoteReady(true);
      })
      .catch(() => {
        if (active) setRemoteReady(true);
      });

    return () => {
      active = false;
    };
  }, [user?.id, prefix, legacyPrefix, vaultPresent]);

  useEffect(() => {
    const handleStoreUpdate = (event: Event) => {
      const { key, value } = (event as CustomEvent<{ key: string; value: unknown }>).detail ?? {};
      if (!key) return;

      switch (key) {
        case `${prefix}_sessions`:
          setSessions_(value as AbstractionSession[]);
          break;
        case `${prefix}_dayEntries`:
          setDayEntries_(value as DayEntry[]);
          break;
        case `${prefix}_consumptions`:
          setConsumptions_(value as ConsumptionEntry[]);
          break;
        case `${prefix}_emotions`:
          setEmotions_(value as EmotionalEntry[]);
          break;
        case `${prefix}_cravings`:
          setCravings_(value as CravingEvent[]);
          break;
        case `${prefix}_safetyPlan`:
          setSafetyPlan_(value as SafetyPlan);
          break;
        case `${prefix}_contacts`:
          setContacts_(value as TrustedContact[]);
          break;
        case `${prefix}_goals`:
          setGoals_(value as Goal[]);
          break;
        case `${prefix}_settings`:
          setSettings_(value as AppSettings);
          break;
      }
    };

    window.addEventListener(STORE_UPDATE_EVENT, handleStoreUpdate);
    return () => window.removeEventListener(STORE_UPDATE_EVENT, handleStoreUpdate);
  }, [prefix]);

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

  useEffect(() => {
    if (!user || !remoteReady) return;
    scheduleRemoteSave(user.id, {
      sessions,
      dayEntries,
      consumptions,
      emotions,
      cravings,
      safetyPlan,
      contacts,
      goals,
      settings,
    });
  }, [
    user?.id,
    remoteReady,
    sessions,
    dayEntries,
    consumptions,
    emotions,
    cravings,
    safetyPlan,
    contacts,
    goals,
    settings,
  ]);

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
