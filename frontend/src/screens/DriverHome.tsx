import React, { useState, useEffect } from "react";
import {
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

// 1. RECOMMENDATIONS (HYDERABAD INTRA-CITY HUBS)
const RECOMMENDATIONS_DATA = [
  {
    id: "rec_1",
    name: "Hitec City",
    sub: "Cyber Towers & IT Hub",
    badge: "IT Corridor",
    icon: "🏢",
    bgGradient: "#1E3A8A",
  },
  {
    id: "rec_2",
    name: "Madhapur",
    sub: "Metro Station, Durgam Cheruvu",
    badge: "Metro Connect",
    icon: "🚇",
    bgGradient: "#0284C7",
  },
  {
    id: "rec_3",
    name: "Jubilee Hills",
    sub: "Check Post, Road No 36",
    badge: "Premium Zone",
    icon: "🌆",
    bgGradient: "#4338CA",
  },
];

// 2. POPULAR DESTINATIONS
const POPULAR_DESTINATIONS_DATA = [
  {
    id: "dest_1",
    city: "Vijayawada",
    highway: "NH 65 Expressway",
    icon: "🌉",
    badgeColor: "#991B1B",
  },
  {
    id: "dest_2",
    city: "Bengaluru",
    highway: "NH 44 Airport Corridor",
    icon: "🏙️",
    badgeColor: "#0F766E",
  },
  {
    id: "dest_3",
    city: "Tirupati",
    highway: "Balaji Pilgrimage Highway",
    icon: "🛕",
    badgeColor: "#B45309",
  },
  {
    id: "dest_4",
    city: "Kurnool City",
    highway: "NH 44 Gateway to Rayalaseema",
    icon: "🏰",
    badgeColor: "#6B21A8",
  },
  {
    id: "dest_5",
    city: "Khammam",
    highway: "Suryapet - Khammam Expressway",
    icon: "⛰️",
    badgeColor: "#9D174D",
  },
  {
    id: "dest_6",
    city: "Warangal",
    highway: "ORR - Warangal Highway",
    icon: "🏛️",
    badgeColor: "#1E40AF",
  },
];

const INITIAL_IDLE_CARS = [
  {
    id: "car_1",
    owner_name: "Karthik R.",
    car_model: "Maruti Swift Dzire (Petrol)",
    model_year: "2022",
    car_number: "TS09FA2489",
    location: "Gachibowli, Hyderabad",
    price_per_24hr: 1100,
  },
  {
    id: "car_2",
    owner_name: "Srinivas Rao",
    car_model: "Hyundai Grand i10 (CNG)",
    model_year: "2021",
    car_number: "TS07EJ8821",
    location: "Kukatpally Housing Board",
    price_per_24hr: 950,
  },
];

export function DriverHome({ navigation }: any) {
  // Driver KYC & Profile
  const [driverName, setDriverName] = useState("Bhargav");
  const [driverPhone, setDriverPhone] = useState("8919326622");
  const [rcNumber, setRcNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [carModel, setCarModel] = useState("Swift Dzire");

  // Bottom Navigation Selection: HOME, EXPLORE, POOLS, PROFILE
  const [activeTab, setActiveTab] = useState<"HOME" | "EXPLORE" | "POOLS" | "PROFILE">("HOME");

  // Language & Settings
  const [selectedLanguage, setSelectedLanguage] = useState<"Telugu" | "English" | "Hindi">("Telugu");
  const [onlyWomenMode, setOnlyWomenMode] = useState(false);

  // Modals
  const [showVehicleBookingModal, setShowVehicleBookingModal] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<"CAR" | "BIKE" | "VAN">("CAR");
  const [showRentCarModal, setShowRentCarModal] = useState(false);
  const [showHostCarModal, setShowHostCarModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showGeneralSettingsModal, setShowGeneralSettingsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Live Deployed Ride in "My Pools"
  const [deployedRide, setDeployedRide] = useState<any | null>(null);
  const [bookedSeatsCount, setBookedSeatsCount] = useState(0);

  // Deployment Form Fields
  const [pickupInput, setPickupInput] = useState("Hitec City Cyber Towers, Hyderabad");
  const [dropInput, setDropInput] = useState("");
  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");

  // Attach Car Comprehensive Form Fields
  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
  const [hostRc, setHostRc] = useState("");
  const [hostInsurance, setHostInsurance] = useState("");
  const [hostDailyPrice, setHostDailyPrice] = useState("1100");
  const [hostLocation, setHostLocation] = useState("");

  const [idleCars, setIdleCars] = useState(INITIAL_IDLE_CARS);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("DRIVER_REGISTERED_PROFILE");
        if (saved) {
          const p = JSON.parse(saved);
          if (p.name) setDriverName(p.name);
          if (p.phone) setDriverPhone(p.phone);
          if (p.rc) setRcNumber(p.rc);
          if (p.dl) setDlNumber(p.dl);
          if (p.carModel) setCarModel(p.carModel);
          if (p.lang) setSelectedLanguage(p.lang);
        }

        const savedRide = window.localStorage.getItem("ACTIVE_DEPLOYED_RIDE");
        if (savedRide) {
          const r = JSON.parse(savedRide);
          setDeployedRide(r);
          setBookedSeatsCount(r.bookedSeats || 0);
        }
      }
    } catch {}
  }, []);

  const openBookingModal = (type: "CAR" | "BIKE" | "VAN") => {
    setSelectedBookingType(type);
    setShowVehicleBookingModal(true);
  };

  const handleSelectCityRoute = (cityName: string) => {
    setDropInput(cityName);
    setSelectedBookingType("CAR");
    setShowVehicleBookingModal(true);
  };

  // Deploy ride -> Closes modal and opens "My Pools" dashboard directly
  const handleDeployRide = () => {
    if (!pickupInput.trim() || !dropInput.trim() || !pricePerSeat.trim()) {
      alert("Please enter Pickup location, Drop destination, and Seat price.");
      return;
    }

    const newPoolRide = {
      id: "ride_" + Date.now(),
      driver_name: driverName,
      from_location: pickupInput.trim(),
      to_location: dropInput.trim(),
      vehicle_type: selectedBookingType,
      vehicle_name: selectedBookingType === "BIKE" ? "Bike" : selectedBookingType === "VAN" ? "Van Shuttle" : carModel,
      total_seats: Number(seatsCount),
      booked_seats: 0,
      price_per_seat: Number(pricePerSeat),
      plate_type: plateType,
      status: "SEARCHING_FOR_CUSTOMER",
      created_at: new Date().toLocaleTimeString(),
    };

    setDeployedRide(newPoolRide);
    setBookedSeatsCount(0);

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("ACTIVE_DEPLOYED_RIDE", JSON.stringify(newPoolRide));
        const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
        const list = stored ? JSON.parse(stored) : [];
        window.localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify([newPoolRide, ...list]));
      }
    } catch {}

    setShowVehicleBookingModal(false);
    setActiveTab("POOLS");
    alert("🎉 Ride deployed! Opening your My Pools live dashboard.");
  };

  // Manual Driver Action: Accept a customer request
  const handleManualAcceptCustomer = () => {
    if (!deployedRide) return;
    const maxSeats = deployedRide.total_seats;
    if (bookedSeatsCount >= maxSeats) {
      alert("All seats are already booked!");
      return;
    }
    const updatedCount = bookedSeatsCount + 1;
    setBookedSeatsCount(updatedCount);
    const updatedRide = { ...deployedRide, booked_seats: updatedCount };
    setDeployedRide(updatedRide);

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("ACTIVE_DEPLOYED_RIDE", JSON.stringify(updatedRide));
      }
    } catch {}

    alert(`✓ Passenger request accepted! Booked seats: ${updatedCount} / ${maxSeats}`);
  };

  const handleCancelDeployedRide = () => {
    if (confirm("Cancel this live deployed ride and go offline?")) {
      setDeployedRide(null);
      setBookedSeatsCount(0);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem("ACTIVE_DEPLOYED_RIDE");
        }
      } catch {}
      alert("Ride cancelled. You are now offline.");
    }
  };

  const handleHostCarSubmit = () => {
    if (!hostOwnerName || !hostCarModel || !hostRc || !hostInsurance || !hostDailyPrice) {
      alert("Please provide owner details, car model, RC, Insurance & daily rent fee.");
      return;
    }
    const newCar = {
      id: "car_" + Date.now(),
      owner_name: hostOwnerName,
      car_model: hostCarModel,
      model_year: "2022",
      car_number: hostRc,
      location: hostLocation || "Hyderabad Hub",
      price_per_24hr: Number(hostDailyPrice),
    };
    setIdleCars([newCar, ...idleCars]);
    alert("🎉 Your idle car details have been saved & submitted for fleet deployment!");
    setShowHostCarModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ---------------- 1. TOP ROYAL BLUE HEADER AREA ---------------- */}
        <View style={styles.royalBlueHeader}>
          <View style={styles.welcomeProfileRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity style={styles.avatarCircle} onPress={() => setActiveTab("PROFILE")}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.welcomeSub}>Welcome!</Text>
                <Text style={styles.welcomeName}>{driverName.toUpperCase()}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {/* Only Women Mode Toggle */}
              <TouchableOpacity
                style={[styles.womenModePill, onlyWomenMode && styles.womenModePillActive]}
                onPress={() => {
                  setOnlyWomenMode(!onlyWomenMode);
                  alert(
                    onlyWomenMode
                      ? "Standard pooling mode active."
                      : "🚺 Only Women ride mode active! Rides will match female passengers only."
                  );
                }}
              >
                <Text style={styles.womenModeText}>{onlyWomenMode ? "🚺 Active Mode" : "🎀 Only Women"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
                <Text style={styles.sosButtonText}>🚨 SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ---------------- TAB 1: MAIN HOME DASHBOARD ---------------- */}
        {activeTab === "HOME" && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 5 CATEGORY CIRCLES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Category</Text>
            </View>

            <View style={styles.categoryGridRow}>
              <TouchableOpacity style={styles.categoryCol} onPress={() => openBookingModal("CAR")}>
                <View style={styles.categoryIconCircle}>
                  <Text style={{ fontSize: 22 }}>🚗</Text>
                </View>
                <Text style={styles.categoryTitle}>Car</Text>
                <Text style={styles.categorySub}>Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCol} onPress={() => openBookingModal("BIKE")}>
                <View style={styles.categoryIconCircle}>
                  <Text style={{ fontSize: 22 }}>🏍️</Text>
                </View>
                <Text style={styles.categoryTitle}>Bike</Text>
                <Text style={styles.categorySub}>Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCol} onPress={() => openBookingModal("VAN")}>
                <View style={styles.categoryIconCircle}>
                  <Text style={{ fontSize: 22 }}>🚐</Text>
                </View>
                <Text style={styles.categoryTitle}>Van</Text>
                <Text style={styles.categorySub}>Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCol} onPress={() => setShowRentCarModal(true)}>
                <View style={[styles.categoryIconCircle, styles.categoryIconCircleBlue]}>
                  <Text style={{ fontSize: 22 }}>🚕</Text>
                </View>
                <Text style={[styles.categoryTitle, { color: "#1D4ED8" }]}>Request</Text>
                <Text style={[styles.categorySub, { color: "#1D4ED8" }]}>a Cab</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCol} onPress={() => setShowHostCarModal(true)}>
                <View style={[styles.categoryIconCircle, styles.categoryIconCircleAmber]}>
                  <Text style={{ fontSize: 22 }}>🔑</Text>
                </View>
                <Text style={[styles.categoryTitle, { color: "#D97706" }]}>Attach</Text>
                <Text style={[styles.categorySub, { color: "#D97706" }]}>a Car</Text>
              </TouchableOpacity>
            </View>

            {/* RECOMMENDATIONS SECTION */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <Text style={styles.sectionHeading}>Recommendation</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {RECOMMENDATIONS_DATA.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    style={styles.recommendationCard}
                    onPress={() => handleSelectCityRoute(rec.name)}
                  >
                    <View style={[styles.recommendationHeaderVisual, { backgroundColor: rec.bgGradient }]}>
                      <Text style={{ fontSize: 32 }}>{rec.icon}</Text>
                      <View style={styles.recBadgePill}>
                        <Text style={styles.recBadgeText}>{rec.badge}</Text>
                      </View>
                    </View>
                    <View style={styles.recommendationBody}>
                      <Text style={styles.recCityName}>{rec.name}</Text>
                      <Text style={styles.recSubText}>{rec.sub}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* POPULAR DESTINATIONS (NO PRICES DISPLAYED) */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <Text style={styles.sectionHeading}>Popular Destination</Text>
            </View>

            <View style={styles.destinationGridContainer}>
              {POPULAR_DESTINATIONS_DATA.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.destinationCard}
                  onPress={() => handleSelectCityRoute(item.city)}
                >
                  <View style={[styles.destTopGraphic, { backgroundColor: item.badgeColor }]}>
                    <Text style={{ fontSize: 26 }}>{item.icon}</Text>
                  </View>
                  <View style={styles.destCardContent}>
                    <Text style={styles.destCityName}>{item.city}</Text>
                    <Text style={styles.destHighwayName} numberOfLines={1}>
                      {item.highway}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ---------------- TAB 2: EXPLORE DASHBOARD (REFERRALS & INCENTIVES ONLY) ---------------- */}
        {activeTab === "EXPLORE" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabHeadingTitle}>🧭 Explore Opportunities</Text>

            {/* 1. Referral Card */}
            <View style={styles.exploreCard}>
              <View style={styles.exploreBadgeGreen}>
                <Text style={styles.exploreBadgeGreenText}>🎁 DRIVER REFERRAL SCHEME</Text>
              </View>
              <Text style={styles.exploreCardTitle}>Refer a Friend & Earn ₹200 + ₹200</Text>
              <Text style={styles.exploreCardSub}>
                Invite your friend to join RidePool Driver Network. When your friend completes their 1st ride, both of
                you receive ₹200 directly into your bank account!
              </Text>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeTag}>YOUR REFERRAL CODE</Text>
                <Text style={styles.referralCodeText}>{`DRIVER${driverPhone.slice(-4)}`}</Text>
              </View>

              <TouchableOpacity
                style={styles.whatsappShareBtn}
                onPress={() => {
                  const msg = `Join RidePool Driver Network! Use code DRIVER${driverPhone.slice(
                    -4
                  )} and get ₹200 bonus on your first ride: https://my-app-frontend-blue.vercel.app/driver`;
                  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
                }}
              >
                <Text style={styles.whatsappShareText}>📲 Share Referral Code on WhatsApp (₹200) ➔</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Weekly Targets & Petrol Bonus Card */}
            <View style={[styles.exploreCard, { marginTop: 16 }]}>
              <View style={styles.exploreBadgeAmber}>
                <Text style={styles.exploreBadgeAmberText}>⛽ WEEKLY PETROL INCENTIVES</Text>
              </View>
              <Text style={styles.exploreCardTitle}>Hit Weekly Targets & Unlock Petrol Bonus</Text>
              <Text style={styles.exploreCardSub}>
                Every week trips (Up & Down pool routes combined) are counted towards guaranteed petrol cash bonuses:
              </Text>

              <View style={styles.targetProgressCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.targetRowTitle}>🎯 Target 1: 5 Rides / Week</Text>
                  <Text style={styles.targetRowBonus}>₹500 Bonus</Text>
                </View>
                <Text style={styles.targetRowDesc}>Complete 5 rides this week ➔ ₹500 petrol bonus credited to wallet.</Text>
              </View>

              <View style={[styles.targetProgressCard, { borderColor: "#F59E0B" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.targetRowTitle}>🏆 Target 2: 10 Rides / Week</Text>
                  <Text style={[styles.targetRowBonus, { color: "#D97706" }]}>₹1,500 Bonus</Text>
                </View>
                <Text style={styles.targetRowDesc}>
                  Complete 10 rides this week ➔ ₹1,500 grand petrol incentive unlocked!
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- TAB 3: MY POOLS DASHBOARD (DEDICATED LIVE RADAR & SEATS DISPLAY) ---------------- */}
        {activeTab === "POOLS" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabHeadingTitle}>🚗 My Pools Dashboard</Text>

            {deployedRide ? (
              <View style={styles.myPoolsCard}>
                <View style={styles.radarStatusHeader}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.radarStatusText}>
                    {bookedSeatsCount >= deployedRide.total_seats
                      ? "ALL SEATS FULLY BOOKED"
                      : "SEARCHING FOR CUSTOMER..."}
                  </Text>
                </View>

                {/* Route Header */}
                <Text style={styles.poolRouteTitle}>
                  📍 {deployedRide.from_location} ➔ 🏁 {deployedRide.to_location}
                </Text>
                <Text style={styles.poolVehicleSub}>
                  Vehicle: {deployedRide.vehicle_name} • {deployedRide.plate_type} Plate • ₹{deployedRide.price_per_seat}
                  /seat
                </Text>

                {/* Live Seat Matrix Display */}
                <View style={styles.seatsOverviewBox}>
                  <View style={styles.seatMetricCol}>
                    <Text style={styles.seatMetricLabel}>TOTAL SEATS</Text>
                    <Text style={styles.seatMetricValue}>{deployedRide.total_seats}</Text>
                  </View>
                  <View style={styles.seatMetricCol}>
                    <Text style={[styles.seatMetricLabel, { color: "#16A34A" }]}>BOOKED SEATS</Text>
                    <Text style={[styles.seatMetricValue, { color: "#16A34A" }]}>{bookedSeatsCount}</Text>
                  </View>
                  <View style={styles.seatMetricCol}>
                    <Text style={[styles.seatMetricLabel, { color: "#D97706" }]}>AVAILABLE SEATS</Text>
                    <Text style={[styles.seatMetricValue, { color: "#D97706" }]}>
                      {deployedRide.total_seats - bookedSeatsCount}
                    </Text>
                  </View>
                </View>

                {/* Driver Manual Booking Control */}
                {bookedSeatsCount < deployedRide.total_seats ? (
                  <View style={styles.customerMatchBox}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 13 }}>
                        ⚡ New Passenger Request Found
                      </Text>
                      <Text style={{ fontWeight: "900", color: "#16A34A" }}>₹{deployedRide.price_per_seat}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      Pickup near {deployedRide.from_location.split(",")[0]}
                    </Text>

                    <TouchableOpacity style={styles.acceptCustomerBtn} onPress={handleManualAcceptCustomer}>
                      <Text style={styles.acceptCustomerBtnText}>✓ Accept Passenger (Confirm 1 Seat) ➔</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.allSeatsFullBanner}>
                    <Text style={styles.allSeatsFullBannerText}>
                      🎉 All {deployedRide.total_seats} seats booked! Ready for trip departure.
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.cancelPoolBtn} onPress={handleCancelDeployedRide}>
                  <Text style={styles.cancelPoolBtnText}>✕ Cancel Ride / Go Offline</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyPoolBox}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🚗</Text>
                <Text style={styles.emptyPoolTitle}>No Active Deployed Ride</Text>
                <Text style={styles.emptyPoolSub}>
                  Main dashboard lo Car, Bike, leda Van select chesi ride deploy chesthe, live customer search mariyu
                  seat bookings ikkada kanipisthayi.
                </Text>
                <TouchableOpacity style={styles.deployNowActionBtn} onPress={() => openBookingModal("CAR")}>
                  <Text style={styles.deployNowActionBtnText}>+ Deploy a Ride Now ➔</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* ---------------- TAB 4: PROFILE DASHBOARD (SETTINGS, NOTIFICATIONS, EDIT PROFILE) ---------------- */}
        {activeTab === "PROFILE" && (
          <ScrollView contentContainerStyle={styles.dedicatedTabScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabHeadingTitle}>👤 Driver Profile & Settings</Text>

            {/* Profile Summary Card */}
            <View style={styles.profileSummaryCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={styles.profileAvatarCircle}>
                  <Text style={{ fontSize: 26 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileDriverName}>{driverName}</Text>
                  <Text style={styles.profilePhoneText}>📱 {driverPhone}</Text>
                  <Text style={styles.profileKycTag}>{rcNumber && dlNumber ? "Verified KYC" : "KYC Pending"}</Text>
                </View>
              </View>
            </View>

            {/* Profile Action Hub Options */}
            <View style={styles.profileMenuCard}>
              {/* Option 1: Edit Profile */}
              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setShowEditProfileModal(true)}>
                <Text style={{ fontSize: 18 }}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileMenuRowTitle}>Edit Profile</Text>
                  <Text style={styles.profileMenuRowSub}>Driver Name, Phone, Car Model, RC & DL</Text>
                </View>
                <Text style={styles.menuArrow}>➔</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Option 2: General Settings */}
              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setShowGeneralSettingsModal(true)}>
                <Text style={{ fontSize: 18 }}>⚙️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileMenuRowTitle}>General Settings</Text>
                  <Text style={styles.profileMenuRowSub}>Language (Telugu, English, Hindi), GPS Mode</Text>
                </View>
                <Text style={styles.menuArrow}>➔</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Option 3: Notifications Hub */}
              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setShowNotificationsModal(true)}>
                <Text style={{ fontSize: 18 }}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileMenuRowTitle}>Notifications</Text>
                  <Text style={styles.profileMenuRowSub}>Rewards, Referral Alerts & Incentive Updates</Text>
                </View>
                <Text style={styles.menuArrow}>➔</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Option 4: Privacy Policy & Support */}
              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setShowPolicyModal(true)}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileMenuRowTitle}>Privacy Policy & Helpline</Text>
                  <Text style={styles.profileMenuRowSub}>24x7 Driver Helpline, Emergency Services</Text>
                </View>
                <Text style={styles.menuArrow}>➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- 5. FIXED ROYAL BLUE BOTTOM NAV BAR ---------------- */}
        <View style={styles.royalBlueBottomNav}>
          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("HOME")}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={[styles.navBarText, activeTab === "HOME" && styles.navBarTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("EXPLORE")}>
            <Text style={{ fontSize: 18 }}>🧭</Text>
            <Text style={[styles.navBarText, activeTab === "EXPLORE" && styles.navBarTextActive]}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("POOLS")}>
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={[styles.navBarText, activeTab === "POOLS" && styles.navBarTextActive]}>My Pools</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("PROFILE")}>
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={[styles.navBarText, activeTab === "PROFILE" && styles.navBarTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- MODAL 1: VEHICLE ROUTE SETUP (CAR, BIKE, VAN) ---------------- */}
        <Modal visible={showVehicleBookingModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>
                  {selectedBookingType === "CAR"
                    ? "🚗 Car Pool Setup"
                    : selectedBookingType === "BIKE"
                    ? "🏍️ Bike Route Setup"
                    : "🚐 Van Shuttle Setup"}
                </Text>
                <TouchableOpacity onPress={() => setShowVehicleBookingModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputTag}>STARTING POINT (PICKUP)</Text>
              <TextInput style={styles.inputBox} value={pickupInput} onChangeText={setPickupInput} />

              <Text style={styles.inputTag}>END POINT (DROP DESTINATION)</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="e.g. Vijayawada, Bengaluru, Madhapur"
                value={dropInput}
                onChangeText={setDropInput}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>SEATS OFFERED</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    value={seatsCount}
                    onChangeText={setSeatsCount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>PRICE PER SEAT (₹)</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    value={pricePerSeat}
                    onChangeText={setPricePerSeat}
                  />
                </View>
              </View>

              <Text style={[styles.inputTag, { marginTop: 8 }]}>NUMBER PLATE TYPE</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.plateMiniPill, plateType === "WHITE" && styles.plateMiniPillActive]}
                  onPress={() => setPlateType("WHITE")}
                >
                  <Text style={[styles.plateMiniText, plateType === "WHITE" && styles.plateMiniTextActive]}>
                    ⚪ White Plate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.plateMiniPill, plateType === "YELLOW" && styles.plateMiniPillActiveYellow]}
                  onPress={() => setPlateType("YELLOW")}
                >
                  <Text style={[styles.plateMiniText, plateType === "YELLOW" && styles.plateMiniTextActiveYellow]}>
                    🟡 Yellow Plate
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.confirmActionBtn} onPress={handleDeployRide}>
                <Text style={styles.confirmActionBtnText}>Deploy Ride to Live Pool ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 2: REQUEST A CAB (RENT IDLE CARS) ---------------- */}
        <Modal visible={showRentCarModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>🚕 Request a Cab / Rent Idle Cars</Text>
                <TouchableOpacity onPress={() => setShowRentCarModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: "#64748B", marginVertical: 6 }}>
                24-Hour rental cars available across Hyderabad for verified drivers.
              </Text>

              {idleCars.map((car) => (
                <View key={car.id} style={styles.fleetCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 13 }}>{car.car_model}</Text>
                    <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>📍 {car.location}</Text>
                    <Text style={{ fontSize: 10, color: "#0284C7", marginTop: 2 }}>Car No: {car.car_number}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 15 }}>₹{car.price_per_24hr}</Text>
                    <Text style={{ fontSize: 9, color: "#94A3B8" }}>/ 24 Hours</Text>
                    <TouchableOpacity
                      style={styles.rentMiniBtn}
                      onPress={() => {
                        alert(`Booked ${car.car_model}! Collect keys from ${car.owner_name}.`);
                        setShowRentCarModal(false);
                      }}
                    >
                      <Text style={styles.rentMiniBtnText}>Rent ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 3: ATTACH A CAR (CAR HOST) ---------------- */}
        <Modal visible={showHostCarModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModalScroll}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={styles.modalTitle}>🔑 Attach Your Idle Car (Car Host)</Text>
                  <TouchableOpacity onPress={() => setShowHostCarModal(false)}>
                    <Text style={{ fontSize: 16, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputTag}>OWNER FULL NAME</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostOwnerName}
                  onChangeText={setHostOwnerName}
                  placeholder="e.g. Bhargav Vattala"
                />

                <Text style={styles.inputTag}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostPhone}
                  onChangeText={setHostPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. 8919326622"
                />

                <Text style={styles.inputTag}>CAR MODEL & YEAR</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostCarModel}
                  onChangeText={setHostCarModel}
                  placeholder="e.g. Maruti Swift Dzire (2022)"
                />

                <Text style={styles.inputTag}>REGISTRATION NUMBER (RC)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostRc}
                  onChangeText={setHostRc}
                  placeholder="e.g. TS09FA2489"
                />

                <Text style={styles.inputTag}>INSURANCE POLICY NUMBER</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostInsurance}
                  onChangeText={setHostInsurance}
                  placeholder="e.g. Comprehensive Policy No."
                />

                <Text style={styles.inputTag}>24 HOURS RENTAL RATE EXPECTED (₹)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostDailyPrice}
                  onChangeText={setHostDailyPrice}
                  keyboardType="numeric"
                />

                <Text style={styles.inputTag}>PARKING PREFERRED LOCATION</Text>
                <TextInput
                  style={styles.inputBox}
                  value={hostLocation}
                  onChangeText={setHostLocation}
                  placeholder="e.g. Madhapur Metro / Gachibowli"
                />

                <TouchableOpacity style={styles.confirmActionBtn} onPress={handleHostCarSubmit}>
                  <Text style={styles.confirmActionBtnText}>Submit Complete Listing Details ➔</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 4: EDIT PROFILE ---------------- */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>✏️ Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputTag}>DRIVER NAME</Text>
              <TextInput style={styles.inputBox} value={driverName} onChangeText={setDriverName} />

              <Text style={styles.inputTag}>PHONE NUMBER</Text>
              <TextInput style={styles.inputBox} value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />

              <Text style={styles.inputTag}>CAR MODEL</Text>
              <TextInput style={styles.inputBox} value={carModel} onChangeText={setCarModel} />

              <Text style={styles.inputTag}>RC NUMBER</Text>
              <TextInput style={styles.inputBox} value={rcNumber} onChangeText={setRcNumber} placeholder="e.g. TS09FA1234" />

              <Text style={styles.inputTag}>DRIVING LICENCE (DL)</Text>
              <TextInput style={styles.inputBox} value={dlNumber} onChangeText={setDlNumber} placeholder="e.g. DL-0920190012345" />

              <TouchableOpacity
                style={styles.confirmActionBtn}
                onPress={() => {
                  const profile = { name: driverName, phone: driverPhone, rc: rcNumber, dl: dlNumber, carModel, lang: selectedLanguage };
                  try {
                    if (typeof window !== "undefined" && window.localStorage) {
                      window.localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
                    }
                  } catch {}
                  setShowEditProfileModal(false);
                  alert("Profile updated successfully!");
                }}
              >
                <Text style={styles.confirmActionBtnText}>Save Profile ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 5: GENERAL SETTINGS (LANGUAGE TELUGU, HINDI, ENGLISH) ---------------- */}
        <Modal visible={showGeneralSettingsModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>⚙️ General Settings</Text>
                <TouchableOpacity onPress={() => setShowGeneralSettingsModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputTag, { marginTop: 12 }]}>SELECT APPLICATION LANGUAGE</Text>
              <View style={{ gap: 8, marginVertical: 8 }}>
                {[
                  { id: "Telugu", label: "తెలుగు (Telugu)" },
                  { id: "English", label: "English" },
                  { id: "Hindi", label: "हिन्दी (Hindi)" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.langSelectRow, selectedLanguage === item.id && styles.langSelectRowActive]}
                    onPress={() => {
                      setSelectedLanguage(item.id as any);
                      alert(`Language set to ${item.label}`);
                    }}
                  >
                    <Text style={[styles.langSelectText, selectedLanguage === item.id && styles.langSelectTextActive]}>
                      {item.label}
                    </Text>
                    {selectedLanguage === item.id && <Text style={{ color: "#1E40AF", fontWeight: "900" }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.confirmActionBtn} onPress={() => setShowGeneralSettingsModal(false)}>
                <Text style={styles.confirmActionBtnText}>Apply Settings ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 6: NOTIFICATIONS (REWARDS & ALERTS) ---------------- */}
        <Modal visible={showNotificationsModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>🔔 Notifications & Rewards</Text>
                <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <View style={styles.notificationItemBox}>
                  <Text style={styles.notifTitle}>🎁 Referral Bonus Alert</Text>
                  <Text style={styles.notifDesc}>
                    Invite colleagues to drive! Both get ₹200 as soon as they complete their first ride.
                  </Text>
                </View>

                <View style={[styles.notificationItemBox, { borderColor: "#F59E0B" }]}>
                  <Text style={[styles.notifTitle, { color: "#D97706" }]}>⛽ Weekly Petrol Targets Live</Text>
                  <Text style={styles.notifDesc}>
                    5 rides = ₹500 petrol bonus | 10 rides = ₹1,500 grand bonus. Deploy rides to qualify!
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.confirmActionBtn} onPress={() => setShowNotificationsModal(false)}>
                <Text style={styles.confirmActionBtnText}>Close ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 7: PRIVACY POLICY, HELPLINE & EMERGENCY ---------------- */}
        <Modal visible={showPolicyModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>🛡️ Privacy Policy & Helpline</Text>
                <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <TouchableOpacity
                  style={styles.helplineRow}
                  onPress={() => Linking.openURL("tel:18004190099")}
                >
                  <Text style={{ fontSize: 20 }}>📞</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.helplineTitle}>24x7 Driver Helpline (1800-419-0099)</Text>
                    <Text style={styles.helplineSub}>Toll-free customer & captain support</Text>
                  </View>
                  <Text style={{ color: "#1E40AF", fontWeight: "900" }}>CALL ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.helplineRow, { backgroundColor: "#FDF2F8", borderColor: "#F472B6" }]}
                  onPress={() => Linking.openURL("tel:1091")}
                >
                  <Text style={{ fontSize: 20 }}>🌸</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.helplineTitle, { color: "#BE185D" }]}>SHE Teams Telangana (1091)</Text>
                    <Text style={styles.helplineSub}>Women Safety Rapid Police Response</Text>
                  </View>
                  <Text style={{ color: "#BE185D", fontWeight: "900" }}>CALL ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.helplineRow, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }]}
                  onPress={() => Linking.openURL("tel:112")}
                >
                  <Text style={{ fontSize: 20 }}>🚓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.helplineTitle, { color: "#DC2626" }]}>Police Emergency Dispatch (112)</Text>
                    <Text style={styles.helplineSub}>National Emergency Response System</Text>
                  </View>
                  <Text style={{ color: "#DC2626", fontWeight: "900" }}>CALL ➔</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.confirmActionBtn} onPress={() => setShowPolicyModal(false)}>
                <Text style={styles.confirmActionBtnText}>Close ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- MODAL 8: SOS DISPATCH ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sosHeading}>🚨 Emergency SOS Dispatch</Text>
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
                  <Text style={{ fontSize: 10, color: "#9D174D" }}>Women Rapid Police Emergency</Text>
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

