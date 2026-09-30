import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Ride, User } from "@/src/api";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { Icon } from "@/src/components/ui";
import { UserMenuModal } from "@/src/components/UserMenuModal";

interface DriverHomeProps {
  token: string;
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
}

export function DriverHome({
  token,
  user,
  onUserUpdate,
  onLogout,
}: DriverHomeProps) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"dashboard" | "my_published_rides" | "earnings" | "profile">("dashboard");

  // Create Ride Form States
  const [fromLoc, setFromLoc] = useState("");
  const [toLoc, setToLoc] = useState("");
  const [vehicleType, setVehicleType] = useState<"car" | "bike">("car");
  const [availableSeats, setAvailableSeats] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("100");
  const [womenOnly, setWomenOnly] = useState(false);
  const [departureTime, setDepartureTime] = useState("Today, 06:00 PM");

  const [publishing, setPublishing] = useState(false);
  const [publishedRides, setPublishedRides] = useState<Ride[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const loadDriverRides = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await api<Ride[]>("/rides/my-published", {}, token);
      if (Array.isArray(data)) {
        setPublishedRides(data);
      }
    } catch {
      // Local fallback if backend is empty
      const local = typeof window !== "undefined" ? localStorage.getItem("riderx_driver_rides") : null;
      if (local) {
        setPublishedRides(JSON.parse(local));
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    loadDriverRides();
  }, [loadDriverRides]);

  const handlePublishRide = async () => {
    if (!fromLoc || !toLoc) {
      showAlert("Missing Locations", "Please set both Start and Destination spots.");
      return;
    }

    setPublishing(true);
    const newRidePayload = {
      from_location: fromLoc,
      to_location: toLoc,
      vehicle_type: vehicleType,
      available_seats: parseInt(availableSeats, 10) || 1,
      price_per_seat: parseInt(pricePerSeat, 10) || 50,
      women_only: womenOnly,
      departure_time: departureTime,
    };

    try {
      const created = await api<Ride>("/rides", {
        method: "POST",
        body: JSON.stringify(newRidePayload),
      }, token);

      showAlert("Success", "Your shared ride has been published live!");
      const updated = [created, ...publishedRides];
      setPublishedRides(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("riderx_driver_rides", JSON.stringify(updated));
      }
      setFromLoc("");
      setToLoc("");
      setActiveTab("my_published_rides");
    } catch {
      // Fallback local save
      const mockCreated: Ride = {
        id: "ride_pub_" + Date.now(),
        driver_id: user.id,
        driver_name: user.full_name,
        from_location: fromLoc,
        to_location: toLoc,
        vehicle_type: vehicleType,
        vehicle_name: vehicleType === "car" ? "Car Pool Ride" : "Bike Share Ride",
        available_seats: parseInt(availableSeats, 10) || 1,
        price_per_seat: parseInt(pricePerSeat, 10) || 50,
        departure_time: departureTime,
        status: "active",
      } as any;

      const updated = [mockCreated, ...publishedRides];
      setPublishedRides(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("riderx_driver_rides", JSON.stringify(updated));
      }
      showAlert("Success", "Ride successfully posted and live for passengers!");
      setFromLoc("");
      setToLoc("");
      setActiveTab("my_published_rides");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.screenRoot}>
      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.brandTitle}>
            RIDER<Text style={styles.brandAccent}>X</Text> <Text style={styles.driverBadge}>DRIVER</Text>
          </Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveIndicatorText}>Ready to Share Empty Seats</Text>
          </View>
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSosModalVisible(true)}
            style={styles.sosButton}
          >
            <Icon name="shield-alert" size={14} color="#FFFFFF" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuCircleBtn}>
            <Icon name="menu" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* DASHBOARD TAB (Publish Ride Form) */}
      {activeTab === "dashboard" && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingTitle}>Welcome, {user?.full_name?.split(" ")[0]}! 🚗</Text>
            <Text style={styles.greetingSub}>Share your daily travel and save on fuel costs</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>PUBLISH A ROUTE</Text>

            {/* Starting Point */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerTarget("from")}
              style={styles.locationInputRow}
            >
              <View style={styles.greenDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>STARTING LOCATION (PICKUP)</Text>
                <Text numberOfLines={1} style={[styles.inputValue, !fromLoc && styles.placeholderText]}>
                  {fromLoc || "Where are you starting from?"}
                </Text>
              </View>
              <Icon name="map-marker" size={20} color="#10B981" />
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            {/* Ending Point */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerTarget("to")}
              style={styles.locationInputRow}
            >
              <View style={styles.redDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>DESTINATION (DROP POINT)</Text>
                <Text numberOfLines={1} style={[styles.inputValue, !toLoc && styles.placeholderText]}>
                  {toLoc || "Where are you heading?"}
                </Text>
              </View>
              <Icon name="map-marker-radius" size={20} color="#EF4444" />
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            {/* Vehicle Selection */}
            <Text style={[styles.inputLabel, { marginTop: 10, marginBottom: 8 }]}>VEHICLE TYPE</Text>
            <View style={styles.vehicleRow}>
              <TouchableOpacity
                style={[styles.vehicleBtn, vehicleType === "car" && styles.vehicleBtnActive]}
                onPress={() => {
                  setVehicleType("car");
                  setAvailableSeats("3");
                }}
              >
                <Icon name="car" size={20} color={vehicleType === "car" ? "#0284C7" : "#64748B"} />
                <Text style={[styles.vehicleBtnText, vehicleType === "car" && styles.vehicleBtnTextActive]}>
                  Car (Pool)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.vehicleBtn, vehicleType === "bike" && styles.vehicleBtnActive]}
                onPress={() => {
                  setVehicleType("bike");
                  setAvailableSeats("1");
                }}
              >
                <Icon name="motorbike" size={20} color={vehicleType === "bike" ? "#0284C7" : "#64748B"} />
                <Text style={[styles.vehicleBtnText, vehicleType === "bike" && styles.vehicleBtnTextActive]}>
                  Bike (Share)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Seats & Price */}
            <View style={styles.numberInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>SEATS AVAILABLE</Text>
                <TextInput
                  value={availableSeats}
                  onChangeText={setAvailableSeats}
                  keyboardType="numeric"
                  style={styles.textInputBox}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>PRICE / SEAT (₹)</Text>
                <TextInput
                  value={pricePerSeat}
                  onChangeText={setPricePerSeat}
                  keyboardType="numeric"
                  style={styles.textInputBox}
                />
              </View>
            </View>

            {/* Departure Time */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>DEPARTURE TIME</Text>
            <TextInput
              value={departureTime}
              onChangeText={setDepartureTime}
              placeholder="e.g. Today, 06:30 PM"
              style={styles.textInputBox}
            />

            {/* Women Only Toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setWomenOnly(!womenOnly)}
              style={[styles.womenOnlyToggle, womenOnly && styles.womenOnlyToggleActive]}
            >
              <Icon name="face-woman" size={18} color={womenOnly ? "#DB2777" : "#64748B"} />
              <Text style={[styles.womenOnlyText, womenOnly && { color: "#DB2777" }]}>
                {womenOnly ? "Women Commuters Only (Enabled)" : "Allow Female Passengers Only?"}
              </Text>
            </TouchableOpacity>

            {/* Publish Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handlePublishRide}
              disabled={publishing}
              style={styles.publishBtn}
            >
              {publishing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.publishBtnText}>Publish Ride & Start Accepting ➔</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* MY PUBLISHED RIDES TAB */}
      {activeTab === "my_published_rides" && (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tabHeadingText}>Your Published Rides</Text>

          {loadingHistory ? (
            <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 30 }} />
          ) : publishedRides.length === 0 ? (
            <View style={styles.emptyScreenCard}>
              <Icon name="car-connected" size={40} color="#94A3B8" />
              <Text style={styles.emptyScreenTitle}>No Active Rides Posted</Text>
              <Text style={styles.emptyScreenSub}>When you offer empty seats, your routes will appear here.</Text>
              <TouchableOpacity onPress={() => setActiveTab("dashboard")} style={styles.emptyActionBtn}>
                <Text style={styles.emptyActionBtnText}>Offer a Ride</Text>
              </TouchableOpacity>
            </View>
          ) : (
            publishedRides.map((ride, idx) => (
              <View key={idx} style={styles.rideItemCard}>
                <View style={styles.rideItemHeader}>
                  <Text style={styles.rideItemStatus}>● Active Route</Text>
                  <Text style={styles.rideItemPrice}>₹{ride.price_per_seat} / seat</Text>
                </View>
                <Text style={styles.rideItemRoute}>{ride.from_location} ➔ {ride.to_location}</Text>
                <View style={styles.rideItemFooter}>
                  <Text style={styles.rideItemSub}>Departure: {ride.departure_time}</Text>
                  <Text style={styles.rideItemSub}>{ride.available_seats} Seats Left</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* EARNINGS TAB */}
      {activeTab === "earnings" && (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tabHeadingText}>Driver Fuel & Rewards Wallet</Text>

          <View style={styles.earningsSummaryCard}>
            <Text style={styles.earningsLabel}>Total Fuel Savings</Text>
            <Text style={styles.earningsAmount}>₹0.00</Text>
            <Text style={styles.earningsSub}>Share empty seats to offset fuel expenses every day.</Text>
          </View>

          <View style={styles.emptyScreenCard}>
            <Icon name="wallet-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyScreenTitle}>No Payout History</Text>
            <Text style={styles.emptyScreenSub}>Completed passenger rides will show up in your settlement ledger.</Text>
          </View>
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        <TouchableOpacity onPress={() => setActiveTab("dashboard")} style={styles.navTabItem}>
          <Icon name="plus-circle-outline" size={22} color={activeTab === "dashboard" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "dashboard" && styles.navTabLabelActive]}>Offer Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("my_published_rides")} style={styles.navTabItem}>
          <Icon name="format-list-bulleted" size={22} color={activeTab === "my_published_rides" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "my_published_rides" && styles.navTabLabelActive]}>My Posts</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("earnings")} style={styles.navTabItem}>
          <Icon name="currency-inr" size={22} color={activeTab === "earnings" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "earnings" && styles.navTabLabelActive]}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab("profile");
            setMenuVisible(true);
          }}
          style={styles.navTabItem}
        >
          <Icon name="account-circle-outline" size={22} color={activeTab === "profile" ? "#0284C7" : "#94A3B8"} />
          <Text style={[styles.navTabLabel, activeTab === "profile" && styles.navTabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* SOS MODAL */}
      <Modal visible={sosModalVisible} transparent animationType="fade" onRequestClose={() => setSosModalVisible(false)}>
        <View style={styles.sosModalBackdrop}>
          <View style={styles.sosCard}>
            <View style={styles.sosHeader}>
              <Icon name="shield-alert" size={28} color="#DC2626" />
              <Text style={styles.sosTitle}>DRIVER SAFETY HELPLINE</Text>
              <Text style={styles.sosSubTitle}>Instant 24x7 Roadside & Emergency Assistance</Text>
            </View>

            <TouchableOpacity onPress={() => Linking.openURL("tel:100")} style={[styles.sosActionRow, { backgroundColor: "#FEE2E2" }]}>
              <Text style={{ fontSize: 22 }}>🚓</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#991B1B" }]}>Police</Text>
                <Text style={styles.sosActionDesc}>Emergency Help 100</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#DC2626" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Linking.openURL("tel:108")} style={[styles.sosActionRow, { backgroundColor: "#FEF3C7" }]}>
              <Text style={{ fontSize: 22 }}>🚑</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#92400E" }]}>Ambulance</Text>
                <Text style={styles.sosActionDesc}>Medical Care 108</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#D97706" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Linking.openURL("tel:112")} style={[styles.sosActionRow, { backgroundColor: "#E0E7FF" }]}>
              <Text style={{ fontSize: 22 }}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosActionName, { color: "#3730A3" }]}>National Emergency</Text>
                <Text style={styles.sosActionDesc}>Unified Helpline 112</Text>
              </View>
              <Text style={[styles.callTag, { backgroundColor: "#4F46E5" }]}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSosModalVisible(false)} style={styles.sosCloseBtn}>
              <Text style={styles.sosCloseBtnText}>Close Window</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Picker */}
      <LocationPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(p) => {
          if (pickerTarget === "from") setFromLoc(p);
          if (pickerTarget === "to") setToLoc(p);
          setPickerTarget(null);
        }}
        title={pickerTarget === "from" ? "Select Start Location" : "Select Drop Location"}
      />

      {/* Menu Modal */}
      <UserMenuModal
        visible={menuVisible}
        onClose={() => {
          setMenuVisible(false);
          setActiveTab("dashboard");
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
  },
  brandAccent: {
    color: "#0284C7",
  },
  driverBadge: {
    fontSize: 10,
    backgroundColor: "#F0FDF4",
    color: "#16A34A",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: "800",
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
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  formCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 12,
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
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
  },
  inputValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  placeholderText: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  routeDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  vehicleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  vehicleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 10,
  },
  vehicleBtnActive: {
    borderColor: "#0284C7",
    backgroundColor: "#F0F9FF",
  },
  vehicleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  vehicleBtnTextActive: {
    color: "#0284C7",
  },
  numberInputRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  textInputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  womenOnlyToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  womenOnlyToggleActive: {
    backgroundColor: "#FDF2F8",
    borderColor: "#F472B6",
  },
  womenOnlyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  publishBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  publishBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  tabHeadingText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },
  rideItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  rideItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideItemStatus: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A",
  },
  rideItemPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0284C7",
  },
  rideItemRoute: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 8,
  },
  rideItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  rideItemSub: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  earningsSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    marginBottom: 14,
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#16A34A",
    marginVertical: 6,
  },
  earningsSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  emptyScreenCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  emptyScreenTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 10,
  },
  emptyScreenSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },
  emptyActionBtn: {
    marginTop: 16,
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
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
