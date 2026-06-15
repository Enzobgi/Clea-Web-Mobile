import { createContext, useContext, useState } from "react";

interface UserContextType {
  currentUser: string | null;
  users: string[];
  setUser: (name: string) => void;
  switchUser: (name: string) => void;
  deleteUser: (name: string) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  setUser: () => {},
  switchUser: () => {},
  deleteUser: () => {},
});

export function getUserStoragePrefix(username: string): string {
  return `cleanpath_${username.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("cleanpath_current_user");
  });

  const [users, setUsers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cleanpath_users");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const setUser = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = users.includes(trimmed) ? users : [...users, trimmed];
    setUsers(updated);
    setCurrentUser(trimmed);
    localStorage.setItem("cleanpath_current_user", trimmed);
    localStorage.setItem("cleanpath_users", JSON.stringify(updated));
  };

  const switchUser = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem("cleanpath_current_user", name);
  };

  const deleteUser = (name: string) => {
    const prefix = getUserStoragePrefix(name);
    const suffixes = ["_sessions", "_dayEntries", "_consumptions", "_emotions", "_cravings", "_safetyPlan", "_contacts", "_goals", "_settings"];
    suffixes.forEach(s => localStorage.removeItem(`${prefix}${s}`));
    const updated = users.filter(u => u !== name);
    setUsers(updated);
    localStorage.setItem("cleanpath_users", JSON.stringify(updated));
    if (currentUser === name) {
      const next = updated[0] ?? null;
      setCurrentUser(next);
      if (next) {
        localStorage.setItem("cleanpath_current_user", next);
      } else {
        localStorage.removeItem("cleanpath_current_user");
      }
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, users, setUser, switchUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
