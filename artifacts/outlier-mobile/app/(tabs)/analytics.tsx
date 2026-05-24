import { Feather } from "@expo/vector-icons";
import {
  useGetSessionAnalytics,
  useGetSetupAnalytics,
  useGetTimeframeAnalytics,
  useGetTriggerAnalytics,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Tab = "timeframe" | "trigger" | "setup" | "session";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "timeframe", label: "Timeframe", icon: "clock" },
  { key: "trigger", label: "Trigger", icon: "zap" },
  { key: "setup", label: "Setup", icon: "layers" },
  { key: "session", label: "Sessão", icon: "sun" },
];

function pct(n: number) { return `${n.toFixed(1)}%`; }
function fmt(n: number) {
  return `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(2)}`;
}

interface BarRowProps {
  label: string;
  winRate: number;
  trades: number;
  pnl: number;
}

function BarRow({ label, winRate, trades, pnl }: BarRowProps) {
  const colors = useColors();
  const isPositive = pnl >= 0;
  return (
    <View style={[styles.barRow, { borderBottomColor: colors.border }]}>
      <View style={styles.barLeft}>
        <Text style={[styles.barLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.barMeta, { color: colors.mutedForeground }]}>{trades} ops</Text>
      </View>
      <View style={styles.barRight}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(winRate, 100)}%` as unknown as number, backgroundColor: winRate >= 50 ? colors.profit : colors.loss }]} />
        </View>
        <Text style={[styles.barPct, { color: winRate >= 50 ? colors.profit : colors.loss }]}>{pct(winRate)}</Text>
        <Text style={[styles.barPnl, { color: isPositive ? colors.profit : colors.loss }]}>{fmt(pnl)}</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("timeframe");

  const { data: tfData } = useGetTimeframeAnalytics({});
  const { data: trigData } = useGetTriggerAnalytics({});
  const { data: setupData } = useGetSetupAnalytics({});
  const { data: sessionData } = useGetSessionAnalytics({});

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 20) + 84;

  const rows: { label: string; winRate: number; trades: number; pnl: number }[] = (() => {
    if (tab === "timeframe") return (tfData ?? []).map(r => ({ label: r.timeframe, winRate: r.winRate, trades: r.trades, pnl: r.totalPnl }));
    if (tab === "trigger") return (trigData ?? []).map(r => ({ label: r.trigger, winRate: r.winRate, trades: r.trades, pnl: r.totalPnl }));
    if (tab === "setup") return (setupData ?? []).map(r => ({ label: r.setup, winRate: r.winRate, trades: r.trades, pnl: r.totalPnl }));
    if (tab === "session") return (sessionData ?? []).map(r => ({ label: r.session.replace(/_/g, " "), winRate: r.winRate, trades: r.trades, pnl: r.totalPnl }));
    return [];
  })().sort((a, b) => b.pnl - a.pnl);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPadding, paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Análise</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Performance detalhada</Text>
      </View>

      {/* Tab Switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, { borderBottomWidth: tab === t.key ? 2 : 0, borderBottomColor: colors.primary }]}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rows */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 16 }]}>
        {!rows.length ? (
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={32} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sem dados suficientes</Text>
          </View>
        ) : (
          rows.map((r, i) => (
            <BarRow key={`${r.label}-${i}`} label={r.label} winRate={r.winRate} trades={r.trades} pnl={r.pnl} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13 },
  tabBar: { paddingHorizontal: 16, paddingVertical: 4, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barLeft: { flex: 1 },
  barLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, textTransform: "capitalize" },
  barMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  barRight: { alignItems: "flex-end", gap: 4 },
  barTrack: { width: 80, height: 5, borderRadius: 3, backgroundColor: "#ffffff15", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barPct: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  barPnl: { fontFamily: "Inter_700Bold", fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
