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
        { text: "📞 Customer Support", onPress: () => Linking.openURL("tel:8919326622") },
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
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. TOP STATUS & BRAND HEADER */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.brandTitle}>RIDER<Text style={styles.brandAccent}>X</Text></Text>
            <Text style={styles.brandTagline}>Smart Shared Commute</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={triggerDirectSos} style={styles.sosButton}>
              <Icon name="shield-alert" size={13} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>

            <View style={styles.safePill}>
              <Icon name="shield-check" size={14} color="#059669" />
              <Text style={styles.safePillText}>Safe</Text>
            </View>

            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuCircleBtn}>
              <Icon name="menu" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. FLOATING SEARCH PILL BAR (Ola / Rapido Style) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setPickerTarget("to")}
          style={styles.floatingSearchPill}
        >
          <View style={styles.searchPillIconWrap}>
            <Icon name="magnify" size={22} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.searchPillPlaceholder}>
              {search.toLocation ? search.toLocation : "Where are you going?"}
            </Text>
            <Text style={styles.searchPillSubtext}>Search destination or tap to pick on map</Text>
          </View>
          <View style={styles.searchPillArrow}>
            <Icon name="arrow-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* 3. PROMO OFFER CARD (Rapido Yellow-Blue Style on White) */}
        <View style={styles.offerCard}>
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
          </View>
          <View style={styles.offerContentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.offerMainTitle}>FLAT ₹50 OFF</Text>
              <Text style={styles.offerSubTitle}>
                On your upcoming shared ride! Use code: <Text style={styles.offerCode}>SAFAR50</Text>
              </Text>
            </View>
            <View style={styles.offerDiscountCircle}>
              <Text style={styles.offerDiscountText}>₹50</Text>
              <Text style={styles.offerDiscountSub}>SAVE</Text>
            </View>
          </View>
        </View>

        {/* 4. QUICK CATEGORY SELECTOR CARDS */}
        <Text style={styles.sectionHeaderTitle}>Choose Your Ride Category</Text>
        <View style={styles.categoryGrid}>
          <TouchableOpacity
            style={[styles.categoryCard, search.vehicleType === "car" && styles.categoryCardActive]}
            onPress={() => setSearch((s) => ({ ...s, vehicleType: "car" }))}
          >
            <View style={styles.catIconWrap}>
              <Icon name="car" size={26} color="#0284C7" />
            </View>
            <Text style={styles.categoryLabel}>Car Pool</Text>
            <Text style={styles.categorySub}>Petrol Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, search.vehicleType === "bike" && styles.categoryCardActive]}
            onPress={() => setSearch((s) => ({ ...s, vehicleType: "bike" }))}
          >
            <View style={styles.catIconWrap}>
              <Icon name="motorbike" size={26} color="#059669" />
            </View>
            <Text style={styles.categoryLabel}>Bike Share</Text>
            <Text style={styles.categorySub}>Fast & Cheap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, womenOnlyFilter && styles.categoryCardWomenActive]}
            onPress={() => setWomenOnlyFilter((prev) => !prev)}
          >
            <View style={[styles.catIconWrap, { backgroundColor: "#FCE7F3" }]}>
              <Icon name="face-woman" size={26} color="#DB2777" />
            </View>
            <Text style={[styles.categoryLabel, { color: "#DB2777" }]}>Women Only</Text>
            <Text style={styles.categorySub}>{womenOnlyFilter ? "Filtered ✓" : "Verified Safe"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, search.vehicleType === "all" && styles.categoryCardActive]}
            onPress={() => setSearch((s) => ({ ...s, vehicleType: "all" }))}
          >
            <View style={styles.catIconWrap}>
              <Icon name="apps" size={26} color="#6366F1" />
            </View>
            <Text style={styles.categoryLabel}>All Rides</Text>
            <Text style={styles.categorySub}>Any Vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* 5. LOCATION SHORTCUT HELPERS */}
        <View style={styles.locationPillsRow}>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={detectingLocation}
            style={styles.locationPillBtn}
          >
            <Icon name="crosshairs-gps" size={14} color="#0284C7" />
            <Text style={styles.locationPillText}>
              {detectingLocation ? "Detecting GPS..." : "Current Location"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPickerTarget("from")}
            style={styles.locationPillBtn}
          >
            <Icon name="map-marker" size={14} color="#10B981" />
            <Text style={styles.locationPillText}>Set Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPickerTarget("to")}
            style={styles.locationPillBtn}
          >
            <Icon name="map-marker-check" size={14} color="#F59E0B" />
            <Text style={styles.locationPillText}>Set Drop</Text>
          </TouchableOpacity>
        </View>

        {/* Full Ride Search Panel Container (Clean White Card) */}
        <View style={styles.searchPanelWhiteCard}>
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
          <ActivityIndicator color="#0284C7" size="large" style={{ marginVertical: 32 }} />
        ) : displayedRides.length ? (
          displayedRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} onPress={() => setSelectedRide(ride)} />
          ))
        ) : (
          <View style={styles.emptyWhiteCard}>
            <Icon name="map-search-outline" color="#94A3B8" size={38} />
            <Text style={styles.emptyTitle}>No scheduled rides right now</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your route, vehicle type, or clear filters.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 6. BOTTOM NAVIGATION BAR (Ola/Rapido Style) */}
      <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("home")}
          style={styles.navTabItem}
        >
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
            Alert.alert("Coupon Code", "Use coupon 'SAFAR50' during checkout for ₹50 discount!");
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

      <Modal visible={Boolean(selectedRide)} animationType="slide" transparent onRequestClose={() => setSelectedRide(null)}>
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
  brandTagline: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginTop: -2,
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
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  safePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  safePillText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "800",
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
  floatingSearchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  searchPillIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPillPlaceholder: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  searchPillSubtext: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  searchPillArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  offerCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 14,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  offerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.5,
  },
  offerContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offerMainTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  offerSubTitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  offerCode: {
    color: "#38BDF8",
    fontWeight: "800",
  },
  offerDiscountCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  offerDiscountText: {
    color: "#F59E0B",
    fontWeight: "900",
    fontSize: 14,
  },
  offerDiscountSub: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    marginHorizontal: 18,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 18,
    marginBottom: 14,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
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
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },
  categorySub: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  locationPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 14,
  },
  locationPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  searchPanelWhiteCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 16,
  },
  resultsHeadingWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 18,
    marginTop: 10,
    marginBottom: 6,
  },
  ridesFoundBadge: {
    backgroundColor: "#E0F2FE",
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyWhiteCard: {
    marginHorizontal: 18,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
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
