import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

const THEME_KEY = "outlier_theme_mode";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  scheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  loaded: boolean;
}

const ThemeContext = createContext<ThemeState>({
  mode: "system",
  scheme: "light",
  setMode: () => {},
  loaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setModeState(saved);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  const scheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  return (
    <ThemeContext.Provider value={{ mode, scheme, setMode, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
