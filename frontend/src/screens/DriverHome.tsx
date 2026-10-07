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

// 2. POPULAR DESTINATIONS (NO PRICES DISPLAYED ON TILES)
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

// PREVIOUS/PAST RIDES DATABASE FOR HISTORY
const PAST_RIDES_HISTORY = [
  {
    id: "hist_1",
    route: "Madhapur ➔ Vijayawada",
    date: "04 Oct 2026",
    seatsBooked: "3/3 Seats Confirmed",
    income: "₹1,050 Earned",
    status: "Completed",
  },
  {
    id: "hist_2",
    route: "Hitec City ➔ Secunderabad",
    date: "28 Sept 2026",
    seatsBooked: "4/4 Seats Confirmed",
    income: "₹440 Earned",
    status: "Completed",
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
  const [driverName, setDriverName] = useState("Bhargav");
  const [driverPhone, setDriverPhone] = useState("8919326622");
  const [driverEmail, setDriverEmail] = useState("vattalabhargav3@gmail.com");
  const [rcNumber, setRcNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [carModel, setCarModel] = useState("Swift Dzire");

  // Bottom Nav Selection
  const [activeTab, setActiveTab] = useState<"HOME" | "EXPLORE" | "POOLS" | "PROFILE">("HOME");

  // Safety & Mode Flags
  const [onlyWomenMode, setOnlyWomenMode] = useState(false);

  // Core Booking Modals
  const [showVehicleBookingModal, setShowVehicleBookingModal] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<"CAR" | "BIKE" | "VAN">("CAR");
  const [showRentCarModal, setShowRentCarModal] = useState(false);
  const [showHostCarModal, setShowHostCarModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Settings & Target Modals (Triggered via Profile)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Live Deployed Ride States
  const [isRideActive, setIsRideActive] = useState(false);
  const [rideStatus, setRideStatus] = useState<"WAITING_FOR_CUSTOMER" | "CONFIRMED">("WAITING_FOR_CUSTOMER");
  const [bookedSeatsCount, setBookedSeatsCount] = useState(0);

  // Ride Deployment Configurations
  const [pickupInput, setPickupInput] = useState("Hitec City Cyber Towers, Hyderabad");
  const [dropInput, setDropInput] = useState("");
  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");

  // ATTACH CAR INPUTS (COMPREHENSIVE)
  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [hostRc, setHostRc] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
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
          if (p.email) setDriverEmail(p.email);
          if (p.phone) setDriverPhone(p.phone);
          if (p.rc) setRcNumber(p.rc);
          if (p.dl) setDlNumber(p.dl);
          if (p.carModel) setCarModel(p.carModel);
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

  const handleDeployRide = () => {
    if (!pickupInput.trim() || !dropInput.trim()) {
      alert("Please specify start and end points.");
      return;
    }
    setIsRideActive(true);
    setRideStatus("WAITING_FOR_CUSTOMER");
    setBookedSeatsCount(0);
    setShowVehicleBookingModal(false);

    // Auto Seat Confirm Simulation
    setTimeout(() => {
      setRideStatus("CONFIRMED");
      setBookedSeatsCount(Number(seatsCount));
    }, 4500);
  };

  const handleHostCarSubmit = () => {
    if (!hostOwnerName || !hostCarModel || !hostRc || !hostInsurance || !hostDailyPrice) {
      alert("Please provide owner details, car info, RC, Insurance & daily rent rate.");
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
    alert("🎉 Your vehicle listing has been submitted for review! It will show up in listings upon document check.");
    setShowHostCarModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ---------------- 1. TOP ROYAL BLUE HEADER AREA ---------------- */}
        <View style={styles.royalBlueHeader}>
          <View style={styles.welcomeProfileRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={styles.avatarCircle}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View>
                <Text style={styles.welcomeSub}>Welcome!</Text>
                <Text style={styles.welcomeName}>{driverName.toUpperCase()}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {/* Only Women Mode Trigger */}
              <TouchableOpacity
                style={[styles.womenModePill, onlyWomenMode && styles.womenModePillActive]}
                onPress={() => {
                  setOnlyWomenMode(!onlyWomenMode);
                  alert(onlyWomenMode ? "Standard pools available." : "🚺 Only Women ride mode activated! Showing women passengers only.");
                }}
              >
                <Text style={styles.womenModeText}>{onlyWomenMode ? "🚺 Active Mode" : "🎀 Only Women"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosButton}
                onPress={() => setShowSosModal(true)}
              >
                <Text style={styles.sosButtonText}>🚨 SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ---------------- ACTIVE DEPLOYED RADAR BANNER (IN-APP POPUP STATUS) ---------------- */}
        {isRideActive && (
          <View style={styles.activeRideStatusCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <View style={[styles.pulsingGreenDot, rideStatus === "WAITING_FOR_CUSTOMER" && { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.activeBannerMainHeading}>
                  {rideStatus === "WAITING_FOR_CUSTOMER" ? "Waiting for Customer..." : "🎯 Passenger Ride Booked!"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsRideActive(false)}>
                <Text style={{ color: "#94A3B8", fontWeight: "900", fontSize: 13 }}>✕ Offline</Text>
              </TouchableOpacity>
            </View>

            {rideStatus === "WAITING_FOR_CUSTOMER" ? (
              <Text style={styles.activeBannerSubText}>Radar is live searching for nearby commuters ➔</Text>
            ) : (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.seatCountConfirmStatus}>
                  ✅ All Seats booked dynamically: {bookedSeatsCount} / {seatsCount} Confirm!
                </Text>
                <Text style={{ fontSize: 10, color: "#BFDBFE" }}>Driver details updated for boarding pool on route drops.</Text>
              </View>
            )}
          </View>
        )}

        {/* ---------------- SCROLLABLE DASHBOARD CONTENT ---------------- */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ---------------- 2. CATEGORY GRID SECTION (NO SEARCH BAR) ---------------- */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Category</Text>
            <TouchableOpacity onPress={() => setShowHistoryModal(true)}>
              <Text style={styles.historyAccessText}>📜 Past History</Text>
            </TouchableOpacity>
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

          {/* ---------------- 3. RECOMMENDATION SECTION (HYDERABAD INTRA-CITY HUBS) ---------------- */}
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

          {/* ---------------- 4. POPULAR DESTINATIONS (NO HIGHWAY AND TICKET PRICING DISPLAY) ---------------- */}
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
                  <Text style={styles.destHighwayName} numberOfLines={1}>{item.highway}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ---------------- 5. FIXED ROYAL BLUE BOTTOM BAR ---------------- */}
        <View style={styles.royalBlueBottomNav}>
          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("HOME");
              alert("Routing Hub Home active.");
            }}
          >
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={[styles.navBarText, activeTab === "HOME" && styles.navBarTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("EXPLORE");
              // Prompt view updates containing essential references as requested:
              alert(`🎁 Referral: ₹200 for both when your friend 1st ride completes!\n\n⛽ Incentives: Target 10 Rides/Week = ₹1,500 Petrol Bonus | Target 5 Rides/Week = ₹500 Petrol Bonus`);
            }}
          >
            <Text style={{ fontSize: 18 }}>🧭</Text>
            <Text style={[styles.navBarText, activeTab === "EXPLORE" && styles.navBarTextActive]}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("POOLS");
              openBookingModal("CAR");
            }}
          >
            <Text style={{ fontSize: 18 }}>🚗</Text>
            <Text style={[styles.navBarText, activeTab === "POOLS" && styles.navBarTextActive]}>My Pools</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("PROFILE");
              // In Profile setting only these verified choices should load:
              alert("Settings Panel Options:\n\n⚙️ Settings\n🔔 Notifications\n🎁 Rewards\n✏️ Edit Profile");
              setShowEditProfileModal(true);
            }}
          >
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={[styles.navBarText, activeTab === "PROFILE" && styles.navBarTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- PAST VEHICLE ROUTE HISTORY MODAL ---------------- */}
        <Modal visible={showHistoryModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>📜 Past Rides History</Text>
                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              {PAST_RIDES_HISTORY.map((hist) => (
                <View key={hist.id} style={styles.fleetCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 13 }}>{hist.route}</Text>
                    <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{hist.date} • {hist.seatsBooked}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 13 }}>{hist.income}</Text>
                    <Text style={{ fontSize: 9, color: "#10B981" }}>{hist.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Modal>

        {/* ---------------- VEHICLE ROUTE DEPLOY MODAL (NO PRICES DISPLAY ON POST) ---------------- */}
        <Modal visible={showVehicleBookingModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>
                  {selectedBookingType === "CAR"
                    ? "🚗 Car Pool Route Setup"
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
              <TextInput style={styles.inputBox} placeholder="e.g. Vijayawada, Bengaluru, Madhapur" value={dropInput} onChangeText={setDropInput} />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>SEATS OFFERED</Text>
                  <TextInput style={styles.inputBox} keyboardType="numeric" value={seatsCount} onChangeText={setSeatsCount} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>PRICE PER SEAT (₹)</Text>
                  <TextInput style={styles.inputBox} keyboardType="numeric" value={pricePerSeat} onChangeText={setPricePerSeat} />
                </View>
              </View>

              <Text style={[styles.inputTag, { marginTop: 8 }]}>NUMBER PLATE TYPE</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.plateMiniPill, plateType === "WHITE" && styles.plateMiniPillActive]}
                  onPress={() => setPlateType("WHITE")}
                >
                  <Text style={[styles.plateMiniText, plateType === "WHITE" && styles.plateMiniTextActive]}>⚪ White Plate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.plateMiniPill, plateType === "YELLOW" && styles.plateMiniPillActiveYellow]}
                  onPress={() => setPlateType("YELLOW")}
                >
                  <Text style={[styles.plateMiniText, plateType === "YELLOW" && styles.plateMiniTextActiveYellow]}>🟡 Yellow Plate</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.confirmActionBtn} onPress={handleDeployRide}>
                <Text style={styles.confirmActionBtnText}>Deploy Ride to Live Pool ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- REQUEST A CAB (RENT IDLE CARS) MODAL ---------------- */}
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
                24-Hour flexible rental cars available for verified drivers in Hyderabad.
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

        {/* ---------------- ATTACH A CAR MODAL (COMPREHENSIVE FORMS) ---------------- */}
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
                <TextInput style={styles.inputBox} value={hostOwnerName} onChangeText={setHostOwnerName} placeholder="e.g. Bhargav Vattala" />

                <Text style={styles.inputTag}>PHONE NUMBER</Text>
                <TextInput style={styles.inputBox} value={hostPhone} onChangeText={setHostPhone} keyboardType="phone-pad" placeholder="e.g. 8919326622" />

                <Text style={styles.inputTag}>CAR MODEL & YEAR</Text>
                <TextInput style={styles.inputBox} value={hostCarModel} onChangeText={setHostCarModel} placeholder="e.g. Maruti Swift Dzire (2022)" />

                <Text style={styles.inputTag}>REGISTRATION NUMBER (RC)</Text>
                <TextInput style={styles.inputBox} value={hostRc} onChangeText={setHostRc} placeholder="e.g. TS09FA2489" />

                <Text style={styles.inputTag}>INSURANCE POLICY NUMBER</Text>
                <TextInput style={styles.inputBox} value={hostInsurance} onChangeText={setHostInsurance} placeholder="e.g. Comprehensive Policy No." />

                <Text style={styles.inputTag}>HOURLY/DAILY RENTAL FEE EXPECTED (₹)</Text>
                <TextInput style={styles.inputBox} value={hostDailyPrice} onChangeText={setHostDailyPrice} keyboardType="numeric" />

                <Text style={styles.inputTag}>PARKING PREFERRED LOCATION</Text>
                <TextInput style={styles.inputBox} value={hostLocation} onChangeText={setHostLocation} placeholder="e.g. Madhapur Metro/Gachibowli" />

                <TouchableOpacity style={styles.confirmActionBtn} onPress={handleHostCarSubmit}>
                  <Text style={styles.confirmActionBtnText}>Submit Complete Listing Details ➔</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ---------------- PROFILE MODAL ---------------- */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>👤 Profile Hub</Text>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Verified Sub-modules to ensure clean accessibility per User updates: */}
              <View style={{ gap: 10, marginVertical: 14 }}>
                <TouchableOpacity
                  style={styles.profileActionRow}
                  onPress={() => {
                    setShowEditProfileModal(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <Text style={styles.profileActionText}>⚙️ General Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileActionRow}
                  onPress={() => {
                    setShowEditProfileModal(false);
                    setShowNotificationsModal(true);
                  }}
                >
                  <Text style={styles.profileActionText}>🔔 Notifications Dispatch</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileActionRow}
                  onPress={() => {
                    setShowEditProfileModal(false);
                    setShowRewardsModal(true);
                  }}
                >
                  <Text style={styles.profileActionText}>🎁 Active Rewards Hub</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileActionRow}
                  onPress={() => {
                    // Quick In-house modal form editing
                    alert("Ready to update primary verified ID: Phone No, Car type below.");
                  }}
                >
                  <Text style={styles.profileActionText}>✏️ Edit Profile Data</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputTag}>DRIVER NAME</Text>
              <TextInput style={styles.inputBox} value={driverName} onChangeText={setDriverName} />

              <Text style={styles.inputTag}>RC (VEHICLE ID) REGISTERED</Text>
              <TextInput style={styles.inputBox} value={rcNumber} onChangeText={setRcNumber} placeholder="Update registration data..." />

              <TouchableOpacity
                style={styles.confirmActionBtn}
                onPress={() => {
                  const profile = { name: driverName, phone: driverPhone, rc: rcNumber, dl: dlNumber, carModel };
                  try {
                    if (typeof window !== "undefined" && window.localStorage) {
                      window.localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
                    }
                  } catch {}
                  setShowEditProfileModal(false);
                  alert("KYC and profile specs locked!");
                }}
              >
                <Text style={styles.confirmActionBtnText}>Apply Core Settings ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- GENERAL SETTINGS MODAL ---------------- */}
        <Modal visible={showSettingsModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>⚙️ Settings</Text>
                <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                  <Text style={{ fontSize: 16, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ marginVertical: 14, color: "#334155" }}>Modify system preferences, GPS polling frequency, and privacy setups.</Text>
              <TouchableOpacity style={styles.confirmActionBtn} onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.confirmActionBtnText}>Save Preferences ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- NOTIFICATIONS DISPATCH MODAL ---------------- */}
        <Modal visible={showNotificationsModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>🔔 Notifications Settings</Text>
                <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                  <Text style={{ fontSize: 16, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ marginVertical: 14, color: "#334155" }}>Configure alerts for new passenger ride pool match and routing updates.</Text>
              <TouchableOpacity style={styles.confirmActionBtn} onPress={() => setShowNotificationsModal(false)}>
                <Text style={styles.confirmActionBtnText}>Save and Alert ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- ACTIVE REWARDS HUB MODAL ---------------- */}
        <Modal visible={showRewardsModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>🎁 Rewards Status</Text>
                <TouchableOpacity onPress={() => setShowRewardsModal(false)}>
                  <Text style={{ fontSize: 16, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ marginVertical: 14, color: "#334155", fontWeight: "bold" }}>
                🎯 Petrol Incentives: Targets 10 Trips = ₹1,500 Petrol Bonus | 5 Trips = ₹500 Petrol Bonus.{"\n\n"}
                👥 Referral Scheme: Earn ₹200 for you and ₹200 for your referred friend when they complete their first ride!
              </Text>
              <TouchableOpacity style={styles.confirmActionBtn} onPress={() => setShowRewardsModal(false)}>
                <Text style={styles.confirmActionBtnText}>Continue ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- EMERGENCY SOS MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sosHeading}>🚨 Emergency SOS & Police Dispatch</Text>
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
    marginTop: 6,
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
  activeRideStatusCard: {
    backgroundColor: "#1E3A8A",
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    padding: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  pulsingGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  activeBannerMainHeading: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
  activeBannerSubText: {
    color: "#93C5FD",
    fontSize: 10,
    marginTop: 4,
  },
  seatCountConfirmStatus: {
    color: "#34D399",
    fontWeight: "900",
    fontSize: 11.5,
  },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 90 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  historyAccessText: { fontSize: 12, fontWeight: "800", color: "#1E40AF" },
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
  profileActionRow: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 10,
    borderRadius: 10,
  },
  profileActionText: { color: "#1E40AF", fontSize: 12, fontWeight: "900" },
  sosHeading: { fontSize: 15, fontWeight: "900", color: "#DC2626", marginBottom: 12 },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
});
