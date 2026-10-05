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

// Multi-language dictionary for Driver Portal
const DRIVER_TRANSLATIONS: any = {
  English: {
    dashboardTitle: "Driver Console",
    publishHeading: "Route Setup",
    fromLabel: "STARTING POINT (PICKUP)",
    toLabel: "END POINT (DROP)",
    carModel: "CAR MODEL",
    seats: "SEATS OFFERED",
    seatPrice: "PRICE PER SEAT (₹)",
    plateType: "NUMBER PLATE TYPE",
    publishBtn: "Publish Ride to Live Pool ➔",
    waitingText: "Looking for nearby passengers...",
    onlineStatus: "YOU ARE ONLINE",
    cancelRide: "Cancel Ride / Go Offline",
    menuCreatePool: "Create Ride Pool",
    menuRentCar: "Request a Cab (Rent to Drive)",
    menuHostCar: "Host Idle Car (Earn Money)",
    menuIncentives: "Weekly Targets & Petrol Bonus",
    menuLang: "Language & Settings",
    menuLogout: "Logout Driver Account",
  },
  Telugu: {
    dashboardTitle: "డ్రైవర్ కన్సోల్",
    publishHeading: "రైడ్ పోస్ట్ వివరాలు",
    fromLabel: "స్టార్టింగ్ పాయింట్ (పికప్)",
    toLabel: "ఎండ్ పాయింట్ (డ్రాప్)",
    carModel: "కార్ మోడల్",
    seats: "అందుబాటులో ఉన్న సీట్లు",
    seatPrice: "సీటు అమౌంట్ (₹)",
    plateType: "నెంబర్ ప్లేట్ రకం",
    publishBtn: "రైడ్ పబ్లిష్ చేయండి ➔",
    waitingText: "ప్యాసింజర్ల కోసం వెతుకుతోంది...",
    onlineStatus: "మీరు ఆన్‌లైన్‌లో ఉన్నారు",
    cancelRide: "రైడ్ రద్దు చేయండి / ఆఫ్‌లైన్ వెళ్ళండి",
    menuCreatePool: "రైడ్ పోస్ట్ ఫారమ్",
    menuRentCar: "కార్లు అద్దెకు తీసుకోండి (Request Cab)",
    menuHostCar: "ఖాళీ కారును అటాచ్ చేయండి (Host Car)",
    menuIncentives: "వీక్లీ టార్గెట్స్ & పెట్రోల్ బోనస్",
    menuLang: "భాష & సెట్టింగ్స్",
    menuLogout: "లాగౌట్ అవ్వండి",
  },
  Hindi: {
    dashboardTitle: "ड्राइवर कंसोल",
    publishHeading: "रूट सेटअप",
    fromLabel: "पिकअप स्थान",
    toLabel: "ड्रॉप स्थान",
    carModel: "कार मॉडल",
    seats: "उपलब्ध सीटें",
    seatPrice: "प्रति सीट किराया (₹)",
    plateType: "नंबर प्लेट प्रकार",
    publishBtn: "राइड पब्लिश करें ➔",
    waitingText: "यात्रियों की तलाश जारी है...",
    onlineStatus: "आप ऑनलाइन हैं",
    cancelRide: "राइड रद्द करें / ऑफलाइन जाएं",
    menuCreatePool: "राइड पोस्ट करें",
    menuRentCar: "कार किराए पर लें (Request Cab)",
    menuHostCar: "खाली कार जोड़ें (Host Car)",
    menuIncentives: "साप्ताहिक लक्ष्य और पेट्रोल बोनस",
    menuLang: "भाषा और सेटिंग्स",
    menuLogout: "लॉगआउट करें",
  },
  Tenglish: {
    dashboardTitle: "Driver Console",
    publishHeading: "Ride Post Setup",
    fromLabel: "STARTING POINT (PICKUP)",
    toLabel: "END POINT (DROP)",
    carModel: "CAR MODEL",
    seats: "SEATS OFFERED",
    seatPrice: "SEAT AMOUNT (₹)",
    plateType: "NUMBER PLATE TYPE",
    publishBtn: "Ride Publish Cheyandi ➔",
    waitingText: "Passengers kosam search chesthondi...",
    onlineStatus: "MEERU ONLINE LO UNNARU",
    cancelRide: "Ride Cancel / Go Offline",
    menuCreatePool: "Ride Post Dashboard",
    menuRentCar: "Request a Cab (Rent to Drive)",
    menuHostCar: "Host Idle Car (Attach Car)",
    menuIncentives: "Weekly Targets & Petrol Bonus",
    menuLang: "Language & Settings",
    menuLogout: "Logout Account",
  },
};

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
  },
];

