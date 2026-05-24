import { Feather } from "@expo/vector-icons";
import { useGetTrades } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
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
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Diário</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {trades?.length ?? 0} operações
        </Text>
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
            Registe as suas operações no OUTLIER Web.
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
