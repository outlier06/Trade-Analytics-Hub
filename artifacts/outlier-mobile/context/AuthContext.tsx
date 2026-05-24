import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const SID_KEY = "outlier_sid";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_DOMAIN) {
      setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
    }
    setAuthTokenGetter(async () => {
      return await AsyncStorage.getItem(SID_KEY);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const sid = await AsyncStorage.getItem(SID_KEY);
    if (!sid) {
      setUser(null);
      return;
    }
    try {
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${sid}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
      } else {
        await AsyncStorage.removeItem(SID_KEY);
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
    const res = await fetch(`${base}/api/auth/login?mobile=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { user?: AuthUser; sid?: string; error?: string };
    if (!res.ok || data.error) return data.error ?? "Erro ao entrar.";
    if (data.sid) await AsyncStorage.setItem(SID_KEY, data.sid);
    if (data.user) setUser(data.user);
    return null;
  }, []);

  const logout = useCallback(async () => {
    const sid = await AsyncStorage.getItem(SID_KEY);
    const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        headers: sid ? { Authorization: `Bearer ${sid}` } : {},
      });
    } catch {}
    await AsyncStorage.removeItem(SID_KEY);
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
