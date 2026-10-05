import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RideCard from "@/src/components/RideCard";
import LocationPickerModal from "@/src/components/LocationPickerModal";
import InteractiveMap from "@/src/components/InteractiveMap";

export default function PassengerHome({ navigation }: any) {
  // 4 Bottom Tabs: Home, My Rides, Offers, Profile
  const [currentTab, setCurrentTab] = useState<"HOME" | "RIDES" | "OFFERS" | "PROFILE">("HOME");

  // Map Coordinates & Route State
  const [coords, setCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [pickup, setPickup] = useState("Hitec City, Hyderabad");
  const [drop, setDrop] = useState("LB Nagar, Hyderabad");
  const [modalType, setModalType] = useState<"pickup" | "drop" | null>(null);

  // Live Rides (Driver post chese rides ikkadiki vasthayi)
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Payment Checkout States
  const [selectedRideForBooking, setSelectedRideForBooking] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Sync with Driver App Shared Storage / Backend
  const syncLiveRides = () => {
    try {
      const stored = localStorage.getItem("SHARED_CARPOOL_RIDES");
      if (stored) {
        setRides(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    syncLiveRides();
    const interval = setInterval(syncLiveRides, 2000); // Check for new driver rides every 2 sec
    return () => clearInterval(interval);
  }, []);

  const confirmBookingPayment = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      const bookedRide = selectedRideForBooking;
      setSelectedRideForBooking(null);
      alert(`Booking Confirmed with ${bookedRide?.driver_name}! Seat Reserved.`);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>PASSENGER COMMUTE</Text>
            <Text style={styles.headerTitle}>Hyderabad RidePool</Text>
          </View>

          {/* Quick link to Open Driver App */}
          <TouchableOpacity
            style={styles.openDriverBtn}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate("DriverHome");
              } else {
                window.location.href = "/driver";
              }
            }}
          >
            <Text style={styles.openDriverText}>🚗 Open Driver App ➔</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- PASSENGER SCREENS ---------------- */}
        <View style={{ flex: 1 }}>
          {/* TAB 1: HOME (Rapido Half Screen Map + Search Kinda) */}
          {currentTab === "HOME" && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* 1. Interactive Drag & Zoom Map */}
              <InteractiveMap
                lat={coords.lat}
                lon={coords.lon}
                height={260}
                onLocationChange={(newLat, newLon) => {
                  setCoords({ lat: newLat, lon: newLon });
                }}
              />

              {/* 2. Search Underneath Map */}
              <View style={styles.searchUnderMapCard}>
                <TouchableOpacity
                  style={styles.inputLocationRow}
                  onPress={() => setModalType("pickup")}
                >
                  <View style={styles.greenCircle} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputTag}>PICKUP LOCATION</Text>
                    <Text style={styles.inputText} numberOfLines={1}>
                      {pickup}
                    </Text>
                  </View>
                  <Text style={styles.editSign}>✏️</Text>
                </TouchableOpacity>

                <View style={styles.inputDivider} />

                <TouchableOpacity
                  style={styles.inputLocationRow}
                  onPress={() => setModalType("drop")}
                >
                  <View style={styles.redCircle} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputTag}>DROP DESTINATION</Text>
                    <Text style={styles.inputText} numberOfLines={1}>
                      {drop}
                    </Text>
                  </View>
                  <Text style={styles.editSign}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.searchRidesBtn}
                  onPress={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 400);
                  }}
                >
                  <Text style={styles.searchRidesBtnText}>Search Carpools ➔</Text>
                </TouchableOpacity>
              </View>

              {/* 3. Live Rides Heading */}
              <View style={styles.ridesHeaderRow}>
                <Text style={styles.ridesSectionTitle}>Available Rides</Text>
                <Text style={styles.ridesCountBadge}>
                  {rides.length > 0 ? `${rides.length} Live Pools` : "Awaiting Driver Posts"}
                </Text>
              </View>

              {/* 4. Rides List (Driver App create chesina rides matrame ikkada vasthayi) */}
              {rides.length === 0 ? (
                <View style={styles.noRidesCard}>
                  <Text style={styles.noRidesTitle}>No live rides available right now</Text>
                  <Text style={styles.noRidesSub}>
                    Rides will appear automatically as soon as a driver posts one from the Driver App.
                  </Text>
                </View>
              ) : (
                rides.map((item) => {
                  const finalFare = appliedCoupon
                    ? Math.round(item.price_per_seat * 0.8)
                    : item.price_per_seat;
                  return (
                    <View key={item.id} style={{ marginHorizontal: 16 }}>
                      <RideCard
                        ride={{ ...item, price_per_seat: finalFare }}
                        onPress={() =>
                          setSelectedRideForBooking({ ...item, price_per_seat: finalFare })
                        }
                      />
                    </View>
                  );
                })
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          )}

          {/* TAB 2: MY RIDES */}
          {currentTab === "RIDES" && (
            <View style={styles.centeredTabContent}>
              <Text style={styles.tabBigTitle}>My Booked Rides</Text>
              <Text style={styles.tabSubDesc}>
                Your confirmed carpools, live tracking and ride receipts appear here.
              </Text>
            </View>
          )}

          {/* TAB 3: OFFERS */}
          {currentTab === "OFFERS" && (
            <ScrollView contentContainerStyle={styles.offersScroll}>
              <Text style={styles.tabBigTitle}>Exclusive Offers & Promos</Text>
              <Text style={styles.tabSubDesc}>Apply promo discounts directly to your daily rides</Text>

              <View style={styles.offerCard}>
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>FLAT 20% OFF</Text>
                </View>
                <Text style={styles.offerCode}>CODE: FIRSTPOOL</Text>
                <Text style={styles.offerDesc}>Get 20% off on your office commute pools.</Text>
                <TouchableOpacity
                  style={[styles.applyOfferBtn, appliedCoupon === "FIRSTPOOL" && styles.appliedBtn]}
                  onPress={() => {
                    if (appliedCoupon === "FIRSTPOOL") {
                      setAppliedCoupon(null);
                      alert("Coupon removed");
                    } else {
                      setAppliedCoupon("FIRSTPOOL");
                      alert("Coupon FIRSTPOOL applied! 20% OFF Active.");
                    }
                  }}
                >
                  <Text style={styles.applyOfferText}>
                    {appliedCoupon === "FIRSTPOOL" ? "✓ APPLIED" : "APPLY COUPON"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* TAB 4: PROFILE */}
          {currentTab === "PROFILE" && (
            <View style={styles.profileContent}>
              <View style={styles.profileAvatar}>
                <Text style={{ fontSize: 32 }}>👤</Text>
              </View>
              <Text style={styles.profileName}>Bhargav Vattala</Text>
              <Text style={styles.profilePhone}>+91 8919326622</Text>
              <Text style={styles.profileTag}>Verified Passenger</Text>
            </View>
          )}
        </View>

        {/* ---------------- 4 BOTTOM NAVIGATION TABS ---------------- */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("HOME")}>
            <Text style={[styles.tabIcon, currentTab === "HOME" && styles.tabActiveText]}>🏠</Text>
            <Text style={[styles.tabLabel, currentTab === "HOME" && styles.tabActiveText]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("RIDES")}>
            <Text style={[styles.tabIcon, currentTab === "RIDES" && styles.tabActiveText]}>🚗</Text>
            <Text style={[styles.tabLabel, currentTab === "RIDES" && styles.tabActiveText]}>My Rides</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("OFFERS")}>
            <Text style={[styles.tabIcon, currentTab === "OFFERS" && styles.tabActiveText]}>🎁</Text>
            <Text style={[styles.tabLabel, currentTab === "OFFERS" && styles.tabActiveText]}>Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("PROFILE")}>
            <Text style={[styles.tabIcon, currentTab === "PROFILE" && styles.tabActiveText]}>👤</Text>
            <Text style={[styles.tabLabel, currentTab === "PROFILE" && styles.tabActiveText]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- PAYMENT MODAL ---------------- */}
        <Modal visible={selectedRideForBooking !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.paymentModalCard}>
              <Text style={styles.modalHeading}>Confirm Seat & Pay</Text>
              <Text style={styles.modalSub}>
                Driver: {selectedRideForBooking?.driver_name} ({selectedRideForBooking?.vehicle_name})
              </Text>

              <View style={styles.fareBox}>
                <Text style={styles.fareLabel}>Total Fare (1 Seat)</Text>
                <Text style={styles.fareValue}>₹{selectedRideForBooking?.price_per_seat}</Text>
              </View>

              <TouchableOpacity style={styles.upiCard} onPress={confirmBookingPayment}>
                <Text style={{ fontSize: 20 }}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiName}>Pay via UPI (GPay / PhonePe / Paytm)</Text>
                  <Text style={styles.upiVpa}>8919326622@upi</Text>
                </View>
                <Text style={styles.payArrow}>➔</Text>
              </TouchableOpacity>

              {paymentSuccess && (
                <View style={styles.successTag}>
                  <Text style={styles.successTagText}>✓ Payment Successful! Pass Confirmed.</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedRideForBooking(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={modalType !== null}
          title={modalType === "pickup" ? "Select Pickup Location" : "Select Drop Location"}
          onClose={() => setModalType(null)}
          onSelect={(name, lat, lon) => {
            if (modalType === "pickup") {
              setPickup(name);
              setCoords({ lat, lon });
            } else if (modalType === "drop") {
              setDrop(name);
            }
            setModalType(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerSub: { fontSize: 9, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  openDriverBtn: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  openDriverText: { fontSize: 11, fontWeight: "800", color: "#B45309" },
  searchUnderMapCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  inputLocationRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  greenCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  redCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  inputTag: { fontSize: 8, fontWeight: "800", color: "#94A3B8" },
  inputText: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  editSign: { fontSize: 12, opacity: 0.6 },
  inputDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8, marginLeft: 18 },
  searchRidesBtn: {
    backgroundColor: "#FFC000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  searchRidesBtnText: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  ridesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  ridesSectionTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  ridesCountBadge: { fontSize: 11, fontWeight: "700", color: "#0284C7" },
  noRidesCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  noRidesTitle: { fontSize: 14, fontWeight: "800", color: "#334155" },
  noRidesSub: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtn: { alignItems: "center" },
  tabIcon: { fontSize: 18, color: "#64748B" },
  tabLabel: { fontSize: 10, fontWeight: "700", color: "#64748B", marginTop: 2 },
  tabActiveText: { color: "#0284C7" },
  centeredTabContent: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  tabBigTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  tabSubDesc: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 6 },
  offersScroll: { padding: 16 },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  offerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0284C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  offerBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  offerCode: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  offerDesc: { fontSize: 11, color: "#64748B", marginTop: 4, marginBottom: 12 },
  applyOfferBtn: { backgroundColor: "#F1F5F9", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  appliedBtn: { backgroundColor: "#DCFCE7" },
  applyOfferText: { fontSize: 11, fontWeight: "800", color: "#0F172A" },
  profileContent: { padding: 24, alignItems: "center" },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  profileName: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  profilePhone: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  profileTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  paymentModalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeading: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  modalSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  fareBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fareLabel: { fontSize: 12, fontWeight: "700", color: "#475569" },
  fareValue: { fontSize: 18, fontWeight: "900", color: "#16A34A" },
  upiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 10,
  },
  upiName: { fontSize: 12, fontWeight: "800", color: "#14532D" },
  upiVpa: { fontSize: 10, color: "#16A34A" },
  payArrow: { fontSize: 14, fontWeight: "bold", color: "#15803D" },
  successTag: { backgroundColor: "#DCFCE7", padding: 10, borderRadius: 8, marginTop: 10, alignItems: "center" },
  successTagText: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  cancelBtn: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
});
