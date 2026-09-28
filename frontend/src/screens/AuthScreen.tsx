import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
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

import { api, errorMessage, User } from "@/src/api";
import { ErrorBanner, Icon } from "@/src/components/ui";

const REAL_VEHICLES = [
  {
    name: "Car Pool",
    sub: "Share Daily Fuel",
    color: "#0284C7",
    uri: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Bike Share",
    sub: "Beat City Traffic",
    color: "#059669",
    uri: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Smart Cab",
    sub: "Comfort & Fixed Fare",
    color: "#D97706",
    uri: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80",
  },
];

export function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (token: string, user: User) => void }) {
  const insets = useSafeAreaInsets();

  const [vehicleIdx, setVehicleIdx] = useState(0);
  const [animStage, setAnimStage] = useState<"vehicles" | "logo" | "ready">("vehicles");
  const [showLogin, setShowLogin] = useState(false);

  const vehicleOpacity = useRef(new Animated.Value(0)).current;
  const vehicleScale = useRef(new Animated.Value(0.75)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const playVehicle = (index: number) => {
      if (index >= REAL_VEHICLES.length) {
        setAnimStage("logo");
        Animated.parallel([
          Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
          Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          setAnimStage("ready");
          Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
        return;
      }

      setVehicleIdx(index);
      vehicleOpacity.setValue(0);
      vehicleScale.setValue(0.75);

      Animated.parallel([
        Animated.timing(vehicleOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(vehicleScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(vehicleOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            playVehicle(index + 1);
          });
        }, 350);
      });
    };

    playVehicle(0);
  }, []);

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) {
      setError("Dayachesi valid 10-digit mobile number enter cheyandi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api<{ message: string; otp?: string }>("/auth/otp", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (res?.otp) {
        setMockOtp(res.otp);
      }
      setStep("otp");
    } catch (err) {
      setError(errorMessage(err, "OTP pampadam lo samasya vachindi."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 4) {
      setError("Please 4-digit OTP enter cheyandi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api<{ token: string; user: User }>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
          full_name: fullName.trim() || undefined,
          role,
        }),
      });

      if (res?.token && res?.user) {
        onAuthSuccess(res.token, res.user);
      } else {
        throw new Error("Invalid login response.");
      }
    } catch (err) {
      setError(errorMessage(err, "OTP verification fail ayindi."));
    } finally {
      setLoading(false);
    }
  };

  const currentVehicle = REAL_VEHICLES[vehicleIdx] || REAL_VEHICLES[0];

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
            <View style={styles.badgeTopWrap}>
              <Text style={styles.badgeTopEmoji}>🇮🇳</Text>
              <Text style={styles.badgeTopText}>BHARAT'S TRUSTED COMMUTE COMMUNITY</Text>
            </View>

            {animStage === "vehicles" ? (
              <View style={styles.vehicleAnimBox}>
                <Animated.View
                  style={[
                    styles.imageCardWrapper,
                    {
                      borderColor: currentVehicle.color,
                      opacity: vehicleOpacity,
                      transform: [{ scale: vehicleScale }],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: currentVehicle.uri }}
                    style={styles.vehicleRealImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.imageOverlayBadge, { backgroundColor: currentVehicle.color }]}>
                    <Text style={styles.imageBadgeText}>{currentVehicle.name}</Text>
                  </View>
                </Animated.View>
                <Animated.Text style={[styles.vehicleSubText, { opacity: vehicleOpacity }]}>
                  {currentVehicle.sub}...
                </Animated.Text>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.logoHeroContainer,
                  {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                  },
                ]}
              >
                <View style={styles.logoInnerPulse}>
                  <Icon name="steering" size={44} color="#0284C7" />
                  <View style={styles.activePulseOrb} />
                </View>

                <Text style={styles.heroBrandTitle}>
                  RIDER<Text style={styles.heroBrandAccent}>X</Text>
                </Text>

                <Text style={styles.teluguMotto}>మన ప్రయాణం • మన తోడు • మన భరోసా</Text>
                <Text style={styles.heroSubTagline}>
                  "Together on Every Road • Car, Bike & Cab Sharing for Daily Commuters"
                </Text>
              </Animated.View>
            )}

            {animStage !== "vehicles" && (
              <Animated.View style={{ width: "100%", opacity: buttonFade }}>
                <View style={styles.pillarsContainer}>
                  <View style={styles.pillarItem}>
                    <View style={[styles.pillarIconWrap, { backgroundColor: "#E0F2FE" }]}>
                      <Icon name="shield-check" size={18} color="#0284C7" />
                    </View>
                    <Text style={styles.pillarMainText}>100% Verified</Text>
                    <Text style={styles.pillarSubText}>ID & DL Checked</Text>
                  </View>

                  <View style={styles.pillarItem}>
                    <View style={[styles.pillarIconWrap, { backgroundColor: "#DCFCE7" }]}>
                      <Icon name="cash-multiple" size={18} color="#059669" />
                    </View>
                    <Text style={styles.pillarMainText}>Fair Savings</Text>
                    <Text style={styles.pillarSubText}>Split Fuel Easily</Text>
                  </View>

                  <View style={styles.pillarItem}>
                    <View style={[styles.pillarIconWrap, { backgroundColor: "#FDF2F8" }]}>
                      <Icon name="shield-alert" size={18} color="#DB2777" />
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
                  <Text style={styles.getStartedBtnText}>ప్రయాణం మొదలుపెట్టండి ➔</Text>
                  <Text style={styles.getStartedSubText}>Get Started with Mobile OTP</Text>
                </TouchableOpacity>

                <View style={styles.heroFooterLove}>
                  <Text style={styles.heroFooterLoveText}>
                    Made with ❤️ for Indian Commuters & Daily Travelers
                  </Text>
                </View>
              </Animated.View>
            )}
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
              <Icon name="arrow-left" size={18} color="#475569" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>
                {step === "phone" ? "Welcome to RiderX" : "Verify Your Mobile"}
              </Text>
              <Text style={styles.authSubtitle}>
                {step === "phone"
                  ? "Enter your mobile number to sign in or create an account."
                  : `Enter the 4-digit code sent to +91 ${phone}`}
              </Text>
            </View>

            {step === "phone" ? (
              <View style={styles.formWrap}>
                <Text style={styles.inputLabel}>Select Your Role</Text>
                <View style={styles.roleToggleRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, role === "passenger" && styles.roleBtnActive]}
                    onPress={() => setRole("passenger")}
                  >
                    <Icon name="car" size={16} color={role === "passenger" ? "#0284C7" : "#64748B"} />
                    <Text style={[styles.roleBtnText, role === "passenger" && styles.roleBtnTextActive]}>
                      Passenger (రైడర్)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, role === "driver" && styles.roleBtnActive]}
                    onPress={() => setRole("driver")}
                  >
                    <Icon name="steering" size={16} color={role === "driver" ? "#0284C7" : "#64748B"} />
                    <Text style={[styles.roleBtnText, role === "driver" && styles.roleBtnTextActive]}>
                      Captain (రైడ్ హోస్ట్)
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Your Full Name (optional)</Text>
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

                <ErrorBanner message={error} />

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

                {mockOtp ? (
                  <View style={styles.mockOtpAlert}>
                    <Text style={styles.mockOtpAlertText}>Demo Auto OTP: {mockOtp}</Text>
                  </View>
                ) : null}

                <ErrorBanner message={error} />

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
  badgeTopWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeTopEmoji: {
    fontSize: 14,
  },
  badgeTopText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 0.5,
  },
  vehicleAnimBox: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  imageCardWrapper: {
    width: 140,
    height: 110,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    position: "relative",
  },
  vehicleRealImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlayBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: "center",
  },
  imageBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  vehicleSubText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },
  logoHeroContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoInnerPulse: {
    position: "relative",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#E0F2FE",
    borderWidth: 2,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  activePulseOrb: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroBrandTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
  },
  heroBrandAccent: {
    color: "#0284C7",
  },
  teluguMotto: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0369A1",
    marginTop: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  heroSubTagline: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  pillarsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 18,
    marginBottom: 20,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  pillarMainText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  pillarSubText: {
    fontSize: 9,
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
    color: "#BAE6FD",
    marginTop: 3,
    fontWeight: "600",
  },
  heroFooterLove: {
    marginTop: 18,
  },
  heroFooterLoveText: {
    fontSize: 11,
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
    color: "#64748B",
    marginTop: 3,
    lineHeight: 17,
  },
  formWrap: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  roleToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 12,
  },
  roleBtnActive: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0284C7",
    borderWidth: 1.5,
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  roleBtnTextActive: {
    color: "#0284C7",
    fontWeight: "900",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
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
    fontWeight: "800",
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
    fontWeight: "700",
    color: "#0284C7",
  },
});
