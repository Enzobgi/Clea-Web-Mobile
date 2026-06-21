export type MainObjective =
  | "ne_pas_commencer"
  | "reduire"
  | "arreter"
  | "eviter_rechute"
  | "aider_proche";

export interface UserProfile {
  nickname: string;
  ageRange: string;
  objective: MainObjective | "";
  substance: string;
  frequency: string;
  difficultSituations: string[];
  strategiesTried: string[];
  region: string;
  notificationsEnabled: boolean;
  personalGoal: string;
  startDate: string;
  onboardingCompleted: boolean;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  completed: boolean;
  weekStart: string;
}

export interface ProgramProgress {
  programId: string;
  completedSteps: string[];
  completedAt: string | null;
}

export interface ChatMemory {
  id: string;
  label: string;
  value: string;
  createdAt: string;
}

export type ChatMode =
  | "ecoute"
  | "plan"
  | "comprendre"
  | "urgence"
  | "discussion"
  | "envie";
