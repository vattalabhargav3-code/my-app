import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  // 4 Bottom Tabs (Safety బదులు Offers మార్చబడింది)
  const [currentTab, setCurrentTab] = useState<"HOME" | "RIDES" | "OFFERS" | "PROFILE">("HOME");
  const [isDriverMode, setIsDriverMode] = useState(false);

  // Map Coordinates & Route State
  const [coords, setCoords] = useState({ lat: 17.4435, lon: 78.3772 }); // Hitec City default
  const [pickup, setPickup] = useState("Hitec City, Hyderabad");
  const [drop, setDrop] = useState("LB Nagar, Hyderabad");
  const [modalType, setModalType] = useState<"pickup" | "drop" | null>(null);

  // Live Rides (Driver App నుంచి క్రియేట్ అయినవి మాత్రమే ఇక్కడ వస్తాయి)
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Driver Mode Creation Form
  const [driverPickup, setDriverPickup] = useState("Dilsukhnagar, Hyderabad");
  const [driverDrop, setDriverDrop] = useState("Madhapur, Hyderabad");
  const [driverVehicle, setDriverVehicle] = useState("Swift Dzire (White)");
  const [driverNumber, setDriverNumber] = useState("TS09AB1234");
  const [driverSeats, setDriverSeats] = useState("3");
  const [driverPrice, setDriverPrice] = useState("95");
  const [driverFemaleOnly, setDriverFemaleOnly] = useState(false);

  // Payment Checkout
  const [selectedRideForBooking, setSelectedRideForBooking] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Driver Ride Submit Logic
  const handlePublishRide = () => {
    if (!driverPickup || !driverDrop || !driverPrice) {
      alert("Please fill all ride route details");
      return;
    }

    const newRide = {
      id: "ride_" + Date.now(),
      driver_name: "Bhargav (You)",
      phone: "8919326622",
      vehicle_name: driverVehicle,
      vehicle_number: driverNumber,
      from_location: driverPickup,
      to_location: driverDrop,
      price_per_seat: Number(driverPrice),
      available_seats: Number(driverSeats),
      departure_time: "Today in 15 mins",
      female_only: driverFemaleOnly,
    };

    setRides([newRide, ...rides]);
    alert("Ride published successfully to live pool!");
    setIsDriverMode(false);
    setCurrentTab("HOME");
  };

  // Payment Confirmation
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>
              {isDriverMode ? "DRIVER PARTNER PORTAL" : "URBAN CARPOOLING"}
            </Text>
            <Text style={styles.headerTitle}>
              {isDriverMode ? "Offer Seats & Earn" : "Hyderabad Pools"}
            </Text>
          </View>

          {/* Driver vs Passenger Switch */}
          <TouchableOpacity
            style={[styles.modeSwitchBtn, isDriverMode && styles.driverActiveBtn]}
            onPress={() => setIsDriverMode(!isDriverMode)}
          >
            <Text style={styles.modeSwitchText}>
              {isDriverMode ? "➔ Switch to Passenger" : "🚗 Driver Mode"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ----------------- DRIVER MODE SCREEN ----------------- */}
        {isDriverMode ? (
          <ScrollView contentContainerStyle={styles.driverScroll}>
            <View style={styles.driverCard}>
              <Text style={styles.driverCardHeading}>Create & Post a Ride Pool</Text>

              <Text style={styles.formLabel}>START POINT (PICKUP)</Text>
              <TextInput
                style={styles.formInput}
                value={driverPickup}
                onChangeText={setDriverPickup}
                placeholder="e.g. LB Nagar Ring Road"
              />

              <Text style={styles.formLabel}>DROP LOCATION</Text>
              <TextInput
                style={styles.formInput}
                value={driverDrop}
                onChangeText={setDriverDrop}
                placeholder="e.g. Mindspace, Hitec City"
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>VEHICLE MODEL</Text>
                  <TextInput
                    style={styles.formInput}
                    value={driverVehicle}
                    onChangeText={setDriverVehicle}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>SEATS OFFERED</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={driverSeats}
                    onChangeText={setDriverSeats}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>PRICE PER SEAT (₹)</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                value={driverPrice}
                onChangeText={setDriverPrice}
              />

              <TouchableOpacity
                style={[styles.femaleToggle, driverFemaleOnly && styles.femaleToggleActive]}
                onPress={() => setDriverFemaleOnly(!driverFemaleOnly)}
              >
                <Text style={styles.femaleToggleText}>
                  {driverFemaleOnly ? "🌸 Female-Only Pool: ENABLED" : "🌸 Enable Female-Only Pool"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.publishBtn} onPress={handlePublishRide}>
                <Text style={styles.publishBtnText}>Publish Ride to Passenger App ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* ----------------- PASSENGER MODE SCREENS ----------------- */
          <View style={{ flex: 1 }}>
            {/* TAB 1: HOME (Rapido Half-Screen Map + Search Underneath) */}
            {currentTab === "HOME" && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* 1. Rapido Style Half-Screen Interactive Drag & Zoom Map */}
                <InteractiveMap
                  lat={coords.lat}
                  lon={coords.lon}
                  height={260}
                  onLocationChange={(newLat, newLon) => {
                    setCoords({ lat: newLat, lon: newLon });
                  }}
                />

                {/* 2. Search Box Right Underneath the Map */}
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

                {/* 3. Available Rides Heading */}
                <View style={styles.ridesHeaderRow}>
                  <Text style={styles.ridesSectionTitle}>Live Carpools</Text>
                  <Text style={styles.ridesCountBadge}>
                    {rides.length > 0 ? `${rides.length} Active` : "Live from Driver Mode"}
                  </Text>
                </View>

                {/* 4. Rides List (Direct from Driver App) */}
                {rides.length === 0 ? (
                  <View style={styles.noRidesCard}>
                    <Text style={styles.noRidesTitle}>No live rides published yet</Text>
                    <Text style={styles.noRidesSub}>
                      Click "🚗 Driver Mode" in the top header, create a ride, and it will immediately show up here!
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
                          onPress={() => setSelectedRideForBooking({ ...item, price_per_seat: finalFare })}
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
                  Your confirmed carpools, driver tracking, and OTP verification will appear here.
                </Text>
              </View>
            )}

            {/* TAB 3: OFFERS (Safety మార్చబడి OFFERS గా అమర్చబడింది) */}
            {currentTab === "OFFERS" && (
              <ScrollView contentContainerStyle={styles.offersScroll}>
                <Text style={styles.tabBigTitle}>Exclusive Commute Offers</Text>
                <Text style={styles.tabSubDesc}>Apply promo discounts directly to your daily rides</Text>

                {/* Offer 1 */}
                <View style={styles.offerCard}>
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>FLAT 20% OFF</Text>
                  </View>
                  <Text style={styles.offerCode}>CODE: FIRSTPOOL</Text>
                  <Text style={styles.offerDesc}>Get 20% off on your first 3 office commutes in Hyderabad.</Text>
                  <TouchableOpacity
                    style={[styles.applyOfferBtn, appliedCoupon === "FIRSTPOOL" && styles.appliedBtn]}
                    onPress={() => {
                      if (appliedCoupon === "FIRSTPOOL") {
                        setAppliedCoupon(null);
                        alert("Offer removed");
                      } else {
                        setAppliedCoupon("FIRSTPOOL");
                        alert("Coupon FIRSTPOOL applied! 20% Discount active.");
                      }
                    }}
                  >
                    <Text style={styles.applyOfferText}>
                      {appliedCoupon === "FIRSTPOOL" ? "✓ APPLIED" : "APPLY COUPON"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Offer 2 */}
                <View style={styles.offerCard}>
                  <View style={[styles.offerBadge, { backgroundColor: "#16A34A" }]}>
                    <Text style={styles.offerBadgeText}>CASHBACK ₹50</Text>
                  </View>
                  <Text style={styles.offerCode}>CODE: HITEC50</Text>
                  <Text style={styles.offerDesc}>Flat ₹50 cashback when carpooling to Madhapur & Hitec City.</Text>
                  <TouchableOpacity
                    style={[styles.applyOfferBtn, appliedCoupon === "HITEC50" && styles.appliedBtn]}
                    onPress={() => {
                      setAppliedCoupon("HITEC50");
                      alert("Coupon HITEC50 applied!");
                    }}
                  >
                    <Text style={styles.applyOfferText}>
                      {appliedCoupon === "HITEC50" ? "✓ APPLIED" : "APPLY COUPON"}
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
                <Text style={styles.profileTag}>Verified Corporate Commuter</Text>

                <View style={styles.profileStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>14</Text>
                    <Text style={styles.statLabel}>Rides Taken</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>4.9 ★</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>₹420</Text>
                    <Text style={styles.statLabel}>Saved (Fuel)</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ----------------- 4 BOTTOM NAVIGATION TABS ----------------- */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => {
              setIsDriverMode(false);
              setCurrentTab("HOME");
            }}
          >
            <Text style={[styles.tabIcon, currentTab === "HOME" && styles.tabActiveText]}>🏠</Text>
            <Text style={[styles.tabLabel, currentTab === "HOME" && styles.tabActiveText]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => {
              setIsDriverMode(false);
              setCurrentTab("RIDES");
            }}
          >
            <Text style={[styles.tabIcon, currentTab === "RIDES" && styles.tabActiveText]}>🚗</Text>
            <Text style={[styles.tabLabel, currentTab === "RIDES" && styles.tabActiveText]}>My Rides</Text>
          </TouchableOpacity>

          {/* 3rd Option: OFFERS */}
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => {
              setIsDriverMode(false);
              setCurrentTab("OFFERS");
            }}
          >
            <Text style={[styles.tabIcon, currentTab === "OFFERS" && styles.tabActiveText]}>🎁</Text>
            <Text style={[styles.tabLabel, currentTab === "OFFERS" && styles.tabActiveText]}>Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => {
              setIsDriverMode(false);
              setCurrentTab("PROFILE");
            }}
          >
            <Text style={[styles.tabIcon, currentTab === "PROFILE" && styles.tabActiveText]}>👤</Text>
            <Text style={[styles.tabLabel, currentTab === "PROFILE" && styles.tabActiveText]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ----------------- PAYMENT CHECKOUT MODAL ----------------- */}
        <Modal visible={selectedRideForBooking !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.paymentModalCard}>
              <Text style={styles.modalHeading}>Confirm Seat & Pay</Text>
              <Text style={styles.modalSub}>
                Driver: {selectedRideForBooking?.driver_name} ({selectedRideForBooking?.vehicle_name})
              </Text>

              <View style={styles.fareBox}>
                <Text style={styles.fareLabel}>Payable Fare (1 Seat)</Text>
                <Text style={styles.fareValue}>₹{selectedRideForBooking?.price_per_seat}</Text>
              </View>

              <Text style={styles.payOptionTitle}>Select Payment Method</Text>

              <TouchableOpacity style={styles.upiCard} onPress={confirmBookingPayment}>
                <Text style={{ fontSize: 20 }}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiName}>Instant UPI (GPay / PhonePe / Paytm)</Text>
                  <Text style={styles.upiVpa}>8919326622@upi</Text>
                </View>
                <Text style={styles.payArrow}>➔</Text>
              </TouchableOpacity>

              {paymentSuccess && (
                <View style={styles.successTag}>
                  <Text style={styles.successTagText}>✓ Payment Successful! Generating Ride Pass...</Text>
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

        {/* Location Selector Modal */}
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
  modeSwitchBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  driverActiveBtn: { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
  modeSwitchText: { fontSize: 11, fontWeight: "800", color: "#0F172A" },
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
  inputLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
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
  driverScroll: { padding: 16 },
  driverCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  driverCardHeading: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginBottom: 12 },
  formLabel: { fontSize: 10, fontWeight: "800", color: "#64748B", marginTop: 10, marginBottom: 4 },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  formRow: { flexDirection: "row", gap: 10 },
  femaleToggle: {
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
  },
  femaleToggleActive: { backgroundColor: "#FCE7F3", borderColor: "#DB2777" },
  femaleToggleText: { fontSize: 12, fontWeight: "800", color: "#BE185D" },
  publishBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  publishBtnText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
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
  applyOfferBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
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
  profileStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  statNum: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  statLabel: { fontSize: 10, color: "#64748B", marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  paymentModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
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
  payOptionTitle: { fontSize: 12, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
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
  successTag: {
    backgroundColor: "#DCFCE7",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  successTagText: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  cancelBtn: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
});
