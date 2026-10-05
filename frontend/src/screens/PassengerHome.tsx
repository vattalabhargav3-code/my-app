import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmhhcmdhdjE4MTkiLCJhIjoiY211bnJxOGJ6MDJnNjJ4cGNucWV3ZTB5ZyJ9.eeQZMTPajF3ggl5E1ovH0Q";

const POPULAR_HUBS = [
  { name: "Hitec City Cyber Towers", lat: 17.4435, lon: 78.3772 },
  { name: "Gachibowli DLF", lat: 17.4401, lon: 78.3489 },
  { name: "Madhapur Metro", lat: 17.4483, lon: 78.3915 },
  { name: "LB Nagar Ring Road", lat: 17.3457, lon: 78.5522 },
  { name: "Kukatpally KPHB", lat: 17.4947, lon: 78.3996 },
  { name: "Secunderabad Station", lat: 17.4399, lon: 78.4983 },
  { name: "Financial District", lat: 17.4141, lon: 78.3412 },
  { name: "Banjara Hills Rd 12", lat: 17.4156, lon: 78.4357 },
];

export function PassengerHome({ navigation }: any) {
  const [passengerName, setPassengerName] = useState("BHARGAV");
  const [startPoint, setStartPoint] = useState("LB Nagar, Hyderabad");
  const [startCoords, setStartCoords] = useState({ lat: 17.3457, lon: 78.5522 });
  const [endPoint, setEndPoint] = useState("Madhapur, Hyderabad");
  const [endCoords, setEndCoords] = useState({ lat: 17.4483, lon: 78.3915 });

  const [publishedRides, setPublishedRides] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"HOME" | "RIDES" | "OFFERS" | "PROFILE">("HOME");

  // Rapido Style Interactive Drag Map Modal State
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"PICKUP" | "DROP">("PICKUP");
  const [mapCenter, setMapCenter] = useState({ lat: 17.3457, lon: 78.5522 });
  const [selectedAddress, setSelectedAddress] = useState("LB Nagar, Hyderabad");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
        if (stored) {
          setPublishedRides(JSON.parse(stored));
        }
        const profile = window.localStorage.getItem("DRIVER_REGISTERED_PROFILE");
        if (profile) {
          const p = JSON.parse(profile);
          if (p.name) setPassengerName(p.name.toUpperCase());
        }
      }
    } catch {}
  }, []);

  const openMapPicker = (mode: "PICKUP" | "DROP") => {
    setPickerMode(mode);
    const coords = mode === "PICKUP" ? startCoords : endCoords;
    const addr = mode === "PICKUP" ? startPoint : endPoint;
    setMapCenter(coords);
    setSelectedAddress(addr);
    setSearchQuery("");
    setSearchResults([]);
    setMapModalVisible(true);
  };

  const handleLiveSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        text.trim()
      )}.json?access_token=${MAPBOX_TOKEN}&country=in&proximity=78.4867,17.3850&types=neighborhood,locality,place,poi,address&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.features) {
        setSearchResults(data.features);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const pickSearchedLocation = (item: any) => {
    const lat = item.center[1];
    const lon = item.center[0];
    const name = item.text + ", Hyderabad";
    setMapCenter({ lat, lon });
    setSelectedAddress(name);
    setSearchQuery("");
    setSearchResults([]);
  };

  const fetchLiveGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const name = `Live GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setMapCenter({ lat, lon });
          setSelectedAddress(name);
          setIsFetchingGps(false);
        },
        () => {
          setIsFetchingGps(false);
          alert("GPS Permission denied. Type location to search.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const confirmLocationChoice = () => {
    if (pickerMode === "PICKUP") {
      setStartPoint(selectedAddress);
      setStartCoords(mapCenter);
    } else {
      setEndPoint(selectedAddress);
      setEndCoords(mapCenter);
    }
    setMapModalVisible(false);
  };

  // Drag simulation helpers
  const nudgeMap = (dLat: number, dLon: number, label: string) => {
    const newLat = mapCenter.lat + dLat;
    const newLon = mapCenter.lon + dLon;
    setMapCenter({ lat: newLat, lon: newLon });
    setSelectedAddress(label);
  };

  const homeMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${startCoords.lon},${startCoords.lat},13.5,0/800x480@2x?access_token=${MAPBOX_TOKEN}`;
  const modalMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${mapCenter.lon},${mapCenter.lat},15,0/800x600@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.topTag}>PASSENGER POOL</Text>
            <Text style={styles.topGreeting}>Hi, {passengerName} 👋</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              style={styles.sosButton}
              onPress={() => Linking.openURL("tel:112").catch(() => alert("Calling 112..."))}
            >
              <Text style={styles.sosButtonText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollArea}>
          {/* Main Map Background with Hardware Acceleration Badge */}
          <View style={styles.homeMapContainer}>
            {/* @ts-ignore */}
            <img
              src={homeMapUrl}
              alt="Live City Map"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <View style={styles.hardwareBadge}>
              <Text style={styles.hardwareBadgeText}>⚡ Hardware Accelerated (Fast)</Text>
            </View>

            {/* Live Center Pin */}
            <View style={styles.homeFixedPin} pointerEvents="none">
              <View style={styles.pinBubbleGreen}>
                <View style={styles.innerDotWhite} />
              </View>
              <View style={styles.pinStemGreen} />
            </View>
          </View>

          {/* Clean Rapido-Style Pure White Location Selection Card */}
          <View style={styles.whiteRouteCard}>
            {/* Pickup Selector */}
            <TouchableOpacity
              style={styles.routeRow}
              onPress={() => openMapPicker("PICKUP")}
              activeOpacity={0.8}
            >
              <View style={styles.greenDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>PICKUP POINT</Text>
                <Text style={styles.routeAddressText} numberOfLines={1}>
                  {startPoint}
                </Text>
              </View>
              <Text style={styles.searchIconText}>🔍</Text>
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            {/* Drop Selector */}
            <TouchableOpacity
              style={styles.routeRow}
              onPress={() => openMapPicker("DROP")}
              activeOpacity={0.8}
            >
              <View style={styles.redSquare} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DROP POINT</Text>
                <Text style={styles.routeAddressText} numberOfLines={1}>
                  {endPoint}
                </Text>
              </View>
              <Text style={styles.searchIconText}>🔍</Text>
            </TouchableOpacity>

            {/* Pools Action Button */}
            <TouchableOpacity
              style={styles.poolsChoodandiBtn}
              onPress={() => alert(`Searching pools from ${startPoint} to ${endPoint}...`)}
              activeOpacity={0.85}
            >
              <Text style={styles.poolsChoodandiText}>Pools Choodandi ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Live Rides Feed */}
          <View style={styles.liveRidesHeaderRow}>
            <Text style={styles.sectionTitle}>Live Rides</Text>
            <TouchableOpacity onPress={() => alert("Refreshing pools...")}>
              <Text style={styles.refreshLink}>Wait / Refresh</Text>
            </TouchableOpacity>
          </View>

          {publishedRides.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>🚗</Text>
              <Text style={styles.emptyStateTitle}>No live rides published yet</Text>
              <Text style={styles.emptyStateSub}>
                Driver App lo ride create cheyagane ventane ikkadiki live sync avthundi.
              </Text>
            </View>
          ) : (
            publishedRides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.rideDriverName}>{ride.driver_name || "Driver Partner"}</Text>
                  <Text style={styles.rideFare}>₹{ride.price_per_seat} / seat</Text>
                </View>
                <Text style={styles.rideVehicle}>{ride.vehicle_name} • {ride.plate_type === "WHITE" ? "Green Saver" : "Commercial Express"}</Text>
                <Text style={styles.rideRoute}>
                  📍 {ride.from_location} ➔ 🏁 {ride.to_location}
                </Text>
                <TouchableOpacity
                  style={styles.bookRideBtn}
                  onPress={() => alert(`Booking seat with ${ride.driver_name}!`)}
                >
                  <Text style={styles.bookRideBtnText}>Book Seat ➔</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* ---------------- RAPIDO/UBER STYLE INTERACTIVE DRAG MAP MODAL ---------------- */}
        <Modal visible={mapModalVisible} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* Top Bar with Search & Back */}
            <View style={styles.modalTopHeader}>
              <TouchableOpacity
                onPress={() => setMapModalVisible(false)}
                style={styles.backCircleBtn}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0F172A" }}>←</Text>
              </TouchableOpacity>

              <View style={styles.searchBarWrap}>
                <Text style={{ fontSize: 14 }}>🔍</Text>
                <TextInput
                  style={styles.searchBarInput}
                  placeholder={`Search ${pickerMode === "PICKUP" ? "Pickup" : "Drop"} location in Hyderabad...`}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={handleLiveSearch}
                />
                {loadingSearch && <ActivityIndicator size="small" color="#0284C7" />}
              </View>
            </View>

            {/* Live Autocomplete Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsDropdown}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultRow}
                    onPress={() => pickSearchedLocation(item)}
                  >
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{item.text}</Text>
                      <Text style={styles.resultSub} numberOfLines={1}>{item.place_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Interactive Map Area with Fixed Center Pin */}
            <View style={styles.interactiveMapLayer}>
              {/* @ts-ignore */}
              <img
                src={modalMapUrl}
                alt="Interactive Map"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Rapido Fixed Center Pin */}
              <View style={styles.fixedPinWrapper} pointerEvents="none">
                <View style={pickerMode === "PICKUP" ? styles.pinBubbleGreen : styles.pinBubbleRed}>
                  <View style={styles.innerDotWhite} />
                </View>
                <View style={pickerMode === "PICKUP" ? styles.pinStemGreen : styles.pinStemRed} />
                <View style={styles.pinShadow} />
              </View>

              {/* Drag / Nudge Floating Controls for Browser Drag Simulation */}
              <View style={styles.nudgeContainer}>
                <Text style={styles.dragHelpText}>Drag map or tap directions to reposition pin:</Text>
                <View style={styles.nudgeButtonsRow}>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => nudgeMap(0.005, 0, "North Zone, Hyderabad")}
                  >
                    <Text style={styles.nudgeBtnText}>▲ North</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => nudgeMap(-0.005, 0, "South Zone, Hyderabad")}
                  >
                    <Text style={styles.nudgeBtnText}>▼ South</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => nudgeMap(0, -0.005, "West / Hitec Zone")}
                  >
                    <Text style={styles.nudgeBtnText}>◀ West</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => nudgeMap(0, 0.005, "East / LB Nagar Zone")}
                  >
                    <Text style={styles.nudgeBtnText}>▶ East</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Live GPS Floating Button */}
              <TouchableOpacity
                style={styles.floatingGpsBtn}
                onPress={fetchLiveGps}
                disabled={isFetchingGps}
              >
                {isFetchingGps ? (
                  <ActivityIndicator size="small" color="#0284C7" />
                ) : (
                  <Text style={{ fontSize: 18 }}>🎯</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Confirmation Sheet */}
            <View style={styles.bottomSheetConfirm}>
              <Text style={styles.confirmSheetLabel}>
                {pickerMode === "PICKUP" ? "SELECTED PICKUP LOCATION" : "SELECTED DROP LOCATION"}
              </Text>

              <View style={styles.selectedAddressBox}>
                <View style={pickerMode === "PICKUP" ? styles.greenDot : styles.redSquare} />
                <Text style={styles.selectedAddressText} numberOfLines={2}>
                  {selectedAddress}
                </Text>
              </View>

              {/* Popular Quick Hub Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {POPULAR_HUBS.map((hub) => (
                    <TouchableOpacity
                      key={hub.name}
                      style={styles.hubChip}
                      onPress={() => {
                        setMapCenter({ lat: hub.lat, lon: hub.lon });
                        setSelectedAddress(`${hub.name}, Hyderabad`);
                      }}
                    >
                      <Text style={styles.hubChipText}>{hub.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.confirmLocationBtn}
                onPress={confirmLocationChoice}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmLocationBtnText}>
                  Confirm {pickerMode === "PICKUP" ? "Pickup" : "Drop"} ➔
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavBar}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab("HOME")}
          >
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={[styles.navText, activeTab === "HOME" && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab("RIDES")}
          >
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={[styles.navText, activeTab === "RIDES" && styles.navTextActive]}>Naa Rides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab("OFFERS")}
          >
            <Text style={{ fontSize: 18 }}>🎁</Text>
            <Text style={[styles.navText, activeTab === "OFFERS" && styles.navTextActive]}>Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab("PROFILE")}
          >
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={[styles.navText, activeTab === "PROFILE" && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default PassengerHome;

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
  topTag: { fontSize: 8, fontWeight: "800", color: "#D97706", letterSpacing: 0.5 },
  topGreeting: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  sosButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  scrollArea: { paddingBottom: 80 },
  homeMapContainer: {
    width: "100%",
    height: 250,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  hardwareBadge: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  hardwareBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  homeFixedPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -28 }],
    alignItems: "center",
    zIndex: 10,
  },
  // Pure White Rapido-style Floating Card
  whiteRouteCard: {
    marginHorizontal: 16,
    marginTop: -40,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    zIndex: 20,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  greenDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981" },
  redSquare: { width: 12, height: 12, borderRadius: 3, backgroundColor: "#EF4444" },
  routeLabel: { fontSize: 8, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  routeAddressText: { fontSize: 13, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  searchIconText: { fontSize: 14, color: "#94A3B8" },
  routeDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 6 },
  poolsChoodandiBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  poolsChoodandiText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  liveRidesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  refreshLink: { fontSize: 11, fontWeight: "800", color: "#0284C7" },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyStateTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  emptyStateSub: { fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 4 },
  rideCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  rideDriverName: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  rideFare: { fontSize: 14, fontWeight: "900", color: "#16A34A" },
  rideVehicle: { fontSize: 11, color: "#64748B", marginTop: 2 },
  rideRoute: { fontSize: 12, fontWeight: "700", color: "#1E293B", marginTop: 8 },
  bookRideBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  bookRideBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  // Bottom Bar
  bottomNavBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navText: { fontSize: 10, fontWeight: "700", color: "#94A3B8", marginTop: 2 },
  navTextActive: { color: "#0F172A", fontWeight: "900" },
  // Interactive Modal Styles
  modalTopHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchBarInput: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0F172A" },
  searchResultsDropdown: {
    position: "absolute",
    top: 60,
    left: 14,
    right: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    maxHeight: 220,
    elevation: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  resultTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  resultSub: { fontSize: 10, color: "#64748B", marginTop: 2 },
  interactiveMapLayer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  fixedPinWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -14 }, { translateY: -32 }],
    alignItems: "center",
    zIndex: 10,
  },
  pinBubbleGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  pinBubbleRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  innerDotWhite: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  pinStemGreen: { width: 3, height: 10, backgroundColor: "#10B981" },
  pinStemRed: { width: 3, height: 10, backgroundColor: "#EF4444" },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.25)",
    marginTop: 2,
  },
  nudgeContainer: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },
  dragHelpText: { fontSize: 10, fontWeight: "800", color: "#475569", marginBottom: 6 },
  nudgeButtonsRow: { flexDirection: "row", gap: 6 },
  nudgeBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nudgeBtnText: { fontSize: 10, fontWeight: "800", color: "#0F172A" },
  floatingGpsBtn: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  bottomSheetConfirm: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 10,
  },
  confirmSheetLabel: { fontSize: 9, fontWeight: "900", color: "#94A3B8", letterSpacing: 0.5 },
  selectedAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginVertical: 10,
  },
  selectedAddressText: { fontSize: 13, fontWeight: "800", color: "#0F172A", flex: 1 },
  hubChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hubChipText: { fontSize: 11, fontWeight: "700", color: "#334155" },
  confirmLocationBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmLocationBtnText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
});
