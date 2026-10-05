import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import InteractiveMap from "@/src/components/InteractiveMap";
import LocationPickerModal from "@/src/components/LocationPickerModal";

export default function DriverHome({ navigation }: any) {
  // Navigation Tabs for Driver Portal
  const [driverTab, setDriverTab] = useState<"POST" | "MY_RIDES" | "EARNINGS" | "PROFILE">("POST");

  // Driver Identity & Vehicle Info
  const [driverName, setDriverName] = useState("Bhargav (Driver)");
  const [driverPhone, setDriverPhone] = useState("8919326622");
  const [vehicleName, setVehicleName] = useState("Swift Dzire (White)");
  const [vehicleNumber, setVehicleNumber] = useState("TS09AB1234");

  // Map & Route Coordinates
  const [coords, setCoords] = useState({ lat: 17.3457, lon: 78.5522 }); // LB Nagar default
  const [pickup, setPickup] = useState("LB Nagar Ring Road, Hyderabad");
  const [drop, setDrop] = useState("Hitec City Cyber Towers, Hyderabad");
  const [modalType, setModalType] = useState<"pickup" | "drop" | null>(null);

  // Ride Pricing & Capacity Details
  const [availableSeats, setAvailableSeats] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("100");
  const [departureTime, setDepartureTime] = useState("Today in 15 mins");
  const [femaleOnly, setFemaleOnly] = useState(false);

  // Published Rides State
  const [myPublishedRides, setMyPublishedRides] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Driver's Rides (7000ms safe interval)
  const loadDriverRides = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem("SHARED_CARPOOL_RIDES");
        if (stored) {
          const allRides = JSON.parse(stored);
          setMyPublishedRides(allRides);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadDriverRides();
    const interval = setInterval(loadDriverRides, 7000);
    return () => clearInterval(interval);
  }, []);

  // Publish Ride Function (Direct sync to Passenger app)
  const handlePublishRide = () => {
    if (!pickup.trim() || !drop.trim() || !pricePerSeat.trim()) {
      alert("Dhayachesi Pickup, Drop mariyu Seat Price enter cheyandi");
      return;
    }

    setIsSubmitting(true);

    const newRide = {
      id: "ride_" + Date.now(),
      driver_name: driverName,
      phone: driverPhone,
      vehicle_name: vehicleName,
      vehicle_number: vehicleNumber,
      from_location: pickup,
      to_location: drop,
      coords: coords,
      price_per_seat: Number(pricePerSeat),
      available_seats: Number(availableSeats),
      departure_time: departureTime,
      female_only: femaleOnly,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem("SHARED_CARPOOL_RIDES");
        const currentList = stored ? JSON.parse(stored) : [];
        const updatedList = [newRide, ...currentList];
        localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify(updatedList));
        setMyPublishedRides(updatedList);
      }
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      alert("🎉 Ride published successfully! Passenger App lo live ga kanipisthundi.");
      setDriverTab("MY_RIDES");
    }, 500);
  };

  // Delete / Cancel Published Ride
  const handleCancelRide = (rideId: string) => {
    try {
      const updated = myPublishedRides.filter((r) => r.id !== rideId);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify(updated));
      }
      setMyPublishedRides(updated);
      alert("Ride cancelled successfully.");
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.portalBadge}>DRIVER PARTNER PORTAL</Text>
            <Text style={styles.portalTitle}>Car & Bike Pool Dashboard</Text>
          </View>

          {/* Switch to Passenger Mode Button */}
          <TouchableOpacity
            style={styles.switchPassengerBtn}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate("PassengerHome");
              } else if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
          >
            <Text style={styles.switchPassengerText}>🚶 Switch Passenger ➔</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- DRIVER MAIN SCREENS ---------------- */}
        <View style={{ flex: 1 }}>
          {/* TAB 1: POST A RIDE */}
          {driverTab === "POST" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollForm}>
              {/* Interactive Map */}
              <View style={styles.mapCardWrap}>
                <InteractiveMap
                  lat={coords.lat}
                  lon={coords.lon}
                  height={220}
                  onLocationChange={(newLat, newLon) => setCoords({ lat: newLat, lon: newLon })}
                />
                <View style={styles.mapHintBadge}>
                  <Text style={styles.mapHintText}>📍 Pickup point adjust cheyadaniki map drag cheyandi</Text>
                </View>
              </View>

              {/* Route Inputs */}
              <View style={styles.formContainer}>
                <Text style={styles.formHeading}>Publish New Route</Text>

                <TouchableOpacity
                  style={styles.routeInputBox}
                  onPress={() => setModalType("pickup")}
                >
                  <View style={styles.greenDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>YOUR START POINT (PICKUP)</Text>
                    <Text style={styles.inputValue} numberOfLines={1}>{pickup}</Text>
                  </View>
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>

                <View style={styles.routeDivider} />

                <TouchableOpacity
                  style={styles.routeInputBox}
                  onPress={() => setModalType("drop")}
                >
                  <View style={styles.redDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>FINAL DESTINATION (DROP)</Text>
                    <Text style={styles.inputValue} numberOfLines={1}>{drop}</Text>
                  </View>
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>

                {/* Vehicle & Seats Details */}
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>VEHICLE MODEL</Text>
                    <TextInput
                      style={styles.textInput}
                      value={vehicleName}
                      onChangeText={setVehicleName}
                      placeholder="e.g. Swift Dzire"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>VEHICLE NUMBER</Text>
                    <TextInput
                      style={styles.textInput}
                      value={vehicleNumber}
                      onChangeText={setVehicleNumber}
                      placeholder="TS09AB1234"
                    />
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>SEATS OFFERED</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={availableSeats}
                      onChangeText={setAvailableSeats}
                      placeholder="3"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>PRICE PER SEAT (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={pricePerSeat}
                      onChangeText={setPricePerSeat}
                      placeholder="95"
                    />
                  </View>
                </View>

                {/* Departure Time */}
                <Text style={styles.inputLabel}>DEPARTURE TIME</Text>
                <TextInput
                  style={styles.textInput}
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  placeholder="e.g. Today, 08:30 AM or In 15 mins"
                />

                {/* Women Safety / Female-Only Toggle */}
                <TouchableOpacity
                  style={[styles.femaleOnlyBtn, femaleOnly && styles.femaleOnlyBtnActive]}
                  onPress={() => setFemaleOnly(!femaleOnly)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.femaleOnlyIcon}>🌸</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.femaleOnlyTitle}>
                      {femaleOnly ? "Female-Only Pool: ACTIVE" : "Female-Only Pool (Optional)"}
                    </Text>
                    <Text style={styles.femaleOnlySub}>
                      Enable chesukunte కేవలం verified mahila passengerlaku mathrame ee ride kanipisthundi.
                    </Text>
                  </View>
                  <View style={[styles.toggleCheckbox, femaleOnly && styles.toggleCheckboxActive]}>
                    {femaleOnly && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                {/* Publish Action Button */}
                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={handlePublishRide}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.publishBtnText}>Publish Ride to Passenger App ➔</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* TAB 2: MY ACTIVE RIDES */}
          {driverTab === "MY_RIDES" && (
            <ScrollView contentContainerStyle={styles.manageScroll}>
              <Text style={styles.tabHeading}>My Active Ride Pools</Text>
              <Text style={styles.tabSubheading}>
                Meeru publish chesina rides mariyu live passengers ikkada kanipistharu.
              </Text>

              {myPublishedRides.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Active rides emi levu</Text>
                  <Text style={styles.emptySub}>
                    "Post Ride" tab ki velli mee journey details enter chesi publish cheyandi.
                  </Text>
                  <TouchableOpacity
                    style={styles.postNowBtn}
                    onPress={() => setDriverTab("POST")}
                  >
                    <Text style={styles.postNowBtnText}>+ Post a Ride Now</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myPublishedRides.map((ride) => (
                  <View key={ride.id} style={styles.activeRideCard}>
                    <View style={styles.activeCardHeader}>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>LIVE ON PASSENGER APP</Text>
                      </View>
                      <Text style={styles.activeFareText}>₹{ride.price_per_seat} / seat</Text>
                    </View>

                    <Text style={styles.routeHeadingText}>
                      {ride.from_location} ➔ {ride.to_location}
                    </Text>

                    <View style={styles.rideDetailPillRow}>
                      <Text style={styles.detailPill}>🚗 {ride.vehicle_name}</Text>
                      <Text style={styles.detailPill}>👥 {ride.available_seats} Seats left</Text>
                      <Text style={styles.detailPill}>🕒 {ride.departure_time}</Text>
                      {ride.female_only && <Text style={[styles.detailPill, { color: "#DB2777" }]}>🌸 Women-Only</Text>}
                    </View>

                    <View style={styles.rideActionsRow}>
                      <TouchableOpacity
                        style={styles.startTripBtn}
                        onPress={() => alert(`Trip started for ${ride.to_location}! Passenger tracking on live map.`)}
                      >
                        <Text style={styles.startTripBtnText}>▶ Start Trip</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelRideBtn}
                        onPress={() => handleCancelRide(ride.id)}
                      >
                        <Text style={styles.cancelRideBtnText}>✕ Cancel Ride</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* TAB 3: EARNINGS */}
          {driverTab === "EARNINGS" && (
            <ScrollView contentContainerStyle={styles.earningsContainer}>
              <Text style={styles.tabHeading}>Driver Earnings</Text>

              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>TOTAL REVENUE (ONLINE PAYMENTS)</Text>
                <Text style={styles.balanceAmount}>₹1,450.00</Text>
                <Text style={styles.balanceSub}>Direct settlement via UPI ID: vattalabhargav3@okhdfcbank</Text>

                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={() => alert("Withdrawal request submitted! Amount will be credited to UPI within 15 mins.")}
                >
                  <Text style={styles.withdrawBtnText}>⚡ Instant UPI Payout</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>12</Text>
                  <Text style={styles.statLabel}>Trips Completed</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>28</Text>
                  <Text style={styles.statLabel}>Passengers Pooled</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>4.9 ★</Text>
                  <Text style={styles.statLabel}>Driver Rating</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* TAB 4: PROFILE */}
          {driverTab === "PROFILE" && (
            <ScrollView contentContainerStyle={styles.profileContainer}>
              <View style={styles.avatarWrap}>
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
              <Text style={styles.profileDriverName}>{driverName}</Text>
              <Text style={styles.profileDriverPhone}>📞 {driverPhone}</Text>
              <View style={styles.verifiedDriverBadge}>
                <Text style={styles.verifiedDriverText}>✓ VERIFIED DRIVER PARTNER</Text>
              </View>

              <View style={styles.profileInfoCard}>
                <Text style={styles.profileSecTitle}>Registered Vehicle</Text>
                <Text style={styles.profileSecValue}>{vehicleName}</Text>
                <Text style={styles.profileSecSub}>Plate No: {vehicleNumber} • Commercial/Private Carpool Permit</Text>
              </View>

              <TouchableOpacity
                style={styles.emergencySosBtn}
                onPress={() => Linking.openURL("tel:112")}
              >
                <Text style={styles.emergencySosText}>🚨 Police Helpline (112 / 100)</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Bottom Bar */}
        <View style={styles.driverBottomBar}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setDriverTab("POST")}>
            <Text style={[styles.tabIcon, driverTab === "POST" && styles.tabActiveText]}>➕</Text>
            <Text style={[styles.tabLabel, driverTab === "POST" && styles.tabActiveText]}>Post Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setDriverTab("MY_RIDES")}>
            <Text style={[styles.tabIcon, driverTab === "MY_RIDES" && styles.tabActiveText]}>🚗</Text>
            <Text style={[styles.tabLabel, driverTab === "MY_RIDES" && styles.tabActiveText]}>My Rides</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setDriverTab("EARNINGS")}>
            <Text style={[styles.tabIcon, driverTab === "EARNINGS" && styles.tabActiveText]}>💰</Text>
            <Text style={[styles.tabLabel, driverTab === "EARNINGS" && styles.tabActiveText]}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setDriverTab("PROFILE")}>
            <Text style={[styles.tabIcon, driverTab === "PROFILE" && styles.tabActiveText]}>👤</Text>
            <Text style={[styles.tabLabel, driverTab === "PROFILE" && styles.tabActiveText]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={modalType !== null}
          title={modalType === "pickup" ? "Select Start Location" : "Select Destination"}
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  portalBadge: { fontSize: 9, fontWeight: "900", color: "#D97706", letterSpacing: 0.5 },
  portalTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  switchPassengerBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  switchPassengerText: { fontSize: 11, fontWeight: "800", color: "#1D4ED8" },
  scrollForm: { paddingBottom: 24 },
  mapCardWrap: {
    position: "relative",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  mapHintBadge: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  mapHintText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  formContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  formHeading: { fontSize: 17, fontWeight: "900", color: "#0F172A", marginBottom: 12 },
  routeInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  inputLabel: { fontSize: 8, fontWeight: "800", color: "#94A3B8" },
  inputValue: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  editIcon: { fontSize: 12, opacity: 0.6 },
  routeDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8, marginLeft: 18 },
  rowInputs: { flexDirection: "row", gap: 10, marginTop: 10 },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  femaleOnlyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 10,
  },
  femaleOnlyBtnActive: { backgroundColor: "#FCE7F3", borderColor: "#DB2777" },
  femaleOnlyIcon: { fontSize: 20 },
  femaleOnlyTitle: { fontSize: 12, fontWeight: "900", color: "#BE185D" },
  femaleOnlySub: { fontSize: 10, color: "#9D174D", marginTop: 2 },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#F472B6",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleCheckboxActive: { backgroundColor: "#DB2777", borderColor: "#DB2777" },
  checkmark: { color: "#FFFFFF", fontSize: 11, fontWeight: "bold" },
  publishBtn: {
    backgroundColor: "#FFC000",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    elevation: 2,
  },
  publishBtnText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  driverBottomBar: {
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
  tabActiveText: { color: "#D97706" },
  manageScroll: { padding: 16 },
  tabHeading: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  tabSubheading: { fontSize: 12, color: "#64748B", marginTop: 2, marginBottom: 16 },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#334155" },
  emptySub: { fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 6, marginBottom: 16 },
  postNowBtn: { backgroundColor: "#FFC000", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  postNowBtnText: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  activeRideCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  activeCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  activeBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { color: "#16A34A", fontSize: 10, fontWeight: "900" },
  activeFareText: { fontSize: 16, fontWeight: "900", color: "#16A34A" },
  routeHeadingText: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  rideDetailPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  detailPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  rideActionsRow: { flexDirection: "row", gap: 10 },
  startTripBtn: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  startTripBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  cancelRideBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelRideBtnText: { color: "#DC2626", fontSize: 12, fontWeight: "800" },
  earningsContainer: { padding: 16 },
  balanceCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 10, fontWeight: "800", color: "#94A3B8", letterSpacing: 0.5 },
  balanceAmount: { fontSize: 28, fontWeight: "900", color: "#10B981", marginVertical: 6 },
  balanceSub: { fontSize: 11, color: "#CBD5E1", marginBottom: 16 },
  withdrawBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  withdrawBtnText: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  statsGrid: { flexDirection: "row", gap: 10 },
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
  statLabel: { fontSize: 10, color: "#64748B", marginTop: 2, textAlign: "center" },
  profileContainer: { padding: 24, alignItems: "center" },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileDriverName: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  profileDriverPhone: { fontSize: 13, fontWeight: "700", color: "#64748B", marginTop: 2 },
  verifiedDriverBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  verifiedDriverText: { fontSize: 10, fontWeight: "900", color: "#16A34A" },
  profileInfoCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  profileSecTitle: { fontSize: 11, fontWeight: "800", color: "#94A3B8" },
  profileSecValue: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  profileSecSub: { fontSize: 11, color: "#64748B", marginTop: 4 },
  emergencySosBtn: {
    backgroundColor: "#FEE2E2",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  emergencySosText: { color: "#DC2626", fontSize: 13, fontWeight: "900" },
});
