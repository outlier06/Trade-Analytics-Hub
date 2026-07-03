import { Feather } from "@expo/vector-icons";
import {
  getGetDashboardSummaryQueryKey,
  getListTradesQueryKey,
  useCreateTrade,
  useListAccounts,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const TIMEFRAMES = ["M1", "M2", "M3", "M5", "M10", "M15", "M30", "H1"];
const ENTRY_TRIGGERS = [
  "MSS", "BOS", "LiquiditySweep", "OrderBlock", "FVG",
  "SMTDivergence", "RejectionCandle", "Engulfing",
  "BreakerBlock", "MitigationBlock", "SessionManipulation", "CHOCH",
];
const SESSIONS = ["london", "new_york", "asian", "london_open", "ny_open"];
const SESSION_LABELS: Record<string, string> = {
  london: "Londres",
  new_york: "Nova York",
  asian: "Asiática",
  london_open: "Abertura Londres",
  ny_open: "Abertura NY",
};
const SETUPS = [
  "LiquiditySweep", "OrderBlock", "FVG", "BOS", "MSS",
  "Breaker", "Mitigation", "CHOCH", "SMT", "IFVG",
];
const RESULTS = ["win", "loss", "breakeven"] as const;
const RESULT_LABELS: Record<string, string> = { win: "Ganho", loss: "Perda", breakeven: "BE" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function ChipRow({
  options,
  value,
  onChange,
  labels,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labels?: Record<string, string>;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => {
        const active = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(active ? "" : o)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 8,
              borderRadius: 18,
              borderWidth: 1,
              backgroundColor: active ? colors.primary : colors.card,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: active ? "#fff" : colors.mutedForeground }}>
              {labels?.[o] ?? o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function NewTradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: accounts } = useListAccounts();
  const createTrade = useCreateTrade();

  const [accountId, setAccountId] = useState<number | null>(null);
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [timeframe, setTimeframe] = useState("");
  const [entryTrigger, setEntryTrigger] = useState("");
  const [setup, setSetup] = useState("");
  const [session, setSession] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [riskReward, setRiskReward] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "breakeven">("win");
  const [pnl, setPnl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 0);

  async function handleSubmit() {
    if (!accountId || !asset.trim() || !result) {
      setError("Preencha Conta, Ativo e Resultado.");
      return;
    }
    setError(null);
    createTrade.mutate(
      {
        data: {
          accountId,
          tradeDate: new Date().toISOString(),
          asset: asset.trim().toUpperCase(),
          direction,
          setup: setup || null,
          timeframe: timeframe || null,
          entryTrigger: entryTrigger || null,
          session: session || null,
          entryPrice: entryPrice ? parseFloat(entryPrice) : null,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
          riskReward: riskReward ? parseFloat(riskReward) : null,
          result,
          pnl: pnl ? parseFloat(pnl) : null,
          notes: notes || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          router.back();
        },
        onError: () => setError("Erro ao registar a operação. Tente novamente."),
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nova Operação</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Section title="Conta">
          {!accounts?.length ? (
            <Pressable
              onPress={() => router.push("/accounts")}
              style={[styles.emptyAccountBox, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Feather name="alert-circle" size={16} color={colors.mutedForeground} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground }}>
                Nenhuma conta. Toque para criar uma.
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {accounts.map(a => {
                const active = accountId === a.id;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setAccountId(a.id)}
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 9,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: active ? "#fff" : colors.foreground }}>
                      {a.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Section>

        <Section title="Ativo & Direção">
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Ex: EURUSD, XAUUSD, BTCUSD"
              placeholderTextColor={colors.mutedForeground}
              value={asset}
              onChangeText={setAsset}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["buy", "sell"] as const).map(d => {
              const active = direction === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDirection(d)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    alignItems: "center",
                    backgroundColor: active ? (d === "buy" ? colors.profitBg : colors.lossBg) : colors.card,
                    borderColor: active ? (d === "buy" ? colors.profit : colors.loss) : colors.border,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: active ? (d === "buy" ? colors.profit : colors.loss) : colors.mutedForeground }}>
                    {d === "buy" ? "▲ LONG" : "▼ SHORT"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Setup SMC/ICT">
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Timeframe</Text>
          <ChipRow options={TIMEFRAMES} value={timeframe} onChange={setTimeframe} />
          <Text style={[styles.subLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Gatilho de Entrada</Text>
          <ChipRow options={ENTRY_TRIGGERS} value={entryTrigger} onChange={setEntryTrigger} />
          <Text style={[styles.subLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Setup</Text>
          <ChipRow options={SETUPS} value={setup} onChange={setSetup} />
          <Text style={[styles.subLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Sessão</Text>
          <ChipRow options={SESSIONS} value={session} onChange={setSession} labels={SESSION_LABELS} />
        </Section>

        <Section title="Preços">
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Entrada</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.mutedForeground} value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Stop Loss</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.mutedForeground} value={stopLoss} onChangeText={setStopLoss} keyboardType="decimal-pad" />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Take Profit</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.mutedForeground} value={takeProfit} onChangeText={setTakeProfit} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Risco/Retorno</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Ex: 2.5" placeholderTextColor={colors.mutedForeground} value={riskReward} onChangeText={setRiskReward} keyboardType="decimal-pad" />
              </View>
            </View>
          </View>
        </Section>

        <Section title="Resultado">
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {RESULTS.map(r => {
              const active = result === r;
              const color = r === "win" ? colors.profit : r === "loss" ? colors.loss : colors.mutedForeground;
              const bg = r === "win" ? colors.profitBg : r === "loss" ? colors.lossBg : colors.muted;
              return (
                <Pressable
                  key={r}
                  onPress={() => setResult(r)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    alignItems: "center",
                    backgroundColor: active ? bg : colors.card,
                    borderColor: active ? color : colors.border,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: active ? color : colors.mutedForeground }}>
                    {RESULT_LABELS[r]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>P&L ($)</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Ex: 125.50 ou -80" placeholderTextColor={colors.mutedForeground} value={pnl} onChangeText={setPnl} keyboardType="numbers-and-punctuation" />
          </View>
        </Section>

        <Section title="Notas">
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, height: 100, alignItems: "flex-start", paddingVertical: 10 }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground, height: "100%", textAlignVertical: "top" }]}
              placeholder="Observações sobre a operação..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </Section>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.lossBg, borderColor: colors.loss }]}>
            <Feather name="alert-circle" size={15} color={colors.loss} />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.loss, flex: 1 }}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary }, createTrade.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={createTrade.isPending}
        >
          {createTrade.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Guardar Operação</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, width: 30 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  subLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  input: {
    height: 48,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  emptyAccountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  submitBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
