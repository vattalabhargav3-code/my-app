import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { User } from "@/src/api";

export function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (token: string, user: User) => void }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleDirectLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess("mock_token_riderx_" + Date.now(), {
        id: "usr_passenger_1",
        phone: "9876543210",
        full_name: "Bhargav Vattala",
        role: "passenger",
        id_verified: true,
      });
    }, 200);
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
        showsVerticalScrollIndicator={false}
      >
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
            {/* Real Original Google Map Style Box */}
            <View style={styles.originalMapBox}>
              <View style={styles.mapGridLineHorizontal} />
              <View style={styles.mapGridLineVertical} />
              <View style={styles.mapRouteCurve} />
              <View style={styles.mapPinContainer}>
                <View style={styles.mapPinHead} />
                <View style={styles.mapPinDot} />
              </View>
              <View style={styles.mapLabelBadge}>
                <Text style={styles.mapLocationTag}>📍 HYDERABAD • TELANGANA</Text>
              </View>
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

          <View style={{ width: "100%", marginTop: 20 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.getStartedBtn}
              onPress={handleDirectLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.getStartedBtnText}>Start Your Journey ➔</Text>
                  <Text style={styles.getStartedSubText}>Enter App Directly</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.heroFooterLove}>
              <Text style={styles.heroFooterLoveText}>
                Made with ❤️ in Bharat for Daily Commuters
              </Text>
            </View>
          </View>
        </View>
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
    width: "100%",
  },
  originalMapBox: {
    width: "100%",
    height: 110,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  mapGridLineHorizontal: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#CBD5E1",
  },
  mapGridLineVertical: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#CBD5E1",
  },
  mapRouteCurve: {
    position: "absolute",
    width: 140,
    height: 50,
    borderTopWidth: 4,
    borderColor: "#3B82F6",
    borderRadius: 50,
    top: 25,
  },
  mapPinContainer: {
    position: "absolute",
    top: 22,
    alignItems: "center",
  },
  mapPinHead: {
    width: 16,
    height: 16,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  mapPinDot: {
    width: 4,
    height: 6,
    backgroundColor: "#991B1B",
  },
  mapLabelBadge: {
    position: "absolute",
    bottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
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
  getStartedBtn: {
    width: "100%",
    backgroundColor: "#0284C7",
    paddingVertical: 16,
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
    marginTop: 18,
  },
  heroFooterLoveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
  },
});
