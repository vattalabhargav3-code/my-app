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

// 2. POPULAR DESTINATIONS (6 INTER-CITY HIGHWAY HUBS)
const POPULAR_DESTINATIONS_DATA = [
  {
    id: "dest_1",
    city: "Vijayawada",
    highway: "NH 65 Expressway",
    price: "₹350 onwards",
    icon: "🌉",
    badgeColor: "#991B1B",
  },
  {
    id: "dest_2",
    city: "Bengaluru",
    highway: "NH 44 Airport Corridor",
    price: "₹850 onwards",
    icon: "🏙️",
    badgeColor: "#0F766E",
  },
  {
    id: "dest_3",
    city: "Tirupati",
    highway: "Balaji Pilgrimage Highway",
    price: "₹650 onwards",
    icon: "🛕",
    badgeColor: "#B45309",
  },
  {
    id: "dest_4",
    city: "Kurnool City",
    highway: "NH 44 Gateway to Rayalaseema",
    price: "₹300 onwards",
    icon: "🏰",
    badgeColor: "#6B21A8",
  },
  {
    id: "dest_5",
    city: "Khammam",
    highway: "Suryapet - Khammam Expressway",
    price: "₹250 onwards",
    icon: "⛰️",
    badgeColor: "#9D174D",
  },
  {
    id: "dest_6",
    city: "Warangal",
    highway: "ORR - Warangal Highway",
    price: "₹220 onwards",
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
  {
    id: "car_3",
    owner_name: "Dr. Anirudh",
    car_model: "Maruti Ertiga 7-Seater (Diesel)",
    model_year: "2023",
    car_number: "TS08HQ4512",
    location: "LB Nagar Ring Road",
    price_per_24hr: 1500,
  },
];

export function DriverHome({ navigation }: any) {
  const [driverName, setDriverName] = useState("Bhargav");
  const [driverPhone, setDriverPhone] = useState("8919326622");
  const [driverEmail, setDriverEmail] = useState("vattalabhargav3@gmail.com");
  const [rcNumber, setRcNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [carModel, setCarModel] = useState("Swift Dzire");

  const [activeTab, setActiveTab] = useState<"HOME" | "EXPLORE" | "POOLS" | "PROFILE">("HOME");

  const [showVehicleBookingModal, setShowVehicleBookingModal] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<"CAR" | "BIKE" | "VAN">("CAR");
  const [showRentCarModal, setShowRentCarModal] = useState(false);
  const [showHostCarModal, setShowHostCarModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  const [pickupInput, setPickupInput] = useState("Hitec City Cyber Towers, Hyderabad");
  const [dropInput, setDropInput] = useState("");
  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");

  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
  const [hostLocation, setHostLocation] = useState("");
  const [hostDailyPrice, setHostDailyPrice] = useState("1100");

  const [searchCityQuery, setSearchCityQuery] = useState("");

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
    if (!pickupInput.trim() || !dropInput.trim() || !pricePerSeat.trim()) {
      alert("Please enter Pickup location, Drop destination, and Seat price.");
      return;
    }

    const newPoolRide = {
      id: "ride_" + Date.now(),
      driver_name: driverName,
      from_location: pickupInput,
      to_location: dropInput,
      vehicle_name: selectedBookingType === "BIKE" ? "Bike" : selectedBookingType === "VAN" ? "Van Shuttle" : carModel,
      available_seats: Number(seatsCount),
      price_per_seat: Number(pricePerSeat),
      plate_type: plateType,
      category_tag: plateType === "WHITE" ? "Green Saver" : "Commercial Express",
      status: "ONLINE_SEARCHING",
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
        const list = stored ? JSON.parse(stored) : [];
        window.localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify([newPoolRide, ...list]));
      }
    } catch {}

    setShowVehicleBookingModal(false);
    alert(`🎉 ${selectedBookingType} Ride successfully deployed to Hyderabad live pool!`);
  };

  const handleHostCarSubmit = () => {
    if (!hostOwnerName || !hostCarModel || !hostLocation || !hostDailyPrice) {
      alert("Please fill all car details, location and daily rate.");
      return;
    }
    alert("🎉 Your idle car has been successfully listed in the fleet!");
    setShowHostCarModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 1. TOP ROYAL BLUE HEADER AREA */}
        <View style={styles.royalBlueHeader}>
          <View style={styles.topSearchBar}>
            <Text style={{ fontSize: 14 }}>🔍</Text>
            <TextInput
              style={styles.topSearchInput}
              placeholder="Search destinations, Hyderabad hubs..."
              placeholderTextColor="#94A3B8"
              value={searchCityQuery}
              onChangeText={setSearchCityQuery}
            />
            {searchCityQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchCityQuery("")}>
                <Text style={{ fontSize: 14, color: "#64748B" }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.welcomeProfileRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => setShowEditProfileModal(true)}
              >
                <Text style={{ fontSize: 18 }}>👤</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.welcomeSub}>Welcome!</Text>
                <Text style={styles.welcomeName}>{driverName.toUpperCase()}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity
                style={styles.bellIconCircle}
                onPress={() => alert("Notification: RidePool Driver Console Active")}
              >
                <Text style={{ fontSize: 13 }}>🔔</Text>
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

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 2. CATEGORY SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Category</Text>
            <TouchableOpacity onPress={() => setShowEditProfileModal(true)}>
              <Text style={styles.hamburgerIcon}>☰</Text>
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

            <TouchableOpacity
              style={styles.categoryCol}
              onPress={() => setShowRentCarModal(true)}
            >
              <View style={[styles.categoryIconCircle, styles.categoryIconCircleBlue]}>
                <Text style={{ fontSize: 22 }}>🚕</Text>
              </View>
              <Text style={[styles.categoryTitle, { color: "#1D4ED8" }]}>Request</Text>
              <Text style={[styles.categorySub, { color: "#1D4ED8" }]}>a Cab</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoryCol}
              onPress={() => setShowHostCarModal(true)}
            >
              <View style={[styles.categoryIconCircle, styles.categoryIconCircleAmber]}>
                <Text style={{ fontSize: 22 }}>🔑</Text>
              </View>
              <Text style={[styles.categoryTitle, { color: "#D97706" }]}>Attach</Text>
              <Text style={[styles.categorySub, { color: "#D97706" }]}>a Car</Text>
            </TouchableOpacity>
          </View>

          {/* 3. RECOMMENDATIONS */}
          <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
            <Text style={styles.sectionHeading}>Recommendation</Text>
            <TouchableOpacity onPress={() => alert("Showing all top Hyderabad business hubs")}>
              <Text style={styles.seeAllLink}>See all ➔</Text>
            </TouchableOpacity>
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

          {/* 4. POPULAR DESTINATIONS */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionHeading}>Popular Destination</Text>
            <Text style={styles.destinationCountTag}>6 Cities ➔</Text>
          </View>

          <View style={styles.destinationGridContainer}>
            {POPULAR_DESTINATIONS_DATA.filter((c) =>
              c.city.toLowerCase().includes(searchCityQuery.toLowerCase())
            ).map((item) => (
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
                  <Text style={styles.destPriceTag}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* 5. ROYAL BLUE BOTTOM BAR */}
        <View style={styles.royalBlueBottomNav}>
          <TouchableOpacity style={styles.navBarItem} onPress={() => setActiveTab("HOME")}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={[styles.navBarText, activeTab === "HOME" && styles.navBarTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBarItem}
            onPress={() => {
              setActiveTab("EXPLORE");
              setShowRentCarModal(true);
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
              setShowEditProfileModal(true);
            }}
          >
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={[styles.navBarText, activeTab === "PROFILE" && styles.navBarTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* VEHICLE ROUTE MODAL */}
        <Modal visible={showVehicleBookingModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>
                  {selectedBookingType === "CAR"
                    ? "🚗 Car Pool Route Setup"
                    : selectedBookingType === "BIKE"
                    ? "🏍️ Bike Route Setup"
                    : "🚐 Van Shuttle Route Setup"}
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
                  <Text style={[styles.plateMiniText, plateType === "WHITE" && styles.plateMiniTextActive]}>⚪ White Plate (Eco Cost Share)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.plateMiniPill, plateType === "YELLOW" && styles.plateMiniPillActiveYellow]}
                  onPress={() => setPlateType("YELLOW")}
                >
                  <Text style={[styles.plateMiniText, plateType === "YELLOW" && styles.plateMiniTextActiveYellow]}>🟡 Yellow Plate (Taxi Express)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.confirmActionBtn} onPress={handleDeployRide}>
                <Text style={styles.confirmActionBtnText}>Deploy Ride to Live Pool ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* RENT IDLE CAR MODAL */}
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

              {INITIAL_IDLE_CARS.map((car) => (
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

        {/* HOST A CAR MODAL */}
        <Modal visible={showHostCarModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>🔑 Attach Your Idle Car (Car Host)</Text>
                <TouchableOpacity onPress={() => setShowHostCarModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: "#D97706", fontWeight: "700", marginVertical: 4 }}>
                Earn ₹25,000+ monthly passive income from your idle vehicle.
              </Text>

              <Text style={styles.inputTag}>OWNER NAME</Text>
              <TextInput style={styles.inputBox} value={hostOwnerName} onChangeText={setHostOwnerName} placeholder="e.g. Bhargav Vattala" />

              <Text style={styles.inputTag}>CAR MODEL & YEAR</Text>
              <TextInput style={styles.inputBox} value={hostCarModel} onChangeText={setHostCarModel} placeholder="e.g. Swift Dzire (2022)" />

              <Text style={styles.inputTag}>PARKING LOCATION (HYDERABAD)</Text>
              <TextInput style={styles.inputBox} value={hostLocation} onChangeText={setHostLocation} placeholder="e.g. Madhapur, LB Nagar" />

              <Text style={styles.inputTag}>24 HOURS RENTAL RATE (₹)</Text>
              <TextInput style={styles.inputBox} value={hostDailyPrice} onChangeText={setHostDailyPrice} keyboardType="numeric" />

              <TouchableOpacity style={styles.confirmActionBtn} onPress={handleHostCarSubmit}>
                <Text style={styles.confirmActionBtnText}>List Your Car Today ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* EDIT PROFILE MODAL */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.modalTitle}>Driver Profile & KYC Details</Text>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputTag}>DRIVER NAME</Text>
              <TextInput style={styles.inputBox} value={driverName} onChangeText={setDriverName} />

              <Text style={styles.inputTag}>PHONE NUMBER</Text>
              <TextInput style={styles.inputBox} value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />

              <Text style={styles.inputTag}>RC NUMBER</Text>
              <TextInput style={styles.inputBox} value={rcNumber} onChangeText={setRcNumber} placeholder="e.g. TS09FA1234" />

              <Text style={styles.inputTag}>DRIVING LICENCE (DL)</Text>
              <TextInput style={styles.inputBox} value={dlNumber} onChangeText={setDlNumber} placeholder="e.g. DL-0920190012345" />

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
                  alert("Driver profile saved!");
                }}
              >
                <Text style={styles.confirmActionBtnText}>Save Profile ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* SOS MODAL */}
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
  topSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
    elevation: 3,
  },
  topSearchInput: { flex: 1, fontSize: 13, color: "#0F172A", fontWeight: "600" },
  welcomeProfileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
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
  bellIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  hamburgerIcon: { fontSize: 18, fontWeight: "bold", color: "#1E40AF" },
  seeAllLink: { fontSize: 11, fontWeight: "800", color: "#1E40AF" },
  destinationCountTag: { fontSize: 11, fontWeight: "800", color: "#1E40AF" },
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
  destHighwayName: { fontSize: 8.5, color: "#64748B", marginVertical: 2 },
  destPriceTag: { fontSize: 9.5, fontWeight: "900", color: "#16A34A" },
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
  sosHeading: { fontSize: 15, fontWeight: "900", color: "#DC2626", marginBottom: 12 },
  sosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 10, marginBottom: 8, gap: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
});
