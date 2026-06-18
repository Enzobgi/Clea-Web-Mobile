import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface AccountUser {
  id: string;
  email: string;
  displayName: string;
}

interface UserContextType {
  user: AccountUser | null;
  currentUser: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function getUserStoragePrefix(identifier: string): string {
  return `cleanpath_${identifier.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "")}`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || "Une erreur est survenue.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiRequest<{ user: AccountUser }>("/auth/me")
      .then(result => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<UserContextType>(() => ({
    user,
    currentUser: user?.displayName ?? null,
    isLoading,
    async login(email, password) {
      const result = await apiRequest<{ user: AccountUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(result.user);
    },
    async register(displayName, email, password) {
      const result = await apiRequest<{ user: AccountUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName, email, password }),
      });
      setUser(result.user);
    },
    async logout() {
      await apiRequest<void>("/auth/logout", { method: "POST" });
      setUser(null);
    },
  }), [user, isLoading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
