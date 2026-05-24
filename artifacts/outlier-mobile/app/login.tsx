import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/(tabs)" />;

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Preencha o email e a password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const err = await login(email.trim().toLowerCase(), password);
      if (err) {
        setError(err);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setLoading(false);
    }
  }

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
    },
    inner: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: "center",
    },
    logo: {
      fontFamily: "Inter_700Bold",
      fontSize: 38,
      letterSpacing: -1,
      color: colors.foreground,
      marginBottom: 6,
    },
    logoAccent: { color: colors.primary },
    subtitle: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.mutedForeground,
      marginBottom: 44,
    },
    label: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 11,
      color: colors.mutedForeground,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 14,
    },
    input: {
      flex: 1,
      height: 50,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.foreground,
    },
    eyeBtn: { padding: 4 },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.lossBg,
      borderWidth: 1,
      borderColor: colors.loss,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.loss,
      flex: 1,
    },
    btn: {
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      fontFamily: "Inter_700Bold",
      fontSize: 15,
      color: "#fff",
      letterSpacing: 0.3,
    },
    footer: {
      marginTop: 40,
      alignItems: "center",
    },
    footerText: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.inner}>
        <Text style={s.logo}>
          OUT<Text style={s.logoAccent}>LIER</Text>
        </Text>
        <Text style={s.subtitle}>Plataforma de gestão de trading</Text>

        <Text style={s.label}>Email</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="trader@exemplo.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <Text style={s.label}>Password</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Feather name="alert-circle" size={15} color={colors.loss} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>Entrar</Text>
          )}
        </Pressable>

        <View style={s.footer}>
          <Text style={s.footerText}>
            Não tem conta? Registe-se no OUTLIER Web.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
