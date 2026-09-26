import { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errorMessage, SESSION_KEY, User } from "@/src/api";
import { BrandMark, Button, ErrorBanner, Field, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";
import { storage } from "@/src/utils/storage";

// Firebase Imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDEOTgln5Gs2lgZqLYTQwQS_s5geHxxMdU",
  authDomain: "safer-way-9b359.firebaseapp.com",
  projectId: "safer-way-9b359",
  storageBucket: "safer-way-9b359.firebasestorage.app",
  messagingSenderId: "585513390587",
  appId: "1:585513390587:web:96d3abb813095142e5bb5e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export function AuthScreen({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Web ప్లాట్‌ఫారమ్‌లో invisible reCAPTCHA క్రియేట్ చేయడం
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            setError("reCAPTCHA expired. Please try again.");
          }
        });
      }
    }
  }, []);

  const sendOtp = async () => {
    setError("");
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const phoneNumber = `+91${cleaned}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (requestError: any) {
      console.error(requestError);
      setError(requestError?.message || "Failed to send SMS OTP. Please try again.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha?.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (!otp || otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP received via SMS.");
      return;
    }
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No active OTP session found. Please resend OTP.");
      }
      // Firebase ద్వారా యూజర్ OTP వెరిఫై చేయడం
      const userCredential = await confirmationResult.confirm(otp.trim());
      const firebaseIdToken = await userCredential.user.getIdToken();
      await storage.secureSet(SESSION_KEY, firebaseIdToken);
      localStorage.setItem(SESSION_KEY, firebaseIdToken);
      onLogin(firebaseIdToken, {
        id: userCredential.user.uid,
        phone: userCredential.user.phoneNumber || phone,
        name: userCredential.user.displayName || "User",
      });
    } catch (verifyError: any) {
      console.error(verifyError);
      setError("Invalid or expired OTP. Please check and try again.");
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
                {otpSent ? "We sent a 6-digit SMS code to your number." : "India numbers only for now."}
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
                placeholder="6-digit SMS code"
                keyboardType="number-pad"
                testID="auth-otp-input"
              />
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

        {/* reCAPTCHA కోసం హిడెన్ కంటైనర్ */}
        <div id="recaptcha-container"></div>

        <View style={styles.trustRow}>
          <Icon name="shield-check" color={colors.brand} size={18} />
          <Text style={styles.trustText}>Your account is secured with Google Phone Verification.</Text>
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
  trustRow: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 24 },
  trustText: { color: colors.muted, fontSize: 12 },
});
