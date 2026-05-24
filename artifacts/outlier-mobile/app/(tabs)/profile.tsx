import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MenuRowProps {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuRow({ icon, label, sub, onPress, danger }: MenuRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.lossBg : colors.muted }]}>
        <Feather name={icon as any} size={16} color={danger ? colors.loss : colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: danger ? colors.loss : colors.foreground }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      {!danger && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 20) + 84;

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "T";

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Trader"
    : "Trader";

  function handleLogout() {
    Alert.alert("Terminar Sessão", "Tem a certeza que quer sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPadding, paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Perfil</Text>
      </View>

      {/* Avatar card */}
      <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={[styles.avatarName, { color: colors.foreground }]}>{displayName}</Text>
          <Text style={[styles.avatarEmail, { color: colors.mutedForeground }]}>{user?.email ?? ""}</Text>
          <View style={[styles.memberBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.memberText, { color: colors.primary }]}>OUTLIER Member</Text>
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 16 }]}>
        <MenuRow icon="user" label="Informações Pessoais" sub="Nome, email" />
        <MenuRow icon="lock" label="Alterar Password" sub="Segurança da conta" />
        <MenuRow icon="bell" label="Notificações" sub="Alertas e avisos" />
        <MenuRow icon="info" label="Sobre o OUTLIER" sub="Versão 1.0.0" />
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 12 }]}>
        <MenuRow icon="log-out" label="Terminar Sessão" onPress={handleLogout} danger />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>OUTLIER Trading Platform</Text>
        <Text style={[styles.footerText, { color: colors.mutedForeground, opacity: 0.6 }]}>
          Construído para traders SMC/ICT
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 },
  avatarCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  avatarInfo: { flex: 1, gap: 3 },
  avatarName: { fontFamily: "Inter_700Bold", fontSize: 17 },
  avatarEmail: { fontFamily: "Inter_400Regular", fontSize: 13 },
  memberBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  memberText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  menuCard: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  footer: { marginTop: 32, alignItems: "center", gap: 4 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
