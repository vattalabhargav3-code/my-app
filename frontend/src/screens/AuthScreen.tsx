import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errorMessage, SESSION_KEY, User } from "@/src/api";
import { BrandMark, Button, ErrorBanner, Field, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";
import { storage } from "@/src/utils/storage";

export function AuthScreen({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devCode, setDevCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setError("");
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const result = await api("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) });
      setChallengeId(result.challenge_id);
      setDevCode(result.development_code ?? "");
      setOtpSent(true);
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, challenge_id: challengeId, code: otp }),
      });
      await storage.secureSet(SESSION_KEY, result.access_token);
      onLogin(result.access_token, result.user);
    } catch (verifyError) {
      setError(errorMessage(verifyError, "Could not verify OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[shared.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <BrandMark />
          <Text style={shared.eyebrow}>MOVE WITH CONFIDENCE</Text>
          <Text style={styles.title}>
            Your next ride,<Text style={shared.brandText}> made safer.</Text>
          </Text>
          <Text style={styles.subtitle}>Verified people. Clear prices. One calm journey from pickup to arrival.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={shared.sectionTitle}>{otpSent ? "Enter your code" : "Sign in with mobile"}</Text>
              <Text style={shared.mutedText}>
                {otpSent ? "We sent a 6-digit code to your number." : "India numbers only for now."}
              </Text>
            </View>
            <Icon name={otpSent ? "shield-check-outline" : "cellphone-lock"} color={colors.brand} size={26} />
          </View>

          {!otpSent ? (
            <>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryText}>+91</Text>
                </View>
                <TextInput
                  testID="auth-phone-input"
                  style={[shared.input, shared.flex]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Mobile number"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <Button label="Send secure OTP" onPress={sendOtp} loading={loading} testID="auth-send-otp" />
            </>
          ) : (
            <>
              <Field
                label="One-time password"
                value={otp}
                onChangeText={setOtp}
                placeholder="6-digit code"
                keyboardType="number-pad"
                testID="auth-otp-input"
              />
              {devCode ? (
                <View style={styles.devCode}>
                  <Icon name="information-outline" size={16} color={colors.info} />
                  <Text style={styles.devCodeText}>
                    Preview code: <Text style={styles.devCodeStrong} testID="auth-dev-code">{devCode}</Text>
                  </Text>
                </View>
              ) : null}
              <Button label="Verify & enter" onPress={verifyOtp} loading={loading} testID="auth-verify-otp" />
              <Pressable
                onPress={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>Use a different number</Text>
              </Pressable>
            </>
          )}
          <ErrorBanner message={error} />
        </View>

        <View style={styles.trustRow}>
          <Icon name="shield-check" color={colors.brand} size={18} />
          <Text style={styles.trustText}>Your account is secured with phone verification.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { marginBottom: 28 },
  title: { color: colors.onSurface, fontSize: 34, lineHeight: 39, fontWeight: "800", letterSpacing: -1.1 },
  subtitle: { color: colors.onSurfaceSecondary, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 340 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    gap: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  phoneRow: { flexDirection: "row", gap: 8 },
  countryCode: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
    borderWidth: 1,
  },
  countryText: { color: colors.onSurface, fontWeight: "700" },
  textButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  textButtonLabel: { color: colors.brand, fontSize: 13, fontWeight: "700" },
  devCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.brandTertiary,
  },
  devCodeText: { color: colors.onSurfaceSecondary, fontSize: 12 },
  devCodeStrong: { color: colors.brand, fontWeight: "800", letterSpacing: 1 },
  trustRow: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 24 },
  trustText: { color: colors.muted, fontSize: 12 },
});