export function DriverHome({ navigation }: any) {
  // Verification states
  const [isVerified, setIsVerified] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");

  // Language state
  const [selectedLang, setSelectedLang] = useState("Telugu");
  const t = DRIVER_TRANSLATIONS[selectedLang] || DRIVER_TRANSLATIONS.Telugu;

  // Active view managed exclusively via Drawer Menu
  const [currentView, setCurrentView] = useState<"CREATE_POOL" | "WAITING_POOL" | "RENT_CAR" | "HOST_CAR" | "INCENTIVES">("CREATE_POOL");

  // Modals
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Pool form states
  const [startPoint, setStartPoint] = useState("LB Nagar, Hyderabad");
  const [endPoint, setEndPoint] = useState("Hitec City Cyber Towers");
  const [carModel, setCarModel] = useState("Swift Dzire");
  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");

  // Live active ride state
  const [activeRideData, setActiveRideData] = useState<any>(null);

  // Targets & fleet
  const [weeklyRidesCount, setWeeklyRidesCount] = useState(4);
  const [idleCars, setIdleCars] = useState(INITIAL_IDLE_CARS);
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [selectedCarToRent, setSelectedCarToRent] = useState<any>(null);

  // Host form states
  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostRc, setHostRc] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
  const [hostCarYear, setHostCarYear] = useState("2022");
  const [hostLocation, setHostLocation] = useState("");
  const [hostDailyPrice, setHostDailyPrice] = useState("1100");

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("DRIVER_REGISTERED_PROFILE");
        if (saved) {
          const parsed = JSON.parse(saved);
          setDriverName(parsed.name || "");
          setDriverEmail(parsed.email || "");
          setRcNumber(parsed.rc || "");
          setDlNumber(parsed.dl || "");
          if (parsed.lang) setSelectedLang(parsed.lang);
          setIsVerified(true);
        }
      }
    } catch {}
  }, []);

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
      lang: selectedLang,
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
      }
    } catch {}

    setIsVerified(true);
  };

  // Publish ride and immediately transfer to Rapido/Uber live waiting radar
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
      status: "ONLINE_SEARCHING",
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
        const list = stored ? JSON.parse(stored) : [];
        window.localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify([newPoolRide, ...list]));
      }
    } catch {}

    setActiveRideData(newPoolRide);
    setWeeklyRidesCount((prev) => prev + 1);
    // Switch to waiting dashboard immediately
    setCurrentView("WAITING_POOL");
  };

  const handleCancelActiveRide = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("SHARED_CARPOOL_RIDES");
        if (stored) {
          const list = JSON.parse(stored);
          const filtered = list.filter((r: any) => r.id !== activeRideData?.id);
          window.localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify(filtered));
        }
      }
    } catch {}

    setActiveRideData(null);
    setCurrentView("CREATE_POOL");
    alert("రైడ్ రద్దు చేయబడింది. మీరు ఆఫ్‌లైన్ అయ్యారు.");
  };

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
    };

    setIdleCars([newCarListing, ...idleCars]);
    alert("మీ ఖాళీ కారు విజయవంతంగా లిస్ట్ చేయబడింది!");
    setCurrentView("RENT_CAR");
  };

  const dialEmergency = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => alert(`Calling ${num}...`));
  };

  // 1. Onboarding Screen
  if (!isVerified) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.onboardContainer}>
          <View style={styles.onboardHeader}>
            <Text style={styles.badgeOrange}>DRIVER PARTNER REGISTRATION</Text>
            <Text style={styles.onboardTitle}>డ్రైవర్ వెరిఫికేషన్ & లాగిన్</Text>
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
              placeholder="e.g. TS09FA1234"
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

  // 2. Main Dashboard (Top Action Bar is removed completely - strictly in Menu)
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Clean Top Header */}
        <View style={styles.topHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity style={styles.menuIconBtn} onPress={() => setShowDrawerMenu(true)}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "#0F172A" }}>☰</Text>
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
                } else if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
            >
              <Text style={styles.switchPassText}>Passenger Mode ➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- VIEW 1: CREATE RIDE POOL ---------------- */}
        {currentView === "CREATE_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.publishHeading}</Text>

              <Text style={styles.inputTag}>{t.fromLabel}</Text>
              <TextInput
                style={styles.inputBox}
                value={startPoint}
                onChangeText={setStartPoint}
              />

              <Text style={styles.inputTag}>{t.toLabel}</Text>
              <TextInput
                style={styles.inputBox}
                value={endPoint}
                onChangeText={setEndPoint}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>{t.carModel}</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={carModel}
                    onChangeText={setCarModel}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>{t.seats}</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    value={seatsCount}
                    onChangeText={setSeatsCount}
                  />
                </View>
              </View>

              <Text style={styles.inputTag}>{t.seatPrice}</Text>
              <TextInput
                style={styles.inputBox}
                keyboardType="numeric"
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
              />

              <Text style={[styles.inputTag, { marginTop: 14 }]}>{t.plateType}</Text>
              <View style={styles.plateRow}>
                <TouchableOpacity
                  style={[styles.plateBox, plateType === "WHITE" && styles.plateBoxActive]}
                  onPress={() => setPlateType("WHITE")}
                >
                  <View style={styles.whitePlateBadge}>
                    <Text style={{ fontWeight: "900", fontSize: 10, color: "#000" }}>WHITE</Text>
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
                    <Text style={{ fontWeight: "900", fontSize: 10, color: "#000" }}>YELLOW</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plateTitle}>Commercial Express / Pro Pool</Text>
                    <Text style={styles.plateSub}>కమర్షియల్ టాక్సీ అనుమతి గల ఫాస్ట్ రూట్స్</Text>
                  </View>
                  {plateType === "YELLOW" && <Text style={{ color: "#D97706", fontWeight: "900" }}>✓</Text>}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handlePublishPoolRide}>
                <Text style={styles.submitBtnText}>{t.publishBtn}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 2: RAPIDO/UBER STYLE LIVE WAITING DASHBOARD ---------------- */}
        {currentView === "WAITING_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.liveRadarCard}>
              <View style={styles.liveStatusRow}>
                <View style={styles.pulsingGreenDot} />
                <Text style={styles.liveStatusTitle}>{t.onlineStatus}</Text>
              </View>

              <View style={styles.radarCircle}>
                <ActivityIndicator size="large" color="#FFC000" />
                <Text style={styles.radarRadarText}>📡</Text>
              </View>

              <Text style={styles.waitingMainHeading}>{t.waitingText}</Text>
              <Text style={styles.waitingSubHeading}>
                రూట్: <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>{activeRideData?.from_location}</Text> ➔ <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>{activeRideData?.to_location}</Text>
              </Text>

              <View style={styles.activeRideDetailsBox}>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>కార్ / మోడల్</Text>
                  <Text style={styles.detailMetricVal}>{activeRideData?.vehicle_name}</Text>
                </View>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>సీట్లు</Text>
                  <Text style={styles.detailMetricVal}>{activeRideData?.available_seats} ఖాళీ</Text>
                </View>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>ధర / సీట్</Text>
                  <Text style={[styles.detailMetricVal, { color: "#10B981" }]}>₹{activeRideData?.price_per_seat}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelLiveBtn} onPress={handleCancelActiveRide}>
                <Text style={styles.cancelLiveBtnText}>✕ {t.cancelRide}</Text>
              </TouchableOpacity>
            </View>

            {/* Simulated Live Match Request Card */}
            <View style={[styles.card, { marginTop: 16, borderColor: "#10B981", borderWidth: 2 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={styles.newRequestBadge}>
                  <Text style={styles.newRequestBadgeText}>⚡ NEW PASSENGER REQUEST</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 16 }}>₹{activeRideData?.price_per_seat}</Text>
              </View>

              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0F172A", marginTop: 8 }}>
                Vattala (Passenger)
              </Text>
              <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                పికప్: {activeRideData?.from_location} (300 మీటర్ల దూరం)
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.acceptRequestBtn}
                  onPress={() => alert("రైడ్ యాక్సెప్ట్ అయింది! ప్యాసింజర్ పికప్ లొకేషన్‌కు చేరుకోండి.")}
                >
                  <Text style={styles.acceptBtnText}>✓ ACCEPT RIDE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectRequestBtn}
                  onPress={() => alert("రిక్వెస్ట్ స్కిప్ చేయబడింది.")}
                >
                  <Text style={styles.rejectBtnText}>DECLINE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 3: REQUEST A CAB (IDLE FLEET) ---------------- */}
        {currentView === "RENT_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>సమీపంలో ఖాళీగా ఉన్న కార్లు (Idle Fleet)</Text>
              <Text style={styles.cardSub}>
                డ్రైవింగ్ లైసెన్స్ ఉండి కారు లేని డ్రైవర్లు 24 గంటలకు అద్దెకు తీసుకుని రోజంతా డ్రైవ్ చేసుకోవచ్చు.
              </Text>
              <TextInput
                style={styles.inputBox}
                placeholder="ఏరియా సెర్చ్ (e.g. Gachibowli, LB Nagar)..."
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
                <View key={car.id} style={[styles.card, { marginTop: 12 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: "#0F172A", marginTop: 12 }]}
                    onPress={() => setSelectedCarToRent(car)}
                  >
                    <Text style={[styles.submitBtnText, { color: "#FFFFFF" }]}>
                      ఈ కారును అద్దెకు తీసుకోండి (₹{car.price_per_24hr}) ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        )}

        {/* ---------------- VIEW 4: HOST IDLE CAR ---------------- */}
        {currentView === "HOST_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>మీ ఖాళీ కారును అటాచ్ చేయండి (Car Host)</Text>
              <Text style={styles.cardSub}>నిరుపయోగంగా ఉండే కారు ద్వారా నెలకు ₹25,000+ స్థిర ఆదాయం పొందండి.</Text>

              <Text style={styles.inputTag}>ఓనర్ పేరు</Text>
              <TextInput style={styles.inputBox} value={hostOwnerName} onChangeText={setHostOwnerName} />

              <Text style={styles.inputTag}>ఈమెయిల్</Text>
              <TextInput style={styles.inputBox} value={hostEmail} onChangeText={setHostEmail} />

              <Text style={styles.inputTag}>కార్ మోడల్</Text>
              <TextInput style={styles.inputBox} value={hostCarModel} onChangeText={setHostCarModel} placeholder="e.g. Swift Dzire" />

              <Text style={styles.inputTag}>కార్ RC నంబర్</Text>
              <TextInput style={styles.inputBox} value={hostRc} onChangeText={setHostRc} placeholder="TS09AB1234" />

              <Text style={styles.inputTag}>పార్కింగ్ లొకేషన్ (హైదరాబాద్)</Text>
              <TextInput style={styles.inputBox} value={hostLocation} onChangeText={setHostLocation} placeholder="e.g. Madhapur" />

              <Text style={styles.inputTag}>24 గంటల అద్దె ధర (₹)</Text>
              <TextInput style={styles.inputBox} value={hostDailyPrice} onChangeText={setHostDailyPrice} keyboardType="numeric" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleHostCarSubmit}>
                <Text style={styles.submitBtnText}>కారును లిస్ట్ చేయండి ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 5: INCENTIVES & TARGETS ---------------- */}
        {currentView === "INCENTIVES" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.targetStatusCard}>
              <Text style={styles.targetCardTag}>WEEKLY DRIVER TARGETS</Text>
              <Text style={styles.targetCountBig}>{weeklyRidesCount} రైడ్లు పూర్తయ్యాయి</Text>
              <Text style={styles.targetSub}>ఈ వారం పూర్తి చేసిన ట్రిప్పులు (Up & Down కలిపి)</Text>
            </View>

            <View style={styles.incentiveBox}>
              <Text style={styles.incentiveTitle}>టార్గెట్ 1: 5 రైడ్స్ / వారం ➔ ₹500 పెట్రోల్ బోనస్</Text>
              <Text style={styles.progressStatusText}>
                {weeklyRidesCount >= 5 ? "✓ టార్గెట్ పూర్తయింది! ₹500 క్రెడిట్ అయింది." : `${5 - weeklyRidesCount} రైడ్లు మిగిలి ఉన్నాయి`}
              </Text>
            </View>

            <View style={[styles.incentiveBox, { borderColor: "#F59E0B" }]}>
              <Text style={styles.incentiveTitle}>టార్గెట్ 2: 10 రైడ్స్ / వారం ➔ ₹1,500 పెట్రోల్ బోనస్</Text>
              <Text style={styles.progressStatusText}>
                {weeklyRidesCount >= 10 ? "🎉 అద్భుతం! ₹1,500 పెట్రోల్ బోనస్ గెలుచుకున్నారు!" : `${10 - weeklyRidesCount} రైడ్లు మిగిలి ఉన్నాయి`}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ---------------- 3. SIDE DRAWER MENU (ALL NAVIGATION & SETTINGS HERE) ---------------- */}
        <Modal visible={showDrawerMenu} transparent animationType="fade">
          <View style={styles.menuOverlay}>
            <View style={styles.menuDrawer}>
              <View style={styles.drawerTopRow}>
                <View>
                  <Text style={styles.menuTitle}>{driverName || "Driver Partner"}</Text>
                  <Text style={styles.menuSub}>RC & DL Verified Driver</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDrawerMenu(false)}>
                  <Text style={styles.drawerCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setCurrentView(activeRideData ? "WAITING_POOL" : "CREATE_POOL");
                }}
              >
                <Text style={styles.menuItemIcon}>🚗</Text>
                <Text style={styles.menuItemText}>{t.menuCreatePool}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setCurrentView("RENT_CAR");
                }}
              >
                <Text style={styles.menuItemIcon}>🔑</Text>
                <Text style={styles.menuItemText}>{t.menuRentCar}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setCurrentView("HOST_CAR");
                }}
              >
                <Text style={styles.menuItemIcon}>🏠</Text>
                <Text style={styles.menuItemText}>{t.menuHostCar}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setCurrentView("INCENTIVES");
                }}
              >
                <Text style={styles.menuItemIcon}>⛽</Text>
                <Text style={styles.menuItemText}>{t.menuIncentives}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setShowLangModal(true);
                }}
              >
                <Text style={styles.menuItemIcon}>🌐</Text>
                <Text style={styles.menuItemText}>{t.menuLang} ({selectedLang})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  setShowSosModal(true);
                }}
              >
                <Text style={styles.menuItemIcon}>🚨</Text>
                <Text style={styles.menuItemText}>Emergency Safety & SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { marginTop: "auto", borderTopWidth: 1, borderColor: "#F1F5F9" }]}
                onPress={() => {
                  try {
                    if (typeof window !== "undefined" && window.localStorage) {
                      window.localStorage.removeItem("DRIVER_REGISTERED_PROFILE");
                    }
                  } catch {}
                  setIsVerified(false);
                  setShowDrawerMenu(false);
                }}
              >
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={[styles.menuItemText, { color: "#EF4444" }]}>{t.menuLogout}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDrawerMenu(false)} />
          </View>
        </Modal>

        {/* ---------------- 4. LANGUAGE SELECTOR MODAL ---------------- */}
        <Modal visible={showLangModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>Select App Language / భాష ఎంచుకోండి</Text>
              <View style={{ gap: 10, marginVertical: 14 }}>
                {[
                  { id: "Telugu", label: "తెలుగు (Telugu)" },
                  { id: "English", label: "English" },
                  { id: "Tenglish", label: "Telugu + English (Tenglish)" },
                  { id: "Hindi", label: "हिन्दी (Hindi)" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.langItemRow, selectedLang === item.id && styles.langItemRowActive]}
                    onPress={() => {
                      setSelectedLang(item.id);
                      setShowLangModal(false);
                    }}
                  >
                    <Text style={[styles.langItemLabel, selectedLang === item.id && styles.langItemLabelActive]}>
                      {item.label}
                    </Text>
                    {selectedLang === item.id && <Text style={{ color: "#D97706", fontWeight: "900" }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowLangModal(false)}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 5. EMERGENCY SOS MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.sosHeading}>🚨 Emergency SOS & Police Dispatch</Text>
              <TouchableOpacity style={styles.sosRow} onPress={() => dialEmergency("112")}>
                <Text style={styles.sosText}>పోలీస్ ఎమర్జెన్సీ (112 / 100)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sosRow, { backgroundColor: "#FDF2F8" }]} onPress={() => dialEmergency("1091")}>
                <Text style={[styles.sosText, { color: "#BE185D" }]}>SHE Teams (1091)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSosModal(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 6. RENT CAR BOOKING MODAL ---------------- */}
        <Modal visible={selectedCarToRent !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>కారును 24 గంటలకు బుక్ చేసుకోండి</Text>
              <Text style={{ color: "#64748B", marginVertical: 6 }}>
                {selectedCarToRent?.car_model} • {selectedCarToRent?.location}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#16A34A" }}>
                ₹{selectedCarToRent?.price_per_24hr} / 24 గంటలు
              </Text>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  alert(`బుకింగ్ పూర్తయింది! ${selectedCarToRent?.owner_name} గారి కారు లొకేషన్ కు చేరుకోండి.`);
                  setSelectedCarToRent(null);
                }}
              >
                <Text style={styles.submitBtnText}>కారు తాళాలు తీసుకోండి ➔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCarToRent(null)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
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
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  onboardContainer: { padding: 20, paddingTop: 30 },
  onboardHeader: { marginBottom: 20 },
  badgeOrange: { color: "#D97706", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  onboardTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginTop: 4 },
  onboardSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
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
  submitBtn: { backgroundColor: "#FFC000", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 18 },
  submitBtnText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
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
  menuIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  topTag: { fontSize: 8, fontWeight: "800", color: "#D97706" },
  topName: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  sosButton: { backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "#FCA5A5" },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  switchPassBtn: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE" },
  switchPassText: { color: "#1D4ED8", fontSize: 10, fontWeight: "800" },
  scrollArea: { padding: 16, paddingBottom: 30 },
  row: { flexDirection: "row", gap: 10 },
  plateRow: { gap: 10, marginTop: 6 },
  plateBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", gap: 12 },
  plateBoxActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateBoxActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  whitePlateBadge: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#000", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  yellowPlateBadge: { backgroundColor: "#FACC15", borderWidth: 1.5, borderColor: "#000", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  plateTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  plateSub: { fontSize: 10, color: "#64748B", marginTop: 2 },
  carModelName: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  carPlateNum: { fontSize: 11, color: "#64748B", marginTop: 2 },
  carLocText: { fontSize: 11, fontWeight: "700", color: "#0284C7", marginTop: 4 },
  carRentPrice: { fontSize: 18, fontWeight: "900", color: "#16A34A" },
  carRentDuration: { fontSize: 9, color: "#94A3B8" },
  targetStatusCard: { backgroundColor: "#0F172A", borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center" },
  targetCardTag: { color: "#F59E0B", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  targetCountBig: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginVertical: 6 },
  targetSub: { color: "#94A3B8", fontSize: 11, textAlign: "center" },
  incentiveBox: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: "#10B981", marginBottom: 14 },
  incentiveTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  progressStatusText: { fontSize: 11, fontWeight: "800", color: "#475569", marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  sheetModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeading: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  sosHeading: { fontSize: 16, fontWeight: "900", color: "#DC2626", marginBottom: 12 },
  sosRow: { backgroundColor: "#FEE2E2", padding: 14, borderRadius: 12, marginBottom: 10 },
  sosText: { color: "#B91C1C", fontWeight: "900", fontSize: 13 },
  menuOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", flexDirection: "row" },
  menuDrawer: { width: "75%", maxWidth: 300, backgroundColor: "#FFFFFF", height: "100%", padding: 20, paddingTop: 36 },
  drawerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  menuTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  menuSub: { fontSize: 11, color: "#16A34A", fontWeight: "700" },
  drawerCloseX: { fontSize: 18, color: "#64748B", fontWeight: "bold" },
  drawerDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  menuItemIcon: { fontSize: 18 },
  menuItemText: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  langItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langItemRowActive: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  langItemLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },
  langItemLabelActive: { color: "#D97706", fontWeight: "900" },
  closeBtn: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  closeBtnText: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  // Rapido/Uber Live Waiting Screen Styles
  liveRadarCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  liveStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  pulsingGreenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  liveStatusTitle: { fontSize: 11, fontWeight: "900", color: "#10B981", letterSpacing: 1 },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 192, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  radarRadarText: { fontSize: 28, position: "absolute" },
  waitingMainHeading: { fontSize: 17, fontWeight: "900", color: "#FFFFFF", textAlign: "center" },
  waitingSubHeading: { fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 6, marginBottom: 18 },
  activeRideDetailsBox: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 12,
    width: "100%",
    marginBottom: 20,
  },
  detailMetricCol: { flex: 1, alignItems: "center" },
  detailMetricLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },
  detailMetricVal: { fontSize: 12, color: "#FFFFFF", fontWeight: "900", marginTop: 2 },
  cancelLiveBtn: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  cancelLiveBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  newRequestBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  newRequestBadgeText: { color: "#16A34A", fontSize: 10, fontWeight: "900" },
  acceptRequestBtn: { flex: 1, backgroundColor: "#16A34A", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  acceptBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  rejectRequestBtn: { backgroundColor: "#F1F5F9", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  rejectBtnText: { color: "#64748B", fontSize: 12, fontWeight: "800" },
});
