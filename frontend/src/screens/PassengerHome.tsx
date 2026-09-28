import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Booking, errorMessage, Ride, User } from "@/src/api";
import { ActiveBookingCard } from "@/src/components/ActiveBookingCard";
import { CheckoutSheet } from "@/src/components/CheckoutSheet";
import { IdVerifyCard } from "@/src/components/IdVerifyCard";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { RideCard } from "@/src/components/RideCard";
import { RideSearchPanel, SearchState } from "@/src/components/RideSearchPanel";
import { ErrorBanner, Icon } from "@/src/components/ui";
import { UserMenuModal } from "@/src/components/UserMenuModal";

const fetchCurrentGPS = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", sub: "Ready for your daily commute?" };
  if (hour < 17) return { text: "Good Afternoon", sub: "Beat the traffic rush together" };
  return { text: "Good Evening", sub: "Heading back home safely?" };
};

export function PassengerHome({
  token,
  user,
  onUserUpdate,
  onLogout,
}: {
  token: string;
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();

  const [search, setSearch] = useState<SearchState>({
    mode: "commercial",
    vehicleType: "all",
    fromLocation: "",
    toLocation: "",
  });
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "rides" | "offers" | "profile">("home");

  const triggerDirectSos = () => {
    Alert.alert(
      "EMERGENCY & SAFETY SOS",
      "Emergency help kosam kindha unna number select cheyandi:",
      [
        { text: "🚓 Police (100)", onPress: () => Linking.openURL("tel:100") },
        { text: "🚑 Ambulance (108)", onPress: () => Linking.openURL("tel:108") },
        { text: "🚨 National Emergency (112)", onPress: () => Linking.openURL("tel:112") },
        { text: "📞 Support Helpline", onPress: () => Linking.openURL("tel:8919326622") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const isAlreadyVerified =
    user.id_verified ||
    (typeof window !== "undefined" && localStorage.getItem("safarway_passenger_verified") === "true");

  useEffect(() => {
    if (!user.id_verified && typeof window !== "undefined") {
      const savedVerification = localStorage.getItem("safarway_passenger_verified");
      if (savedVerification === "true") {
        onUserUpdate({ ...user, id_verified: true });
      }
    }
  }, [user, onUserUpdate]);

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      const coords = await fetchCurrentGPS();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
      );
      const data = await res.json();
      const placeName =
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.display_name;

      if (placeName) {
        setSearch((prev) => ({ ...prev, fromLocation: placeName }));
      }
    } catch {
      alert("Location permission allow cheyandi leda GPS on cheyandi.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLocationPicked = (placeName: string) => {
    if (pickerTarget === "from") {
      setSearch((prev) => ({ ...prev, fromLocation: placeName }));
    } else if (pickerTarget === "to") {
      setSearch((prev) => ({ ...prev, toLocation: placeName }));
    }
    setPickerTarget(null);
  };

  const loadRides = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        from_location: search.fromLocation,
        to_location: search.toLocation,
        mode: search.mode,
        vehicle_type: search.vehicleType,
      });
      setRides(await api<Ride[]>(`/rides?${params.toString()}`, {}, token));
    } catch (loadError) {
      setError(errorMessage(loadError, "Could not load rides"));
    } finally {
      setLoading(false);
    }
  }, [search.fromLocation, search.toLocation, search.mode, search.vehicleType, token]);

  useEffect(() => {
    loadRides();
  }, [search.mode, search.vehicleType, loadRides]);

  useEffect(() => {
    api<Booking | null>("/bookings/active", {}, token)
      .then((active) => active && setBooking(active))
      .catch(() => undefined);
  }, [token]);

  const displayedRides = womenOnlyFilter
    ? rides.filter((r) => (r as any).women_only === true)
    : rides;

  return (
    <View style={styles.whiteScreen}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* TOP BRAND & SOS */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.brandTitle}>
              RIDER<Text style={styles.brandAccent}>X</Text>
            </Text>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveIndicatorText}>Live Commute Network</Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={triggerDirectSos} style={styles.sosButton}>
              <Icon name="shield-alert" size={13} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuCircleBtn}>
              <Icon name="menu" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TIME GREETING */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>
            {greeting.text}, {user?.full_name ? user.full_name.split(" ")[0] : "Friend"}!
          </Text>
          <Text style={styles.greetingSub}>{greeting.sub}</Text>
        </View>

        {/* QUICK SEARCH PILL */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPickerTarget("to")}
          style={styles.floatingSearchPill}
        >
          <View style={styles.searchPillIconWrap}>
            <Icon name="magnify" size={20} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.searchPillPlaceholder}>
              {search.toLocation ? search.toLocation : "Where are you going today?"}
            </Text>
            <Text style={styles.searchPillSubtext}>Tap to pick destination or transit hubs</Text>
          </View>
          <View style={styles.searchPillArrow}>
            <Icon name="arrow-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* RIDE TYPE SELECTOR TILES */}
        <View style={styles.categoryGrid}>
          <TouchableOpacity
            style={[styles.categoryCard, search.vehicleType === "car" && styles.categoryCardActive]}
            onPress={() => setSearch((s) => ({ ...s, vehicleType: "car" }))}
          >
            <Icon name="car" size={20} color="#0284C7" />
            <Text style={styles.categoryLabel}>Car Pool</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, search.vehicleType === "bike" && styles.categoryCardActive]}
            onPress={() => setSearch((s) => ({ ...s, vehicleType: "bike" }))}
          >
            <Icon name="motorbike" size={20} color="#059669" />
            <Text style={styles.categoryLabel}>Bike Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, womenOnlyFilter && styles.categoryCardWomenActive]}
            onPress={() => setWomenOnlyFilter((prev) => !prev)}
          >
            <Icon name="face-woman" size={20} color="#DB2777" />
            <Text style={[styles.categoryLabel, { color: "#DB2777" }]}>
              {womenOnlyFilter ? "Women ✓" : "Women Only"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, search.vehicleType === "all" && styles.categoryCardActive]}
            onPress={() => setSearch((s) => ({ ...s, vehicleType: "all" }))}
          >
            <Icon name="apps" size={20} color="#6366F1" />
            <Text style={styles.categoryLabel}>All Rides</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH DETAILS EXPANDED PANEL */}
        <View style={styles.searchPanelWhiteCard}>
          <View style={styles.searchHelpersRow}>
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              disabled={detectingLocation}
              style={styles.locationPillBtn}
            >
              <Icon name="crosshairs-gps" size={13} color="#0284C7" />
              <Text style={styles.locationPillText}>
                {detectingLocation ? "Detecting GPS..." : "Current Location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPickerTarget("from")} style={styles.locationPillBtn}>
              <Icon name="map-marker" size={13} color="#10B981" />
              <Text style={styles.locationPillText}>Set Pickup</Text>
            </TouchableOpacity>
          </View>

          <RideSearchPanel
            search={search}
            onChange={(patch) => setSearch((current) => ({ ...current, ...patch }))}
            onSearch={loadRides}
            loading={loading}
          />
        </View>

        {!isAlreadyVerified ? (
          <IdVerifyCard
            token={token}
            user={user}
            onVerified={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("safarway_passenger_verified", "true");
              }
              onUserUpdate({ ...user, id_verified: true });
            }}
          />
        ) : null}

        {booking ? <ActiveBookingCard booking={booking} token={token} /> : null}

        {/* AVAILABLE RIDES SECTION */}
        <View style={styles.resultsHeadingWrap}>
          <Text style={styles.sectionHeaderTitle}>Available Shared Rides</Text>
          <Text style={styles.ridesFoundBadge}>{displayedRides.length} available</Text>
        </View>

        <ErrorBanner message={error} />

        {loading ? (
          <ActivityIndicator color="#0284C7" size="large" style={{ marginVertical: 24 }} />
        ) : displayedRides.length ? (
          displayedRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} onPress={() => setSelectedRide(ride)} />
          ))
        ) : (
          <View style={styles.emptyWhiteCard}>
            <Icon name="map-search-outline" color="#94A3B8" size={34} />
            <Text style={styles.emptyTitle}>No scheduled rides right now</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your route, vehicle type, or clear filters.
            </Text>
          </View>
        )}

        {/* 🇮🇳 PROUD FEEL-GOOD & CONNECTING "MADE IN INDIA" FOOTER 🇮🇳 */}
        <View style={styles.indiaCardWrapper}>
          <View style={styles.indiaFlagRow}>
            <Text style={styles.flagEmoji}>🇮🇳</Text>
            <Text style={styles.indiaHeaderTitle}>PROUDLY CRAFTED IN BHARAT</Text>
          </View>

          <Text style={styles.teluguQuote}>
            "ఒకరికొకరు తోడుగా... ఖర్చులను పంచుకుంటూ, కొత్త స్నేహాలను కలుపుకుంటూ సాగే మన ఊరి ప్రయాణం!"
          </Text>

          <Text style={styles.indiaSubQuote}>
            Every shared seat cuts traffic, saves our hard-earned money, and helps our environment breathe easier.
          </Text>

          <View style={styles.indiaPillarsRow}>
            <View style={styles.indiaPillarItem}>
              <Text style={styles.pillarIcon}>🌱</Text>
              <Text style={styles.pillarText}>Cleaner Air</Text>
            </View>
            <View style={styles.indiaPillarDivider} />
            <View style={styles.indiaPillarItem}>
              <Text style={styles.pillarIcon}>🤝</Text>
              <Text style={styles.pillarText}>Real Commuters</Text>
            </View>
            <View style={styles.indiaPillarDivider} />
            <View style={styles.indiaPillarItem}>
              <Text style={styles.pillarIcon}>🛡️</Text>
              <Text style={styles.pillarText}>100% Verified</Text>
            </View>
          </View>

          <View style={styles.heartFooterNote}>
            <Text style={styles.heartNoteText}>
              Made with ❤️ for Indian Commuters & Daily Travelers
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        <TouchableOpacity onPress={() => setActiveTab("home")} style={styles.navTabItem}>
          <Icon name="home" size={22} color={activeTab === "home" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "home" && styles.navTabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab("rides");
            if (!booking) {
              Alert.alert("My Bookings", "Active and completed trips will appear here.");
            }
          }}
          style={styles.navTabItem}
        >
          <Icon name="car-multiple" size={22} color={activeTab === "rides" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "rides" && styles.navTabLabelActive]}>
            My Rides
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab("offers");
            Alert.alert("Active Offers", "Use coupon 'SAFAR50' during checkout for FLAT ₹50 discount!");
          }}
          style={styles.navTabItem}
        >
          <Icon name="ticket-percent-outline" size={22} color={activeTab === "offers" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "offers" && styles.navTabLabelActive]}>
            Offers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab("profile");
            setMenuVisible(true);
          }}
          style={styles.navTabItem}
        >
          <Icon name="account-circle-outline" size={22} color={activeTab === "profile" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "profile" && styles.navTabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <LocationPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleLocationPicked}
        title={pickerTarget === "from" ? "Select Pickup Location" : "Select Drop Location"}
      />

      <Modal
        visible={Boolean(selectedRide)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRide(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedRide ? (
            <CheckoutSheet
              ride={selectedRide}
              token={token}
              onClose={() => setSelectedRide(null)}
              onBooked={(created) => {
                setBooking(created);
                setSelectedRide(null);
                loadRides();
              }}
            />
          ) : null}
        </View>
      </Modal>

      <UserMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        token={token}
        onLogout={onLogout}
        initialPhone={user?.phone || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  whiteScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: "#0284C7",
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#DC2626",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  menuCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 2,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  greetingSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  floatingSearchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  searchPillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPillPlaceholder: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  searchPillSubtext: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  searchPillArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
 categoryGrid: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  categoryCardActive: {
    borderColor: "#0284C7",
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
  },
  categoryCardWomenActive: {
    borderColor: "#DB2777",
    backgroundColor: "#FDF2F8",
    borderWidth: 1.5,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E293B",
  },
  searchPanelWhiteCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 14,
  },
  searchHelpersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  locationPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  resultsHeadingWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 18,
    marginTop: 6,
    marginBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  ridesFoundBadge: {
    backgroundColor: "#E0F2FE",
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptyWhiteCard: {
    marginHorizontal: 18,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  indiaCardWrapper: {
    marginHorizontal: 18,
    marginTop: 26,
    marginBottom: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  indiaFlagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  indiaHeaderTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 1,
  },
  teluguQuote: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
    paddingHorizontal: 8,
  },
  indiaSubQuote: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  indiaPillarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    width: "100%",
    marginTop: 4,
  },
  indiaPillarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillarIcon: {
    fontSize: 13,
  },
  pillarText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
  },
  indiaPillarDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#CBD5E1",
  },
  heartFooterNote: {
    marginTop: 4,
  },
  heartNoteText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navTabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 2,
  },
  navTabLabelActive: {
    color: "#0284C7",
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
});
