import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
  type ReactNode,
} from "react";
import { useLocalStorage } from "./use-local-storage";
import { useUser, getUserStoragePrefix } from "./UserContext";
import { useVault } from "./VaultContext";
import { subDays } from "date-fns";
import type { ChatMemory, ProgramProgress, UserProfile, WeeklyGoal } from "@/types/domain";

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
  createdAt?: string;
  mood: number;
  anxiety: number;
  sleepQuality: number;
  energy: number;
  gratitude: string;
  whatHelped: string;
  whatWasDifficult: string;
  intentionForTomorrow: string;
}

export interface GratitudeEntry {
  id: string;
  date: string;
  text: string;
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
  chatMemoryEnabled: boolean;
  chatStatsEnabled: boolean;
}

const defaultSettings: AppSettings = {
  discreteMode: false,
  costPerDay: 15,
  reminderSettings: {},
  chatMemoryEnabled: false,
  chatStatsEnabled: true,
};

const defaultProfile: UserProfile = {
  nickname: "",
  ageRange: "",
  objective: "",
  substance: "",
  frequency: "",
  difficultSituations: [],
  strategiesTried: [],
  region: "Belgique",
  notificationsEnabled: false,
  personalGoal: "",
  startDate: new Date().toISOString().slice(0, 10),
  onboardingCompleted: false,
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
const remoteSaveChains = new Map<string, Promise<void>>();

const dataSuffixes = [
  "sessions",
  "dayEntries",
  "consumptions",
  "emotions",
  "gratitudes",
  "cravings",
  "safetyPlan",
  "contacts",
  "goals",
  "profile",
  "weeklyGoals",
  "programProgress",
  "chatMemory",
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
    const previousSave = remoteSaveChains.get(userId) ?? Promise.resolve();
    const nextSave = previousSave
      .catch(() => undefined)
      .then(() => saveRemoteData(userId, data));

    remoteSaveChains.set(userId, nextSave);
    void nextSave
      .catch(() => {
        // The local copy remains available and a later edit will retry.
      })
      .finally(() => {
        if (remoteSaveChains.get(userId) === nextSave) {
          remoteSaveChains.delete(userId);
        }
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
    .finally(() => {
      remoteLoadPromises.delete(userId);
    });

  remoteLoadPromises.set(userId, promise);
  return promise;
}

function useAppStoreState() {
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
  const [gratitudes, setGratitudes_] = useState<GratitudeEntry[]>(
    () => readFromStorage(`${prefix}_gratitudes`, [], vaultData, vaultPresent)
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
  const [profile, setProfile_] = useState<UserProfile>(
    () => readFromStorage(`${prefix}_profile`, defaultProfile, vaultData, vaultPresent)
  );
  const [weeklyGoals, setWeeklyGoals_] = useState<WeeklyGoal[]>(
    () => readFromStorage(`${prefix}_weeklyGoals`, [], vaultData, vaultPresent)
  );
  const [programProgress, setProgramProgress_] = useState<ProgramProgress[]>(
    () => readFromStorage(`${prefix}_programProgress`, [], vaultData, vaultPresent)
  );
  const [chatMemory, setChatMemory_] = useState<ChatMemory[]>(
    () => readFromStorage(`${prefix}_chatMemory`, [], vaultData, vaultPresent)
  );

  const [settings, setSettings_] = useLocalStorage<AppSettings>(`${prefix}_settings`, defaultSettings);

  const setSessions = makeSetter(`${prefix}_sessions`, setSessions_, vaultPresent);
  const setDayEntries = makeSetter(`${prefix}_dayEntries`, setDayEntries_, vaultPresent);
  const setConsumptions = makeSetter(`${prefix}_consumptions`, setConsumptions_, vaultPresent);
  const setEmotions = makeSetter(`${prefix}_emotions`, setEmotions_, vaultPresent);
  const setGratitudes = makeSetter(`${prefix}_gratitudes`, setGratitudes_, vaultPresent);
  const setCravings = makeSetter(`${prefix}_cravings`, setCravings_, vaultPresent);
  const setSafetyPlan = makeSetter(`${prefix}_safetyPlan`, setSafetyPlan_, vaultPresent);
  const setContacts = makeSetter(`${prefix}_contacts`, setContacts_, vaultPresent);
  const setGoals = makeSetter(`${prefix}_goals`, setGoals_, vaultPresent);
  const setProfile = makeSetter(`${prefix}_profile`, setProfile_, vaultPresent);
  const setWeeklyGoals = makeSetter(`${prefix}_weeklyGoals`, setWeeklyGoals_, vaultPresent);
  const setProgramProgress = makeSetter(`${prefix}_programProgress`, setProgramProgress_, vaultPresent);
  const setChatMemory = makeSetter(`${prefix}_chatMemory`, setChatMemory_, vaultPresent);
  const setSettings = (value: AppSettings) => {
    memoryCache.set(`${prefix}_settings`, value);
    setSettings_(value);
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT, {
      detail: { key: `${prefix}_settings`, value },
    }));
  };

  const stateRef = useRef({ sessions, dayEntries, consumptions, emotions, gratitudes, cravings, safetyPlan, contacts, goals, profile, weeklyGoals, programProgress, chatMemory, settings });
  stateRef.current = { sessions, dayEntries, consumptions, emotions, gratitudes, cravings, safetyPlan, contacts, goals, profile, weeklyGoals, programProgress, chatMemory, settings };

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
        const nextGratitudes = (data.gratitudes as GratitudeEntry[] | undefined) ?? [];
        const nextCravings = (data.cravings as CravingEvent[] | undefined) ?? [];
        const nextSafetyPlan = (data.safetyPlan as SafetyPlan | undefined) ?? defaultSafetyPlan;
        const nextContacts = (data.contacts as TrustedContact[] | undefined) ?? [];
        const nextGoals = (data.goals as Goal[] | undefined) ?? defaultGoals;
        const nextProfile = (data.profile as UserProfile | undefined) ?? defaultProfile;
        const nextWeeklyGoals = (data.weeklyGoals as WeeklyGoal[] | undefined) ?? [];
        const nextProgramProgress = (data.programProgress as ProgramProgress[] | undefined) ?? [];
        const nextChatMemory = (data.chatMemory as ChatMemory[] | undefined) ?? [];
        const nextSettings = { ...defaultSettings, ...((data.settings as Partial<AppSettings> | undefined) ?? {}) };

        const values: Array<[string, unknown]> = [
          [`${prefix}_sessions`, nextSessions],
          [`${prefix}_dayEntries`, nextDayEntries],
          [`${prefix}_consumptions`, nextConsumptions],
          [`${prefix}_emotions`, nextEmotions],
          [`${prefix}_gratitudes`, nextGratitudes],
          [`${prefix}_cravings`, nextCravings],
          [`${prefix}_safetyPlan`, nextSafetyPlan],
          [`${prefix}_contacts`, nextContacts],
          [`${prefix}_goals`, nextGoals],
          [`${prefix}_profile`, nextProfile],
          [`${prefix}_weeklyGoals`, nextWeeklyGoals],
          [`${prefix}_programProgress`, nextProgramProgress],
          [`${prefix}_chatMemory`, nextChatMemory],
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
        setGratitudes_(nextGratitudes);
        setCravings_(nextCravings);
        setSafetyPlan_(nextSafetyPlan);
        setContacts_(nextContacts);
        setGoals_(nextGoals);
        setProfile_(nextProfile);
        setWeeklyGoals_(nextWeeklyGoals);
        setProgramProgress_(nextProgramProgress);
        setChatMemory_(nextChatMemory);
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
        case `${prefix}_gratitudes`:
          setGratitudes_(value as GratitudeEntry[]);
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
        case `${prefix}_profile`:
          setProfile_(value as UserProfile);
          break;
        case `${prefix}_weeklyGoals`:
          setWeeklyGoals_(value as WeeklyGoal[]);
          break;
        case `${prefix}_programProgress`:
          setProgramProgress_(value as ProgramProgress[]);
          break;
        case `${prefix}_chatMemory`:
          setChatMemory_(value as ChatMemory[]);
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
        [`${prefix}_gratitudes`]: stateRef.current.gratitudes,
        [`${prefix}_cravings`]: stateRef.current.cravings,
        [`${prefix}_safetyPlan`]: stateRef.current.safetyPlan,
        [`${prefix}_contacts`]: stateRef.current.contacts,
        [`${prefix}_goals`]: stateRef.current.goals,
        [`${prefix}_profile`]: stateRef.current.profile,
        [`${prefix}_weeklyGoals`]: stateRef.current.weeklyGoals,
        [`${prefix}_programProgress`]: stateRef.current.programProgress,
        [`${prefix}_chatMemory`]: stateRef.current.chatMemory,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [sessions, dayEntries, consumptions, emotions, gratitudes, cravings, safetyPlan, contacts, goals, profile, weeklyGoals, programProgress, chatMemory, vaultPresent, saveData, prefix]);

  useEffect(() => {
    if (!user || !remoteReady) return;
    scheduleRemoteSave(user.id, {
      sessions,
      dayEntries,
      consumptions,
      emotions,
      gratitudes,
      cravings,
      safetyPlan,
      contacts,
      goals,
      profile,
      weeklyGoals,
      programProgress,
      chatMemory,
      settings,
    });
  }, [
    user?.id,
    remoteReady,
    sessions,
    dayEntries,
    consumptions,
    emotions,
    gratitudes,
    cravings,
    safetyPlan,
    contacts,
    goals,
    profile,
    weeklyGoals,
    programProgress,
    chatMemory,
    settings,
  ]);

  return {
    isReady: !user || remoteReady,
    prefix,
    sessions, setSessions,
    dayEntries, setDayEntries,
    consumptions, setConsumptions,
    emotions, setEmotions,
    gratitudes, setGratitudes,
    cravings, setCravings,
    safetyPlan, setSafetyPlan,
    contacts, setContacts,
    goals, setGoals,
    profile, setProfile,
    weeklyGoals, setWeeklyGoals,
    programProgress, setProgramProgress,
    chatMemory, setChatMemory,
    settings, setSettings
  };
}

type AppStoreValue = ReturnType<typeof useAppStoreState>;

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const store = useAppStoreState();

  if (!store.isReady) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Synchronisation de ton espace...</p>
      </div>
    );
  }

  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return store;
}
