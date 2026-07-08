import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Plan = "free" | "essencial";

type User = {
  id: string;
  email: string;
  name: string;
  plan: Plan;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  togglePlan: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("nfp_user");
    if (raw) {
      const u = JSON.parse(raw) as User;
      if (u.plan === "free") { u.plan = "essencial"; storeUser(u); }
      return u;
    }
  } catch {}
  return null;
}

function storeUser(u: User | null) {
  if (u) localStorage.setItem("nfp_user", JSON.stringify(u));
  else localStorage.removeItem("nfp_user");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const login = async (email: string, _password: string) => {
    const u: User = { id: "temp", email, name: email.split("@")[0], plan: "essencial" };
    storeUser(u);
    setUser(u);
  };

  const logout = () => {
    storeUser(null);
    setUser(null);
  };

  const togglePlan = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = { ...prev, plan: prev.plan === "free" ? "essencial" : "free" };
      storeUser(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, togglePlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
