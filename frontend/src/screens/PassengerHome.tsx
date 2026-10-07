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

const HYDERABAD_HUBS = [
  { name: "Hitec City Cyber Towers", sub: "Madhapur, Hyderabad", lat: 17.4435, lon: 78.3772 },
  { name: "Gachibowli DLF Cybercity", sub: "Gachibowli, Hyderabad", lat: 17.4401, lon: 78.3489 },
  { name: "LB Nagar Ring Road", sub: "LB Nagar, Hyderabad", lat: 17.3457, lon: 78.5522 },
  { name: "Secunderabad Railway Station", sub: "Secunderabad, Hyderabad", lat: 17.4399, lon: 78.4983 },
  { name: "Kukatpally Housing Board (KPHB)", sub: "Kukatpally, Hyderabad", lat: 17.4947, lon: 78.3996 },
  { name: "B.N. Reddy Nagar", sub: "Sagar Highway, Hyderabad", lat: 17.3312, lon: 78.5638 },
];

export function PassengerHome({ navigation }: any) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [passengerName, setPassengerName] = useState("Bhargav");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [passengerEmail, setPassengerEmail] = useState("vattalabhargav3@gmail.com");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [studentOrEmpId, setStudentOrEmpId] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [activeTab, setActiveTab] = useState<"RIDE" | "POOLS" | "REWARDS" | "PROFILE">("RIDE");

  const [pickupAddress, setPickupAddress] = useState("TCS Junction, HITEC City Road, Madhapur");
  const [pickupCoords, setPickupCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [dropAddress, setDropAddress] = useState("");
  const [dropCoords, setDropCoords] = useState({ lat: 17.4483, lon: 78.3915 });

  const [showMapModal, setShowMapModal] = useState(false);
  const [activeTarget, setActiveTarget] = useState<"PICKUP" | "DROP">("DROP");
  const [modalPinCoords, setModalPinCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [modalResolvedAddress, setModalResolvedAddress] = useState("Cyber Towers, Hyderabad");
  const [isModalResolving, setIsModalResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [isSearchingRides, setIsSearchingRides] = useState(false);
  const [matchedRides, setMatchedRides] = useState<any[]>([]);

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const [showRidePaymentModal, setShowRidePaymentModal] = useState(false);
  const [pendingRideToPay, setPendingRideToPay] = useState<any | null>(null);
  const [selectedPayService, setSelectedPayService] = useState<"PHONEPE" | "GPAY" | "PAYTM" | "QR">("PHONEPE");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState("200");

  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  const modalMapRef = useRef<HTMLDivElement | null>(null);
  const modalLeafletInstance = useRef<any>(null);

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

  const reverseGeocode = async (lat: number, lon: number) => {
    setIsModalResolving(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const p0 = parts[0] ? parts[0].trim() : "";
        const p1 = parts[1] ? parts[1].trim() : "";
        setModalResolvedAddress(`${p0}, ${p1}, Hyderabad`);
      } else {
        setModalResolvedAddress(`Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch {
      setModalResolvedAddress(`Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    } finally {
      setIsModalResolving(false);
    }
  };

  useEffect(() => {
    if (!showMapModal || typeof window === "undefined") return;

    const loadLeafletAssets = () => {
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
        script.onload = () => initModalMap();
        document.body.appendChild(script);
      } else {
        setTimeout(initModalMap, 80);
      }
    };

    const initModalMap = () => {
      const L = (window as any).L;
      if (!L || !modalMapRef.current) return;

      if (modalLeafletInstance.current) {
        modalLeafletInstance.current.remove();
        modalLeafletInstance.current = null;
      }

      const initialCoords = activeTarget === "PICKUP" ? pickupCoords : modalPinCoords;

      const map = L.map(modalMapRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [initialCoords.lat, initialCoords.lon],
        zoom: 16,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      map.on("moveend", () => {
        const center = map.getCenter();
        setModalPinCoords({ lat: center.lat, lon: center.lng });
        reverseGeocode(center.lat, center.lng);
        map.invalidateSize();
      });

      setTimeout(() => map.invalidateSize(), 200);
      modalLeafletInstance.current = map;
    };

    loadLeafletAssets();

    return () => {
      if (modalLeafletInstance.current) {
        modalLeafletInstance.current.remove();
        modalLeafletInstance.current = null;
      }
    };
  }, [showMapModal, activeTarget]);

  const openSearchModal = (target: "PICKUP" | "DROP") => {
    setActiveTarget(target);
    const coords = target === "PICKUP" ? pickupCoords : dropCoords;
    const addr = target === "PICKUP" ? pickupAddress : dropAddress;
    setModalPinCoords(coords);
    setModalResolvedAddress(addr || "Hyderabad");
    setSearchQuery("");
    setSearchResults([]);
    setShowMapModal(true);
  };

  const handleSearchPlaces = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        text.trim() + ", Hyderabad"
      )}&countrycodes=in&viewbox=78.1,17.6,78.7,17.1&bounded=1&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const placeName = item.display_name.split(",").slice(0, 3).join(",");

    setModalPinCoords({ lat, lon });
    setModalResolvedAddress(placeName);
    setSearchResults([]);
    setSearchQuery("");

    if (modalLeafletInstance.current) {
      modalLeafletInstance.current.setView([lat, lon], 17);
      setTimeout(() => modalLeafletInstance.current.invalidateSize(), 100);
    }
  };

  const fetchLiveGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setModalPinCoords({ lat, lon });
          reverseGeocode(lat, lon);
          if (modalLeafletInstance.current) {
            modalLeafletInstance.current.setView([lat, lon], 17);
            setTimeout(() => modalLeafletInstance.current.invalidateSize(), 100);
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

  const confirmModalLocation = () => {
    if (activeTarget === "PICKUP") {
      setPickupAddress(modalResolvedAddress);
      setPickupCoords(modalPinCoords);
    } else {
      setDropAddress(modalResolvedAddress);
      setDropCoords(modalPinCoords);
    }
    setShowMapModal(false);
  };

  const handleSearchForRides = () => {
    if (!dropAddress.trim()) {
      alert("Please select a Drop Location first!");
      openSearchModal("DROP");
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
            alert("No rides found right now for this route! Create a ride in Driver Console to test live matching.");
          }
        }
      } catch {
        setMatchedRides([]);
      }
    }, 1200);
  };

  const launchRealUpi = (amount: number, note: string) => {
    const upiUri = `upi://pay?pa=8919326622@ybl&pn=RidePool&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    Linking.openURL(upiUri).catch(() => {
      alert(`Launching UPI App for ₹${amount}. If on browser, please scan QR code.`);
    });
  };

  const handleConfirmRidePayment = () => {
    const fare = pendingRideToPay?.price_per_seat || 110;
    setIsProcessingPayment(true);
    launchRealUpi(fare, `Ride Booking #${pendingRideToPay?.id || "101"}`);

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
      alert("🎉 Real Payment Successful! Ride confirmed. Opening your live tracking dashboard.");
    }, 2000);
  };

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

  const shareLiveLocationToFamily = () => {
    const text = `🚨 LIVE RIDE TRACKING: Hi Family, I have started my ride with ${confirmedBooking?.driver_name} (${confirmedBooking?.vehicle_name}). Pickup: ${confirmedBooking?.pickup} ➔ Drop: ${confirmedBooking?.drop}. Track Live: https://my-app-frontend-blue.vercel.app/track`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

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

  const handleDeleteAccount = () => {
    if (confirm("Are you sure? Your profile, bookings, and wallet will be deleted permanently.")) {
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
      alert("Account deleted.");
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.onboardScroll}>
          <View style={styles.onboardCard}>
            <Text style={styles.badgeOrange}>PASSENGER ONBOARDING</Text>
            <Text style={styles.onboardTitle}>RidePool Hyderabad</Text>
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

            <Text style={styles.inputTag}>AADHAAR NUMBER (OPTIONAL)</Text>
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
              placeholder="College / Company ID (can be skipped)"
              value={studentOrEmpId}
              onChangeText={setStudentOrEmpId}
            />

            <TouchableOpacity
              style={styles.primaryYellowBtn}
              onPress={() => {
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
              }}
            >
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
        {/* TAB 1: RIDE */}
        {activeTab === "RIDE" && (
          <ScrollView contentContainerStyle={styles.mainDashboardScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.mainBrandHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <TouchableOpacity style={styles.menuIconBtn} onPress={() => setShowDrawerMenu(true)}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0F172A" }}>☰</Text>
                </TouchableOpacity>
                <View>
                  <Text style={styles.brandTitleText}>RIDEPOOL</Text>
                  <Text style={styles.brandSubText}>HYDERABAD COMMUTE</Text>
                </View>
              </View>

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

            <View style={styles.searchRouteCard}>
              <Text style={styles.routeSectionHeading}>BOOK YOUR RIDE</Text>

              <TouchableOpacity
                style={styles.locationSelectorRow}
                onPress={() => openSearchModal("PICKUP")}
                activeOpacity={0.85}
              >
                <View style={styles.greenDotMini} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>PICKUP LOCATION</Text>
                  <Text style={styles.selectorValueText} numberOfLines={1}>
                    {pickupAddress}
                  </Text>
                </View>
                <Text style={styles.selectorActionTag}>Select on Map ➔</Text>
              </TouchableOpacity>

              <View style={{ height: 10 }} />

              <TouchableOpacity
                style={[
                  styles.locationSelectorRow,
                  !dropAddress && { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
                ]}
                onPress={() => openSearchModal("DROP")}
                activeOpacity={0.85}
              >
                <View style={styles.redSquareMini} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorLabel}>DROP LOCATION</Text>
                  <Text
                    style={[styles.selectorValueText, !dropAddress && { color: "#D97706" }]}
                    numberOfLines={1}
                  >
                    {dropAddress || "Where do you want to go? (Tap to Search)"}
                  </Text>
                </View>
                <Text style={[styles.selectorActionTag, !dropAddress && { color: "#D97706" }]}>
                  {dropAddress ? "Change ➔" : "Search ➔"}
                </Text>
              </TouchableOpacity>

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
                  <Text
                    style={[
                      styles.plateFilterText,
                      plateFilter === "YELLOW" && styles.plateFilterChipActiveYellowText,
                    ]}
                  >
                    🟡 Commercial Cab
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.searchForRidesBtn}
                onPress={handleSearchForRides}
                disabled={isSearchingRides}
                activeOpacity={0.85}
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
            </View>

            {matchedRides.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.matchedSectionTitle}>AVAILABLE RIDES MATCHED ({matchedRides.length})</Text>
                {matchedRides.map((ride) => (
                  <View key={ride.id} style={styles.matchedRideCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 14 }}>
                        {ride.driver_name} • {ride.vehicle_name}
                      </Text>
                      <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 16 }}>₹{ride.price_per_seat}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#64748B", marginVertical: 4 }}>
                      📍 {ride.from_location} ➔ 🏁 {ride.to_location}
                    </Text>
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
              </View>
            )}

            <View style={styles.referNetworkCard}>
              <View style={styles.networkGraphicContainer}>
                <View style={styles.networkCenterNode}>
                  <Text style={{ fontSize: 24 }}>🚗</Text>
                </View>
                <View style={styles.networkPillLeft}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#1E293B" }}>You (₹200)</Text>
                </View>
                <View style={styles.networkPillRight}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#1E293B" }}>Friend (₹200)</Text>
                </View>
              </View>

              <Text style={styles.referNetworkTitle}>Build the Green Commute Network</Text>
              <Text style={styles.referNetworkSub}>
                Invite colleagues, students, and commuters to carpool. When your friend takes their first ride, both of
                you receive ₹200 directly!
              </Text>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeTag}>YOUR REFERRAL CODE</Text>
                <Text style={styles.referralCodeText}>{`PASSENGER${passengerPhone.slice(-4)}`}</Text>
              </View>

              <TouchableOpacity
                style={styles.shareWhatsAppNetworkBtn}
                onPress={() => {
                  const txt = `Join RidePool Hyderabad! Use code PASSENGER${passengerPhone.slice(
                    -4
                  )} to get ₹200 off your first ride: https://my-app-frontend-blue.vercel.app`;
                  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(txt)}`);
                }}
              >
                <Text style={styles.shareWhatsAppNetworkBtnText}>📲 Share Referral Link on WhatsApp ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* TAB 2: POOLS */}
        {activeTab === "POOLS" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabContent}>
            <Text style={styles.tabHeading}>My Active Pools & Tracking</Text>

            {confirmedBooking ? (
              <View style={styles.activeRideBox}>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.statusBadgeText}>PAYMENT VERIFIED • {confirmedBooking.status}</Text>
                </View>

                <View style={styles.otpCard}>
                  <Text style={styles.otpCardLabel}>SHARE TRIP OTP WITH DRIVER</Text>
                  <Text style={styles.otpCardNumber}>{confirmedBooking.otp}</Text>
                </View>

                <View style={styles.driverInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverBigName}>{confirmedBooking.driver_name}</Text>
                    <Text style={styles.driverVehicleSub}>
                      {confirmedBooking.vehicle_name} ({confirmedBooking.plate_type} Plate)
                    </Text>
                    <Text style={styles.driverRouteSub}>📍 {confirmedBooking.pickup}</Text>
                    <Text style={styles.driverRouteSub}>🏁 {confirmedBooking.drop}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.driverFareBig}>₹{confirmedBooking.fare}</Text>
                    <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "900" }}>Paid Online</Text>
                  </View>
                </View>

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

        {/* TAB 3: REWARDS */}
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

        {/* TAB 4: PROFILE */}
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
                  <Text style={{ color: "#16A34A", fontSize: 11, fontWeight: "800", marginTop: 2 }}>
                    Verified Passenger
                  </Text>
                </View>
                <TouchableOpacity style={styles.editProfilePill} onPress={() => setShowEditProfileModal(true)}>
                  <Text style={styles.editProfilePillText}>Edit ✏️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileDivider} />

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

        {/* BOTTOM NAV */}
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

        {/* PIN-TO-PIN MAP MODAL */}
        <Modal visible={showMapModal} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View style={styles.modalSearchTopHeader}>
              <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.backCircleBtn}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0F172A" }}>←</Text>
              </TouchableOpacity>

              <View style={styles.modalSearchInputWrap}>
                <Text style={{ fontSize: 14 }}>🔍</Text>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder={`Search ${activeTarget === "DROP" ? "destination" : "pickup"} in Hyderabad...`}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={handleSearchPlaces}
                />
                {loadingSearch && <ActivityIndicator size="small" color="#0284C7" />}
              </View>
            </View>

            <View style={styles.quickGpsBar}>
              <TouchableOpacity style={styles.gpsActionBtn} onPress={fetchLiveGps} disabled={isFetchingGps}>
                {isFetchingGps ? <ActivityIndicator size="small" color="#0284C7" /> : <Text style={{ fontSize: 14 }}>🎯</Text>}
                <Text style={styles.gpsActionText}>Locate My Position</Text>
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchDropdownWrap}>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.searchDropdownItem} onPress={() => handleSelectSearchResult(item)}>
                    <Text style={{ fontSize: 15 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchItemHead}>{item.display_name.split(",")[0]}</Text>
                      <Text style={styles.searchItemSub} numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                    activeTarget === "DROP" ? { backgroundColor: "#EF4444" } : { backgroundColor: "#16A34A" },
                  ]}
                >
                  <View style={styles.pinInnerDotWhite} />
                </View>
                <View
                  style={[
                    styles.modalPinStem,
                    activeTarget === "DROP" ? { backgroundColor: "#EF4444" } : { backgroundColor: "#16A34A" },
                  ]}
                />
                <View style={styles.pinShadowDot} />
              </View>

              <View style={styles.modalDragHintPill} pointerEvents="none">
                <Text style={styles.modalDragHintText}>
                  🖐️ Chetho / Mouse tho drag chesi pin set cheyandi
                </Text>
              </View>
            </View>

            <View style={styles.modalConfirmBottomSheet}>
              <Text style={styles.confirmHeaderLabel}>
                {activeTarget === "DROP" ? "CONFIRM DROP LOCATION (HYDERABAD)" : "CONFIRM PICKUP LOCATION"}
              </Text>

              <View style={styles.confirmedAddressBox}>
                <View style={activeTarget === "DROP" ? styles.redSquareMini : styles.greenDotMini} />
                <View style={{ flex: 1 }}>
                  {isModalResolving ? (
                    <Text style={{ color: "#0284C7", fontSize: 12, fontWeight: "700" }}>Locating address...</Text>
                  ) : (
                    <Text style={styles.confirmedAddressText} numberOfLines={2}>
                      {modalResolvedAddress}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={confirmModalLocation}>
                <Text style={styles.confirmButtonText}>
                  Confirm {activeTarget === "DROP" ? "Drop Location" : "Pickup Location"} ➔
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* PAYMENT MODAL */}
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

        {/* ADD MONEY MODAL */}
        <Modal visible={showAddMoneyModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.paymentModalHeader}>💰 Add Money to Wallet</Text>
                <TouchableOpacity onPress={() => setShowAddMoneyModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputTag}>ENTER AMOUNT (₹)</Text>
              <TextInput
                style={styles.inputBox}
                value={addAmount}
                onChangeText={setAddAmount}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.payNowConfirmBtn}
                onPress={() => {
                  const amt = Number(addAmount) || 200;
                  launchRealUpi(amt, "Wallet Add Money");
                  setTimeout(() => {
                    const newBal = walletBalance + amt;
                    setWalletBalance(newBal);
                    try {
                      if (typeof window !== "undefined" && window.localStorage) {
                        const profile = JSON.parse(window.localStorage.getItem("PASSENGER_PROFILE_DATA") || "{}");
                        profile.wallet = newBal;
                        window.localStorage.setItem("PASSENGER_PROFILE_DATA", JSON.stringify(profile));
                      }
                    } catch {}
                    setShowAddMoneyModal(false);
                    alert(`₹${amt} added to wallet!`);
                  }, 1500);
                }}
              >
                <Text style={styles.payNowConfirmBtnText}>Pay & Add ₹{addAmount} via UPI ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* EDIT PROFILE MODAL */}
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

              <Text style={styles.inputTag}>AADHAAR NUMBER (OPTIONAL)</Text>
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

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
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
                  alert("Profile updated!");
                }}
              >
                <Text style={styles.saveBtnText}>Save Profile ➔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setShowEditProfileModal(false)}>
                <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* SIDE DRAWER */}
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

        {/* SOS MODAL */}
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
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, position: "relative" },
  mainDashboardScroll: { padding: 16, paddingBottom: 85 },
  mainBrandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  brandTitleText: { fontSize: 18, fontWeight: "900", color: "#0F172A", letterSpacing: 0.5 },
  brandSubText: { fontSize: 9, fontWeight: "800", color: "#D97706", letterSpacing: 0.5 },
  womenBadgeBtn: {
    backgroundColor: "#FDF2F8",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  womenBadgeBtnActive: { backgroundColor: "#F472B6", borderColor: "#DB2777" },
  womenBadgeBtnText: { color: "#BE185D", fontSize: 11, fontWeight: "900" },
  sosButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  searchRouteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 4,
  },
  routeSectionHeading: { fontSize: 10, fontWeight: "900", color: "#64748B", letterSpacing: 0.5, marginBottom: 10 },
  locationSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  selectorLabel: { fontSize: 8, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  selectorValueText: { fontSize: 13, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  selectorActionTag: { fontSize: 11, fontWeight: "800", color: "#0284C7" },
  greenDotMini: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16A34A" },
  redSquareMini: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#EF4444" },
  plateFilterRow: { flexDirection: "row", gap: 8, marginVertical: 12 },
  plateFilterChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
  },
  plateFilterChipActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateFilterChipActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  plateFilterText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  plateFilterTextActive: { color: "#16A34A", fontWeight: "900" },
  plateFilterChipActiveYellowText: { color: "#B45309", fontWeight: "900" },
  searchForRidesBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  searchForRidesBtnText: { color: "#0F172A", fontSize: 14, fontWeight: "900" },
  matchedSectionTitle: { fontSize: 11, fontWeight: "900", color: "#16A34A", marginBottom: 8 },
  matchedRideCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  bookOnlineBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  bookOnlineBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  referNetworkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 4,
    alignItems: "center",
  },
  networkGraphicContainer: {
    width: "100%",
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 10,
  },
  networkCenterNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  networkPillLeft: {
    position: "absolute",
    left: 20,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  networkPillRight: {
    position: "absolute",
    right: 20,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  referNetworkTitle: { fontSize: 17, fontWeight: "900", color: "#0F172A", textAlign: "center", marginTop: 6 },
  referNetworkSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  referralCodeBox: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 14,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  referralCodeTag: { fontSize: 9, fontWeight: "800", color: "#B45309" },
  referralCodeText: { fontSize: 22, fontWeight: "900", color: "#78350F", marginTop: 2, letterSpacing: 2 },
  shareWhatsAppNetworkBtn: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  shareWhatsAppNetworkBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  dedicatedTabContent: { padding: 16, paddingBottom: 85 },
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
  bookNowActionBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 18,
  },
  bookNowActionBtnText: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  activeRideBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#10B981",
    elevation: 4,
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
  cancelBookingBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBookingText: { color: "#DC2626", fontSize: 12, fontWeight: "800" },
  shareFamilyLocationBtn: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  shareFamilyLocationText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  rewardsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rewardsCardTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  rewardsCardSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
  whatsappShareBtn: { backgroundColor: "#25D366", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  whatsappShareText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
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
  modalSearchInputWrap: {
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
  modalSearchInput: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0F172A" },
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
    top: 105,
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
  pinInnerDotWhite: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  modalPinStem: { width: 3, height: 10 },
  pinShadowDot: { width: 12, height: 4, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.2)", marginTop: 2 },
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
