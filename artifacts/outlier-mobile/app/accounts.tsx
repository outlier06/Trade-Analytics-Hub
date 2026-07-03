import { Feather } from "@expo/vector-icons";
import {
  getListAccountsQueryKey,
  useCreateAccount,
  useDeleteAccount,
  useListAccounts,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

const ACCOUNT_TYPES = ["forex", "crypto", "prop_firm", "demo", "cent"];
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  forex: "Forex", crypto: "Cripto", prop_firm: "Prop Firm", demo: "Demo", cent: "Cent",
};
const ACCOUNT_STATUSES = ["active", "passed", "failed", "blown", "archived"];
const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Ativo", passed: "Aprovado", failed: "Reprovado", blown: "Queimado", archived: "Arquivado",
};

function fmtMoney(n: number, currency: string) {
  return `${currency === "USD" ? "$" : currency + " "}${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusColors(colors: ReturnType<typeof useColors>, status: string) {
  const m: Record<string, { fg: string; bg: string }> = {
    active: { fg: colors.profit, bg: colors.profitBg },
    passed: { fg: colors.primary, bg: colors.muted },
    failed: { fg: colors.gold, bg: colors.goldBg },
    blown: { fg: colors.loss, bg: colors.lossBg },
    archived: { fg: colors.mutedForeground, bg: colors.muted },
  };
  return m[status] ?? { fg: colors.mutedForeground, bg: colors.muted };
}

export default function AccountsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = useListAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [accountType, setAccountType] = useState("forex");
  const [initialBalance, setInitialBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState<string | null>(null);

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 0);

  function resetForm() {
    setName(""); setBrokerName(""); setAccountType("forex");
    setInitialBalance(""); setCurrency("USD"); setStatus("active"); setError(null);
  }

  function handleCreate() {
    if (!name.trim() || !initialBalance) {
      setError("Preencha o nome e o saldo inicial.");
      return;
    }
    setError(null);
    const balance = parseFloat(initialBalance);
    createAccount.mutate(
      {
        data: {
          name: name.trim(),
          brokerName: brokerName.trim() || null,
          accountType,
          initialBalance: balance,
          currentBalance: balance,
          currency,
          status,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
          setModalOpen(false);
          resetForm();
        },
        onError: () => setError("Erro ao criar a conta. Tente novamente."),
      }
    );
  }

  function handleDelete(id: number, accName: string) {
    Alert.alert("Eliminar conta", `Eliminar "${accName}"? Todas as operações associadas serão removidas.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteAccount.mutate({ id }, {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() }),
          });
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Contas</Text>
        <Pressable onPress={() => setModalOpen(true)} style={styles.addBtn} hitSlop={10}>
          <Feather name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !accounts?.length ? (
        <View style={styles.empty}>
          <Feather name="credit-card" size={36} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma conta ainda</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Crie a sua primeira conta para começar a registar operações.
          </Text>
          <Pressable style={[styles.createFirstBtn, { backgroundColor: colors.primary }]} onPress={() => setModalOpen(true)}>
            <Text style={styles.createFirstText}>Criar Primeira Conta</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {accounts.map(acc => {
            const growth = acc.initialBalance > 0 ? ((acc.currentBalance - acc.initialBalance) / acc.initialBalance) * 100 : 0;
            const positive = acc.currentBalance >= acc.initialBalance;
            const sc = statusColors(colors, acc.status);
            return (
              <View key={acc.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accName, { color: colors.foreground }]}>{acc.name}</Text>
                    <Text style={[styles.accMeta, { color: colors.mutedForeground }]}>
                      {acc.brokerName ?? ACCOUNT_TYPE_LABELS[acc.accountType] ?? acc.accountType}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.fg }]}>{ACCOUNT_STATUS_LABELS[acc.status] ?? acc.status}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(acc.id, acc.name)} style={{ marginLeft: 10, padding: 4 }} hitSlop={8}>
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
                <View style={styles.balanceRow}>
                  <View>
                    <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Saldo Atual</Text>
                    <Text style={[styles.balanceValue, { color: colors.foreground }]}>{fmtMoney(acc.currentBalance, acc.currency)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Crescimento</Text>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: positive ? colors.profit : colors.loss }}>
                      {positive ? "+" : ""}{growth.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nova Conta</Text>
              <Pressable onPress={() => { setModalOpen(false); resetForm(); }} hitSlop={10}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nome *</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Ex: FTMO 100k" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Corretora</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Ex: FTMO, Binance" placeholderTextColor={colors.mutedForeground} value={brokerName} onChangeText={setBrokerName} />
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tipo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {ACCOUNT_TYPES.map(t => {
                  const active = accountType === t;
                  return (
                    <Pressable key={t} onPress={() => setAccountType(t)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: active ? "#fff" : colors.mutedForeground }}>{ACCOUNT_TYPE_LABELS[t]}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Saldo Inicial *</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="10000" placeholderTextColor={colors.mutedForeground} value={initialBalance} onChangeText={setInitialBalance} keyboardType="decimal-pad" />
                  </View>
                </View>
                <View style={{ width: 90 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Moeda</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput style={[styles.input, { color: colors.foreground }]} value={currency} onChangeText={t => setCurrency(t.toUpperCase())} autoCapitalize="characters" maxLength={3} />
                  </View>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 4 }]}>Estado</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {ACCOUNT_STATUSES.map(s => {
                  const active = status === s;
                  return (
                    <Pressable key={s} onPress={() => setStatus(s)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: active ? "#fff" : colors.mutedForeground }}>{ACCOUNT_STATUS_LABELS[s]}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.lossBg, borderColor: colors.loss }]}>
                  <Feather name="alert-circle" size={14} color={colors.loss} />
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.loss, flex: 1 }}>{error}</Text>
                </View>
              )}

              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.primary }, createAccount.isPending && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={createAccount.isPending}
              >
                {createAccount.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Criar Conta</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  addBtn: { padding: 4, width: 30, alignItems: "flex-end" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  createFirstBtn: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  createFirstText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  accName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  accMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.3 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 3 },
  balanceValue: { fontFamily: "Inter_700Bold", fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.4 },
  inputWrap: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, justifyContent: "center" },
  input: { height: 46, fontFamily: "Inter_400Regular", fontSize: 15 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  submitBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
