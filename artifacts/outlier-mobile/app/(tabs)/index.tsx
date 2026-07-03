import { Feather } from "@expo/vector-icons";
import { useGetDashboardSummary, useGetRecentTrades } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EquityCurveChart from "@/components/EquityCurveChart";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function fmt(n: number | undefined | null, currency = true) {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const str = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(2);
  return `${n < 0 ? "-" : ""}${currency ? "$" : ""}${str}`;
}

function pct(n: number | undefined | null) {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  accent?: "profit" | "loss" | "primary" | "gold";
}

function StatTile({ label, value, sub, accent }: StatTileProps) {
  const colors = useColors();
  const accentColor =
    accent === "profit" ? colors.profit
    : accent === "loss" ? colors.loss
    : accent === "gold" ? colors.gold
    : colors.primary;

  return (
    <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.tileLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: accentColor }]}>{value}</Text>
      {sub ? <Text style={[styles.tileSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: trades } = useGetRecentTrades({ limit: 5 });

  const s = summary;
  const pnlPositive = !s || s.totalPnl >= 0;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const topPaddingTotal = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPaddingTotal = insets.bottom + (Platform.OS === "web" ? 34 : 20) + 84;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPaddingTotal, paddingBottom: bottomPaddingTotal, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.firstName ?? "Trader"}
          </Text>
        </View>
        <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] ?? "T").toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable
          onPress={() => router.push("/new-trade")}
          style={[styles.quickActionBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.quickActionTextPrimary}>Nova Operação</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/accounts")}
          style={[styles.quickActionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        >
          <Feather name="credit-card" size={16} color={colors.foreground} />
          <Text style={[styles.quickActionText, { color: colors.foreground }]}>Contas</Text>
        </Pressable>
      </View>

      <EquityCurveChart />

      {/* Hero PnL card */}
      <View style={[styles.heroCard, { backgroundColor: pnlPositive ? colors.profitBg : colors.lossBg, borderColor: pnlPositive ? colors.profit : colors.loss }]}>
        <Text style={[styles.heroLabel, { color: pnlPositive ? colors.profit : colors.loss }]}>P&L Total</Text>
        {isLoading ? (
          <View style={[styles.skeleton, { width: 140, height: 36, marginVertical: 4 }]} />
        ) : (
          <Text style={[styles.heroValue, { color: pnlPositive ? colors.profit : colors.loss }]}>
            {fmt(s?.totalPnl)}
          </Text>
        )}
        <Text style={[styles.heroSub, { color: pnlPositive ? colors.profit : colors.loss, opacity: 0.7 }]}>
          Hoje: {fmt(s?.totalPnlToday)}
        </Text>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        {isLoading ? (
          [0,1,2,3].map(i => (
            <View key={i} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.skeleton, { width: 60, height: 10, marginBottom: 8 }]} />
              <View style={[styles.skeleton, { width: 80, height: 22 }]} />
            </View>
          ))
        ) : (
          <>
            <StatTile label="Taxa de Acerto" value={pct(s?.overallWinRate)} sub={`${s?.totalWins ?? 0}G · ${s?.totalLosses ?? 0}P`} accent={s && s.overallWinRate >= 50 ? "profit" : "loss"} />
            <StatTile label="Operações" value={String(s?.totalTrades ?? "—")} sub={`${s?.activeAccounts ?? 0} contas`} accent="primary" />
            <StatTile label="Esta Semana" value={fmt(s?.totalPnlThisWeek)} accent={s && s.totalPnlThisWeek >= 0 ? "profit" : "loss"} />
            <StatTile label="Disciplina" value={s ? `${s.averageDisciplineScore.toFixed(0)}%` : "—"} accent="gold" />
          </>
        )}
      </View>

      {/* Recent trades */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operações Recentes</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
        {!trades?.length ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma operação ainda</Text>
          </View>
        ) : (
          trades.map(t => (
            <View key={t.id} style={[styles.tradeRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.tradeDot, { backgroundColor: t.result === "win" ? colors.profit : t.result === "loss" ? colors.loss : colors.mutedForeground }]} />
              <View style={styles.tradeInfo}>
                <Text style={[styles.tradeAsset, { color: colors.foreground }]}>
                  {t.asset}
                  <Text style={{ color: t.direction === "buy" ? colors.profit : colors.loss }}>
                    {" "}{t.direction === "buy" ? "▲" : "▼"}
                  </Text>
                </Text>
                <Text style={[styles.tradeMeta, { color: colors.mutedForeground }]}>
                  {t.setup ?? t.entryTrigger ?? "—"}
                </Text>
              </View>
              <Text style={[styles.tradePnl, { color: t.pnl != null && t.pnl >= 0 ? colors.profit : colors.loss }]}>
                {fmt(t.pnl)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Best performers */}
      {s && (s.bestSetup || s.bestSession || s.bestTimeframe) && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Melhores Desempenhos</Text>
          <View style={styles.pillRow}>
            {s.bestTimeframe && (
              <View style={[styles.pill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>TF</Text>
                <Text style={[styles.pillValue, { color: colors.foreground }]}>{s.bestTimeframe}</Text>
              </View>
            )}
            {s.bestSetup && (
              <View style={[styles.pill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>Setup</Text>
                <Text style={[styles.pillValue, { color: colors.foreground }]}>{s.bestSetup}</Text>
              </View>
            )}
            {s.bestSession && (
              <View style={[styles.pill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>Sessão</Text>
                <Text style={[styles.pillValue, { color: colors.foreground }]}>{s.bestSession.replace(/_/g, " ")}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5, marginTop: 2 },
  avatarBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickActions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 12 },
  quickActionTextPrimary: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  quickActionText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  heroLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  heroValue: { fontFamily: "Inter_700Bold", fontSize: 34, letterSpacing: -1 },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  tile: {
    width: "47.5%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  tileLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.3, marginBottom: 6 },
  tileValue: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.5 },
  tileSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  tradeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  tradeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, flexShrink: 0 },
  tradeInfo: { flex: 1 },
  tradeAsset: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  tradeMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  tradePnl: { fontFamily: "Inter_700Bold", fontSize: 14 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  pillLabel: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase" },
  pillValue: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 2 },
  skeleton: { backgroundColor: "#ffffff20", borderRadius: 6 },
});
