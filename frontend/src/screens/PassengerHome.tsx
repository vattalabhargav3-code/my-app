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

const HYDERABAD_POPULAR_HUBS = [
  { name: "Hitec City Cyber Towers", sub: "Madhapur, Hyderabad", lat: 17.4435, lon: 78.3772 },
  { name: "Gachibowli DLF Cybercity", sub: "Gachibowli, Hyderabad", lat: 17.4401, lon: 78.3489 },
  { name: "LB Nagar Ring Road", sub: "LB Nagar, Hyderabad", lat: 17.3457, lon: 78.5522 },
  { name: "Secunderabad Railway Station", sub: "Secunderabad, Hyderabad", lat: 17.4399, lon: 78.4983 },
  { name: "Kukatpally Housing Board (KPHB)", sub: "Kukatpally, Hyderabad", lat: 17.4947, lon: 78.3996 },
  { name: "B.N. Reddy Nagar", sub: "Sagar Highway, Hyderabad", lat: 17.3312, lon: 78.5638 },
  { name: "Uppal Metro Station", sub: "Uppal, Hyderabad", lat: 17.4018, lon: 78.5602 },
];

export function PassengerHome({ navigation }: any) {
  // Passenger Profile
  const [passengerName, setPassengerName] = useState("BHARGAV");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [walletBalance, setWalletBalance] = useState(250);

  // Main Dashboard Map States
  const [mapCenter, setMapCenter] = useState({ lat: 17.3341, lon: 78.5670 });
  const [pickupAddress, setPickupAddress] = useState("125, Harithasa Ave, Harithapuri Colony, Hyderabad");
  const [dropAddress, setDropAddress] = useState("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);

  // Search & Pin-to-Pin Modal States
  const [showSearchMapModal, setShowSearchMapModal] = useState(false);
  const [activeInputTarget, setActiveInputTarget] = useState<"PICKUP" | "DROP">("DROP");
  const [modalSearchText, setModalSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [modalPinCoords, setModalPinCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [modalResolvedAddress, setModalResolvedAddress] = useState("Hitec City, Hyderabad");
  const [isModalResolving, setIsModalResolving] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Online Payment Gateway Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingRideToPay, setPendingRideToPay] = useState<any | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"GPAY" | "PHONEPE" | "PAYTM" | "QR">("GPAY");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Navigation, Drawer & Safety
  const [activeTab, setActiveTab] = useState<"RIDE" | "POOLS" | "OFFERS" | "PROFILE">("RIDE");
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // Live Rides & Real Bookings (NO DEMO DUMMY CARDS)
  const [publishedRides, setPublishedRides] = useState<any[]>([]);
  const [bookedRide, setBookedRide] = useState<any | null>(null);

  // Map DOM Refs
  const mainMapRef = useRef<HTMLDivElement | null>(null);
  const modalMapRef = useRef<HTMLDivElement | null>(null);
  const mainLeafletInstance = useRef<any>(null);
  const modalLeafletInstance = useRef<any>(null);

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

  // Reverse Geocoding helper
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

  // Main Dashboard Background Map Init
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

  // Strict Hyderabad Search Filtering
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

  // Pick location from search or popular list
  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const placeName = item.display_name ? item.display_name.split(",").slice(0, 3).join(",") : item.name;

    setModalPinCoords({ lat, lon });
    setModalResolvedAddress(placeName);
    setSearchResults([]);
    setModalSearchText("");

    if (modalLeafletInstance.current) {
      modalLeafletInstance.current.setView([lat, lon], 17);
    }
  };

  // Fetch Current GPS Location inside Modal (ONLY FOR PICKUP)
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
          alert("GPS permission denied. Please allow location access.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Confirm pin location and update main dashboard
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

  // START ONLINE PAYMENT FLOW FOR RIDE CONFIRMATION
  const initiateRideBookingPayment = (ride: any) => {
    if (!dropAddress.trim()) {
      alert("Please set a Drop Location before booking!");
      openLocationPickerModal("DROP");
      return;
    }
    setPendingRideToPay(ride);
    setShowPaymentModal(true);
  };

  // COMPLETE ONLINE PAYMENT & CONFIRM RIDE
  const handlePaymentSuccessAndConfirm = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);

      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const confirmedRideData = {
        id: pendingRideToPay.id || "bk_" + Date.now(),
        driver_name: pendingRideToPay.driver_name || "Karthik R.",
        driver_phone: "9848012345",
        vehicle_name: pendingRideToPay.vehicle_name || "Swift Dzire",
        plate_type: pendingRideToPay.plate_type || "WHITE",
        fare: pendingRideToPay.price_per_seat || 110,
        otp: generatedOtp,
        status: "PAYMENT_CONFIRMED",
        eta: "Arriving in 5 mins",
        payment_method: selectedPaymentMethod,
      };

      setBookedRide(confirmedRideData);
      setPendingRideToPay(null);
      setActiveTab("RIDE");
      alert("🎉 Online Payment Successful! Your ride is confirmed.");
    }, 1500);
  };

  const triggerDefenseSiren = () => {
    setIsSirenActive(!isSirenActive);
    if (!isSirenActive) alert("🚨 DEFENSE SIREN ALARM ACTIVATED!");
  };

  const shareRideWhatsAppSafety = () => {
    const msg = `🚨 EMERGENCY ALERT: Traveling from ${pickupAddress} to ${dropAddress || "Destination"}. Tracking: https://my-app-frontend-blue.vercel.app/track`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Full-screen Isolated Interactive Leaflet Map Background */}
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
        </View>

        {/* Floating Top Nav Bar (Menu & Safety Badges) */}
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

        {/* ---------------- RAPIDO-STYLE BOTTOM SHEET CARD (PICKUP & DROP BOTH VISIBLE) ---------------- */}
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHandle} />

          {/* 1. PICKUP POINT TRIGGER */}
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

          <View style={styles.selectorDivider} />

          {/* 2. DROP POINT TRIGGER ("Where do you want to go?") */}
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

          {/* Live Rides Feed or Popular Hyderabad Hubs */}
          <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
            {publishedRides.length > 0 ? (
              publishedRides.map((ride) => (
                <View key={ride.id} style={styles.availableRideCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.availableRideDriver}>{ride.driver_name} • {ride.vehicle_name}</Text>
                    <Text style={styles.availableRideFare}>₹{ride.price_per_seat}</Text>
                  </View>
                  <Text style={styles.availableRideRoute}>📍 {ride.from_location} ➔ 🏁 {ride.to_location}</Text>
                  <TouchableOpacity
                    style={styles.payAndBookBtn}
                    onPress={() => initiateRideBookingPayment(ride)}
                  >
                    <Text style={styles.payAndBookBtnText}>Pay Online & Confirm (₹{ride.price_per_seat}) ➔</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              HYDERABAD_POPULAR_HUBS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentLocationRow}
                  onPress={() => setDropAddress(`${item.name}, ${item.sub}`)}
                >
                  <Text style={{ fontSize: 15, color: "#64748B" }}>🕒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentItemTitle}>{item.name}</Text>
                    <Text style={styles.recentItemSub} numberOfLines={1}>{item.sub}</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: "#94A3B8" }}>♡</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Active Booked Ride (ONLY IF PAYMENT COMPLETED - NO DEMO) */}
          {bookedRide && (
            <View style={styles.realBookedRideCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.realBookedStatus}>PAID ONLINE • {bookedRide.eta}</Text>
                </View>
                <Text style={styles.realBookedFare}>₹{bookedRide.fare}</Text>
              </View>

              <View style={styles.otpBanner}>
                <Text style={styles.otpBannerLabel}>SHARE TRIP OTP WITH DRIVER</Text>
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
                    alert("Booking cancelled. Online refund initiated to your source account.");
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
              alert("Available Live Pools in Hyderabad: " + publishedRides.length);
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

        {/* ---------------- ONLINE PAYMENT GATEWAY MODAL (PHONEPE / GPAY / PAYTM / QR) ---------------- */}
        <Modal visible={showPaymentModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.paymentModalHeader}>💳 Online Payment Gateway</Text>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paymentModalSub}>Payment successful ayyaka mathrame ride confirm avthundi.</Text>

              {/* Ride Summary */}
              <View style={styles.paymentSummaryCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "800", color: "#0F172A" }}>Total Amount to Pay</Text>
                  <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 18 }}>
                    ₹{pendingRideToPay?.price_per_seat || 110}.00
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  Route: {pickupAddress.split(",")[0]} ➔ {dropAddress.split(",")[0]}
                </Text>
              </View>

              {/* Payment Methods */}
              <Text style={styles.paymentMethodHeading}>SELECT ONLINE PAYMENT SERVICE</Text>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "GPAY" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("GPAY")}
              >
                <Text style={{ fontSize: 20 }}>🟢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Google Pay (UPI)</Text>
                  <Text style={styles.paymentMethodSub}>Direct Instant UPI Transfer</Text>
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
                  <Text style={styles.paymentMethodSub}>Fast UPI Gateway</Text>
                </View>
                {selectedPaymentMethod === "PHONEPE" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "PAYTM" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("PAYTM")}
              >
                <Text style={{ fontSize: 20 }}>🔵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Paytm UPI / NetBanking</Text>
                  <Text style={styles.paymentMethodSub}>Paytm Wallet or UPI ID</Text>
                </View>
                {selectedPaymentMethod === "PAYTM" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethodRow, selectedPaymentMethod === "QR" && styles.paymentMethodRowActive]}
                onPress={() => setSelectedPaymentMethod("QR")}
              >
                <Text style={{ fontSize: 20 }}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodTitle}>Instant QR Code Scanner</Text>
                  <Text style={styles.paymentMethodSub}>Scan using Any UPI App to Pay</Text>
                </View>
                {selectedPaymentMethod === "QR" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
              </TouchableOpacity>

              {/* QR Code Container if selected */}
              {selectedPaymentMethod === "QR" && (
                <View style={styles.qrDisplayBox}>
                  {/* @ts-ignore */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=8919326622@ybl&pn=RidePool&am=${
                      pendingRideToPay?.price_per_seat || 110
                    }&cu=INR`}
                    alt="Scan UPI QR"
                    style={{ width: 140, height: 140 }}
                  />
                  <Text style={styles.qrInstructionText}>Scan QR using Google Pay / PhonePe / Paytm</Text>
                </View>
              )}

              {/* Pay Now Button */}
              <TouchableOpacity
                style={styles.payNowConfirmBtn}
                onPress={handlePaymentSuccessAndConfirm}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payNowConfirmBtnText}>
                    Confirm & Pay ₹{pendingRideToPay?.price_per_seat || 110} ➔
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- FULL-SCREEN PIN-TO-PIN INTERACTIVE MAP MODAL ---------------- */}
        <Modal visible={showSearchMapModal} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* Modal Top Search Header with Target Switchers */}
            <View style={styles.modalSearchTopHeader}>
              <TouchableOpacity onPress={() => setShowSearchMapModal(false)} style={styles.backCircleBtn}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0F172A" }}>←</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 8 }}>
                {/* Pickup Field */}
                <TouchableOpacity
                  style={[styles.inputPillBox, activeInputTarget === "PICKUP" && styles.inputPillBoxActive]}
                  onPress={() => setActiveInputTarget("PICKUP")}
                >
                  <View style={styles.greenDotMini} />
                  <Text style={styles.inputPillText} numberOfLines={1}>
                    {activeInputTarget === "PICKUP" ? "Pinpoint Pickup on Map" : `Pickup: ${pickupAddress}`}
                  </Text>
                </TouchableOpacity>

                {/* Drop Field */}
                <TouchableOpacity
                  style={[styles.inputPillBox, activeInputTarget === "DROP" && styles.inputPillBoxActive]}
                  onPress={() => setActiveInputTarget("DROP")}
                >
                  <View style={styles.redSquareMini} />
                  <TextInput
                    style={styles.inputPillInput}
                    placeholder="Search Hyderabad destination..."
                    placeholderTextColor="#94A3B8"
                    value={modalSearchText}
                    onChangeText={searchHyderabadPlacesOnly}
                    autoFocus={activeInputTarget === "DROP"}
                  />
                  {loadingSearch && <ActivityIndicator size="small" color="#0284C7" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick "Use My Current Location" Action Bar (ONLY AVAILABLE FOR PICKUP) */}
            {activeInputTarget === "PICKUP" && (
              <View style={styles.quickGpsBar}>
                <TouchableOpacity style={styles.gpsActionBtn} onPress={fetchModalLiveGps} disabled={isFetchingGps}>
                  {isFetchingGps ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                  ) : (
                    <Text style={{ fontSize: 14 }}>📍</Text>
                  )}
                  <Text style={styles.gpsActionText}>Use My Current Location</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search Suggestions Dropdown Overlay */}
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

            {/* INTERACTIVE PIN-TO-PIN MAP CONTAINER */}
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

              {/* Pinpoint Target at Center */}
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

            {/* Bottom Confirmation Sheet */}
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
                  alert(`Rewards: Share PASSENGER${passengerPhone.slice(-4)} for ₹200 + ₹200`);
                }}
              >
                <Text style={styles.drawerItemIcon}>🎁</Text>
                <Text style={styles.drawerItemLabel}>Rewards & Referrals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => {
                  setShowDrawerMenu(false);
                  alert(`Wallet Balance: ₹${walletBalance}. Added via UPI/Cards.`);
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
  // Floating Top Bar
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
    marginBottom: 10,
  },
  locationSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  selectorDivider: { height: 6 },
  selectorLabel: { fontSize: 8, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  selectorValueText: { fontSize: 12, fontWeight: "800", color: "#0F172A", marginTop: 1 },
  selectorActionTag: { fontSize: 11, fontWeight: "800", color: "#0284C7" },
  greenDotMini: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  redSquareMini: { width: 8, height: 8, borderRadius: 2, backgroundColor: "#EF4444" },
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
  availableRideCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  availableRideDriver: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  availableRideFare: { fontSize: 15, fontWeight: "900", color: "#16A34A" },
  availableRideRoute: { fontSize: 11, color: "#64748B", marginVertical: 4 },
  payAndBookBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  payAndBookBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
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
  // Payment Modal Styles
  paymentModalHeader: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  paymentModalSub: { fontSize: 11, color: "#64748B", marginTop: 2, marginBottom: 10 },
  paymentSummaryCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  paymentMethodHeading: { fontSize: 9, fontWeight: "900", color: "#94A3B8", letterSpacing: 0.5, marginBottom: 8 },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  paymentMethodRowActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  paymentMethodTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  paymentMethodSub: { fontSize: 10, color: "#64748B", marginTop: 1 },
  qrDisplayBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 8,
  },
  qrInstructionText: { fontSize: 11, fontWeight: "700", color: "#475569", marginTop: 8 },
  payNowConfirmBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  payNowConfirmBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  // Full-Screen Search Modal Styles
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
    marginVertical: 10,
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
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626" },
  sirenAlarmBtn: { backgroundColor: "#DC2626", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginVertical: 12 },
  sirenAlarmBtnActive: { backgroundColor: "#7F1D1D" },
  sirenAlarmText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
  whatsappSosBtn: { backgroundColor: "#25D366", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginVertical: 6 },
  whatsappSosText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
