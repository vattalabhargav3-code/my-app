import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { User } from "@/src/api";

export function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (token: string, user: User) => void }) {
  const insets = useSafeAreaInsets();

  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendOtp = () => {
    if (!phone || phone.trim().length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    setErrorMessage("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 200);
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.trim().length < 4) {
      setErrorMessage("Please enter the 4-digit OTP code.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      setLoading(false);
      onAuthSuccess("mock_token_riderx_" + Date.now(), {
        id: "usr_passenger_1",
        phone: phone.trim(),
        full_name: fullName.trim() || "Bhargav Vattala",
        role: "passenger",
        id_verified: true,
      });
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 30,
          minHeight: "100%",
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!showLogin ? (
          <View style={styles.heroIntroWrap}>
            <View style={styles.tricolorHeaderBar}>
              <View style={styles.stripeSaffron} />
              <View style={styles.stripeWhite} />
              <View style={styles.stripeGreen} />
            </View>

            <View style={styles.badgeTopWrap}>
              <Text style={styles.badgeTopEmoji}>🇮🇳</Text>
              <Text style={styles.badgeTopText}>MADE FOR INDIA • HYDERABAD COMMUTE</Text>
            </View>

            <View style={styles.logoHeroContainer}>
              <View style={styles.mapEmblemCard}>
                <Text style={{ fontSize: 16 }}>📍</Text>
                <Text style={styles.mapLocationTag}>HYDERABAD • TELANGANA</Text>
              </View>

              <View style={styles.logoInnerPulse}>
                <Text style={{ fontSize: 28 }}>🚗</Text>
                <View style={styles.activePulseOrb} />
              </View>

              <Text style={styles.heroBrandTitle}>
                RIDER<Text style={styles.heroBrandAccent}>X</Text>
              </Text>

              <Text style={styles.teluguMotto}>Our Journey • Our Companion • Our Trust</Text>
              <Text style={styles.heroSubTagline}>
                Safe, Shared & Affordable Rides across Hyderabad
              </Text>
            </View>

            <View style={{ width: "100%", marginTop: 10 }}>
              <View style={styles.pillarsContainer}>
                <View style={styles.pillarItem}>
                  <View style={[styles.pillarIconWrap, { backgroundColor: "#E0F2FE" }]}>
                    <Text style={{ fontSize: 16 }}>🛡️</Text>
                  </View>
                  <Text style={styles.pillarMainText}>100% Verified</Text>
                  <Text style={styles.pillarSubText}>ID & DL Checked</Text>
                </View>

                <View style={styles.pillarItem}>
                  <View style={[styles.pillarIconWrap, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={{ fontSize: 16 }}>💸</Text>
                  </View>
                  <Text style={styles.pillarMainText}>Fair Savings</Text>
                  <Text style={styles.pillarSubText}>Split Fuel Easily</Text>
                </View>

                <View style={styles.pillarItem}>
                  <View style={[styles.pillarIconWrap, { backgroundColor: "#FDF2F8" }]}>
                    <Text style={{ fontSize: 16 }}>🚨</Text>
                  </View>
                  <Text style={styles.pillarMainText}>Safety First</Text>
                  <Text style={styles.pillarSubText}>24/7 SOS & OTP</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.getStartedBtn}
                onPress={() => setShowLogin(true)}
              >
                <Text style={styles.getStartedBtnText}>Start Your Journey ➔</Text>
                <Text style={styles.getStartedSubText}>Get Started with Mobile OTP</Text>
              </TouchableOpacity>

              <View style={styles.heroFooterLove}>
                <Text style={styles.heroFooterLoveText}>
                  Made with ❤️ in Bharat for Daily Commuters
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.authCard}>
            <TouchableOpacity
              onPress={() => {
                if (step === "otp") setStep("phone");
                else setShowLogin(false);
              }}
              style={styles.backButton}
            >
              <Text style={{ fontSize: 14 }}>←</Text>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>
                {step === "phone" ? "Passenger Sign In" : "Verify Your Mobile"}
              </Text>
              <Text style={styles.authSubtitle}>
                {step === "phone"
                  ? "Enter your mobile number to book shared rides instantly."
                  : `Enter the 4-digit code sent to +91 ${phone}`}
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {step === "phone" ? (
              <View style={styles.formWrap}>
                <Text style={styles.inputLabel}>Your Full Name (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Bhargav Vattala"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#94A3B8"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mobile Number</Text>
                <View style={styles.phoneInputWrap}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                    placeholder="10 digit number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Get OTP Code ➔</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formWrap}>
                <Text style={styles.inputLabel}>4-Digit Verification Code</Text>
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  placeholder="• • • •"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  placeholderTextColor="#94A3B8"
                />

                <View style={styles.mockOtpAlert}>
                  <Text style={styles.mockOtpAlertText}>Demo OTP: 1234 (Auto-accepted)</Text>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Verify & Proceed to Ride ➔</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <Text style={styles.resendBtnText}>Resend OTP Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  heroIntroWrap: {
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tricolorHeaderBar: {
    flexDirection: "row",
    width: 90,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  stripeSaffron: { flex: 1, backgroundColor: "#FF9933" },
  stripeWhite: { flex: 1, backgroundColor: "#FFFFFF" },
  stripeGreen: { flex: 1, backgroundColor: "#138808" },
  badgeTopWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeTopEmoji: {
    fontSize: 14,
  },
  badgeTopText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 0.5,
  },
  logoHeroContainer: {
    alignItems: "center",
    marginBottom: 6,
  },
  mapEmblemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 12,
  },
  mapLocationTag: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0369A1",
    letterSpacing: 0.8,
  },
  logoInnerPulse: {
    position: "relative",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E0F2FE",
    borderWidth: 2,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  activePulseOrb: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroBrandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
  },
  heroBrandAccent: {
    color: "#0284C7",
  },
  teluguMotto: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0369A1",
    marginTop: 4,
    textAlign: "center",
  },
  heroSubTagline: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 16,
  },
  pillarsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pillarItem: {
    flex: 1,
    alignItems: "center",
  },
  pillarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pillarMainText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
  },
  pillarSubText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 1,
  },
  getStartedBtn: {
    width: "100%",
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  getStartedBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  getStartedSubText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BAE6FD",
    marginTop: 2,
  },
  heroFooterLove: {
    marginTop: 14,
  },
  heroFooterLoveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
  },
  authCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  authHeader: {
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  authSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 3,
    lineHeight: 17,
  },
  formWrap: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  phoneInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    overflow: "hidden",
  },
  countryCode: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "900",
  },
  mockOtpAlert: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  mockOtpAlertText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400E",
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  resendBtn: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
});
