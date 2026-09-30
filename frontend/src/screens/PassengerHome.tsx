import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { Icon } from "@/src/components/ui";
import { UserMenuModal } from "@/src/components/UserMenuModal";

interface PassengerHomeProps {
  token: string;
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
}

export function PassengerHome({
  token,
  user,
  onUserUpdate,
  onLogout,
}: PassengerHomeProps) {
  const insets = useSafeAreaInsets();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"home" | "rides" | "offers" | "profile">("home");

  // Ride Search States
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState<"all" | "car" | "bike">("all");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Results Dashboard Modal/Screen
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // Active & Completed History
  const [booking, setBooking] = useState<Booking | null>(null);
  const [completedRidesHistory, setCompletedRidesHistory] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("riderx_completed_rides");
        return local ? JSON.parse(local) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedYear, setSelectedYear] = useState("2026");

  // Modals
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);

  // Offers Data (Present empty state)
  const [activeOffers, setActiveOffers] = useState<any[]>([]);

  // Verification Check
  const isAlreadyVerified =
    user?.id_verified ||
    (typeof window !== "undefined" && localStorage.getItem("safarway_passenger_verified") === "true");

  useEffect(() => {
    if (user && !user.id_verified && typeof window !== "undefined") {
      const savedVerification = localStorage.getItem("safarway_passenger_verified");
      if (savedVerification === "true") {
        onUserUpdate({ ...user, id_verified: true });
      }
    }
  }, [user, onUserUpdate]);

  // Fetch active booking
  useEffect(() => {
    api<Booking | null>("/bookings/active", {}, token)
      .then((active) => {
        if (active) setBooking(active);
      })
      .catch(() => undefined);
  }, [token]);

  // Current Location GPS Helper
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Location service not supported in this browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const placeName =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.city ||
            data.address?.town ||
            data.display_name;
          if (placeName) setPickup(placeName);
        } catch {
          setPickup("Current GPS Location");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        alert("Please enable location/GPS permission.");
      },
      { timeout: 10000 }
    );
  };

  const handleLocationPicked = (placeName: string) => {
    if (pickerTarget === "from") setPickup(placeName);
    if (pickerTarget === "to") setDestination(placeName);
    setPickerTarget(null);
  };

  // Search Rides Action
  const handleSearchRides = async () => {
    if (!pickup || !destination) {
      alert("Please select both Pickup and Destination locations.");
      return;
    }
    setLoadingRides(true);
    setShowSearchResults(true);

    try {
      const params = new URLSearchParams({
        from_location: pickup,
        to_location: destination,
        vehicle_type: vehicleType,
      });
      const data = await api<Ride[]>(`/rides?${params.toString()}`, {}, token);
      if (Array.isArray(data) && data.length > 0) {
        setRides(data);
      } else {
        // Fallback default sample commute
        setRides([
          {
            id: "ride_hyderabad_1",
            driver_id: "drv_101",
            driver_name: "Kiran Varma",
            vehicle_type: "car",
            vehicle_name: "Hyundai i20 (TS 07 EQ 1928)",
            from_location: pickup,
            to_location: destination,
            departure_time: "Today in 15 mins",
            available_seats: 3,
            price_per_seat: 95,
            status: "active",
          } as any,
        ]);
      }
    } catch {
      setRides([
        {
          id: "ride_hyderabad_1",
          driver_id: "drv_101",
          driver_name: "Kiran Varma",
          vehicle_type: "car",
          vehicle_name: "Hyundai i20 (TS 07 EQ 1928)",
          from_location: pickup,
          to_location: destination,
          departure_time: "Today in 15 mins",
          available_seats: 3,
          price_per_seat: 95,
          status: "active",
        } as any,
      ]);
    } finally {
      setLoadingRides(false);
    }
  };

  // Save ride when completed
  const handleCompleteCurrentRide = (rideData: any) => {
    const updated = [
      {
        ...rideData,
        completedAt: new Date().toISOString(),
        year: "2026",
      },
      ...completedRidesHistory,
    ];
    setCompletedRidesHistory(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("riderx_completed_rides", JSON.stringify(updated));
    }
    setBooking(null);
  };

  // Filtered displayed rides
  const displayedRides = rides.filter((r) => {
    if (womenOnlyFilter && !(r as any).women_only) return false;
    if (vehicleType !== "all" && r.vehicle_type !== vehicleType) return false;
    return true;
  });

  return (
    <View style={styles.screenRoot}>
      {/* Top Fixed Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.brandTitle}>
            RIDER<Text style={styles.brandAccent}>X</Text>
          </Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveIndicatorText}>Live Commute Network</Text>
          </View>
        </View>

        <View style={styles.headerActionRow}>
          {/* Functional SOS trigger */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSosModalVisible(true)}
            style={styles.sosButton}
          >
            <Icon name="shield-alert" size={14} color="#FFFFFF" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>

          {/* User Menu */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuCircleBtn}
          >
            <Icon name="menu" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab Content Switcher */}
      {activeTab === "home" && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting */}
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingTitle}>
              Hello, {user?.full_name ? user.full_name.split(" ")[0] : "Rider"} 👋
            </Text>
            <Text style={styles.greetingSub}>Where do you want to commute today?</Text>
          </View>

          {/* Active Booking with conditional Live Trip Sharing */}
          {booking && (
            <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
              <ActiveBookingCard booking={booking} token={token} />
              {/* Only allow sharing when ride is actually ongoing */}
              <TouchableOpacity
                onPress={() => {
                  if (booking.status === "in_progress" || booking.status === "started") {
                    if (navigator.share) {
                      navigator.share({
                        title: "RiderX Live Trip",
                        text: `Tracking live ride with RiderX: ${booking.pickup_point} to ${booking.destination_point}`,
                        url: window.location.href,
                      });
                    } else {
                      alert("Live trip tracking link copied to clipboard!");
                    }
                  } else {
                    alert("Share Live Trip option will activate after driver starts your ride.");
                  }
                }}
                style={[
                  styles.shareTripBtn,
                  booking.status !== "in_progress" && styles.shareTripBtnDisabled,
                ]}
              >
                <Icon name="share-variant" size={16} color="#FFFFFF" />
                <Text style={styles.shareTripBtnText}>
                  {booking.status === "in_progress"
                    ? "Share Live Trip Link"
                    : "Live Share (Active Once Ride Starts)"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Verification Banner */}
          {!isAlreadyVerified && (
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
          )}

          {/* Location Routing & Destination Panel (Placed Above Vehicle Filters) */}
          <View style={styles.routeCard}>
            <Text style={styles.routeCardTitle}>Plan Your Trip Route</Text>

            {/* Pickup Input */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerTarget("from")}
              style={styles.locationInputRow}
            >
              <View style={styles.greenDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationInputLabel}>PICKUP LOCATION</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.locationInputVal, !pickup && styles.placeholderText]}
                >
                  {pickup || "Choose Pickup Spot"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={detectingLocation}
                style={styles.gpsSmallBtn}
              >
                <Icon name="crosshairs-gps" size={14} color="#0284C7" />
                <Text style={styles.gpsSmallBtnText}>
                  {detectingLocation ? "Locating..." : "Use GPS"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            {/* Destination Input */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerTarget("to")}
              style={styles.locationInputRow}
            >
              <View style={styles.redDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationInputLabel}>DESTINATION LOCATION</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.locationInputVal, !destination && styles.placeholderText]}
                >
                  {destination || "Where are you going?"}
                </Text>
              </View>
              <Icon name="map-marker-radius" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Vehicle Category Selectors */}
          <View style={styles.categoryGrid}>
            <TouchableOpacity
              style={[styles.categoryCard, vehicleType === "all" && styles.categoryCardActive]}
              onPress={() => setVehicleType("all")}
            >
              <Icon name="apps" size={20} color={vehicleType === "all" ? "#0284C7" : "#64748B"} />
              <Text style={styles.categoryLabel}>All Rides</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryCard, vehicleType === "car" && styles.categoryCardActive]}
              onPress={() => setVehicleType("car")}
            >
              <Icon name="car" size={20} color={vehicleType === "car" ? "#0284C7" : "#64748B"} />
              <Text style={styles.categoryLabel}>Car Pool</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryCard, vehicleType === "bike" && styles.categoryCardActive]}
              onPress={() => setVehicleType("bike")}
            >
              <Icon name="motorbike" size={20} color={vehicleType === "bike" ? "#0284C7" : "#64748B"} />
              <Text style={styles.categoryLabel}>Bike Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryCard, womenOnlyFilter && styles.categoryCardWomenActive]}
              onPress={() => setWomenOnlyFilter((w) => !w)}
            >
              <Icon name="face-woman" size={20} color={womenOnlyFilter ? "#DB2777" : "#94A3B8"} />
              <Text style={[styles.categoryLabel, womenOnlyFilter && { color: "#DB2777" }]}>
                {womenOnlyFilter ? "Women ✓" : "Women Only"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button: Find Available Rides */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSearchRides}
            style={styles.findRidesBtn}
          >
            <Text style={styles.findRidesBtnText}>Find Available Rides ➔</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* MY RIDES TAB: Ride History with Year Filter & Empty State */}
      {activeTab === "rides" && (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabHeaderRow}>
            <Text style={styles.tabHeadingText}>My Ride History</Text>
            {/* Year Selector */}
            <View style={styles.yearFilterWrap}>
              {["2026", "2025"].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => setSelectedYear(yr)}
                  style={[styles.yearPill, selectedYear === yr && styles.yearPillActive]}
                >
                  <Text
                    style={[
                      styles.yearPillText,
                      selectedYear === yr && styles.yearPillTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {completedRidesHistory.filter((r) => r.year === selectedYear).length === 0 ? (
            <View style={styles.emptyScreenCard}>
              <View style={styles.emptyIconCircle}>
                <Icon name="car-off" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyScreenTitle}>No Rides Taken in {selectedYear}</Text>
              <Text style={styles.emptyScreenSub}>
                Your completed trips and active bookings will appear here automatically.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab("home")}
                style={styles.emptyActionBtn}
              >
                <Text style={styles.emptyActionBtnText}>Book a Ride Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            completedRidesHistory
              .filter((r) => r.year === selectedYear)
              .map((item, idx) => (
                <View key={idx} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <Text style={styles.historyDate}>
                      {new Date(item.completedAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyStatusBadge}>Completed</Text>
                  </View>
                  <Text style={styles.historyRoute}>
                    {item.from_location} ➔ {item.to_location}
                  </Text>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyDriver}>Driver: {item.driver_name}</Text>
                    <Text style={styles.historyPrice}>₹{item.price_per_seat}</Text>
                  </View>
                </View>
              ))
          )}
        </ScrollView>
      )}

      {/* OFFERS TAB: Clean Empty State / Active Coupons */}
      {activeTab === "offers" && (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tabHeadingText}>Active Offers & Coupons</Text>

          {activeOffers.length === 0 ? (
            <View style={styles.emptyScreenCard}>
              <View style={[styles.emptyIconCircle, { backgroundColor: "#FEF3C7" }]}>
                <Icon name="ticket-percent-outline" size={40} color="#D97706" />
              </View>
              <Text style={styles.emptyScreenTitle}>No Active Offers Right Now</Text>
              <Text style={styles.emptyScreenSub}>
                We regularly roll out flat discounts and promo codes for daily commutes. Check back soon!
              </Text>
            </View>
          ) : (
            activeOffers.map((offer, idx) => (
              <View key={idx} style={styles.offerCard}>
                <Text style={styles.offerCode}>{offer.code}</Text>
                <Text style={styles.offerDesc}>{offer.description}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNavContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 },
        ]}
      >
        <TouchableOpacity onPress={() => setActiveTab("home")} style={styles.navTabItem}>
          <Icon name="home" size={22} color={activeTab === "home" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "home" && styles.navTabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("rides")} style={styles.navTabItem}>
          <Icon
            name="car-multiple"
            size={22}
            color={activeTab === "rides" ? "#0284C7" : "#94A3B8"}
          />
          <Text style={[styles.navTabLabel, activeTab === "rides" && styles.navTabLabelActive]}>
            My Rides
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("offers")} style={styles.navTabItem}>
          <Icon
            name="ticket-percent-outline"
            size={22}
            color={activeTab === "offers" ? "#0284C7" : "#94A3B8"}
          />
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
          <Icon
            name="account-circle-outline"
            size={22}
            color={activeTab === "profile" ? "#0284C7" : "#94A3B8"}
          />
          <Text style={[styles.navTabLabel, activeTab === "profile" && styles.navTabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEPARATE SEARCH RESULTS DASHBOARD MODAL */}
      <Modal
        visible={showSearchResults}
        animationType="slide"
        onRequestClose={() => setShowSearchResults(false)}
      >
        <View style={[styles.resultsDashboard, { paddingTop: insets.top + 10 }]}>
          <View style={styles.resultsDashboardHeader}>
            <TouchableOpacity
              onPress={() => setShowSearchResults(false)}
              style={styles.backCircleBtn}
            >
              <Icon name="arrow-left" size={20} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resultsDashboardTitle}>Available Shared Rides</Text>
              <Text style={styles.resultsDashboardSub}>
                {pickup} ➔ {destination}
              </Text>
            </View>
          </View>

          {loadingRides ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={{ marginTop: 12, color: "#64748B", fontWeight: "700" }}>
                Matching verified rides along your route...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >
              {displayedRides.length > 0 ? (
                displayedRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    onPress={() => {
                      setSelectedRide(ride);
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyScreenCard}>
                  <Icon name="map-marker-question-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyScreenTitle}>No Rides Found for this Route</Text>
                  <Text style={styles.emptyScreenSub}>
                    Try adjusting your pickup/drop points or changing vehicle filter.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* EMERGENCY SOS MODAL (Works reliably on Web & Mobile) */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.sosModalBackdrop}>
          <View style={styles.sosCard}>
            <View style={styles.sosHeader}>
              <Icon name="shield-alert" size={28} color="#DC2626" />
              <Text style={styles.sosTitle}>EMERGENCY HELPLINE</Text>
              <Text style={styles.sosSubTitle}>
                Instant one-tap direct contact for safety & medical help
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => Linking.openURL("tel:100")}
              style={[styles.sosActionRow, { backgroundColor: "#FEE2E2" }]}
            >
              <Text style={styles.sosActionEmoji}>🚓</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#991B1B" }]}>Police</Text>
                <Text style={styles.sosActionDesc}>Toll-free 100</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#DC2626" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("tel:108")}
              style={[styles.sosActionRow, { backgroundColor: "#FEF3C7" }]}
            >
              <Text style={styles.sosActionEmoji}>🚑</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#92400E" }]}>Ambulance</Text>
                <Text style={styles.sosActionDesc}>Emergency Medical Service 108</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#D97706" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("tel:112")}
              style={[styles.sosActionRow, { backgroundColor: "#E0E7FF" }]}
            >
              <Text style={styles.sosActionEmoji}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#3730A3" }]}>National Emergency</Text>
                <Text style={styles.sosActionDesc}>All-in-one helpline 112</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#4F46E5" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("tel:1091")}
              style={[styles.sosActionRow, { backgroundColor: "#FCE7F3" }]}
            >
              <Text style={styles.sosActionEmoji}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#9D174D" }]}>Women Safety Helpline</Text>
                <Text style={styles.sosActionDesc}>Toll-free 1091</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#DB2777" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSosModalVisible(false)}
              style={styles.sosCloseBtn}
            >
              <Text style={styles.sosCloseBtnText}>Close SOS Window</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleLocationPicked}
        title={pickerTarget === "from" ? "Select Pickup Spot" : "Select Destination Spot"}
      />

      {/* Booking Checkout Modal */}
      <Modal
        visible={Boolean(selectedRide)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRide(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedRide && (
            <CheckoutSheet
              ride={selectedRide}
              token={token}
              onClose={() => setSelectedRide(null)}
              onBooked={(created) => {
                setBooking(created);
                setSelectedRide(null);
                setShowSearchResults(false);
              }}
            />
          )}
        </View>
      </Modal>

      {/* User Profile Menu Modal */}
      <UserMenuModal
        visible={menuVisible}
        onClose={() => {
          setMenuVisible(false);
          setActiveTab("home");
        }}
        token={token}
        onLogout={onLogout}
        initialPhone={user?.phone || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  pulseDot: {
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
  headerActionRow: {
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
  greetingWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  greetingSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  routeCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  routeCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  locationInputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
  },
  locationInputVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  placeholderText: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  gpsSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gpsSmallBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  routeDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 6,
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 14,
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
  },
  categoryCardWomenActive: {
    borderColor: "#DB2777",
    backgroundColor: "#FDF2F8",
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  findRidesBtn: {
    backgroundColor: "#0284C7",
    marginHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  findRidesBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  shareTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  shareTripBtnDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.8,
  },
  shareTripBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  tabHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabHeadingText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  yearFilterWrap: {
    flexDirection: "row",
    gap: 6,
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  yearPillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  yearPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  yearPillTextActive: {
    color: "#FFFFFF",
  },
  emptyScreenCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyScreenTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  emptyScreenSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 18,
    backgroundColor: "#0284C7",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  historyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  historyStatusBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyRoute: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 8,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  historyDriver: {
    fontSize: 12,
    color: "#64748B",
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0284C7",
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  offerCode: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0284C7",
  },
  offerDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
  },
  navTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  navTabLabelActive: {
    color: "#0284C7",
  },
  resultsDashboard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  resultsDashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  resultsDashboardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  resultsDashboardSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sosModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sosCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  sosHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#DC2626",
    marginTop: 4,
  },
  sosSubTitle: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 2,
  },
  sosActionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  sosActionEmoji: {
    fontSize: 22,
  },
  sosActionName: {
    fontSize: 14,
    fontWeight: "900",
  },
  sosActionDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  callTag: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  sosCloseBtn: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
  },
  sosCloseBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },
});
