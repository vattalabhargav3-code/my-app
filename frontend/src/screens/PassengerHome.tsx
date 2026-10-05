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
  // User Profile States
  const [passengerName, setPassengerName] = useState("BHARGAV");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [passengerGender, setPassengerGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [emergencyPhone, setEmergencyPhone] = useState("9876543210");
  const [walletBalance, setWalletBalance] = useState(250);

  // Route & Navigation
  const [startPoint, setStartPoint] = useState("LB Nagar, Hyderabad");
  const [startCoords, setStartCoords] = useState({ lat: 17.3457, lon: 78.5522 });
  const [endPoint, setEndPoint] = useState("Madhapur, Hyderabad");
  const [endCoords, setEndCoords] = useState({ lat: 17.4483, lon: 78.3915 });

  // Filter Modes: ALL, WHITE (Petrol Saver), YELLOW (Commercial Taxi), PINK (Women-Only)
  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<"HOME" | "RIDES" | "OFFERS" | "PROFILE">("HOME");
  const [showSosModal, setShowSosModal] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [publishedRides, setPublishedRides] = useState<any[]>([]);

  // Active Booked Ride (My Rides Tab)
  const [bookedRide, setBookedRide] = useState<any>({
    id: "active_bk_101",
    driver_name: "Karthik R.",
    driver_phone: "9848012345",
    vehicle_name: "Swift Dzire (White Plate)",
    plate_type: "WHITE",
    is_women_driver: false,
    otp: "4821",
    fare: 110,
    status: "ON_THE_WAY",
    eta: "4 mins away",
  });

  // Rapido Real Hand-Drag Map Modal States
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"PICKUP" | "DROP">("PICKUP");
  const [mapCenter, setMapCenter] = useState({ lat: 17.3457, lon: 78.5522 });
  const [selectedAddress, setSelectedAddress] = useState("LB Nagar, Hyderabad");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Offers & Promo
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstance = useRef<any>(null);

  // Sync profile & rides from storage
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
          if (p.phone) setPassengerPhone(p.phone);
        }
      }
    } catch {}
  }, []);

  // Reverse Geocoding: Coords to readable Street/Colony
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsResolvingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const shortName = `${parts[0] || ""}, ${parts[1] || ""}, Hyderabad`;
        setSelectedAddress(shortName);
      } else {
        setSelectedAddress(`Pin Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch {
      setSelectedAddress(`Pin Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Real Hand-Drag Leaflet Map Initialization
  useEffect(() => {
    if (!mapModalVisible || typeof window === "undefined") return;

    const loadLeafletAndInit = () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const scriptId = "leaflet-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initInteractiveMap();
        document.body.appendChild(script);
      } else {
        setTimeout(initInteractiveMap, 100);
      }
    };

    const initInteractiveMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([mapCenter.lat, mapCenter.lon], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Triggered when user finishes hand-dragging
      map.on("moveend", () => {
        const center = map.getCenter();
        setMapCenter({ lat: center.lat, lon: center.lng });
        fetchAddressFromCoords(center.lat, center.lng);
      });

      leafletMapInstance.current = map;
    };

    loadLeafletAndInit();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [mapModalVisible]);

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
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text.trim() + ", Hyderabad"
        )}&limit=5`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const pickSearchedLocation = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setMapCenter({ lat, lon });
    setSelectedAddress(item.display_name.split(",").slice(0, 2).join(",") + ", Hyderabad");
    setSearchQuery("");
    setSearchResults([]);

    if (leafletMapInstance.current) {
      leafletMapInstance.current.setView([lat, lon], 16);
    }
  };

  const fetchLiveGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setMapCenter({ lat, lon });
          fetchAddressFromCoords(lat, lon);
          if (leafletMapInstance.current) {
            leafletMapInstance.current.setView([lat, lon], 17);
          }
          setIsFetchingGps(false);
        },
        () => {
          setIsFetchingGps(false);
          alert("GPS Permission denied. Search location manually.");
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

  // SOS Services Handlers
  const triggerAudioSiren = () => {
    setIsSirenActive(!isSirenActive);
    if (!isSirenActive) {
      alert("🚨 HIGH SECURITY SIREN ALARM ACTIVATED!");
    }
  };

  const shareEmergencyRideWhatsApp = () => {
    const message = `🚨 EMERGENCY ALERT: I am traveling from ${startPoint} to ${endPoint}. Vehicle: ${
      bookedRide?.vehicle_name || "RidePool Car"
    }. Live Security Tracking Link: https://my-app-frontend-blue.vercel.app/track`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  // Filter Published Rides based on White, Yellow, and Pink Pool (Women Only)
  const filteredRides = publishedRides.filter((ride) => {
    if (womenOnlyFilter && !ride.is_women_driver && ride.driver_gender !== "FEMALE") {
      return false;
    }
    if (plateFilter === "WHITE" && ride.plate_type !== "WHITE") return false;
    if (plateFilter === "YELLOW" && ride.plate_type !== "YELLOW") return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.topTag}>PASSENGER POOL</Text>
            <Text style={styles.topGreeting}>Hi, {passengerName} 👋</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[styles.womenBadgeBtn, womenOnlyFilter && styles.womenBadgeBtnActive]}
              onPress={() => setWomenOnlyFilter(!womenOnlyFilter)}
            >
              <Text style={styles.womenBadgeText}>🌸 {womenOnlyFilter ? "Pink Pool ON" : "Women Ride"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
              <Text style={styles.sosButtonText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- TAB 1: HOME (MAP & SEARCH & RIDES FEED) ---------------- */}
        {activeTab === "HOME" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            {/* Top Interactive Map Preview Header */}
            <View style={styles.homeMapContainer}>
              {/* @ts-ignore */}
              <img
                src={`https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${startCoords.lon},${startCoords.lat}&z=14&l=map&size=650,280`}
                alt="Live Map"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <View style={styles.hardwareBadge}>
                <Text style={styles.hardwareBadgeText}>⚡ Live GPS Routing & Real-Time Pool</Text>
              </View>

              <View style={styles.homeFixedPin} pointerEvents="none">
                <View style={styles.pinBubbleGreen}>
                  <View style={styles.innerDotWhite} />
                </View>
                <View style={styles.pinStemGreen} />
              </View>
            </View>

            {/* Pure Modern White Floating Route Selector Card */}
            <View style={styles.whiteRouteCard}>
              <TouchableOpacity
                style={styles.routeRow}
                onPress={() => openMapPicker("PICKUP")}
                activeOpacity={0.8}
              >
                <View style={styles.greenDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>PICKUP POINT (TAP TO DRAG PIN)</Text>
                  <Text style={styles.routeAddressText} numberOfLines={1}>
                    {startPoint}
                  </Text>
                </View>
                <Text style={styles.searchIconText}>📍 Drag</Text>
              </TouchableOpacity>

              <View style={styles.routeDivider} />

              <TouchableOpacity
                style={styles.routeRow}
                onPress={() => openMapPicker("DROP")}
                activeOpacity={0.8}
              >
                <View style={styles.redSquare} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>DROP POINT (TAP TO DRAG PIN)</Text>
                  <Text style={styles.routeAddressText} numberOfLines={1}>
                    {endPoint}
                  </Text>
                </View>
                <Text style={styles.searchIconText}>📍 Drag</Text>
              </TouchableOpacity>

              {/* Ride Mode Selectors: All / Petrol Saver / Commercial Taxi */}
              <View style={styles.plateFilterRow}>
                <TouchableOpacity
                  style={[styles.plateFilterChip, plateFilter === "ALL" && styles.plateFilterChipActive]}
                  onPress={() => setPlateFilter("ALL")}
                >
                  <Text style={[styles.plateFilterText, plateFilter === "ALL" && styles.plateFilterTextActive]}>
                    All Rides
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.plateFilterChip, plateFilter === "WHITE" && styles.plateFilterChipActive]}
                  onPress={() => setPlateFilter("WHITE")}
                >
                  <Text style={[styles.plateFilterText, plateFilter === "WHITE" && styles.plateFilterTextActive]}>
                    ⚪ Petrol Saver
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.plateFilterChip, plateFilter === "YELLOW" && styles.plateFilterChipActiveYellow]}
                  onPress={() => setPlateFilter("YELLOW")}
                >
                  <Text style={[styles.plateFilterText, plateFilter === "YELLOW" && styles.plateFilterTextActiveYellow]}>
                    🟡 Commercial Cab
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.poolsChoodandiBtn}
                onPress={() => alert(`Showing available pools for ${startPoint} ➔ ${endPoint}`)}
                activeOpacity={0.85}
              >
                <Text style={styles.poolsChoodandiText}>Pools Choodandi ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Live Rides Feed */}
            <View style={styles.liveRidesHeaderRow}>
              <Text style={styles.sectionTitle}>
                {womenOnlyFilter ? "🌸 Women-Only Rides (Pink Pool)" : "Available Live Pools"}
              </Text>
              <Text style={styles.refreshLink}>{filteredRides.length} Available</Text>
            </View>

            {filteredRides.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>🚗</Text>
                <Text style={styles.emptyStateTitle}>No live rides matching filter</Text>
                <Text style={styles.emptyStateSub}>
                  Driver App lo kotha ride deploy avvagane ikkada auto sync avthundi.
                </Text>
              </View>
            ) : (
              filteredRides.map((ride) => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.rideDriverName}>{ride.driver_name || "Driver Partner"}</Text>
                      {ride.is_women_driver && (
                        <View style={styles.pinkBadgeMini}>
                          <Text style={styles.pinkBadgeMiniText}>🌸 Women Pilot</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rideFare}>₹{ride.price_per_seat} / seat</Text>
                  </View>

                  <Text style={styles.rideVehicle}>
                    {ride.vehicle_name} • {ride.plate_type === "WHITE" ? "⚪ Green Saver (Petrol)" : "🟡 Commercial Taxi"}
                  </Text>
                  <Text style={styles.rideRoute}>
                    📍 {ride.from_location} ➔ 🏁 {ride.to_location}
                  </Text>

                  <TouchableOpacity
                    style={styles.bookRideBtn}
                    onPress={() => {
                      setBookedRide({
                        id: ride.id,
                        driver_name: ride.driver_name,
                        driver_phone: "9848012345",
                        vehicle_name: ride.vehicle_name,
                        plate_type: ride.plate_type,
                        otp: "5931",
                        fare: ride.price_per_seat,
                        status: "CONFIRMED",
                        eta: "Arriving in 6 mins",
                      });
                      setActiveTab("RIDES");
                      alert("Seat Booked Successfully! Opening My Rides tracking tab.");
                    }}
                  >
                    <Text style={styles.bookRideBtnText}>Book Seat ➔</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* ---------------- TAB 2: MY RIDES (NAA RIDES TRACKING) ---------------- */}
        {activeTab === "RIDES" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 16 }]}>Active Ride Tracking</Text>

            {bookedRide ? (
              <View style={styles.activeRideBox}>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.statusBadgeText}>RIDE IN PROGRESS • {bookedRide.eta}</Text>
                </View>

                {/* Ride OTP for Driver */}
                <View style={styles.otpCard}>
                  <Text style={styles.otpCardLabel}>START TRIP OTP (SHARE WITH DRIVER)</Text>
                  <Text style={styles.otpCardNumber}>{bookedRide.otp}</Text>
                </View>

                <View style={styles.driverInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverBigName}>{bookedRide.driver_name}</Text>
                    <Text style={styles.driverVehicleSub}>{bookedRide.vehicle_name}</Text>
                    <Text style={styles.driverRouteSub}>📍 {startPoint} ➔ 🏁 {endPoint}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.driverFareBig}>₹{bookedRide.fare}</Text>
                    <Text style={{ fontSize: 10, color: "#64748B" }}>Cash / UPI</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
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
                      alert("Booking Cancelled.");
                    }}
                  >
                    <Text style={styles.cancelBookingText}>Cancel Ride</Text>
                  </TouchableOpacity>
                </View>

                {/* Emergency Contact Share Button */}
                <TouchableOpacity style={styles.shareRideBtn} onPress={shareEmergencyRideWhatsApp}>
                  <Text style={styles.shareRideText}>📲 Share Live Ride on WhatsApp (Safety)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>🎫</Text>
                <Text style={styles.emptyStateTitle}>No Active Bookings</Text>
                <Text style={styles.emptyStateSub}>Book a seat from the Home tab to track live trip status here.</Text>
              </View>
            )}

            {/* Past Rides History */}
            <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 24, marginBottom: 8 }]}>Past Rides History</Text>
            <View style={styles.historyCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "800", color: "#0F172A", fontSize: 13 }}>Gachibowli ➔ LB Nagar</Text>
                <Text style={{ fontWeight: "900", color: "#16A34A" }}>₹120</Text>
              </View>
              <Text style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>Completed with Suresh (Swift Dzire) • ⚪ White Plate</Text>
            </View>
          </ScrollView>
        )}

        {/* ---------------- TAB 3: OFFERS & REFERRALS ---------------- */}
        {activeTab === "OFFERS" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.referCard}>
              <Text style={styles.referBigTitle}>🎁 Refer Friends & Win ₹200 + ₹200</Text>
              <Text style={styles.referSub}>
                Invite friends or colleagues. When they take their first carpool ride, both of you receive ₹200 discount coupons!
              </Text>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeTag}>YOUR REFERRAL CODE</Text>
                <Text style={styles.referralCodeText}>{`PASSENGER${passengerPhone.slice(-4)}`}</Text>
              </View>

              <TouchableOpacity
                style={styles.whatsappShareBtn}
                onPress={() => {
                  const txt = `Join RidePool Hyderabad! Use my code PASSENGER${passengerPhone.slice(
                    -4
                  )} to get ₹200 off your first ride: https://my-app-frontend-blue.vercel.app`;
                  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(txt)}`);
                }}
              >
                <Text style={styles.whatsappShareText}>📲 Share Code on WhatsApp (₹200)</Text>
              </TouchableOpacity>
            </View>

            {/* Promo Code Input */}
            <View style={[styles.card, { marginHorizontal: 16, marginTop: 14 }]}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#0F172A" }}>Apply Promo Code</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  placeholder="e.g. GREENHYD50"
                  value={promoCodeInput}
                  onChangeText={setPromoCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyCodeBtn}
                  onPress={() => {
                    if (promoCodeInput.trim().toUpperCase() === "GREENHYD50") {
                      setAppliedDiscount(50);
                      alert("🎉 ₹50 Discount applied successfully to your next ride!");
                    } else {
                      alert("Invalid promo code. Try 'GREENHYD50'");
                    }
                  }}
                >
                  <Text style={styles.applyCodeBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Active Discount Coupons */}
            <View style={[styles.card, { marginHorizontal: 16, marginTop: 14, borderColor: "#10B981" }]}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#16A34A" }}>🌱 Eco Commute Green Credits</Text>
              <Text style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                Carpooling reduces Hyderabad traffic! Every 5 rides give you a flat 15% discount.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ---------------- TAB 4: PROFILE & EMERGENCY CONTACTS ---------------- */}
        {activeTab === "PROFILE" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={[styles.card, { marginHorizontal: 16, marginTop: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.profileAvatarCircle}>
                  <Text style={{ fontSize: 24 }}>👤</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>{passengerName}</Text>
                  <Text style={{ fontSize: 11, color: "#64748B" }}>📱 {passengerPhone}</Text>
                  <Text style={{ fontSize: 11, color: "#16A34A", fontWeight: "700" }}>Verified Passenger</Text>
                </View>
              </View>

              <View style={styles.profileDivider} />

              {/* Wallet Balance */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "800" }}>RIDEPOOL CASH WALLET</Text>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#10B981" }}>₹{walletBalance}.00</Text>
                </View>
                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  onPress={() => {
                    setWalletBalance((b) => b + 200);
                    alert("₹200 added to wallet!");
                  }}
                >
                  <Text style={styles.addMoneyText}>+ Add Money</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Women-Only Pink Pool Setting */}
            <View style={[styles.card, { marginHorizontal: 16, marginTop: 12, borderColor: "#F472B6" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#BE185D" }}>🌸 Pink Pool (Women-Only Mode)</Text>
                  <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    Travel only with verified women drivers and female co-passengers for maximum safety.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.togglePill, womenOnlyFilter && styles.togglePillActive]}
                  onPress={() => setWomenOnlyFilter(!womenOnlyFilter)}
                >
                  <Text style={[styles.togglePillText, womenOnlyFilter && { color: "#FFFFFF" }]}>
                    {womenOnlyFilter ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Emergency Contacts Setup */}
            <View style={[styles.card, { marginHorizontal: 16, marginTop: 12 }]}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#0F172A" }}>🛡️ Trusted Emergency Contacts</Text>
              <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                SOS triggered ayinappudu ee number ki live tracking link auto ga send avthundi.
              </Text>

              <Text style={styles.inputTag}>GUARDIAN / EMERGENCY PHONE</Text>
              <TextInput
                style={styles.inputBox}
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={() => alert("Emergency contact saved successfully!")}
              >
                <Text style={styles.saveProfileBtnText}>Save Safety Details ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- RAPIDO STYLE REAL TOUCH/DRAG MAP MODAL ---------------- */}
        <Modal visible={mapModalVisible} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View style={styles.modalTopHeader}>
              <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.backCircleBtn}>
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

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsDropdown}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultRow}
                    onPress={() => pickSearchedLocation(item)}
                  >
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{item.display_name.split(",")[0]}</Text>
                      <Text style={styles.resultSub} numberOfLines={1}>{item.display_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* REAL HAND-DRAG MAP LAYER */}
            <View style={styles.interactiveMapLayer}>
              <div
                ref={mapContainerRef as any}
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: "grab",
                  touchAction: "none",
                }}
              />

              {/* Center Rapido Pinpoint */}
              <View style={styles.fixedCenterPin} pointerEvents="none">
                <View style={pickerMode === "PICKUP" ? styles.pinBubbleGreen : styles.pinBubbleRed}>
                  <View style={styles.innerDotWhite} />
                </View>
                <View style={pickerMode === "PICKUP" ? styles.pinStemGreen : styles.pinStemRed} />
                <View style={styles.pinShadow} />
              </View>

              <View style={styles.dragHintBox} pointerEvents="none">
                <Text style={styles.dragHintText}>🖐️ Chetho map ni drag chesi pin set cheyandi</Text>
              </View>

              <TouchableOpacity style={styles.floatingGpsBtn} onPress={fetchLiveGps} disabled={isFetchingGps}>
                {isFetchingGps ? <ActivityIndicator size="small" color="#0284C7" /> : <Text style={{ fontSize: 20 }}>🎯</Text>}
              </TouchableOpacity>
            </View>

            {/* Bottom Sheet Confirmation */}
            <View style={styles.bottomSheetConfirm}>
              <Text style={styles.confirmSheetLabel}>
                {pickerMode === "PICKUP" ? "SELECTED PICKUP LOCATION" : "SELECTED DROP LOCATION"}
              </Text>

              <View style={styles.selectedAddressBox}>
                <View style={pickerMode === "PICKUP" ? styles.greenDot : styles.redSquare} />
                <View style={{ flex: 1 }}>
                  {isResolvingAddress ? (
                    <Text style={{ color: "#0284C7", fontSize: 12, fontWeight: "700" }}>Fetching street address...</Text>
                  ) : (
                    <Text style={styles.selectedAddressText} numberOfLines={2}>
                      {selectedAddress}
                    </Text>
                  )}
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {POPULAR_HUBS.map((hub) => (
                    <TouchableOpacity
                      key={hub.name}
                      style={styles.hubChip}
                      onPress={() => {
                        setMapCenter({ lat: hub.lat, lon: hub.lon });
                        setSelectedAddress(`${hub.name}, Hyderabad`);
                        if (leafletMapInstance.current) {
                          leafletMapInstance.current.setView([hub.lat, hub.lon], 16);
                        }
                      }}
                    >
                      <Text style={styles.hubChipText}>{hub.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.confirmLocationBtn} onPress={confirmLocationChoice} activeOpacity={0.85}>
                <Text style={styles.confirmLocationBtnText}>
                  Confirm {pickerMode === "PICKUP" ? "Pickup Point" : "Drop Point"} ➔
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* ---------------- WOMEN SAFETY & SOS EMERGENCY HUB MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sosHeading}>🚨 Emergency & Women Safety Hub</Text>
                <TouchableOpacity onPress={() => setShowSosModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Siren Alarm Trigger */}
              <TouchableOpacity
                style={[styles.sirenAlarmBtn, isSirenActive && styles.sirenAlarmBtnActive]}
                onPress={triggerAudioSiren}
              >
                <Text style={styles.sirenAlarmText}>
                  {isSirenActive ? "🛑 STOP LOUD SIREN ALARM" : "🔊 TRIGGER LOUD DEFENSE SIREN"}
                </Text>
              </TouchableOpacity>

              {/* Direct Emergency Call Rows */}
              <TouchableOpacity
                style={[styles.sosRow, { backgroundColor: "#FDF2F8", borderColor: "#F472B6", borderWidth: 1 }]}
                onPress={() => Linking.openURL("tel:1091")}
              >
                <Text style={{ fontSize: 20 }}>🌸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sosText, { color: "#BE185D" }]}>SHE Teams Telangana (1091)</Text>
                  <Text style={{ fontSize: 10, color: "#9D174D" }}>24/7 Rapid Women Protection Dispatch</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#BE185D" }}>CALL ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sosRow} onPress={() => Linking.openURL("tel:112")}>
                <Text style={{ fontSize: 20 }}>🚓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosText}>Police Emergency (112 / 100)</Text>
                  <Text style={{ fontSize: 10, color: "#991B1B" }}>National Emergency Response Center</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#DC2626" }}>CALL ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sosRow, { backgroundColor: "#FEF2F2" }]}
                onPress={() => Linking.openURL("tel:181")}
              >
                <Text style={{ fontSize: 20 }}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sosText, { color: "#991B1B" }]}>Women Helpline (181)</Text>
                  <Text style={{ fontSize: 10, color: "#7F1D1D" }}>Toll-Free Women Safety Helpline</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#991B1B" }}>CALL ➔</Text>
              </TouchableOpacity>

              {/* WhatsApp Live SOS share */}
              <TouchableOpacity style={styles.whatsappSosBtn} onPress={shareEmergencyRideWhatsApp}>
                <Text style={styles.whatsappSosText}>📲 Share Live Ride Link to Family on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSosModal(false)}>
                <Text style={styles.closeBtnText}>Close Safety Hub</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- BOTTOM NAVIGATION BAR (ALL 4 TABS) ---------------- */}
        <View style={styles.bottomNavBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("HOME")}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={[styles.navText, activeTab === "HOME" && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("RIDES")}>
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={[styles.navText, activeTab === "RIDES" && styles.navTextActive]}>Naa Rides</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("OFFERS")}>
            <Text style={{ fontSize: 18 }}>🎁</Text>
            <Text style={[styles.navText, activeTab === "OFFERS" && styles.navTextActive]}>Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("PROFILE")}>
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
  womenBadgeBtn: {
    backgroundColor: "#FDF2F8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  womenBadgeBtnActive: { backgroundColor: "#F472B6", borderColor: "#DB2777" },
  womenBadgeText: { color: "#BE185D", fontSize: 11, fontWeight: "900" },
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
  // Pure White Floating Card
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
  routeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  greenDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981" },
  redSquare: { width: 12, height: 12, borderRadius: 3, backgroundColor: "#EF4444" },
  routeLabel: { fontSize: 8, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  routeAddressText: { fontSize: 13, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  searchIconText: { fontSize: 12, color: "#0284C7", fontWeight: "800" },
  routeDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 6 },
  plateFilterRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  plateFilterChip: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    alignItems: "center",
  },
  plateFilterChipActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateFilterChipActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  plateFilterText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  plateFilterTextActive: { color: "#16A34A", fontWeight: "900" },
  plateFilterTextActiveYellow: { color: "#B45309", fontWeight: "900" },
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
  pinkBadgeMini: { backgroundColor: "#FCE7F3", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pinkBadgeMiniText: { color: "#DB2777", fontSize: 9, fontWeight: "800" },
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
  // Active Ride Box (Naa Rides Tab)
  activeRideBox: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#10B981",
    marginTop: 10,
  },
  statusBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  pulsingGreenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  statusBadgeText: { fontSize: 11, fontWeight: "900", color: "#10B981", letterSpacing: 0.5 },
  otpCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  otpCardLabel: { fontSize: 9, fontWeight: "800", color: "#FACC15" },
  otpCardNumber: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", marginTop: 2, letterSpacing: 4 },
  driverInfoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  driverBigName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  driverVehicleSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  driverRouteSub: { fontSize: 11, fontWeight: "700", color: "#1E293B", marginTop: 4 },
  driverFareBig: { fontSize: 18, fontWeight: "900", color: "#16A34A" },
  callDriverBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  callDriverText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  cancelBookingBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBookingText: { color: "#DC2626", fontSize: 12, fontWeight: "800" },
  shareRideBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  shareRideText: { color: "#1D4ED8", fontSize: 12, fontWeight: "900" },
  historyCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  // Offers Tab Styles
  referCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 16,
  },
  referBigTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  referSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
  referralCodeBox: {
    backgroundColor: "#FEF3C7",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  referralCodeTag: { fontSize: 9, fontWeight: "800", color: "#B45309" },
  referralCodeText: { fontSize: 20, fontWeight: "900", color: "#78350F", marginTop: 2 },
  whatsappShareBtn: { backgroundColor: "#25D366", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  whatsappShareText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
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
  applyCodeBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
  },
  applyCodeBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  // Profile Tab Styles
  profileAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },
  addMoneyBtn: { backgroundColor: "#DCFCE7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addMoneyText: { color: "#16A34A", fontSize: 11, fontWeight: "900" },
  togglePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  togglePillActive: { backgroundColor: "#DB2777" },
  togglePillText: { fontSize: 11, fontWeight: "900", color: "#64748B" },
  saveProfileBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  saveProfileBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
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
  // Real Drag Map Modal
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
    zIndex: 1000,
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
  interactiveMapLayer: { flex: 1, position: "relative", backgroundColor: "#E2E8F0" },
  fixedCenterPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -14 }, { translateY: -32 }],
    alignItems: "center",
    zIndex: 500,
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
  pinShadow: { width: 14, height: 5, borderRadius: 7, backgroundColor: "rgba(0,0,0,0.25)", marginTop: 2 },
  dragHintBox: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 400,
  },
  dragHintText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  floatingGpsBtn: {
    position: "absolute",
    right: 16,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    zIndex: 400,
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
  selectedAddressText: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  hubChip: { backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  hubChipText: { fontSize: 11, fontWeight: "700", color: "#334155" },
  confirmLocationBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmLocationBtnText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  // SOS & Women Safety Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  sheetModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626" },
  sirenAlarmBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
  },
  sirenAlarmBtnActive: { backgroundColor: "#7F1D1D" },
  sirenAlarmText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  sosRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
  whatsappSosBtn: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 8,
  },
  whatsappSosText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  closeBtn: { marginTop: 6, alignItems: "center", paddingVertical: 8 },
  closeBtnText: { fontSize: 12, fontWeight: "800", color: "#64748B" },
});
