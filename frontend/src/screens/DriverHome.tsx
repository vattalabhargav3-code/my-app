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

// Initial idle cars listed by Hyderabad car hosts
const INITIAL_IDLE_CARS = [
  {
    id: "car_1",
    owner_name: "Karthik R.",
    car_model: "Maruti Swift Dzire (Petrol)",
    model_year: "2022",
    car_number: "TS09FA2489",
    location: "Gachibowli, Hyderabad",
    price_per_24hr: 1100,
    fuel_type: "Petrol",
    available: true,
  },
  {
    id: "car_2",
    owner_name: "Srinivas Rao",
    car_model: "Hyundai Grand i10 (CNG)",
    model_year: "2021",
    car_number: "TS07EJ8821",
    location: "Kukatpally Housing Board",
    price_per_24hr: 950,
    fuel_type: "CNG",
    available: true,
  },
  {
    id: "car_3",
    owner_name: "Dr. Anirudh",
    car_model: "Maruti Ertiga 7-Seater (Diesel)",
    model_year: "2023",
    car_number: "TS08HQ4512",
    location: "LB Nagar Ring Road",
    price_per_24hr: 1500,
    fuel_type: "Diesel",
    available: true,
  },
];

export default function DriverHome({ navigation }: any) {
  // 1. Driver Verification States
  const [isVerified, setIsVerified] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<"CREATE_POOL" | "RENT_CAR" | "HOST_CAR" | "INCENTIVES">("CREATE_POOL");

  // 3. Side Menu & SOS Modals
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // 4. Ride Creation States
  const [startPoint, setStartPoint] = useState("LB Nagar, Hyderabad");
  const [endPoint, setEndPoint] = useState("Hitec City Cyber Towers");
  const [carModel, setCarModel] = useState("Swift Dzire");
  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");

  // 5. Weekly Rides & Incentives Tracking
  const [weeklyRidesCount, setWeeklyRidesCount] = useState(4); // Up & Down trips included

  // 6. Idle Fleet (Rent & Host) States
  const [idleCars, setIdleCars] = useState(INITIAL_IDLE_CARS);
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [selectedCarToRent, setSelectedCarToRent] = useState<any>(null);

  // Host Car Form States
  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostRc, setHostRc] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
  const [hostCarYear, setHostCarYear] = useState("2022");
  const [hostLocation, setHostLocation] = useState("");
  const [hostDailyPrice, setHostDailyPrice] = useState("1100");

  // Check saved driver login
  useEffect(() => {
    try {
      const saved = localStorage.getItem("DRIVER_REGISTERED_PROFILE");
      if (saved) {
        const parsed = JSON.parse(saved);
        setDriverName(parsed.name || "");
        setDriverEmail(parsed.email || "");
        setRcNumber(parsed.rc || "");
        setDlNumber(parsed.dl || "");
        setIsVerified(true);
      }
    } catch {}
  }, []);

  // Submit Driver Verification
  const handleVerifyDriver = () => {
    if (!driverName.trim() || !driverEmail.trim() || !rcNumber.trim() || !dlNumber.trim()) {
      alert("దయచేసి పేరు, ఈమెయిల్, RC మరియు DL నంబర్ నమోదు చేయండి.");
      return;
    }

    const profile = {
      name: driverName.trim(),
      email: driverEmail.trim(),
      rc: rcNumber.trim(),
      dl: dlNumber.trim(),
    };

    try {
      localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
    } catch {}

    setIsVerified(true);
  };

  // Publish Shared Pool Ride
  const handlePublishPoolRide = () => {
    if (!startPoint || !endPoint || !pricePerSeat) {
      alert("దయచేసి ప్రయాణ వివరాలు మరియు సీట్ ధరను నమోదు చేయండి.");
      return;
    }

    const newPoolRide = {
      id: "ride_" + Date.now(),
      driver_name: driverName,
      from_location: startPoint,
      to_location: endPoint,
      vehicle_name: carModel,
      available_seats: Number(seatsCount),
      price_per_seat: Number(pricePerSeat),
      plate_type: plateType,
      category_tag: plateType === "WHITE" ? "Green Saver" : "Commercial Express",
      departure_time: "Today in 15 mins",
    };

    try {
      const stored = localStorage.getItem("SHARED_CARPOOL_RIDES");
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify([newPoolRide, ...list]));
    } catch {}

    setWeeklyRidesCount((prev) => prev + 1);
    alert(`రైడ్ పబ్లిష్ అయింది! (${plateType === "WHITE" ? "Green Saver" : "Commercial Express"})`);
  };

  // Host Car Submission
  const handleHostCarSubmit = () => {
    if (!hostOwnerName || !hostCarModel || !hostLocation || !hostDailyPrice) {
      alert("దయచేసి కారు వివరాలు, లొకేషన్ మరియు 24 గంటల అద్దె ధర నమోదు చేయండి.");
      return;
    }

    const newCarListing = {
      id: "car_" + Date.now(),
      owner_name: hostOwnerName,
      car_model: `${hostCarModel} (${hostCarYear})`,
      model_year: hostCarYear,
      car_number: hostRc || "TS09XX0000",
      location: hostLocation,
      price_per_24hr: Number(hostDailyPrice),
      fuel_type: "Petrol/Diesel",
      available: true,
    };

    setIdleCars([newCarListing, ...idleCars]);
    alert("మీ ఖాళీ కారు విజయవంతంగా లిస్ట్ చేయబడింది! సమీపంలోని డ్రైవర్లు బుక్ చేసుకోవచ్చు.");
    setHostCarModel("");
    setHostLocation("");
    setActiveTab("RENT_CAR");
  };

  // Emergency dial
  const dialEmergency = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => alert(`Calling ${num}...`));
  };

  // ---------------- 1. CLEAN DRIVER ONBOARDING (NO MAP) ----------------
  if (!isVerified) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.onboardContainer}>
          <View style={styles.onboardHeader}>
            <Text style={styles.badgeOrange}>DRIVER PARTNER REGISTRATION</Text>
            <Text style={styles.onboardTitle}>వెరిఫికేషన్ & లాగిన్</Text>
            <Text style={styles.onboardSub}>
              రైడ్ పోస్ట్ చేయడానికి లేదా ఖాళీ కార్లను రెంట్‌కు తీసుకోవడానికి మీ వివరాలు నమోదు చేయండి.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputTag}>డ్రైవర్ పూర్తి పేరు (NAME)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. Bhargav Vattala"
              value={driverName}
              onChangeText={setDriverName}
            />

            <Text style={styles.inputTag}>ఈమెయిల్ ఐడీ (EMAIL ID)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="vattalabhargav3@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={driverEmail}
              onChangeText={setDriverEmail}
            />

            <Text style={styles.inputTag}>వాహన రిజిస్ట్రేషన్ నంబర్ (RC NUMBER)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. TS09FA1234 (కారు ఉంటే RC నంబర్)"
              value={rcNumber}
              onChangeText={setRcNumber}
            />

            <Text style={styles.inputTag}>డ్రైవింగ్ లైసెన్స్ నంబర్ (DRIVING LICENCE)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. DL-0920190012345"
              value={dlNumber}
              onChangeText={setDlNumber}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyDriver}>
              <Text style={styles.submitBtnText}>వెరిఫై చేసి లాగిన్ అవ్వండి ➔</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------- 2. DRIVER MAIN DASHBOARD ----------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity style={styles.menuIconBtn} onPress={() => setShowDrawerMenu(true)}>
              <Text style={{ fontSize: 20 }}>☰</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.topTag}>PARTNER DASHBOARD</Text>
              <Text style={styles.topName}>{driverName}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
              <Text style={styles.sosButtonText}>🚨 SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchPassBtn}
              onPress={() => {
                if (navigation && navigation.navigate) {
                  navigation.navigate("PassengerHome");
                } else {
                  window.location.href = "/";
                }
              }}
            >
              <Text style={styles.switchPassText}>Passenger Mode ➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard 4 Action Tabs */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === "CREATE_POOL" && styles.tabNavItemActive]}
            onPress={() => setActiveTab("CREATE_POOL")}
          >
            <Text style={[styles.tabNavText, activeTab === "CREATE_POOL" && styles.tabNavTextActive]}>
              రైడ్ పోస్ట్
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === "RENT_CAR" && styles.tabNavItemActive]}
            onPress={() => setActiveTab("RENT_CAR")}
          >
            <Text style={[styles.tabNavText, activeTab === "RENT_CAR" && styles.tabNavTextActive]}>
              Request Cab 🚗
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === "HOST_CAR" && styles.tabNavItemActive]}
            onPress={() => setActiveTab("HOST_CAR")}
          >
            <Text style={[styles.tabNavText, activeTab === "HOST_CAR" && styles.tabNavTextActive]}>
              Host Idle Car 🔑
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === "INCENTIVES" && styles.tabNavItemActive]}
            onPress={() => setActiveTab("INCENTIVES")}
          >
            <Text style={[styles.tabNavText, activeTab === "INCENTIVES" && styles.tabNavTextActive]}>
              టార్గెట్స్ & పెట్రోల్ ⛽
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- SECTION 1: CREATE RIDE POOL ---------------- */}
        {activeTab === "CREATE_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>రైడ్ పోస్ట్ వివరాలు (Route Setup)</Text>

              <Text style={styles.inputTag}>STARTING POINT (పికప్ పాయింట్)</Text>
              <TextInput
                style={styles.inputBox}
                value={startPoint}
                onChangeText={setStartPoint}
                placeholder="e.g. LB Nagar Ring Road"
              />

              <Text style={styles.inputTag}>END POINT (డెస్టినేషన్)</Text>
              <TextInput
                style={styles.inputBox}
                value={endPoint}
                onChangeText={setEndPoint}
                placeholder="e.g. Hitec City Cyber Towers"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>కార్ మోడల్ (MODEL)</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={carModel}
                    onChangeText={setCarModel}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>అందుబాటులో ఉన్న సీట్లు</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    value={seatsCount}
                    onChangeText={setSeatsCount}
                  />
                </View>
              </View>

              <Text style={styles.inputTag}>సీటు అమౌంట్ (₹ PER SEAT)</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
              />

              {/* Number Plate Selector (White vs Yellow) */}
              <Text style={[styles.inputTag, { marginTop: 14 }]}>నెంబర్ ప్లేట్ రకం (PLATE TYPE)</Text>
              <View style={styles.plateRow}>
                <TouchableOpacity
                  style={[styles.plateBox, plateType === "WHITE" && styles.plateBoxActive]}
                  onPress={() => setPlateType("WHITE")}
                >
                  <View style={styles.whitePlateBadge}>
                    <Text style={{ fontWeight: "900", fontSize: 11, color: "#000" }}>WHITE</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plateTitle}>Green Saver / Eco Commute</Text>
                    <Text style={styles.plateSub}>వ్యక్తిగత కార్‌పూల్ & ఇంధన వ్యయం పంచుకోవడం (లీగల్)</Text>
                  </View>
                  {plateType === "WHITE" && <Text style={{ color: "#16A34A", fontWeight: "900" }}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.plateBox, plateType === "YELLOW" && styles.plateBoxActiveYellow]}
                  onPress={() => setPlateType("YELLOW")}
                >
                  <View style={styles.yellowPlateBadge}>
                    <Text style={{ fontWeight: "900", fontSize: 11, color: "#000" }}>YELLOW</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plateTitle}>Commercial Express / Pro Pool</Text>
                    <Text style={styles.plateSub}>కమర్షియల్ టాక్సీ అనుమతి గల ఫాస్ట్ రూట్స్</Text>
                  </View>
                  {plateType === "YELLOW" && <Text style={{ color: "#D97706", fontWeight: "900" }}>✓</Text>}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handlePublishPoolRide}>
                <Text style={styles.submitBtnText}>రైడ్ పబ్లిష్ చేయండి ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- SECTION 2: REQUEST A CAB (RENT IDLE CARS) ---------------- */}
        {activeTab === "RENT_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.filterCard}>
              <Text style={styles.cardTitle}>సమీపంలో ఖాళీగా ఉన్న కార్లు (Idle Fleet)</Text>
              <Text style={styles.cardSub}>
                డ్రైవింగ్ లైసెన్స్ ఉండి కారు లేని డ్రైవర్లు 24 గంటలకు అద్దెకు తీసుకుని రోజంతా డ్రైవ్ చేసుకోవచ్చు.
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="ఏరియా సెర్చ్ (e.g. Gachibowli, Kukatpally, LB Nagar)..."
                value={carSearchQuery}
                onChangeText={setCarSearchQuery}
              />
            </View>

            {idleCars
              .filter(
                (c) =>
                  c.location.toLowerCase().includes(carSearchQuery.toLowerCase()) ||
                  c.car_model.toLowerCase().includes(carSearchQuery.toLowerCase())
              )
              .map((car) => (
                <View key={car.id} style={styles.carRentalCard}>
                  <View style={styles.carCardTop}>
                    <View>
                      <Text style={styles.carModelName}>{car.car_model}</Text>
                      <Text style={styles.carPlateNum}>{car.car_number} • Year {car.model_year}</Text>
                      <Text style={styles.carLocText}>📍 {car.location}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.carRentPrice}>₹{car.price_per_24hr}</Text>
                      <Text style={styles.carRentDuration}>/ 24 గంటలు</Text>
                    </View>
                  </View>

                  <View style={styles.carOwnerRow}>
                    <Text style={styles.ownerText}>కార్ ఓనర్: {car.owner_name}</Text>
                    <Text style={styles.fuelBadge}>{car.fuel_type}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookCarBtn}
                    onPress={() => setSelectedCarToRent(car)}
                  >
                    <Text style={styles.bookCarBtnText}>ఈ కారును అద్దెకు తీసుకోండి (₹{car.price_per_24hr}) ➔</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        )}

        {/* ---------------- SECTION 3: HOST YOUR IDLE CAR ---------------- */}
        {activeTab === "HOST_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>మీ ఖాళీ కారును అటాచ్ చేయండి (Car Host)</Text>
              <Text style={styles.cardSub}>
                ఇంట్లో లేదా ఆఫీసులో నిరుపయోగంగా ఉండే కారును అద్దెకు ఇచ్చి నెలకు ₹25,000+ స్థిర ఆదాయం పొందండి.
              </Text>

              <Text style={styles.inputTag}>కార్ ఓనర్ పేరు (OWNER NAME)</Text>
              <TextInput
                style={styles.inputBox}
                value={hostOwnerName}
                onChangeText={setHostOwnerName}
                placeholder="e.g. Ramesh Reddy"
              />

              <Text style={styles.inputTag}>ఈమెయిల్ ఐడీ (EMAIL ID)</Text>
              <TextInput
                style={styles.inputBox}
                value={hostEmail}
                onChangeText={setHostEmail}
                placeholder="ramesh@gmail.com"
              />

              <Text style={styles.inputTag}>కార్ మోడల్ & తయారీ సంవత్సరం</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.inputBox, { flex: 2 }]}
                  value={hostCarModel}
                  onChangeText={setHostCarModel}
                  placeholder="e.g. Maruti WagonR"
                />
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  value={hostCarYear}
                  onChangeText={setHostCarYear}
                  placeholder="2022"
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputTag}>కార్ RC నంబర్ (RC DETAILS)</Text>
              <TextInput
                style={styles.inputBox}
                value={hostRc}
                onChangeText={setHostRc}
                placeholder="TS09AB1234"
              />

              <Text style={styles.inputTag}>కార్ పార్క్ చేయబడిన ఏరియా (HYDERABAD LOCATION)</Text>
              <TextInput
                style={styles.inputBox}
                value={hostLocation}
                onChangeText={setHostLocation}
                placeholder="e.g. Madhapur, Cyber Towers దగ్గర"
              />

              <Text style={styles.inputTag}>24 గంటల అద్దె ధర (₹ PER DAY PRICE)</Text>
              <TextInput
                style={styles.inputBox}
                value={hostDailyPrice}
                onChangeText={setHostDailyPrice}
                placeholder="1000"
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleHostCarSubmit}>
                <Text style={styles.submitBtnText}>కారును లిస్ట్ చేయండి (List Car) ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- SECTION 4: TARGETS & PETROL INCENTIVES ---------------- */}
        {activeTab === "INCENTIVES" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.targetStatusCard}>
              <Text style={styles.targetCardTag}>WEEKLY DRIVER TARGETS</Text>
              <Text style={styles.targetCountBig}>{weeklyRidesCount} రైడ్లు పూర్తయ్యాయి</Text>
              <Text style={styles.targetSub}>ఈ వారం పూర్తి చేసిన ట్రిప్పులు (Up & Down కలిపి లెక్కించబడతాయి)</Text>
            </View>

            {/* Target 1: 5 Rides */}
            <View style={styles.incentiveBox}>
              <View style={styles.incentiveHeader}>
                <View>
                  <Text style={styles.incentiveTitle}>టార్గెట్ 1: 5 రైడ్స్ / వారం</Text>
                  <Text style={styles.incentiveSub}>₹500 ఉచిత పెట్రోల్ బోనస్</Text>
                </View>
                <View style={styles.rewardBadge}>
                  <Text style={styles.rewardBadgeText}>₹500</Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min((weeklyRidesCount / 5) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.progressStatusText}>
                {weeklyRidesCount >= 5 ? "✓ టార్గెట్ పూర్తయింది! ₹500 క్రెడిట్ అయింది." : `${5 - weeklyRidesCount} రైడ్లు మిగిలి ఉన్నాయి`}
              </Text>
            </View>

            {/* Target 2: 10 Rides */}
            <View style={[styles.incentiveBox, { borderColor: "#F59E0B" }]}>
              <View style={styles.incentiveHeader}>
                <View>
                  <Text style={styles.incentiveTitle}>టార్గెట్ 2: 10 రైడ్స్ / వారం</Text>
                  <Text style={styles.incentiveSub}>₹1,500 భారీ పెట్రోల్ బోనస్</Text>
                </View>
                <View style={[styles.rewardBadge, { backgroundColor: "#F59E0B" }]}>
                  <Text style={styles.rewardBadgeText}>₹1,500</Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min((weeklyRidesCount / 10) * 100, 100)}%`,
                      backgroundColor: "#F59E0B",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressStatusText}>
                {weeklyRidesCount >= 10 ? "🎉 అద్భుతం! ₹1,500 పెట్రోల్ బోనస్ గెలుచుకున్నారు!" : `${10 - weeklyRidesCount} రైడ్లు మిగిలి ఉన్నాయి`}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ---------------- 3. RENT CAR BOOKING CONFIRMATION MODAL ---------------- */}
        <Modal visible={selectedCarToRent !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>కారును 24 గంటలకు బుక్ చేసుకోండి</Text>
              <Text style={styles.modalSub}>{selectedCarToRent?.car_model} • {selectedCarToRent?.car_number}</Text>

              <View style={styles.rentSummaryBox}>
                <Text style={styles.summaryLabel}>24 గంటల అద్దె మొత్తం</Text>
                <Text style={styles.summaryValue}>₹{selectedCarToRent?.price_per_24hr}</Text>
              </View>

              <View style={styles.locGuideBox}>
                <Text style={{ fontWeight: "800", color: "#0F172A" }}>కార్ పికప్ లొకేషన్:</Text>
                <Text style={{ color: "#64748B", marginTop: 2 }}>{selectedCarToRent?.location}</Text>
                <Text style={{ fontSize: 11, color: "#16A34A", marginTop: 4 }}>
                  ✓ ఓనర్ నంబర్ & కచ్చితమైన ఇంటి లొకేషన్ బుకింగ్ తర్వాత అందుబాటులో ఉంటాయి.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  alert(`కార్ బుకింగ్ పూర్తయింది! ${selectedCarToRent?.owner_name} గారి కారు లొకేషన్ కు నావిగేట్ చేయండి.`);
                  setSelectedCarToRent(null);
                }}
              >
                <Text style={styles.submitBtnText}>అద్దె చెల్లించి కారు తాళాలు తీసుకోండి ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCarToRent(null)}>
                <Text style={styles.closeBtnText}>రద్దు చేయండి (Cancel)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 4. EMERGENCY 🆘 SOS MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.sosHeading}>🚨 Driver Emergency & Safety Hub</Text>
              <Text style={styles.modalSub}>హైదరాబాద్ రవాణా శాఖ & ఎమర్జెన్సీ రక్షణ కేంద్రం</Text>

              <TouchableOpacity style={styles.sosRowRed} onPress={() => dialEmergency("112")}>
                <Text style={{ fontSize: 24 }}>🚔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosTitle}>పోలీస్ ఎమర్జెన్సీ (112 / 100)</Text>
                  <Text style={styles.sosSub}>తక్షణ పోలీసు సహాయం</Text>
                </View>
                <Text style={styles.sosTag}>CALL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sosRowPink} onPress={() => dialEmergency("1091")}>
                <Text style={{ fontSize: 24 }}>🌸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sosTitle, { color: "#BE185D" }]}>SHE Teams (1091)</Text>
                  <Text style={styles.sosSub}>మహిళా ప్రయాణికుల రక్షణ</Text>
                </View>
                <Text style={styles.sosTag}>CALL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sosRowBlue} onPress={() => dialEmergency("18002008919")}>
                <Text style={{ fontSize: 24 }}>🎧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sosTitle, { color: "#0369A1" }]}>24x7 Driver Support</Text>
                  <Text style={styles.sosSub}>టోల్-ఫ్రీ 1800-200-8919</Text>
                </View>
                <Text style={styles.sosTag}>CALL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSosModal(false)}>
                <Text style={styles.closeBtnText}>మూసివేయండి (Close)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 5. SIDE DRAWER MENU MODAL ---------------- */}
        <Modal visible={showDrawerMenu} transparent animationType="fade">
          <View style={styles.menuOverlay}>
            <View style={styles.menuDrawer}>
              <View style={styles.menuProfileTop}>
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 24 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuDriverName}>{driverName}</Text>
                  <Text style={styles.menuDriverSub}>RC & DL Verified Driver</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDrawerMenu(false)}>
                  <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuLine} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("CREATE_POOL");
                }}
              >
                <Text style={styles.menuItemIcon}>🚗</Text>
                <Text style={styles.menuItemText}>రైడ్ పోస్ట్ డాష్‌బోర్డ్</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("RENT_CAR");
                }}
              >
                <Text style={styles.menuItemIcon}>🔑</Text>
                <Text style={styles.menuItemText}>Request a Cab (కార్లు అద్దెకు)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("HOST_CAR");
                }}
              >
                <Text style={styles.menuItemIcon}>🏠</Text>
                <Text style={styles.menuItemText}>Attach Idle Car (కార్ ఓనర్ల కోసం)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setActiveTab("INCENTIVES");
                }}
              >
                <Text style={styles.menuItemIcon}>⛽</Text>
                <Text style={styles.menuItemText}>వారపు పెట్రోల్ ఇన్సెంటివ్‌లు</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setShowSosModal(true);
                }}
              >
                <Text style={styles.menuItemIcon}>🚨</Text>
                <Text style={styles.menuItemText}>సేఫ్టీ & ఎమర్జెన్సీ హెల్ప్‌లైన్</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { marginTop: "auto" }]}
                onPress={() => {
                  try {
                    localStorage.removeItem("DRIVER_REGISTERED_PROFILE");
                  } catch {}
                  setIsVerified(false);
                  setShowDrawerMenu(false);
                }}
              >
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={[styles.menuItemText, { color: "#EF4444" }]}>లాగౌట్ అవ్వండి (Logout)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDrawerMenu(false)} />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  onboardContainer: { padding: 20, paddingTop: 30 },
  onboardHeader: { marginBottom: 20 },
  badgeOrange: { color: "#D97706", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  onboardTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginTop: 4 },
  onboardSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
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
  menuIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  topTag: { fontSize: 8, fontWeight: "800", color: "#D97706" },
  topName: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  sosButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  switchPassBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  switchPassText: { color: "#1D4ED8", fontSize: 10, fontWeight: "800" },
  tabNavRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
  },
  tabNavItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  tabNavItemActive: { borderColor: "#D97706" },
  tabNavText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  tabNavTextActive: { color: "#D97706", fontWeight: "900" },
  scrollArea: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  cardSub: { fontSize: 11, color: "#64748B", marginTop: 4, marginBottom: 14 },
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
  row: { flexDirection: "row", gap: 10 },
  plateRow: { gap: 10, marginTop: 6 },
  plateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  plateBoxActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateBoxActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  whitePlateBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  yellowPlateBadge: {
    backgroundColor: "#FACC15",
    borderWidth: 1.5,
    borderColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plateTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  plateSub: { fontSize: 10, color: "#64748B", marginTop: 2 },
  submitBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  submitBtnText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  filterCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginTop: 10,
  },
  carRentalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  carCardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  carModelName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  carPlateNum: { fontSize: 11, color: "#64748B", marginTop: 2 },
  carLocText: { fontSize: 11, fontWeight: "700", color: "#0284C7", marginTop: 4 },
  carRentPrice: { fontSize: 18, fontWeight: "900", color: "#16A34A" },
  carRentDuration: { fontSize: 9, color: "#94A3B8" },
  carOwnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  ownerText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  fuelBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookCarBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  bookCarBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  targetStatusCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  targetCardTag: { color: "#F59E0B", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  targetCountBig: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginVertical: 6 },
  targetSub: { color: "#94A3B8", fontSize: 11, textAlign: "center" },
  incentiveBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#10B981",
    marginBottom: 14,
  },
  incentiveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  incentiveTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  incentiveSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  rewardBadge: { backgroundColor: "#10B981", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  rewardBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  progressBarBg: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: "100%", backgroundColor: "#10B981" },
  progressStatusText: { fontSize: 11, fontWeight: "800", color: "#475569" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  sheetModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeading: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  modalSub: { fontSize: 11, color: "#64748B", marginTop: 2, marginBottom: 14 },
  rentSummaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  summaryValue: { fontSize: 16, fontWeight: "900", color: "#16A34A" },
  locGuideBox: { backgroundColor: "#F0FDF4", padding: 12, borderRadius: 12, marginBottom: 14 },
  closeBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  closeBtnText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626" },
  sosRowRed: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 10,
  },
  sosRowPink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F8",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 10,
  },
  sosRowBlue: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 10,
  },
  sosTitle: { fontSize: 13, fontWeight: "900", color: "#B91C1C" },
  sosSub: { fontSize: 10, color: "#64748B" },
  sosTag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "900",
  },
  menuOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", flexDirection: "row" },
  menuDrawer: { width: "75%", maxWidth: 300, backgroundColor: "#FFFFFF", height: "100%", padding: 20, paddingTop: 36 },
  menuProfileTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  menuDriverName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  menuDriverSub: { fontSize: 10, color: "#16A34A", fontWeight: "700" },
  menuLine: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  menuItemIcon: { fontSize: 18 },
  menuItemText: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
});
