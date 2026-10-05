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

// Available Real Coupons Database
const INITIAL_COUPONS = [
  { code: "FIRST50", title: "First Ride Welcome Offer", discount: 50, type: "FLAT", desc: "Flat ₹50 off on your first ride" },
  { code: "GREEN20", title: "Green Commute Saver", discount: 20, type: "PERCENT", desc: "20% off on White Plate Carpools" },
  { code: "RIDEPOOL200", title: "Referral Bonus Credit", discount: 200, type: "FLAT", desc: "Referral reward unlocked" },
];

export function PassengerHome({ navigation }: any) {
  // Passenger Profile (Loaded dynamically)
  const [passengerName, setPassengerName] = useState("BHARGAV");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [walletBalance, setWalletBalance] = useState(200);

  // Bottom Navigation (Dedicated 4 Separate Pages)
  const [activeTab, setActiveTab] = useState<"RIDE" | "POOLS" | "REWARDS" | "PROFILE">("RIDE");

  // Route & Coordinates
  const [mapCenter, setMapCenter] = useState({ lat: 17.4435, lon: 78.3772 }); // Hitec City default
  const [pickupAddress, setPickupAddress] = useState("TCS Junction, HITEC City Road, Madhapur");
  const [dropAddress, setDropAddress] = useState("Cyber Towers - Madhapur Main Road, HITEC City");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);

  // Search Radar Animation
  const [isSearchingRides, setIsSearchingRides] = useState(false);
  const [matchedRides, setMatchedRides] = useState<any[]>([]);

  // Search & Pin Modal
  const [showSearchMapModal, setShowSearchMapModal] = useState(false);
  const [activeInputTarget, setActiveInputTarget] = useState<"PICKUP" | "DROP">("DROP");
  const [modalSearchText, setModalSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [modalPinCoords, setModalPinCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [modalResolvedAddress, setModalResolvedAddress] = useState("Cyber Towers, Hyderabad");
  const [isModalResolving, setIsModalResolving] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Coupons & Rewards
  const [couponsList, setCouponsList] = useState(INITIAL_COUPONS);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [customCouponInput, setCustomCouponInput] = useState("");

  // Payment Gateway Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingRideToPay, setPendingRideToPay] = useState<any | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"GPAY" | "PHONEPE" | "PAYTM" | "QR">("GPAY");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Confirmed Real Ride (Empty initially - No Dummy Demos!)
  const [confirmedRide, setConfirmedRide] = useState<any | null>(null);

  // Modals & Safety
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // DOM Refs for Isolated Map
  const mainMapRef = useRef<HTMLDivElement | null>(null);
  const modalMapRef = useRef<HTMLDivElement | null>(null);
  const mainLeafletInstance = useRef<any>(null);
  const modalLeafletInstance = useRef<any>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const storedProfile = window.localStorage.getItem("DRIVER_REGISTERED_PROFILE");
        if (storedProfile) {
          const p = JSON.parse(storedProfile);
          if (p.name) setPassengerName(p.name.toUpperCase());
          if (p.phone) setPassengerPhone(p.phone);
        }
        const activeBooking = window.localStorage.getItem("REAL_CONFIRMED_BOOKING");
        if (activeBooking) {
          setConfirmedRide(JSON.parse(activeBooking));
        }
      }
    } catch {}
  }, []);

  // Reverse Geocoding Helper
  const reverseGeocode = async (lat: number, lon: number, isForModal: boolean = false) => {
    if (isForModal) setIsModalResolving(true);
    else setIsResolvingAddress(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const cleanName = `${parts[0] || ""}, ${parts[1] || ""}, ${parts[2] || ""}`;
        if (isForModal) setModalResolvedAddress(cleanName);
        else setPickupAddress(cleanName);
      } else {
        const fallback = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        if (isForModal) setModalResolvedAddress(fallback);
        else setPickupAddress(fallback);
      }
    } catch {
      const fallback = `Pin Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      if (isForModal) setModalResolvedAddress(fallback);
      else setPickupAddress(fallback);
    } finally {
      if (isForModal) setIsModalResolving(false);
      else setIsResolvingAddress(false);
    }
  };

  // Main Background Map Setup
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = () => {
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
        script.onload = () => initMainMap();
        document.body.appendChild(script);
      } else {
        setTimeout(initMainMap, 100);
      }
    };

    const initMainMap = () => {
      const L = (window as any).L;
      if (!L || !mainMapRef.current) return;

      if (mainLeafletInstance.current) {
        mainLeafletInstance.current.remove();
        mainLeafletInstance.current = null;
      }

      const map = L.map(mainMapRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [mapCenter.lat, mapCenter.lon],
        zoom: 16,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      map.on("movestart", () => setIsMapDragging(true));
      map.on("moveend", () => {
        setIsMapDragging(false);
        const center = map.getCenter();
        setMapCenter({ lat: center.lat, lon: center.lng });
        reverseGeocode(center.lat, center.lng, false);
      });

      mainLeafletInstance.current = map;
    };

    loadLeaflet();

    return () => {
      if (mainLeafletInstance.current) {
        mainLeafletInstance.current.remove();
        mainLeafletInstance.current = null;
      }
    };
  }, []);

  // Modal Pin-to-Pin Interactive Map Init
  useEffect(() => {
    if (!showSearchMapModal || typeof window === "undefined") return;

    const initModalMap = () => {
      const L = (window as any).L;
      if (!L || !modalMapRef.current) return;

      if (modalLeafletInstance.current) {
        modalLeafletInstance.current.remove();
        modalLeafletInstance.current = null;
      }

      const map = L.map(modalMapRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [modalPinCoords.lat, modalPinCoords.lon],
        zoom: 16,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      map.on("moveend", () => {
        const center = map.getCenter();
        setModalPinCoords({ lat: center.lat, lon: center.lng });
        reverseGeocode(center.lat, center.lng, true);
      });

      modalLeafletInstance.current = map;
    };

    setTimeout(initModalMap, 150);

    return () => {
      if (modalLeafletInstance.current) {
        modalLeafletInstance.current.remove();
        modalLeafletInstance.current = null;
      }
    };
  }, [showSearchMapModal]);

  // Open "Where to go" modal for Pickup or Drop
  const openLocationPickerModal = (target: "PICKUP" | "DROP") => {
    setActiveInputTarget(target);
    setModalSearchText(target === "DROP" ? dropAddress : pickupAddress);
    setSearchResults([]);
    setShowSearchMapModal(true);
  };

  // Strict Hyderabad Search
  const searchHyderabadPlacesOnly = async (text: string) => {
    setModalSearchText(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        text.trim() + ", Hyderabad"
      )}&countrycodes=in&viewbox=78.1,17.6,78.7,17.1&bounded=1&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const placeName = item.display_name.split(",").slice(0, 3).join(",");

    setModalPinCoords({ lat, lon });
    setModalResolvedAddress(placeName);
    setSearchResults([]);
    setModalSearchText("");

    if (modalLeafletInstance.current) {
      modalLeafletInstance.current.setView([lat, lon], 17);
    }
  };

  const fetchModalLiveGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setModalPinCoords({ lat, lon });
          reverseGeocode(lat, lon, true);
          if (modalLeafletInstance.current) {
            modalLeafletInstance.current.setView([lat, lon], 17);
          }
          setIsFetchingGps(false);
        },
        () => {
          setIsFetchingGps(false);
          alert("GPS permission denied.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleConfirmPinLocation = () => {
    if (activeInputTarget === "DROP") {
      setDropAddress(modalResolvedAddress);
    } else {
      setPickupAddress(modalResolvedAddress);
      setMapCenter(modalPinCoords);
      if (mainLeafletInstance.current) {
        mainLeafletInstance.current.setView([modalPinCoords.lat, modalPinCoords.lon], 16);
      }
    }
    setShowSearchMapModal(false);
  };

  // SEARCH FOR RIDES TRIGGER (Real-time live matching from storage)
  const handleSearchForRides = () => {
    if (!dropAddress.trim()) {
      alert("Please select a Drop Location first!");
      openLocationPickerModal("DROP");
      return;
    }

    setIsSearchingRides(true);

    setTimeout(() => {
      setIsSearchingRides(false);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
          const realRides = stored ? JSON.parse(stored) : [];

          // Filter rides based on white/yellow/women
          const filtered = realRides.filter((r: any) => {
            if (womenOnlyFilter && !r.is_women_driver && r.driver_gender !== "FEMALE") return false;
            if (plateFilter === "WHITE" && r.plate_type !== "WHITE") return false;
            if (plateFilter === "YELLOW" && r.plate_type !== "YELLOW") return false;
            return true;
          });

          setMatchedRides(filtered);

          if (filtered.length === 0) {
            alert("No rides found right now for this route! Create a ride in Driver Console to test live matching.");
          }
        }
      } catch {
        setMatchedRides([]);
      }
    }, 1200);
  };

  // Initiate Booking & Open Online Payment
  const initiateBookingPayment = (ride: any) => {
    setPendingRideToPay(ride);
    setAppliedCoupon(null); // Reset coupon or set default FIRST50
    setShowPaymentModal(true);
  };

  // Calculate Final Amount after Coupon
  const getPayableAmount = () => {
    const baseFare = pendingRideToPay?.price_per_seat || 110;
    if (!appliedCoupon) return baseFare;
    if (appliedCoupon.type === "FLAT") {
      return Math.max(0, baseFare - appliedCoupon.discount);
    }
    if (appliedCoupon.type === "PERCENT") {
      return Math.max(0, Math.round(baseFare - (baseFare * appliedCoupon.discount) / 100));
    }
    return baseFare;
  };

  // COMPLETE ONLINE PAYMENT & CONFIRM RIDE
  const handleCompleteOnlinePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);

      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const realConfirmedRide = {
        id: pendingRideToPay.id || "bk_" + Date.now(),
        driver_name: pendingRideToPay.driver_name || "Driver Partner",
        driver_phone: "8919326622",
        vehicle_name: pendingRideToPay.vehicle_name || "Vehicle",
        plate_type: pendingRideToPay.plate_type || "WHITE",
        pickup: pickupAddress,
        drop: dropAddress,
        fare: getPayableAmount(),
        original_fare: pendingRideToPay.price_per_seat || 110,
        coupon_applied: appliedCoupon ? appliedCoupon.code : "NONE",
        otp: generatedOtp,
        status: "CONFIRMED_EN_ROUTE",
        eta: "Arriving in 4 mins",
        payment_service: selectedPaymentMethod,
      };

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("REAL_CONFIRMED_BOOKING", JSON.stringify(realConfirmedRide));
        }
      } catch {}

      setConfirmedRide(realConfirmedRide);
      setPendingRideToPay(null);
      setMatchedRides([]);
      setActiveTab("POOLS"); // Switch directly to Pools tab to show confirmed active ride!
      alert("🎉 Payment Successful! Ride Confirmed. Showing your live active trip in Pools tab.");
    }, 1500);
  };

  const handleCancelConfirmedRide = () => {
    if (confirm("Cancel this ride? Paid amount will be refunded to your source account.")) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem("REAL_CONFIRMED_BOOKING");
        }
      } catch {}
      setConfirmedRide(null);
      alert("Ride cancelled successfully.");
    }
  };

  const triggerDefenseSiren = () => {
    setIsSirenActive(!isSirenActive);
    if (!isSirenActive) alert("🚨 DEFENSE SIREN ALARM ACTIVATED!");
  };

  const shareRideWhatsAppSafety = () => {
    const msg = `🚨 SAFETY ALERT: Traveling from ${pickupAddress} to ${dropAddress}. Tracking: https://my-app-frontend-blue.vercel.app/track`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ---------------- 1. MAIN RIDE TAB (LIVE INTERACTIVE MAP & SEARCH) ---------------- */}
        {activeTab === "RIDE" && (
          <View style={{ flex: 1, position: "relative" }}>
            {/* Full-screen Isolated Interactive Leaflet Map */}
            <View style={styles.fullScreenMapWrap}>
              <div
                ref={mainMapRef as any}
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: isMapDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              />

              {/* Rapido Center Pinpoint */}
              <View
                style={[
                  styles.centerFixedPinWrap,
                  isMapDragging && { transform: [{ translateX: -14 }, { translateY: -44 }] },
                ]}
                pointerEvents="none"
              >
                <View style={styles.pickupPillBadge}>
                  <Text style={styles.pickupPillBadgeText}>Pickup Point</Text>
                </View>
                <View style={styles.pinBubbleGreen}>
                  <View style={styles.pinInnerDotWhite} />
                </View>
                <View style={styles.pinStem} />
                <View style={styles.pinShadowDot} />
              </View>

              {/* Floating Current Address Capsule */}
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
            </View>

            {/* Floating Top Nav Bar */}
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

            {/* Bottom Floating Booking Sheet */}
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetHandle} />

              {/* Pickup Selector */}
              <TouchableOpacity
                style={styles.locationSelectorRow}
                onPress={() => openLocationPickerModal("PICKUP")}
                activeOpacity={0.85}
              >
                <View style={styles.greenDotMini} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>PICKUP LOCATION</Text>
                  <Text style={styles.selectorValueText} numberOfLines={1}>{pickupAddress}</Text>
                </View>
                <Text style={styles.selectorActionTag}>Change ➔</Text>
              </TouchableOpacity>

              <View style={{ height: 6 }} />

              {/* Drop Selector ("Where do you want to go?") */}
              <TouchableOpacity
                style={[styles.locationSelectorRow, !dropAddress && { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}
                onPress={() => openLocationPickerModal("DROP")}
                activeOpacity={0.85}
              >
                <View style={styles.redSquareMini} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>DROP LOCATION</Text>
                  <Text style={[styles.selectorValueText, !dropAddress && { color: "#DC2626" }]} numberOfLines={1}>
                    {dropAddress || "Where do you want to go? (Tap to Set)"}
                  </Text>
                </View>
                <Text style={[styles.selectorActionTag, !dropAddress && { color: "#DC2626" }]}>
                  {dropAddress ? "Change ➔" : "Select ➔"}
                </Text>
              </TouchableOpacity>

              {/* Plate Mode Filters */}
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

              {/* SEARCH FOR RIDES ACTION BUTTON */}
              <TouchableOpacity
                style={styles.searchForRidesBtn}
                onPress={handleSearchForRides}
                disabled={isSearchingRides}
                activeOpacity={0.85}
              >
                {isSearchingRides ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#0F172A" />
                    <Text style={styles.searchForRidesBtnText}>Searching for nearby rides...</Text>
                  </View>
                ) : (
                  <Text style={styles.searchForRidesBtnText}>Search for Rides / Find Pool ➔</Text>
                )}
              </TouchableOpacity>

              {/* Matched Live Rides List */}
              {matchedRides.length > 0 && (
                <View style={{ marginTop: 10, maxHeight: 150 }}>
                  <Text style={{ fontSize: 11, fontWeight: "900", color: "#16A34A", marginBottom: 6 }}>
                    AVAILABLE RIDES MATCHED:
                  </Text>
                  <ScrollView>
                    {matchedRides.map((ride) => (
                      <View key={ride.id} style={styles.matchedRideCard}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 13 }}>
                            {ride.driver_name} • {ride.vehicle_name}
                          </Text>
                          <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 15 }}>₹{ride.price_per_seat}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: "#64748B", marginVertical: 4 }}>
                          📍 {ride.from_location} ➔ 🏁 {ride.to_location}
                        </Text>
                        <TouchableOpacity
                          style={styles.bookOnlineBtn}
                          onPress={() => initiateBookingPayment(ride)}
                        >
                          <Text style={styles.bookOnlineBtnText}>Pay Online & Confirm (₹{ride.price_per_seat}) ➔</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ---------------- 2. DEDICATED POOLS TAB (CONFIRMED RIDE TRACKING ONLY) ---------------- */}
        {activeTab === "POOLS" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>My Active Pools & Bookings</Text>

            {confirmedRide ? (
              <View style={styles.activeRideBox}>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.statusBadgeText}>PAYMENT SUCCESSFUL • {confirmedRide.status}</Text>
                </View>

                {/* OTP Box */}
                <View style={styles.otpCard}>
                  <Text style={styles.otpCardLabel}>SHARE TRIP OTP WITH DRIVER</Text>
                  <Text style={styles.otpCardNumber}>{confirmedRide.otp}</Text>
                </View>

                <View style={styles.driverInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverBigName}>{confirmedRide.driver_name}</Text>
                    <Text style={styles.driverVehicleSub}>{confirmedRide.vehicle_name} ({confirmedRide.plate_type} Plate)</Text>
                    <Text style={styles.driverRouteSub}>📍 {confirmedRide.pickup}</Text>
                    <Text style={styles.driverRouteSub}>🏁 {confirmedRide.drop}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.driverFareBig}>₹{confirmedRide.fare}</Text>
                    <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "800" }}>Paid Online</Text>
                    {confirmedRide.coupon_applied !== "NONE" && (
                      <Text style={{ fontSize: 9, color: "#D97706" }}>Coupon: {confirmedRide.coupon_applied}</Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={styles.callDriverBtn}
                    onPress={() => Linking.openURL(`tel:${confirmedRide.driver_phone}`)}
                  >
                    <Text style={styles.callDriverText}>📞 Call Driver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBookingBtn} onPress={handleCancelConfirmedRide}>
                    <Text style={styles.cancelBookingText}>Cancel Ride</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.shareRideBtn} onPress={shareRideWhatsAppSafety}>
                  <Text style={styles.shareRideText}>📲 Share Live Ride on WhatsApp (Safety)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyPoolCard}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🚗</Text>
                <Text style={styles.emptyPoolTitle}>No Active Pools</Text>
                <Text style={styles.emptyPoolSub}>
                  Ride confirm chesaka mathrame OTP, driver details mariyu live trip status ikkada chupisthundi.
                </Text>
                <TouchableOpacity
                  style={styles.bookNowActionBtn}
                  onPress={() => setActiveTab("RIDE")}
                >
                  <Text style={styles.bookNowActionBtnText}>Search & Book Ride ➔</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* ---------------- 3. DEDICATED REWARDS & COUPONS TAB ---------------- */}
        {activeTab === "REWARDS" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>Rewards, Referrals & Coupons</Text>

            {/* Refer & Earn Card */}
            <View style={styles.rewardsCard}>
              <Text style={styles.rewardsCardTitle}>🎁 Refer & Earn ₹200 + ₹200</Text>
              <Text style={styles.rewardsCardSub}>
                Share your referral code with friends. When they complete their first ride, both get ₹200 added to coupons!
              </Text>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeTag}>YOUR REFERRAL CODE</Text>
                <Text style={styles.referralCodeText}>{`PASSENGER${passengerPhone.slice(-4)}`}</Text>
              </View>

              <TouchableOpacity
                style={styles.whatsappShareBtn}
                onPress={() => {
                  const msg = `Join RidePool Hyderabad! Use code PASSENGER${passengerPhone.slice(
                    -4
                  )} to get ₹200 off: https://my-app-frontend-blue.vercel.app`;
                  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
                }}
              >
                <Text style={styles.whatsappShareText}>📲 Share on WhatsApp (Earn ₹200)</Text>
              </TouchableOpacity>
            </View>

            {/* Active Available Coupons List */}
            <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 10 }]}>Available Ride Coupons</Text>
            {couponsList.map((cp) => (
              <View key={cp.code} style={styles.couponItemCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.couponCodeBadge}>{cp.code}</Text>
                    <Text style={styles.couponTitle}>{cp.title}</Text>
                  </View>
                  <Text style={styles.couponDesc}>{cp.desc}</Text>
                </View>
                <TouchableOpacity
                  style={styles.applyCouponDirectBtn}
                  onPress={() => {
                    setAppliedCoupon(cp);
                    alert(`🎉 Coupon "${cp.code}" applied! You will get this discount during payment.`);
                  }}
                >
                  <Text style={styles.applyCouponDirectBtnText}>Use Code</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Custom Coupon Box */}
            <View style={[styles.rewardsCard, { marginTop: 16 }]}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#0F172A" }}>Have a Promo Code?</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  placeholder="Enter code (e.g. FIRST50)..."
                  value={customCouponInput}
                  onChangeText={setCustomCouponInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyCodeBtn}
                  onPress={() => {
                    const match = couponsList.find((c) => c.code === customCouponInput.trim().toUpperCase());
                    if (match) {
                      setAppliedCoupon(match);
                      alert(`Coupon "${match.code}" applied successfully!`);
                    } else {
                      alert("Invalid promo code. Try 'FIRST50'");
                    }
                  }}
                >
                  <Text style={styles.applyCodeBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- 4. DEDICATED PROFILE TAB ---------------- */}
        {activeTab === "PROFILE" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>Passenger Profile & Settings</Text>

            <View style={styles.profileCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={styles.profileAvatarCircle}>
                  <Text style={{ fontSize: 24 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{passengerName}</Text>
                  <Text style={styles.profilePhone}>📱 {passengerPhone}</Text>
                  <Text style={{ color: "#16A34A", fontSize: 11, fontWeight: "800", marginTop: 2 }}>Verified Passenger</Text>
                </View>
                <TouchableOpacity style={styles.editProfilePill} onPress={() => setShowEditProfileModal(true)}>
                  <Text style={styles.editProfilePillText}>Edit ✏️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileDivider} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "800" }}>RIDEPOOL WALLET</Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: "#16A34A" }}>₹{walletBalance}.00</Text>
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

            {/* Quick Actions List */}
            <View style={[styles.profileCard, { marginTop: 14 }]}>
              <TouchableOpacity style={styles.profileActionRow} onPress={() => setShowSosModal(true)}>
                <Text style={{ fontSize: 18 }}>🚨</Text>
                <Text style={styles.profileActionText}>Emergency Safety & SOS</Text>
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() => {
                  try {
                    if (typeof window !== "undefined" && window.localStorage) {
                      window.localStorage.removeItem("DRIVER_REGISTERED_PROFILE");
                    }
                  } catch {}
                  alert("Logged out successfully.");
                }}
              >
                <Text style={{ fontSize: 18 }}>🚪</Text>
                <Text style={[styles.profileActionText, { color: "#D97706" }]}>Logout</Text>
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() => {
                  if (confirm("Delete account permanently?")) {
                    try {
                      if (typeof window !== "undefined" && window.localStorage) {
                        window.localStorage.clear();
                      }
                    } catch {}
                    alert("Account deleted.");
                  }
                }}
              >
                <Text style={{ fontSize: 18 }}>⚠️</Text>
                <Text style={[styles.profileActionText, { color: "#EF4444" }]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- FIXED BOTTOM NAVIGATION BAR (ALL 4 TABS) ---------------- */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("RIDE")}>
            <Text style={{ fontSize: 18 }}>📍</Text>
            <Text style={[styles.navBarText, activeTab === "RIDE" && styles.navBarTextActive]}>Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("POOLS")}>
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={[styles.navBarText, activeTab === "POOLS" && styles.navBarTextActive]}>Pools</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("REWARDS")}>
            <Text style={{ fontSize: 18 }}>🎁</Text>
            <Text style={[styles.navBarText, activeTab === "REWARDS" && styles.navBarTextActive]}>Rewards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("PROFILE")}>
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={[styles.navBarText, activeTab === "PROFILE" && styles.navBarTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- ONLINE PAYMENT GATEWAY MODAL (PHONEPE / GPAY / PAYTM / QR + COUPONS) ---------------- */}
        <Modal visible={showPaymentModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.paymentModalHeader}>💳 Online Payment Checkout</Text>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paymentModalSub}>Payment complete chesaka mathrame ride confirm avthundi.</Text>

              {/* Ride Summary & Final Price */}
              <View style={styles.paymentSummaryCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", color: "#0F172A" }}>Payable Amount</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 20 }}>
                      ₹{getPayableAmount()}.00
                    </Text>
                    {appliedCoupon && (
                      <Text style={{ fontSize: 10, color: "#D97706", textDecorationLine: "line-through" }}>
                        Original: ₹{pendingRideToPay?.price_per_seat || 110}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  {pickupAddress.split(",")[0]} ➔ {dropAddress.split(",")[0]}
                </Text>
              </View>

              {/* Select Available Coupon During Payment */}
              <Text style={styles.paymentMethodHeading}>APPLY RIDE COUPON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {couponsList.map((cp) => (
                    <TouchableOpacity
                      key={cp.code}
                      style={[
                        styles.couponMiniChip,
                        appliedCoupon?.code === cp.code && styles.couponMiniChipActive,
                      ]}
                      onPress={() => {
                        if (appliedCoupon?.code === cp.code) setAppliedCoupon(null);
                        else setAppliedCoupon(cp);
                      }}
                    >
                      <Text
                        style={[
                          styles.couponMiniChipText,
                          appliedCoupon?.code === cp.code && { color: "#16A34A" },
                        ]}
                      >
                        {cp.code} ({cp.type === "FLAT" ? `₹${cp.discount} OFF` : `${cp.discount}% OFF`})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Payment Methods */}
              <Text style={styles.paymentMethodHeading}>SELECT ONLINE PAYMENT SERVICE</Text>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "GPAY" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("GPAY")}
              >
                <Text style={{ fontSize: 20 }}>🟢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Google Pay (UPI)</Text>
                  <Text style={styles.paymentMethodSub}>Instant Bank UPI</Text>
                </View>
                {selectedPaymentMethod === "GPAY" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "PHONEPE" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("PHONEPE")}
              >
                <Text style={{ fontSize: 20 }}>🟣</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>PhonePe (UPI)</Text>
                  <Text style={styles.paymentMethodSub}>Direct Fast Transfer</Text>
                </View>
                {selectedPaymentMethod === "PHONEPE" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "PAYTM" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("PAYTM")}
              >
                <Text style={{ fontSize: 20 }}>🔵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Paytm UPI / Wallet</Text>
                  <Text style={styles.paymentMethodSub}>Paytm Online Gateway</Text>
                </View>
                {selectedPaymentMethod === "PAYTM" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "QR" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("QR")}
              >
                <Text style={{ fontSize: 20 }}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Scan Any UPI QR</Text>
                  <Text style={styles.paymentMethodSub}>Direct Scanner</Text>
                </View>
                {selectedPaymentMethod === "QR" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              {/* QR Code Container if selected */}
              {selectedPaymentMethod === "QR" && (
                <View style={styles.qrDisplayBox}>
                  {/* @ts-ignore */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=8919326622@ybl&pn=RidePool&am=${getPayableAmount()}&cu=INR`}
                    alt="Scan UPI QR"
                    style={{ width: 130, height: 130 }}
                  />
                  <Text style={styles.qrInstructionText}>Scan via GPay / PhonePe / Paytm</Text>
                </View>
              )}

              {/* Pay Now Button */}
              <TouchableOpacity
                style={styles.payNowConfirmBtn}
                onPress={handleCompleteOnlinePayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payNowConfirmBtnText}>
                    Pay ₹{getPayableAmount()} & Confirm Ride ➔
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- FULL-SCREEN PIN-TO-PIN INTERACTIVE MAP MODAL ---------------- */}
        <Modal visible={showSearchMapModal} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View style={styles.modalSearchTopHeader}>
              <TouchableOpacity onPress={() => setShowSearchMapModal(false)} style={styles.backCircleBtn}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0F172A" }}>←</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 8 }}>
                <TouchableOpacity
                  style={[styles.inputPillBox, activeInputTarget === "PICKUP" && styles.inputPillBoxActive]}
                  onPress={() => setActiveInputTarget("PICKUP")}
                >
                  <View style={styles.greenDotMini} />
                  <Text style={styles.inputPillText} numberOfLines={1}>
                    {activeInputTarget === "PICKUP" ? "Pinpoint Pickup on Map" : `Pickup: ${pickupAddress}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inputPillBox, activeInputTarget === "DROP" && styles.inputPillBoxActive]}
                  onPress={() => setActiveInputTarget("DROP")}
                >
                  <View style={styles.redSquareMini} />
                  <TextInput
                    style={styles.inputPillInput}
                    placeholder="Search destination in Hyderabad..."
                    placeholderTextColor="#94A3B8"
                    value={modalSearchText}
                    onChangeText={searchHyderabadPlacesOnly}
                    autoFocus={activeInputTarget === "DROP"}
                  />
                  {loadingSearch && <ActivityIndicator size="small" color="#0284C7" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Current Location Quick Action (ONLY AVAILABLE FOR PICKUP) */}
            {activeInputTarget === "PICKUP" && (
              <View style={styles.quickGpsBar}>
                <TouchableOpacity style={styles.gpsActionBtn} onPress={fetchModalLiveGps} disabled={isFetchingGps}>
                  {isFetchingGps ? <ActivityIndicator size="small" color="#0284C7" /> : <Text style={{ fontSize: 14 }}>📍</Text>}
                  <Text style={styles.gpsActionText}>Use My Current Location</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Suggestions Overlay */}
            {searchResults.length > 0 && (
              <View style={styles.searchDropdownWrap}>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.searchDropdownItem} onPress={() => selectSearchResult(item)}>
                    <Text style={{ fontSize: 15 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchItemHead}>{item.display_name.split(",")[0]}</Text>
                      <Text style={styles.searchItemSub} numberOfLines={1}>{item.display_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Interactive Map */}
            <View style={styles.modalInteractiveMapWrap}>
              <div
                ref={modalMapRef as any}
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: "grab",
                  touchAction: "none",
                }}
              />

              <View style={styles.modalCenterPinWrap} pointerEvents="none">
                <View
                  style={[
                    styles.modalPinBubble,
                    activeInputTarget === "DROP" ? { backgroundColor: "#EF4444" } : { backgroundColor: "#16A34A" },
                  ]}
                >
                  <View style={styles.pinInnerDotWhite} />
                </View>
                <View
                  style={[
                    styles.modalPinStem,
                    activeInputTarget === "DROP" ? { backgroundColor: "#EF4444" } : { backgroundColor: "#16A34A" },
                  ]}
                />
                <View style={styles.pinShadowDot} />
              </View>

              <View style={styles.modalDragHintPill} pointerEvents="none">
                <Text style={styles.modalDragHintText}>
                  🖐️ Drag map to pinpoint {activeInputTarget === "DROP" ? "Drop" : "Pickup"} in Hyderabad
                </Text>
              </View>
            </View>

            {/* Bottom Confirm */}
            <View style={styles.modalConfirmBottomSheet}>
              <Text style={styles.confirmHeaderLabel}>
                {activeInputTarget === "DROP" ? "CONFIRM DROP LOCATION (HYDERABAD)" : "CONFIRM PICKUP LOCATION"}
              </Text>

              <View style={styles.confirmedAddressBox}>
                <View style={activeInputTarget === "DROP" ? styles.redSquareMini : styles.greenDotMini} />
                <View style={{ flex: 1 }}>
                  {isModalResolving ? (
                    <Text style={{ color: "#0284C7", fontSize: 12, fontWeight: "700" }}>Fetching address...</Text>
                  ) : (
                    <Text style={styles.confirmedAddressText} numberOfLines={2}>
                      {modalResolvedAddress}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPinLocation}>
                <Text style={styles.confirmButtonText}>
                  Confirm {activeInputTarget === "DROP" ? "Drop Location" : "Pickup Location"} ➔
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* ---------------- SIDE MENU DRAWER ---------------- */}
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
                  alert("RidePool 24x7 Toll-Free Helpline: 1800-419-0099");
                }}
              >
                <Text style={styles.drawerItemIcon}>📞</Text>
                <Text style={styles.drawerItemLabel}>Help Line & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  alert("Notifications: You have active First Ride ₹50 off coupon!");
                }}
              >
                <Text style={styles.drawerItemIcon}>🔔</Text>
                <Text style={styles.drawerItemLabel}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("REWARDS");
                }}
              >
                <Text style={styles.drawerItemIcon}>🎁</Text>
                <Text style={styles.drawerItemLabel}>Rewards & Referrals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("PROFILE");
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
                  if (confirm("Delete account permanently?")) {
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
                  alert("Profile updated!");
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

        {/* ---------------- SOS SAFETY MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sosHeading}>🚨 Emergency & Safety Hub</Text>
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
                  <Text style={{ fontSize: 10, color: "#9D174D" }}>Women Safety Rapid Police Response</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#BE185D" }}>CALL ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sosRow} onPress={() => Linking.openURL("tel:112")}>
                <Text style={{ fontSize: 20 }}>🚓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosText}>Police Emergency (112 / 100)</Text>
                  <Text style={{ fontSize: 10, color: "#991B1B" }}>National Emergency Dispatch</Text>
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
    marginBottom: 8,
  },
  locationSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 10,
  },
  selectorLabel: { fontSize: 8, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  selectorValueText: { fontSize: 12, fontWeight: "800", color: "#0F172A", marginTop: 1 },
  selectorActionTag: { fontSize: 11, fontWeight: "800", color: "#0284C7" },
  greenDotMini: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  redSquareMini: { width: 8, height: 8, borderRadius: 2, backgroundColor: "#EF4444" },
  plateFilterRow: { flexDirection: "row", gap: 8, marginVertical: 8 },
  plateFilterChip: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    alignItems: "center",
  },
  plateFilterChipActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateFilterChipActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  plateFilterText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  plateFilterTextActive: { color: "#16A34A", fontWeight: "900" },
  plateFilterTextActiveYellow: { color: "#B45309", fontWeight: "900" },
  searchForRidesBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  searchForRidesBtnText: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  matchedRideCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  bookOnlineBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  bookOnlineBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  // Dedicated Tabs Content
  dedicatedTabContent: { padding: 16, paddingBottom: 80 },
  tabHeading: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  // Empty Pools State
  emptyPoolCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },
  emptyPoolTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  emptyPoolSub: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 18 },
  bookNowActionBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 18,
  },
  bookNowActionBtnText: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  // Active Confirmed Ride
  activeRideBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  statusBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  pulsingGreenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  statusBadgeText: { fontSize: 10, fontWeight: "900", color: "#10B981" },
  otpCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  otpCardLabel: { fontSize: 9, fontWeight: "800", color: "#FACC15" },
  otpCardNumber: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: 4, marginTop: 2 },
  driverInfoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  driverBigName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  driverVehicleSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  driverRouteSub: { fontSize: 11, color: "#1E293B", fontWeight: "700", marginTop: 3 },
  driverFareBig: { fontSize: 20, fontWeight: "900", color: "#16A34A" },
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  // Rewards Tab
  rewardsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rewardsCardTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  rewardsCardSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
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
  couponItemCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  couponCodeBadge: {
    backgroundColor: "#DCFCE7",
    color: "#15803D",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  couponTitle: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  couponDesc: { fontSize: 10, color: "#64748B", marginTop: 2 },
  applyCouponDirectBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyCouponDirectBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  applyCodeBtn: { backgroundColor: "#0F172A", paddingHorizontal: 16, borderRadius: 10, justifyContent: "center" },
  applyCodeBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  // Profile Tab
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  profilePhone: { fontSize: 11, color: "#64748B", marginTop: 2 },
  editProfilePill: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  editProfilePillText: { fontSize: 11, fontWeight: "800", color: "#334155" },
  profileDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  addMoneyBtn: { backgroundColor: "#DCFCE7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addMoneyText: { color: "#16A34A", fontSize: 11, fontWeight: "900" },
  profileActionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  profileActionText: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
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
  // Payment Gateway Modal
  paymentModalHeader: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  paymentModalSub: { fontSize: 11, color: "#64748B", marginTop: 2, marginBottom: 8 },
  paymentSummaryCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  paymentMethodHeading: { fontSize: 9, fontWeight: "900", color: "#94A3B8", letterSpacing: 0.5, marginBottom: 6 },
  couponMiniChip: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  couponMiniChipActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  couponMiniChipText: { fontSize: 10, fontWeight: "800", color: "#64748B" },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    gap: 12,
    marginBottom: 6,
  },
  paymentMethodRowActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  paymentMethodTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  paymentMethodSub: { fontSize: 10, color: "#64748B" },
  qrDisplayBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 6,
  },
  qrInstructionText: { fontSize: 10, fontWeight: "700", color: "#475569", marginTop: 6 },
  payNowConfirmBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  payNowConfirmBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  // Modal General
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  sheetModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
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
  // Full-Screen Search Modal
  modalSearchTopHeader: {
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
  inputPillBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
  },
  inputPillBoxActive: { borderColor: "#0284C7", backgroundColor: "#F0F9FF" },
  inputPillText: { fontSize: 12, fontWeight: "700", color: "#0F172A", flex: 1 },
  inputPillInput: { flex: 1, fontSize: 12, fontWeight: "700", color: "#0F172A" },
  quickGpsBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  gpsActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  gpsActionText: { color: "#1D4ED8", fontSize: 11, fontWeight: "800" },
  searchDropdownWrap: {
    position: "absolute",
    top: 130,
    left: 14,
    right: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    maxHeight: 220,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  searchItemHead: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  searchItemSub: { fontSize: 10, color: "#64748B", marginTop: 2 },
  modalInteractiveMapWrap: { flex: 1, position: "relative", backgroundColor: "#E2E8F0" },
  modalCenterPinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -14 }, { translateY: -32 }],
    alignItems: "center",
    zIndex: 500,
  },
  modalPinBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPinStem: { width: 3, height: 10 },
  modalDragHintPill: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 400,
  },
  modalDragHintText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  modalConfirmBottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 10,
  },
  confirmHeaderLabel: { fontSize: 9, fontWeight: "900", color: "#94A3B8", letterSpacing: 0.5 },
  confirmedAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginVertical: 8,
  },
  confirmedAddressText: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  confirmButton: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
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
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626" },
  sirenAlarmBtn: { backgroundColor: "#DC2626", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginVertical: 12 },
  sirenAlarmBtnActive: { backgroundColor: "#7F1D1D" },
  sirenAlarmText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
  whatsappSosBtn: { backgroundColor: "#25D366", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginVertical: 6 },
  whatsappSosText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
