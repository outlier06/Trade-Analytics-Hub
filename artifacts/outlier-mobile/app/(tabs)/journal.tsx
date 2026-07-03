import { Feather } from "@expo/vector-icons";
import { useGetTrades } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type ResultFilter = "all" | "win" | "loss" | "breakeven";

const RESULT_LABELS: Record<ResultFilter, string> = {
  all: "Todas",
  win: "Ganho",
  loss: "Perda",
  breakeven: "BE",
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(2)}`;
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<ResultFilter>("all");

  const { data: trades, isLoading } = useGetTrades({
    result: filter === "all" ? undefined : filter,
    limit: 50,
  });

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 20) + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.background, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Diário</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {trades?.length ?? 0} operações
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/accounts")}
          style={[styles.accountsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="credit-card" size={16} color={colors.foreground} />
          <Text style={[styles.accountsBtnText, { color: colors.foreground }]}>Contas</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View style={[styles.filters, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(["all", "win", "loss", "breakeven"] as ResultFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.filterLabel, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
              {RESULT_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={[styles.skeleton, { width: 200, height: 16 }]} />
        </View>
      ) : !trades?.length ? (
        <View style={styles.empty}>
          <Feather name="book" size={36} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === "all" ? "Nenhuma operação ainda" : "Nenhum resultado encontrado"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {filter === "all" ? "Toque no botão + para registar a sua primeira operação." : "Tente outro filtro de resultado."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trades}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item: t }) => {
            const isWin = t.result === "win";
            const isLoss = t.result === "loss";
            const resultColor = isWin ? colors.profit : isLoss ? colors.loss : colors.mutedForeground;
            const resultBg = isWin ? colors.profitBg : isLoss ? colors.lossBg : colors.muted;
            const pnlPositive = t.pnl != null && t.pnl >= 0;

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.resultBadge, { backgroundColor: resultBg }]}>
                      <Text style={[styles.resultText, { color: resultColor }]}>
                        {isWin ? "GANHO" : isLoss ? "PERDA" : "BE"}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.assetText, { color: colors.foreground }]}>
                        {t.asset}
                        <Text style={{ color: t.direction === "buy" ? colors.profit : colors.loss }}>
                          {" "}{t.direction === "buy" ? "▲ LONG" : "▼ SHORT"}
                        </Text>
                      </Text>
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {t.session ? t.session.replace(/_/g, " ").toUpperCase() : ""}
                        {t.session && t.setup ? " · " : ""}
                        {t.setup ?? t.entryTrigger ?? ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.pnlText, { color: t.pnl != null ? (pnlPositive ? colors.profit : colors.loss) : colors.mutedForeground }]}>
                      {t.pnl != null ? fmt(t.pnl) : "—"}
                    </Text>
                    {t.riskReward && (
                      <Text style={[styles.rrText, { color: colors.mutedForeground }]}>
                        RR: {t.riskReward.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
                <View style={styles.cardBottom}>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {new Date(t.tradeDate).toLocaleDateString("pt-PT")}
                  </Text>
                  {t.timeframe && (
                    <View style={[styles.tfChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.tfText, { color: colors.mutedForeground }]}>{t.timeframe}</Text>
                    </View>
                  )}
                  {t.disciplineScore != null && (
                    <View style={styles.disciplineRow}>
                      <Feather name="star" size={11} color={colors.gold} />
                      <Text style={[styles.disciplineText, { color: colors.gold }]}>{t.disciplineScore}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <Pressable
        onPress={() => router.push("/new-trade")}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPadding - 20 }]}
      >
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13 },
  accountsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  accountsBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  cardRight: { alignItems: "flex-end" },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  resultText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  assetText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  pnlText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  rrText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  tfChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tfText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  disciplineRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  disciplineText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  skeleton: { backgroundColor: "#ffffff15", borderRadius: 6 },
});