export default DriverHome;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  royalBlueHeader: {
    backgroundColor: "#1E40AF",
    paddingTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeProfileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeSub: { color: "#BFDBFE", fontSize: 11, fontWeight: "600" },
  welcomeName: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  womenModePill: {
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  womenModePillActive: {
    backgroundColor: "#EC4899",
    borderColor: "#DB2777",
  },
  womenModeText: {
    color: "#BE185D",
    fontSize: 10.5,
    fontWeight: "900",
  },
  sosButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 90 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  categoryGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  categoryCol: { alignItems: "center", width: "19%" },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryIconCircleBlue: { borderColor: "#1D4ED8", backgroundColor: "#EFF6FF", borderWidth: 2 },
  categoryIconCircleAmber: { borderColor: "#D97706", backgroundColor: "#FFFBEB", borderWidth: 2 },
  categoryTitle: { fontSize: 10, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  categorySub: { fontSize: 9, fontWeight: "600", color: "#64748B", textAlign: "center" },
  recommendationCard: {
    width: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    elevation: 2,
  },
  recommendationHeaderVisual: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  recBadgePill: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  recommendationBody: { padding: 10 },
  recCityName: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  recSubText: { fontSize: 9.5, color: "#64748B", marginTop: 2 },
  destinationGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  destinationCard: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    elevation: 2,
    marginBottom: 6,
  },
  destTopGraphic: {
    height: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  destCardContent: { padding: 8 },
  destCityName: { fontSize: 11, fontWeight: "900", color: "#0F172A" },
  destHighwayName: { fontSize: 8.5, color: "#64748B", marginTop: 2 },
  royalBlueBottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 62,
    backgroundColor: "#1E40AF",
    flexDirection: "row",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    zIndex: 50,
  },
  navBarItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBarText: { fontSize: 10, fontWeight: "700", color: "#BFDBFE", marginTop: 2 },
  navBarTextActive: { color: "#FFFFFF", fontWeight: "900" },
  // Dedicated Tabs Styling
  dedicatedTabScroll: { padding: 16, paddingBottom: 85 },
  tabHeadingTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 14 },
  exploreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  exploreBadgeGreen: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  exploreBadgeGreenText: { color: "#16A34A", fontSize: 10, fontWeight: "900" },
  exploreBadgeAmber: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  exploreBadgeAmberText: { color: "#B45309", fontSize: 10, fontWeight: "900" },
  exploreCardTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  exploreCardSub: { fontSize: 11.5, color: "#64748B", marginTop: 4, lineHeight: 17 },
  referralCodeBox: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  referralCodeTag: { fontSize: 9, fontWeight: "800", color: "#B45309" },
  referralCodeText: { fontSize: 20, fontWeight: "900", color: "#78350F", marginTop: 2, letterSpacing: 2 },
  whatsappShareBtn: { backgroundColor: "#25D366", paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  whatsappShareText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  targetProgressCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  targetRowTitle: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  targetRowBonus: { fontSize: 13, fontWeight: "900", color: "#16A34A" },
  targetRowDesc: { fontSize: 10, color: "#64748B", marginTop: 2 },
  // My Pools Dashboard
  myPoolsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    elevation: 4,
  },
  radarStatusHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  pulsingGreenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  radarStatusText: { fontSize: 11, fontWeight: "900", color: "#1D4ED8", letterSpacing: 0.5 },
  poolRouteTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  poolVehicleSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  seatsOverviewBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
  },
  seatMetricCol: { flex: 1, alignItems: "center" },
  seatMetricLabel: { fontSize: 9, fontWeight: "800", color: "#1E40AF" },
  seatMetricValue: { fontSize: 22, fontWeight: "900", color: "#1E40AF", marginTop: 2 },
  customerMatchBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  acceptCustomerBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  acceptCustomerBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  allSeatsFullBanner: {
    backgroundColor: "#DCFCE7",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  allSeatsFullBannerText: { color: "#16A34A", fontSize: 11.5, fontWeight: "900" },
  cancelPoolBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelPoolBtnText: { color: "#DC2626", fontSize: 12, fontWeight: "800" },
  emptyPoolBox: {
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
  deployNowActionBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 18,
  },
  deployNowActionBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  // Profile Hub
  profileSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  profileAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDriverName: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  profilePhoneText: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  profileKycTag: { color: "#16A34A", fontSize: 11, fontWeight: "900", marginTop: 2 },
  profileMenuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileMenuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  profileMenuRowTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  profileMenuRowSub: { fontSize: 10.5, color: "#64748B", marginTop: 1 },
  menuArrow: { fontSize: 14, color: "#94A3B8", fontWeight: "bold" },
  menuDivider: { height: 1, backgroundColor: "#F1F5F9" },
  // Modals Styling
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  sheetModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  sheetModalScroll: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: "90%" },
  modalTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  inputTag: { fontSize: 9, fontWeight: "800", color: "#64748B", marginTop: 8, marginBottom: 4 },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  plateMiniPill: { flex: 1, paddingVertical: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, alignItems: "center" },
  plateMiniPillActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateMiniPillActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  plateMiniText: { fontSize: 9.5, fontWeight: "700", color: "#64748B" },
  plateMiniTextActive: { color: "#16A34A", fontWeight: "900" },
  plateMiniTextActiveYellow: { color: "#B45309", fontWeight: "900" },
  confirmActionBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },
  confirmActionBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  fleetCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  rentMiniBtn: {
    backgroundColor: "#1E40AF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 4,
  },
  rentMiniBtnText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  // Settings & Notifications & Helpline
  langSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langSelectRowActive: { borderColor: "#1E40AF", backgroundColor: "#EFF6FF" },
  langSelectText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  langSelectTextActive: { color: "#1E40AF", fontWeight: "900" },
  notificationItemBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    padding: 12,
  },
  notifTitle: { fontSize: 12, fontWeight: "900", color: "#16A34A" },
  notifDesc: { fontSize: 10.5, color: "#64748B", marginTop: 2, lineHeight: 15 },
  helplineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
  },
  helplineTitle: { fontSize: 12, fontWeight: "900", color: "#1E40AF" },
  helplineSub: { fontSize: 10, color: "#64748B", marginTop: 1 },
  sosHeading: { fontSize: 15, fontWeight: "900", color: "#DC2626", marginBottom: 12 },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
});
