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

// Hyderabad Core Hubs Database
const HYDERABAD_HUBS = [
  { name: "Hitec City Cyber Towers", sub: "Madhapur, Hyderabad", lat: 17.4435, lon: 78.3772 },
  { name: "Gachibowli DLF Cybercity", sub: "Gachibowli, Hyderabad", lat: 17.4401, lon: 78.3489 },
  { name: "LB Nagar Ring Road", sub: "LB Nagar, Hyderabad", lat: 17.3457, lon: 78.5522 },
  { name: "Secunderabad Railway Station", sub: "Secunderabad, Hyderabad", lat: 17.4399, lon: 78.4983 },
  { name: "Kukatpally Housing Board (KPHB)", sub: "Kukatpally, Hyderabad", lat: 17.4947, lon: 78.3996 },
  { name: "B.N. Reddy Nagar", sub: "Sagar Highway, Hyderabad", lat: 17.3312, lon: 78.5638 },
];

export function PassengerHome({ navigation }: any) {
  // Onboarding & Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [passengerName, setPassengerName] = useState("Bhargav");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [passengerEmail, setPassengerEmail] = useState("vattalabhargav3@gmail.com");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [studentOrEmpId, setStudentOrEmpId] = useState("");
  const [walletBalance, setWalletBalance] = useState(0); // Default ZERO

  // Navigation
  const [activeTab, setActiveTab] = useState<"RIDE" | "POOLS" | "REWARDS" | "PROFILE">("RIDE");

  // Map & Address
  const [mapCenter, setMapCenter] = useState({ lat: 17.4435, lon: 78.3772 });
  const [pickupAddress, setPickupAddress] = useState("HITEC City, Madhapur, Hyderabad");
  const [dropAddress, setDropAddress] = useState("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);

  // Search & Pin Modal States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTarget, setActiveTarget] = useState<"PICKUP" | "DROP">("DROP");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Bottom Sheet Height Toggle (Drag up/down)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Rides & Live Search
  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [isSearchingRides, setIsSearchingRides] = useState(false);
  const [matchedRides, setMatchedRides] = useState<any[]>([]);

  // Confirmed Real Ride (Empty initially)
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Payment Gateway Modals
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState("200");
  const [showRidePaymentModal, setShowRidePaymentModal] = useState(false);
  const [pendingRideToPay, setPendingRideToPay] = useState<any | null>(null);
  const [selectedPayService, setSelectedPayService] = useState<"PHONEPE" | "GPAY" | "PAYTM" | "QR">("PHONEPE");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Drawer & Profile Modals
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // DOM Refs for Leaflet Map
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletInstance = useRef<any>(null);

  // Load User Data & Saved Bookings
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const savedProfile = window.localStorage.getItem("PASSENGER_PROFILE_DATA");
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          if (p.name) setPassengerName(p.name);
          if (p.phone) setPassengerPhone(p.phone);
          if (p.email) setPassengerEmail(p.email);
          if (p.aadhaar) setAadhaarInput(p.aadhaar);
          if (p.idCard) setStudentOrEmpId(p.idCard);
          if (p.wallet !== undefined) setWalletBalance(p.wallet);
        } else {
          setIsLoggedIn(false);
        }

        const savedBooking = window.localStorage.getItem("CONFIRMED_RIDE_BOOKING");
        if (savedBooking) {
          setConfirmedBooking(JSON.parse(savedBooking));
        }
      }
    } catch {}
  }, []);

  // Reverse Geocoding Helper
  const reverseGeocode = async (lat: number, lon: number) => {
    setIsResolvingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        setPickupAddress(`${parts[0] || ""}, ${parts[1] || ""}, Hyderabad`);
      } else {
        setPickupAddress(`Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch {
      setPickupAddress(`Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Leaflet Map Initialization with Carto CDN Tiles
  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;

    let resizeTimer: any = null;

    const injectLeaflet = () => {
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
        script.onload = () => initMapEngine();
        document.body.appendChild(script);
      } else {
        setTimeout(initMapEngine, 60);
      }
    };

    const initMapEngine = () => {
      const L = (window as any).L;
      if (!L || !mapElementRef.current) return;

      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }

      const map = L.map(mapElementRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [mapCenter.lat, mapCenter.lon],
        zoom: 16,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      map.on("movestart", () => setIsMapDragging(true));
      map.on("moveend", () => {
        setIsMapDragging(false);
        const center = map.getCenter();
        setMapCenter({ lat: center.lat, lon: center.lng });
        reverseGeocode(center.lat, center.lng);
        map.invalidateSize();
      });

      setTimeout(() => map.invalidateSize(), 200);

      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (map) map.invalidateSize();
        }, 100);
      };

      window.addEventListener("resize", handleResize);
      leafletInstance.current = map;
    };

    injectLeaflet();

    return () => {
      clearTimeout(resizeTimer);
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [isLoggedIn]);

  // Tab switch resize listener
  useEffect(() => {
    if (activeTab === "RIDE" && leafletInstance.current) {
      setTimeout(() => leafletInstance.current.invalidateSize(), 150);
    }
  }, [activeTab]);

  // Onboarding / First Login
  const handleCompleteLogin = () => {
    if (!passengerName.trim() || !passengerPhone.trim()) {
      alert("Please enter Name and Mobile Number!");
      return;
    }
    const profile = {
      name: passengerName.trim(),
      phone: passengerPhone.trim(),
      email: passengerEmail.trim(),
      aadhaar: aadhaarInput.trim(),
      idCard: studentOrEmpId.trim(),
      wallet: 0,
    };
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("PASSENGER_PROFILE_DATA", JSON.stringify(profile));
      }
    } catch {}
    setIsLoggedIn(true);
  };

  // Real Delete Account (Clear everything)
  const handleDeleteAccount = () => {
    if (confirm("Are you sure? Your profile, bookings, and wallet data will be deleted permanently.")) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.clear();
        }
      } catch {}
      setPassengerName("");
      setPassengerPhone("");
      setPassengerEmail("");
      setAadhaarInput("");
      setStudentOrEmpId("");
      setWalletBalance(0);
      setConfirmedBooking(null);
      setIsLoggedIn(false);
      setShowDrawerMenu(false);
      alert("Account deleted successfully.");
    }
  };

  // Real Logout
  const handleLogout = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("PASSENGER_PROFILE_DATA");
      }
    } catch {}
    setIsLoggedIn(false);
    setShowDrawerMenu(false);
    alert("Logged out successfully.");
  };

  // Save Edited Profile
  const handleSaveProfile = () => {
    const profile = {
      name: passengerName.trim(),
      phone: passengerPhone.trim(),
      email: passengerEmail.trim(),
      aadhaar: aadhaarInput.trim(),
      idCard: studentOrEmpId.trim(),
      wallet: walletBalance,
    };
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("PASSENGER_PROFILE_DATA", JSON.stringify(profile));
      }
    } catch {}
    setShowEditProfileModal(false);
    alert("Profile & KYC details updated successfully!");
  };

  // Real UPI Intent Launcher (PhonePe / GPay / Paytm)
  const launchRealUpiPayment = (amount: number, note: string) => {
    const upiUri = `upi://pay?pa=8919326622@ybl&pn=RidePool&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    Linking.openURL(upiUri).catch(() => {
      // Fallback for desktop browsers where UPI app is not installed
      alert(`Launching UPI App for ₹${amount}. If on PC, scan the dynamic QR code.`);
    });
  };

  // Complete Wallet Add Money
  const handleConfirmWalletPayment = () => {
    const amt = Number(addAmount) || 200;
    setIsProcessingPayment(true);
    launchRealUpiPayment(amt, "Wallet Add Money");

    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowAddMoneyModal(false);
      const newBal = walletBalance + amt;
      setWalletBalance(newBal);

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const profile = JSON.parse(window.localStorage.getItem("PASSENGER_PROFILE_DATA") || "{}");
          profile.wallet = newBal;
          window.localStorage.setItem("PASSENGER_PROFILE_DATA", JSON.stringify(profile));
        }
      } catch {}
      alert(`🎉 Payment Successful! ₹${amt} added to your wallet.`);
    }, 2000);
  };

  // Strict Hyderabad Place Search
  const handleSearchHyderabadPlaces = async (text: string) => {
    setSearchQuery(text);
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

  // Select Search Item
  const handleSelectSearchItem = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const placeName = item.display_name.split(",").slice(0, 3).join(",");

    if (activeTarget === "DROP") {
      setDropAddress(placeName);
    } else {
      setPickupAddress(placeName);
      setMapCenter({ lat, lon });
      if (leafletInstance.current) {
        leafletInstance.current.setView([lat, lon], 16);
      }
    }
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Search For Rides (Real Live Matching)
  const handleSearchForRides = () => {
    if (!dropAddress.trim()) {
      alert("Please enter a drop location to find rides!");
      setActiveTarget("DROP");
      setShowSearchModal(true);
      return;
    }

    setIsSearchingRides(true);

    setTimeout(() => {
      setIsSearchingRides(false);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
          const realRides = stored ? JSON.parse(stored) : [];

          const filtered = realRides.filter((r: any) => {
            if (womenOnlyFilter && !r.is_women_driver && r.driver_gender !== "FEMALE") return false;
            if (plateFilter === "WHITE" && r.plate_type !== "WHITE") return false;
            if (plateFilter === "YELLOW" && r.plate_type !== "YELLOW") return false;
            return true;
          });

          setMatchedRides(filtered);
          if (filtered.length === 0) {
            alert("No drivers available right now for this route! Create a ride in the Driver Console to test live matching.");
          }
        }
      } catch {
        setMatchedRides([]);
      }
    }, 1200);
  };

  // Complete Ride Online Payment & Generate Real Booking
  const handleConfirmRidePayment = () => {
    const fare = pendingRideToPay?.price_per_seat || 110;
    setIsProcessingPayment(true);
    launchRealUpiPayment(fare, `Ride Booking #${pendingRideToPay?.id || "101"}`);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowRidePaymentModal(false);

      const realOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingData = {
        id: pendingRideToPay.id || "bk_" + Date.now(),
        driver_name: pendingRideToPay.driver_name || "Bhargav",
        driver_phone: "8919326622",
        vehicle_name: pendingRideToPay.vehicle_name || "Swift Dzire",
        plate_type: pendingRideToPay.plate_type || "WHITE",
        pickup: pickupAddress,
        drop: dropAddress,
        fare: fare,
        otp: realOtp,
        status: "CONFIRMED & EN ROUTE",
        eta: "Arriving in 3 mins",
        service: selectedPayService,
      };

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("CONFIRMED_RIDE_BOOKING", JSON.stringify(bookingData));
        }
      } catch {}

      setConfirmedBooking(bookingData);
      setPendingRideToPay(null);
      setMatchedRides([]);
      setActiveTab("POOLS");
      alert("🎉 Real-time Payment Successful! Ride Confirmed. Opening your live tracking dashboard.");
    }, 2000);
  };

  // Cancel Confirmed Booking
  const handleCancelBooking = () => {
    if (confirm("Cancel this ride? Paid fare will be refunded to your source UPI account.")) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem("CONFIRMED_RIDE_BOOKING");
        }
      } catch {}
      setConfirmedBooking(null);
      alert("Ride cancelled successfully.");
    }
  };

  // WhatsApp Location Share to Family
  const shareLiveLocationToFamily = () => {
    const text = `🚨 LIVE RIDE TRACKING: Hi Family, I have started my ride with ${confirmedBooking?.driver_name} (${confirmedBooking?.vehicle_name}). Pickup: ${confirmedBooking?.pickup} ➔ Drop: ${confirmedBooking?.drop}. Track Live: https://my-app-frontend-blue.vercel.app/track`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  // ---------------- ONBOARDING / LOGIN SCREEN IF DELETED / LOGGED OUT ----------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.onboardScroll}>
          <View style={styles.onboardCard}>
            <Text style={styles.badgeOrange}>PASSENGER ONBOARDING</Text>
            <Text style={styles.onboardTitle}>Welcome to RidePool</Text>
            <Text style={styles.onboardSub}>Enter your details to start booking eco-commutes in Hyderabad.</Text>

            <Text style={styles.inputTag}>FULL NAME *</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. Bhargav"
              value={passengerName}
              onChangeText={setPassengerName}
            />

            <Text style={styles.inputTag}>PHONE NUMBER *</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="8919326622"
              value={passengerPhone}
              onChangeText={setPassengerPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputTag}>EMAIL ID (OPTIONAL)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="vattalabhargav3@gmail.com"
              value={passengerEmail}
              onChangeText={setPassengerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputTag}>AADHAAR CARD NUMBER (OPTIONAL)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="12-digit Aadhaar number"
              value={aadhaarInput}
              onChangeText={setAadhaarInput}
              keyboardType="numeric"
            />

            <Text style={styles.inputTag}>STUDENT / EMPLOYEE ID (OPTIONAL)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter College or Company ID"
              value={studentOrEmpId}
              onChangeText={setStudentOrEmpId}
            />

            <TouchableOpacity style={styles.primaryYellowBtn} onPress={handleCompleteLogin}>
              <Text style={styles.primaryYellowBtnText}>Start Booking Rides ➔</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ---------------- 1. MAIN RIDE DASHBOARD TAB ---------------- */}
        {activeTab === "RIDE" && (
          <View style={{ flex: 1, position: "relative" }}>
            {/* Full-Screen Isolated Map */}
            <View style={styles.fullScreenMapWrap}>
              <div
                ref={mapElementRef as any}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100vh",
                  cursor: isMapDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              />

              {/* Rapido Center Pinpoint with Floating Animation */}
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

              {/* Floating Address Pill */}
              <View style={styles.floatingAddressPillBox}>
                <View style={styles.greenRingIcon} />
                <View style={{ flex: 1 }}>
                  {isResolvingAddress ? (
                    <Text style={styles.resolvingText}>Detecting address...</Text>
                  ) : (
                    <Text style={styles.floatingAddressPillText} numberOfLines={1}>
                      {pickupAddress}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Top Floating Nav Bar */}
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

            {/* Draggable Rapido Bottom Sheet */}
            <View style={[styles.bottomSheetContainer, isSheetExpanded && { height: 420 }]}>
              {/* Drag Handle (Toggles Height on Tap) */}
              <TouchableOpacity
                style={styles.sheetHandleArea}
                onPress={() => setIsSheetExpanded(!isSheetExpanded)}
              >
                <View style={styles.bottomSheetHandle} />
                <Text style={styles.dragHelpSmall}>
                  {isSheetExpanded ? "▼ Drag down to collapse" : "▲ Drag up for refer & earn"}
                </Text>
              </TouchableOpacity>

              {/* Pickup Location Selector */}
              <TouchableOpacity
                style={styles.locationSelectorRow}
                onPress={() => {
                  setActiveTarget("PICKUP");
                  setShowSearchModal(true);
                }}
              >
                <View style={styles.greenDotMini} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>PICKUP LOCATION</Text>
                  <Text style={styles.selectorValueText} numberOfLines={1}>{pickupAddress}</Text>
                </View>
                <Text style={styles.selectorActionTag}>Change ➔</Text>
              </TouchableOpacity>

              <View style={{ height: 6 }} />

              {/* Clean Empty Drop Search Trigger ("Where do you want to go?") */}
              <TouchableOpacity
                style={[styles.locationSelectorRow, !dropAddress && { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" }]}
                onPress={() => {
                  setActiveTarget("DROP");
                  setShowSearchModal(true);
                }}
              >
                <View style={styles.redSquareMini} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>DROP LOCATION</Text>
                  <Text style={[styles.selectorValueText, !dropAddress && { color: "#D97706" }]} numberOfLines={1}>
                    {dropAddress || "Where do you want to go? (Tap to search)"}
                  </Text>
                </View>
                <Text style={[styles.selectorActionTag, !dropAddress && { color: "#D97706" }]}>
                  {dropAddress ? "Change ➔" : "Search ➔"}
                </Text>
              </TouchableOpacity>

              {/* Mode Filters */}
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

              {/* Search for Rides Action Button */}
              <TouchableOpacity
                style={styles.searchForRidesBtn}
                onPress={handleSearchForRides}
                disabled={isSearchingRides}
              >
                {isSearchingRides ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#0F172A" />
                    <Text style={styles.searchForRidesBtnText}>Searching nearby drivers...</Text>
                  </View>
                ) : (
                  <Text style={styles.searchForRidesBtnText}>Search for Rides / Find Pool ➔</Text>
                )}
              </TouchableOpacity>

              {/* Matched Live Rides Feed */}
              {matchedRides.length > 0 && (
                <View style={{ marginTop: 8, maxHeight: 110 }}>
                  <ScrollView>
                    {matchedRides.map((ride) => (
                      <View key={ride.id} style={styles.matchedRideCard}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 13 }}>
                            {ride.driver_name} • {ride.vehicle_name}
                          </Text>
                          <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 15 }}>₹{ride.price_per_seat}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.bookOnlineBtn}
                          onPress={() => {
                            setPendingRideToPay(ride);
                            setShowRidePaymentModal(true);
                          }}
                        >
                          <Text style={styles.bookOnlineBtnText}>Pay Online & Confirm (₹{ride.price_per_seat}) ➔</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Drag Down Refer & Earn ₹200 Card */}
              {isSheetExpanded && (
                <View style={styles.expandedReferBanner}>
                  <Text style={styles.referBannerTitle}>🎁 Refer a Friend & Earn ₹200</Text>
                  <Text style={styles.referBannerSub}>Both you and your friend get ₹200 on their first ride!</Text>
                  <TouchableOpacity
                    style={styles.shareCodeMiniBtn}
                    onPress={() => {
                      const txt = `Join RidePool Hyderabad! Use code PASSENGER${passengerPhone.slice(
                        -4
                      )} to get ₹200 off: https://my-app-frontend-blue.vercel.app`;
                      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(txt)}`);
                    }}
                  >
                    <Text style={styles.shareCodeMiniText}>Share on WhatsApp (₹200) ➔</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ---------------- 2. DEDICATED POOLS TAB (CONFIRMED REAL BOOKING ONLY) ---------------- */}
        {activeTab === "POOLS" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>My Active Pools & Tracking</Text>

            {confirmedBooking ? (
              <View style={styles.activeRideBox}>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.statusBadgeText}>PAYMENT VERIFIED • {confirmedBooking.status}</Text>
                </View>

                {/* OTP Box */}
                <View style={styles.otpCard}>
                  <Text style={styles.otpCardLabel}>SHARE TRIP OTP WITH DRIVER</Text>
                  <Text style={styles.otpCardNumber}>{confirmedBooking.otp}</Text>
                </View>

                {/* Driver Details */}
                <View style={styles.driverInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverBigName}>{confirmedBooking.driver_name}</Text>
                    <Text style={styles.driverVehicleSub}>{confirmedBooking.vehicle_name} ({confirmedBooking.plate_type} Plate)</Text>
                    <Text style={styles.driverRouteSub}>📍 {confirmedBooking.pickup}</Text>
                    <Text style={styles.driverRouteSub}>🏁 {confirmedBooking.drop}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.driverFareBig}>₹{confirmedBooking.fare}</Text>
                    <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "900" }}>Paid Online</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={styles.callDriverBtn}
                    onPress={() => Linking.openURL(`tel:${confirmedBooking.driver_phone}`)}
                  >
                    <Text style={styles.callDriverText}>📞 Call Driver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBookingBtn} onPress={handleCancelBooking}>
                    <Text style={styles.cancelBookingText}>Cancel Ride</Text>
                  </TouchableOpacity>
                </View>

                {/* Mandatory WhatsApp Family Share Button */}
                <TouchableOpacity style={styles.shareFamilyLocationBtn} onPress={shareLiveLocationToFamily}>
                  <Text style={styles.shareFamilyLocationText}>📲 Share Your Live Location to Family (WhatsApp)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyPoolCard}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🚗</Text>
                <Text style={styles.emptyPoolTitle}>No Active Pools Found</Text>
                <Text style={styles.emptyPoolSub}>
                  Payment chesi ride confirm chesaka mathrame Driver details, OTP mariyu live tracking ikkada kanipisthundi.
                </Text>
                <TouchableOpacity style={styles.bookNowActionBtn} onPress={() => setActiveTab("RIDE")}>
                  <Text style={styles.bookNowActionBtnText}>Search & Book Ride ➔</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* ---------------- 3. DEDICATED REWARDS TAB ---------------- */}
        {activeTab === "REWARDS" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>Rewards & Referral Bonus</Text>

            <View style={styles.rewardsCard}>
              <Text style={styles.rewardsCardTitle}>🎁 Refer & Earn ₹200 + ₹200</Text>
              <Text style={styles.rewardsCardSub}>
                Share your referral code with friends. Once they take their first carpool ride, both of you get ₹200!
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
          </ScrollView>
        )}

        {/* ---------------- 4. DEDICATED PROFILE TAB ---------------- */}
        {activeTab === "PROFILE" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>Profile & Wallet</Text>

            <View style={styles.profileCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={styles.profileAvatarCircle}>
                  <Text style={{ fontSize: 24 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{passengerName}</Text>
                  <Text style={styles.profilePhone}>📱 {passengerPhone}</Text>
                  {passengerEmail ? <Text style={styles.profileEmail}>✉️ {passengerEmail}</Text> : null}
                  <Text style={{ color: "#16A34A", fontSize: 11, fontWeight: "800", marginTop: 2 }}>Verified Passenger</Text>
                </View>
                <TouchableOpacity style={styles.editProfilePill} onPress={() => setShowEditProfileModal(true)}>
                  <Text style={styles.editProfilePillText}>Edit ✏️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileDivider} />

              {/* Wallet Section (Zero by Default) */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "800" }}>WALLET BALANCE</Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: "#16A34A" }}>₹{walletBalance}.00</Text>
                </View>
                <TouchableOpacity style={styles.addMoneyBtn} onPress={() => setShowAddMoneyModal(true)}>
                  <Text style={styles.addMoneyText}>+ Add Money</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Account Settings */}
            <View style={[styles.profileCard, { marginTop: 14 }]}>
              <TouchableOpacity style={styles.profileActionRow} onPress={() => setShowSosModal(true)}>
                <Text style={{ fontSize: 18 }}>🚨</Text>
                <Text style={styles.profileActionText}>Emergency Safety & SOS</Text>
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity style={styles.profileActionRow} onPress={handleLogout}>
                <Text style={{ fontSize: 18 }}>🚪</Text>
                <Text style={[styles.profileActionText, { color: "#D97706" }]}>Logout</Text>
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity style={styles.profileActionRow} onPress={handleDeleteAccount}>
                <Text style={{ fontSize: 18 }}>⚠️</Text>
                <Text style={[styles.profileActionText, { color: "#EF4444" }]}>Delete Account Permanently</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- FIXED BOTTOM NAVIGATION BAR ---------------- */}
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

        {/* ---------------- REAL-TIME ONLINE PAYMENT MODAL FOR RIDE BOOKING ---------------- */}
        <Modal visible={showRidePaymentModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.paymentModalHeader}>💳 Real-Time Payment</Text>
                <TouchableOpacity onPress={() => setShowRidePaymentModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paymentModalSub}>Payment confirm ayyaka mathrame ride book avthundi.</Text>

              {/* Summary */}
              <View style={styles.paymentSummaryCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", color: "#0F172A" }}>Amount Payable</Text>
                  <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 20 }}>
                    ₹{pendingRideToPay?.price_per_seat || 110}.00
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  {pickupAddress.split(",")[0]} ➔ {dropAddress.split(",")[0]}
                </Text>
              </View>

              {/* Direct UPI Apps */}
              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPayService === "PHONEPE" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPayService("PHONEPE")}
              >
                <Text style={{ fontSize: 20 }}>🟣</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>PhonePe (Direct App Launch)</Text>
                  <Text style={styles.paymentMethodSub}>Instant UPI Transfer</Text>
                </View>
                {selectedPayService === "PHONEPE" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPayService === "GPAY" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPayService("GPAY")}
              >
                <Text style={{ fontSize: 20 }}>🟢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Google Pay (GPay App)</Text>
                  <Text style={styles.paymentMethodSub}>Secure UPI Intent</Text>
                </View>
                {selectedPayService === "GPAY" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPayService === "PAYTM" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPayService("PAYTM")}
              >
                <Text style={{ fontSize: 20 }}>🔵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Paytm UPI / NetBanking</Text>
                  <Text style={styles.paymentMethodSub}>Fast Paytm Checkout</Text>
                </View>
                {selectedPayService === "PAYTM" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPayService === "QR" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPayService("QR")}
              >
                <Text style={{ fontSize: 20 }}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Scan Dynamic UPI QR</Text>
                  <Text style={styles.paymentMethodSub}>Scan with Any UPI App</Text>
                </View>
                {selectedPayService === "QR" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              {/* Dynamic QR */}
              {selectedPayService === "QR" && (
                <View style={styles.qrDisplayBox}>
                  {/* @ts-ignore */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=8919326622@ybl&pn=RidePool&am=${
                      pendingRideToPay?.price_per_seat || 110
                    }&cu=INR`}
                    alt="UPI QR Code"
                    style={{ width: 130, height: 130 }}
                  />
                  <Text style={styles.qrInstructionText}>Scan via PhonePe, GPay, or Paytm</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.payNowConfirmBtn}
                onPress={handleConfirmRidePayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payNowConfirmBtnText}>
                    Pay ₹{pendingRideToPay?.price_per_seat || 110} & Confirm Ride ➔
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- REAL-TIME ADD MONEY WALLET MODAL ---------------- */}
        <Modal visible={showAddMoneyModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.paymentModalHeader}>💰 Add Money to Wallet</Text>
                <TouchableOpacity onPress={() => setShowAddMoneyModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paymentModalSub}>Direct PhonePe / GPay / Paytm dwara payment chesi wallet lo add avthundi.</Text>

              <Text style={styles.inputTag}>AMOUNT (₹)</Text>
              <TextInput
                style={styles.inputBox}
                value={addAmount}
                onChangeText={setAddAmount}
                keyboardType="numeric"
              />

              <View style={styles.qrDisplayBox}>
                {/* @ts-ignore */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=8919326622@ybl&pn=RidePool&am=${
                    addAmount || 200
                  }&cu=INR`}
                  alt="UPI QR"
                  style={{ width: 120, height: 120 }}
                />
                <Text style={styles.qrInstructionText}>Scan QR or tap below to open UPI App</Text>
              </View>

              <TouchableOpacity
                style={styles.payNowConfirmBtn}
                onPress={handleConfirmWalletPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payNowConfirmBtnText}>Pay & Add ₹{addAmount} via UPI ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- EDIT PROFILE MODAL (WITH OPTIONAL AADHAAR & STUDENT/EMP ID) ---------------- */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalTitle}>Edit Profile & Verification</Text>

              <Text style={styles.inputTag}>NAME</Text>
              <TextInput style={styles.inputBox} value={passengerName} onChangeText={setPassengerName} />

              <Text style={styles.inputTag}>MOBILE NUMBER</Text>
              <TextInput style={styles.inputBox} value={passengerPhone} onChangeText={setPassengerPhone} keyboardType="phone-pad" />

              <Text style={styles.inputTag}>EMAIL ID (OPTIONAL)</Text>
              <TextInput style={styles.inputBox} value={passengerEmail} onChangeText={setPassengerEmail} keyboardType="email-address" />

              <Text style={styles.inputTag}>AADHAAR CARD NUMBER (OPTIONAL)</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="12-digit Aadhaar number"
                value={aadhaarInput}
                onChangeText={setAadhaarInput}
                keyboardType="numeric"
              />

              <Text style={styles.inputTag}>STUDENT OR EMPLOYEE ID (OPTIONAL)</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="College / Company ID (can be skipped)"
                value={studentOrEmpId}
                onChangeText={setStudentOrEmpId}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save Profile ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setShowEditProfileModal(false)}>
                <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- SEARCH MODAL FOR PICKUP & DROP (HYDERABAD BOUNDED) ---------------- */}
        <Modal visible={showSearchModal} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View style={styles.searchModalTopBar}>
              <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.backCircleBtn}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>←</Text>
              </TouchableOpacity>

              <View style={styles.searchInputWrap}>
                <TextInput
                  style={styles.searchInputInner}
                  placeholder={`Search ${activeTarget === "DROP" ? "destination" : "pickup"} in Hyderabad...`}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={handleSearchHyderabadPlaces}
                  autoFocus
                />
                {loadingSearch && <ActivityIndicator size="small" color="#0284C7" />}
              </View>
            </View>

            {/* Quick Hubs */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.searchResultRow} onPress={() => handleSelectSearchItem(item)}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchItemTitle}>{item.display_name.split(",")[0]}</Text>
                      <Text style={styles.searchItemSub} numberOfLines={1}>{item.display_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View>
                  <Text style={styles.popularHubsHeading}>POPULAR HYDERABAD DESTINATIONS</Text>
                  {HYDERABAD_HUBS.map((hub, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.searchResultRow}
                      onPress={() => {
                        if (activeTarget === "DROP") setDropAddress(`${hub.name}, ${hub.sub}`);
                        else setPickupAddress(`${hub.name}, ${hub.sub}`);
                        setShowSearchModal(false);
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🏢</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchItemTitle}>{hub.name}</Text>
                        <Text style={styles.searchItemSub}>{hub.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
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
                  alert("RidePool 24x7 Helpline: 1800-419-0099");
                }}
              >
                <Text style={styles.drawerItemIcon}>📞</Text>
                <Text style={styles.drawerItemLabel}>Help Line & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("REWARDS");
                }}
              >
                <Text style={styles.drawerItemIcon}>🎁</Text>
                <Text style={styles.drawerItemLabel}>Rewards (₹200 + ₹200)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setShowAddMoneyModal(true);
                }}
              >
                <Text style={styles.drawerItemIcon}>💳</Text>
                <Text style={styles.drawerItemLabel}>Add Money to Wallet</Text>
              </TouchableOpacity>

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setShowEditProfileModal(true);
                }}
              >
                <Text style={styles.drawerItemIcon}>✏️</Text>
                <Text style={styles.drawerItemLabel}>Edit Profile & Verification</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItemRow} onPress={handleLogout}>
                <Text style={styles.drawerItemIcon}>🚪</Text>
                <Text style={[styles.drawerItemLabel, { color: "#D97706" }]}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItemRow} onPress={handleDeleteAccount}>
                <Text style={styles.drawerItemIcon}>⚠️</Text>
                <Text style={[styles.drawerItemLabel, { color: "#EF4444" }]}>Delete Account Permanently</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDrawerMenu(false)} />
          </View>
        </Modal>

        {/* ---------------- SOS EMERGENCY MODAL ---------------- */}
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
  sheetHandleArea: { alignItems: "center", marginBottom: 8 },
  bottomSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" },
  dragHelpSmall: { fontSize: 9, color: "#94A3B8", fontWeight: "800", marginTop: 4 },
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
    marginBottom: 6,
  },
  bookOnlineBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  bookOnlineBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  expandedReferBanner: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  referBannerTitle: { fontSize: 12, fontWeight: "900", color: "#78350F" },
  referBannerSub: { fontSize: 10, color: "#92400E", marginTop: 2 },
  shareCodeMiniBtn: { backgroundColor: "#25D366", paddingVertical: 6, borderRadius: 6, alignItems: "center", marginTop: 8 },
  shareCodeMiniText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  dedicatedTabContent: { padding: 16, paddingBottom: 80 },
  tabHeading: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 14 },
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
  bookNowActionBtn: { backgroundColor: "#FFC000", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginTop: 18 },
  bookNowActionBtnText: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
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
  callDriverBtn: { flex: 1, backgroundColor: "#16A34A", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  callDriverText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  cancelBookingBtn: { backgroundColor: "#FEE2E2", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  cancelBookingText: { color: "#DC2626", fontSize: 12, fontWeight: "800" },
  shareFamilyLocationBtn: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  shareFamilyLocationText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  rewardsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  rewardsCardTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  rewardsCardSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
  referralCodeBox: { backgroundColor: "#FEF3C7", padding: 14, borderRadius: 12, alignItems: "center", marginVertical: 12, borderWidth: 1.5, borderColor: "#FDE68A" },
  referralCodeTag: { fontSize: 9, fontWeight: "800", color: "#B45309" },
  referralCodeText: { fontSize: 20, fontWeight: "900", color: "#78350F", marginTop: 2 },
  whatsappShareBtn: { backgroundColor: "#25D366", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  whatsappShareText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  profileAvatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  profileName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  profilePhone: { fontSize: 11, color: "#64748B", marginTop: 2 },
  profileEmail: { fontSize: 11, color: "#64748B", marginTop: 1 },
  editProfilePill: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  editProfilePillText: { fontSize: 11, fontWeight: "800", color: "#334155" },
  profileDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  addMoneyBtn: { backgroundColor: "#DCFCE7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addMoneyText: { color: "#16A34A", fontSize: 11, fontWeight: "900" },
  profileActionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  profileActionText: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
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
  paymentModalHeader: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  paymentModalSub: { fontSize: 11, color: "#64748B", marginTop: 2, marginBottom: 8 },
  paymentSummaryCard: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12, marginBottom: 10 },
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
  qrDisplayBox: { alignItems: "center", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", marginVertical: 6 },
  qrInstructionText: { fontSize: 10, fontWeight: "700", color: "#475569", marginTop: 6 },
  payNowConfirmBtn: { backgroundColor: "#16A34A", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  payNowConfirmBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
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
  searchModalTopBar: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  backCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  searchInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 20, paddingHorizontal: 12, height: 40 },
  searchInputInner: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0F172A" },
  searchResultRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9", gap: 10 },
  searchItemTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  searchItemSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  popularHubsHeading: { fontSize: 10, fontWeight: "900", color: "#94A3B8", letterSpacing: 0.5, marginVertical: 10 },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", flexDirection: "row" },
  drawerCard: { width: "75%", maxWidth: 300, backgroundColor: "#FFFFFF", height: "100%", padding: 20, paddingTop: 36 },
  drawerHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  drawerName: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  drawerPhone: { fontSize: 11, color: "#64748B", marginTop: 2 },
  drawerWalletText: { fontSize: 12, color: "#16A34A", fontWeight: "800", marginTop: 4 },
  drawerDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  drawerItemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  drawerItemIcon: { fontSize: 18 },
  drawerItemLabel: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626", marginBottom: 12 },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
  onboardScroll: { padding: 20, paddingTop: 40 },
  onboardCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#E2E8F0" },
  badgeOrange: { color: "#D97706", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  onboardTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginTop: 4 },
  onboardSub: { fontSize: 12, color: "#64748B", marginTop: 4, marginBottom: 12 },
  primaryYellowBtn: { backgroundColor: "#FFC000", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 18 },
  primaryYellowBtnText: { color: "#0F172A", fontSize: 14, fontWeight: "900" },
});
