import React, { useState, useEffect, useRef } from "react";
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

const RECENT_SEARCHES = [
  { id: "1", title: "1-30/3", sub: "Rajnagar Colony, Saraswathi Colony, Uppal, Hyderabad", lat: 17.4018, lon: 78.5602 },
  { id: "2", title: "Lunar loft cafe&kitchen", sub: "Chaitanya Nagar, B.N Reddy Nagar, Hyderabad", lat: 17.3312, lon: 78.5638 },
  { id: "3", title: "1a", sub: "near by SBI Bank, opp. D Mart Road, Barkatpura, Hyderabad", lat: 17.3888, lon: 78.4981 },
];

export function PassengerHome({ navigation }: any) {
  // Passenger Profile
  const [passengerName, setPassengerName] = useState("BHARGAV");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [walletBalance, setWalletBalance] = useState(250);

  // Map Coordinates & Real-time Address
  const [mapCenter, setMapCenter] = useState({ lat: 17.3341, lon: 78.5670 }); // Hyderabad (Vanasthalipuram / BN Reddy region)
  const [pickupAddress, setPickupAddress] = useState("125, Harithasa Ave, Harithapuri Colony, Hyderabad");
  const [dropAddress, setDropAddress] = useState("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<"RIDE" | "POOLS" | "OFFERS" | "PROFILE">("RIDE");
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"PICKUP" | "DROP">("DROP");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Safety & Mode Filters
  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // Live Rides & Real Bookings (NO DUMMY DEMO CARD)
  const [publishedRides, setPublishedRides] = useState<any[]>([]);
  const [bookedRide, setBookedRide] = useState<any | null>(null);

  // Map HTML & Instance Refs
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstance = useRef<any>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
        if (stored) setPublishedRides(JSON.parse(stored));
        const profile = window.localStorage.getItem("DRIVER_REGISTERED_PROFILE");
        if (profile) {
          const p = JSON.parse(profile);
          if (p.name) setPassengerName(p.name.toUpperCase());
          if (p.phone) setPassengerPhone(p.phone);
        }
      }
    } catch {}
  }, []);

  // Reverse Geocoding when map pin stops moving
  const resolveAddressFromCoords = async (lat: number, lon: number) => {
    setIsResolvingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const cleanName = `${parts[0] || ""}, ${parts[1] || ""}, ${parts[2] || ""}`;
        setPickupAddress(cleanName);
      } else {
        setPickupAddress(`Pin Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch {
      setPickupAddress(`Pin Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Full-screen isolated interactive Leaflet Map Engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    const injectLeafletAssets = () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initMainDashboardMap();
        document.body.appendChild(script);
      } else {
        setTimeout(initMainDashboardMap, 80);
      }
    };

    const initMainDashboardMap = () => {
      const L = (window as any).L;
      if (!L || !mapElementRef.current) return;

      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }

      const map = L.map(mapElementRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [mapCenter.lat, mapCenter.lon],
        zoom: 16,
        bounceAtZoomLimits: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      map.on("movestart", () => setIsMapDragging(true));

      map.on("moveend", () => {
        setIsMapDragging(false);
        const center = map.getCenter();
        setMapCenter({ lat: center.lat, lon: center.lng });
        resolveAddressFromCoords(center.lat, center.lng);
      });

      leafletMapInstance.current = map;
    };

    injectLeafletAssets();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, []);

  const fetchDeviceLiveGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setMapCenter({ lat, lon });
          resolveAddressFromCoords(lat, lon);
          if (leafletMapInstance.current) {
            leafletMapInstance.current.setView([lat, lon], 17);
          }
          setIsFetchingGps(false);
        },
        () => {
          setIsFetchingGps(false);
          alert("GPS permission denied. Please allow location access.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleSearchPlaces = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text.trim() + ", Hyderabad")}&limit=5`
      );
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const pickLocationItem = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const placeName = item.display_name.split(",").slice(0, 3).join(",");

    if (searchTarget === "DROP") {
      setDropAddress(placeName);
    } else {
      setPickupAddress(placeName);
      setMapCenter({ lat, lon });
      if (leafletMapInstance.current) {
        leafletMapInstance.current.setView([lat, lon], 16);
      }
    }
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const triggerDefenseSiren = () => {
    setIsSirenActive(!isSirenActive);
    if (!isSirenActive) alert("🚨 DEFENSE SIREN ALARM TRIGGERED!");
  };

  const shareRideWhatsAppSafety = () => {
    const msg = `🚨 SAFETY ALERT: I am travelling from ${pickupAddress} to ${dropAddress || "Destination"}. Tracking Link: https://my-app-frontend-blue.vercel.app/track`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Full-screen Isolated Interactive Leaflet Map Background */}
        <View style={styles.fullScreenMapWrap}>
          <div
            ref={mapElementRef as any}
            style={{
              width: "100%",
              height: "100%",
              cursor: isMapDragging ? "grabbing" : "grab",
              touchAction: "none",
            }}
          />

          {/* Rapido Fixed Center Pinpoint with Elevation on Drag */}
          <View
            style={[
              styles.centerFixedPinWrap,
              isMapDragging && { transform: [{ translateX: -14 }, { translateY: -44 }] },
            ]}
            pointerEvents="none"
          >
            {/* Green Pickup Point Pill */}
            <View style={styles.pickupPillBadge}>
              <Text style={styles.pickupPillBadgeText}>Pickup Point</Text>
            </View>

            {/* Target Pin Icon */}
            <View style={styles.pinBubbleGreen}>
              <View style={styles.pinInnerDotWhite} />
            </View>
            <View style={styles.pinStem} />
            <View style={styles.pinShadowDot} />
          </View>

          {/* Floating Current Pickup Address Capsule */}
          <View style={styles.floatingAddressPillBox}>
            <View style={styles.greenRingIcon} />
            <View style={{ flex: 1 }}>
              {isResolvingAddress ? (
                <Text style={styles.resolvingText}>Locating address...</Text>
              ) : (
                <Text style={styles.floatingAddressPillText} numberOfLines={1}>
                  {pickupAddress}
                </Text>
              )}
            </View>
          </View>

          {/* Floating Device GPS Re-center Button */}
          <TouchableOpacity style={styles.floatingGpsBtn} onPress={fetchDeviceLiveGps} disabled={isFetchingGps}>
            {isFetchingGps ? <ActivityIndicator size="small" color="#0284C7" /> : <Text style={{ fontSize: 20 }}>🎯</Text>}
          </TouchableOpacity>
        </View>

        {/* Floating Top Floating Nav Bar (Menu & Safety Badges) */}
        <View style={styles.floatingTopBar}>
          <TouchableOpacity style={styles.menuIconBtn} onPress={() => setShowDrawerMenu(true)}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0F172A" }}>☰</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[styles.womenBadgeBtn, womenOnlyFilter && styles.womenBadgeBtnActive]}
              onPress={() => setWomenOnlyFilter(!womenOnlyFilter)}
            >
              <Text style={styles.womenBadgeBtnText}>🌸 {womenOnlyFilter ? "Pink Pool ON" : "Women Ride"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
              <Text style={styles.sosButtonText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- RAPIDO-STYLE BOTTOM SHEET CARD ---------------- */}
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHandle} />

          {/* "Where do you want to go?" Search Input */}
          <TouchableOpacity
            style={styles.searchBarTrigger}
            onPress={() => {
              setSearchTarget("DROP");
              setShowSearchModal(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <Text style={[styles.searchBarTriggerText, !dropAddress && { color: "#0F172A" }]}>
              {dropAddress || "Where do you want to go?"}
            </Text>
          </TouchableOpacity>

          {/* Mode Filters (Petrol Saver vs Commercial Cab) */}
          <View style={styles.plateFilterRow}>
            <TouchableOpacity
              style={[styles.plateFilterChip, plateFilter === "ALL" && styles.plateFilterChipActive]}
              onPress={() => setPlateFilter("ALL")}
            >
              <Text style={[styles.plateFilterText, plateFilter === "ALL" && styles.plateFilterTextActive]}>All Rides</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.plateFilterChip, plateFilter === "WHITE" && styles.plateFilterChipActive]}
              onPress={() => setPlateFilter("WHITE")}
            >
              <Text style={[styles.plateFilterText, plateFilter === "WHITE" && styles.plateFilterTextActive]}>⚪ Petrol Saver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.plateFilterChip, plateFilter === "YELLOW" && styles.plateFilterChipActiveYellow]}
              onPress={() => setPlateFilter("YELLOW")}
            >
              <Text style={[styles.plateFilterText, plateFilter === "YELLOW" && styles.plateFilterTextActiveYellow]}>🟡 Commercial Cab</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Location History List */}
          <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
            {RECENT_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentLocationRow}
                onPress={() => {
                  setDropAddress(`${item.title}, ${item.sub}`);
                }}
              >
                <Text style={{ fontSize: 15, color: "#64748B" }}>🕒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentItemTitle}>{item.title}</Text>
                  <Text style={styles.recentItemSub} numberOfLines={1}>{item.sub}</Text>
                </View>
                <Text style={{ fontSize: 16, color: "#94A3B8" }}>♡</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active Booked Ride (ONLY IF ACTUALLY BOOKED - NO DEMO) */}
          {bookedRide && (
            <View style={styles.realBookedRideCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.realBookedStatus}>TRIP ACTIVE • {bookedRide.eta}</Text>
                </View>
                <Text style={styles.realBookedFare}>₹{bookedRide.fare}</Text>
              </View>

              <View style={styles.otpBanner}>
                <Text style={styles.otpBannerLabel}>SHARE OTP WITH DRIVER</Text>
                <Text style={styles.otpBannerNum}>{bookedRide.otp}</Text>
              </View>

              <Text style={styles.bookedDriverName}>{bookedRide.driver_name} • {bookedRide.vehicle_name}</Text>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  style={styles.callDriverBtn}
                  onPress={() => Linking.openURL(`tel:${bookedRide.driver_phone}`)}
                >
                  <Text style={styles.callDriverText}>📞 Call Driver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBookingBtn}
                  onPress={() => {
                    setBookedRide(null);
                    alert("Booking cancelled.");
                  }}
                >
                  <Text style={styles.cancelBookingText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ---------------- BOTTOM NAVIGATION BAR ---------------- */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("RIDE")}>
            <Text style={{ fontSize: 18 }}>📍</Text>
            <Text style={[styles.navBarText, activeTab === "RIDE" && styles.navBarTextActive]}>Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("POOLS");
              alert("Available Pools: " + publishedRides.length);
            }}
          >
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={[styles.navBarText, activeTab === "POOLS" && styles.navBarTextActive]}>Pools</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("OFFERS");
              alert(`Rewards & Referral Code: PASSENGER${passengerPhone.slice(-4)}`);
            }}
          >
            <Text style={{ fontSize: 18 }}>🎁</Text>
            <Text style={[styles.navBarText, activeTab === "OFFERS" && styles.navBarTextActive]}>Rewards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("PROFILE");
              setShowEditProfileModal(true);
            }}
          >
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={[styles.navBarText, activeTab === "PROFILE" && styles.navBarTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- SIDE MENU DRAWER (ALL REQUESTED OPTIONS) ---------------- */}
        <Modal visible={showDrawerMenu} transparent animationType="fade">
          <View style={styles.menuBackdrop}>
            <View style={styles.drawerCard}>
              <View style={styles.drawerHeaderRow}>
                <View>
                  <Text style={styles.drawerName}>{passengerName}</Text>
                  <Text style={styles.drawerPhone}>📱 {passengerPhone}</Text>
                  <Text style={styles.drawerWalletText}>Wallet: ₹{walletBalance}.00</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDrawerMenu(false)}>
                  <Text style={{ fontSize: 20, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  alert("RidePool 24x7 Toll-Free Support: 1800-419-0099");
                }}
              >
                <Text style={styles.drawerItemIcon}>📞</Text>
                <Text style={styles.drawerItemLabel}>Help Line & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  alert("No new notifications at this time.");
                }}
              >
                <Text style={styles.drawerItemIcon}>🔔</Text>
                <Text style={styles.drawerItemLabel}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  alert(`Referral Rewards: Share PASSENGER${passengerPhone.slice(-4)} for ₹200 + ₹200`);
                }}
              >
                <Text style={styles.drawerItemIcon}>🎁</Text>
                <Text style={styles.drawerItemLabel}>Rewards & Referrals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  alert(`Current Balance: ₹${walletBalance}. Added via UPI/Cards.`);
                }}
              >
                <Text style={styles.drawerItemIcon}>💳</Text>
                <Text style={styles.drawerItemLabel}>Payments & Wallet</Text>
              </TouchableOpacity>

              <View style={styles.drawerDivider} />
              <Text style={styles.drawerSectionHeader}>SETTINGS</Text>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setShowEditProfileModal(true);
                }}
              >
                <Text style={styles.drawerItemIcon}>✏️</Text>
                <Text style={styles.drawerItemLabel}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  try {
                    if (typeof window !== "undefined" && window.localStorage) {
                      window.localStorage.removeItem("DRIVER_REGISTERED_PROFILE");
                    }
                  } catch {}
                  setShowDrawerMenu(false);
                  alert("Logged out successfully.");
                }}
              >
                <Text style={styles.drawerItemIcon}>🚪</Text>
                <Text style={[styles.drawerItemLabel, { color: "#D97706" }]}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  if (confirm("Are you sure you want to delete your account permanently?")) {
                    try {
                      if (typeof window !== "undefined" && window.localStorage) {
                        window.localStorage.clear();
                      }
                    } catch {}
                    setShowDrawerMenu(false);
                    alert("Account deleted.");
                  }
                }}
              >
                <Text style={styles.drawerItemIcon}>⚠️</Text>
                <Text style={[styles.drawerItemLabel, { color: "#EF4444" }]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDrawerMenu(false)} />
          </View>
        </Modal>

        {/* ---------------- EDIT PROFILE MODAL ---------------- */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalTitle}>Edit Passenger Profile</Text>

              <Text style={styles.inputTag}>FULL NAME</Text>
              <TextInput style={styles.inputBox} value={passengerName} onChangeText={setPassengerName} />

              <Text style={styles.inputTag}>PHONE NUMBER</Text>
              <TextInput style={styles.inputBox} value={passengerPhone} onChangeText={setPassengerPhone} keyboardType="phone-pad" />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  setShowEditProfileModal(false);
                  alert("Profile updated successfully!");
                }}
              >
                <Text style={styles.saveBtnText}>Save Changes ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setShowEditProfileModal(false)}>
                <Text style={{ color: "#64748B", fontWeight: "700" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- SEARCH LOCATION MODAL ---------------- */}
        <Modal visible={showSearchModal} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View style={styles.searchModalHeader}>
              <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.backCircleBtn}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>←</Text>
              </TouchableOpacity>
              <View style={styles.searchInputWrap}>
                <TextInput
                  style={styles.searchInputInner}
                  placeholder="Search destination in Hyderabad..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={handleSearchPlaces}
                  autoFocus
                />
                {loadingSearch && <ActivityIndicator size="small" color="#0284C7" />}
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
              {searchResults.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.searchItemRow} onPress={() => pickLocationItem(item)}>
                  <Text style={{ fontSize: 16 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchItemTitle}>{item.display_name.split(",")[0]}</Text>
                    <Text style={styles.searchItemSub} numberOfLines={1}>{item.display_name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ---------------- SOS SAFETY HUB MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sosHeading}>🚨 Emergency & Safety Center</Text>
                <TouchableOpacity onPress={() => setShowSosModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.sirenAlarmBtn, isSirenActive && styles.sirenAlarmBtnActive]}
                onPress={triggerDefenseSiren}
              >
                <Text style={styles.sirenAlarmText}>
                  {isSirenActive ? "🛑 STOP LOUD SIREN" : "🔊 TRIGGER LOUD DEFENSE SIREN"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sosRow, { backgroundColor: "#FDF2F8", borderColor: "#F472B6", borderWidth: 1 }]}
                onPress={() => Linking.openURL("tel:1091")}
              >
                <Text style={{ fontSize: 20 }}>🌸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sosText, { color: "#BE185D" }]}>SHE Teams Telangana (1091)</Text>
                  <Text style={{ fontSize: 10, color: "#9D174D" }}>Women Safety Rapid Dispatch</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#BE185D" }}>CALL ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sosRow} onPress={() => Linking.openURL("tel:112")}>
                <Text style={{ fontSize: 20 }}>🚓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosText}>Police Emergency (112 / 100)</Text>
                  <Text style={{ fontSize: 10, color: "#991B1B" }}>National Emergency Response</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#DC2626" }}>CALL ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.whatsappSosBtn} onPress={shareRideWhatsAppSafety}>
                <Text style={styles.whatsappSosText}>📲 Share Live Ride on WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export default PassengerHome;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, position: "relative" },
  fullScreenMapWrap: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  // Center Pinpoint
  centerFixedPinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -14 }, { translateY: -36 }],
    alignItems: "center",
    zIndex: 10,
  },
  pickupPillBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 6,
    elevation: 4,
  },
  pickupPillBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  pinBubbleGreen: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInnerDotWhite: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  pinStem: { width: 3, height: 8, backgroundColor: "#16A34A" },
  pinShadowDot: { width: 12, height: 4, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.2)", marginTop: 2 },
  floatingAddressPillBox: {
    position: "absolute",
    top: "58%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 6,
    maxWidth: "90%",
    zIndex: 10,
  },
  greenRingIcon: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: "#16A34A" },
  floatingAddressPillText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  resolvingText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  floatingGpsBtn: {
    position: "absolute",
    right: 16,
    top: "55%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    zIndex: 10,
  },
  // Floating Top Header
  floatingTopBar: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  womenBadgeBtn: {
    backgroundColor: "#FDF2F8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FBCFE8",
    elevation: 3,
  },
  womenBadgeBtnActive: { backgroundColor: "#F472B6", borderColor: "#DB2777" },
  womenBadgeBtnText: { color: "#BE185D", fontSize: 11, fontWeight: "900" },
  sosButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    elevation: 3,
  },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  // Bottom Sheet Container
  bottomSheetContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    elevation: 12,
    zIndex: 20,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 12,
  },
  searchBarTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBarTriggerText: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  plateFilterRow: { flexDirection: "row", gap: 8, marginVertical: 10 },
  plateFilterChip: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    alignItems: "center",
  },
  plateFilterChipActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateFilterChipActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  plateFilterText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  plateFilterTextActive: { color: "#16A34A", fontWeight: "900" },
  plateFilterTextActiveYellow: { color: "#B45309", fontWeight: "900" },
  recentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  recentItemTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  recentItemSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  // Real Booked Ride Box
  realBookedRideCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#10B981",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  realBookedStatus: { fontSize: 10, fontWeight: "900", color: "#16A34A" },
  realBookedFare: { fontSize: 16, fontWeight: "900", color: "#16A34A" },
  pulsingGreenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  otpBanner: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  otpBannerLabel: { color: "#FACC15", fontSize: 9, fontWeight: "800" },
  otpBannerNum: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: 4 },
  bookedDriverName: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  callDriverBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  callDriverText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  cancelBookingBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBookingText: { color: "#DC2626", fontSize: 11, fontWeight: "800" },
  // Bottom Bar
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 30,
  },
  navBarItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBarText: { fontSize: 10, fontWeight: "700", color: "#94A3B8", marginTop: 2 },
  navBarTextActive: { color: "#0F172A", fontWeight: "900" },
  // Side Menu Drawer
  menuBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", flexDirection: "row" },
  drawerCard: { width: "75%", maxWidth: 300, backgroundColor: "#FFFFFF", height: "100%", padding: 20, paddingTop: 36 },
  drawerHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  drawerName: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  drawerPhone: { fontSize: 11, color: "#64748B", marginTop: 2 },
  drawerWalletText: { fontSize: 12, color: "#16A34A", fontWeight: "800", marginTop: 4 },
  drawerDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  drawerSectionHeader: { fontSize: 9, fontWeight: "900", color: "#94A3B8", letterSpacing: 0.5, marginBottom: 8 },
  drawerItemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  drawerItemIcon: { fontSize: 18 },
  drawerItemLabel: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  // Modal General
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  sheetModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginBottom: 12 },
  inputTag: { fontSize: 9, fontWeight: "800", color: "#64748B", marginTop: 10, marginBottom: 4 },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  saveBtn: { backgroundColor: "#0F172A", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 14 },
  saveBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  searchModalHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  backCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  searchInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 20, paddingHorizontal: 12, height: 40 },
  searchInputInner: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0F172A" },
  searchItemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9", gap: 10 },
  searchItemTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  searchItemSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626" },
  sirenAlarmBtn: { backgroundColor: "#DC2626", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginVertical: 12 },
  sirenAlarmBtnActive: { backgroundColor: "#7F1D1D" },
  sirenAlarmText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
  whatsappSosBtn: { backgroundColor: "#25D366", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginVertical: 6 },
  whatsappSosText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
