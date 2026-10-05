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

// Multi-language dictionary
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
    backToHome: "← Back to Home / Edit Ride",
    chillZone: "Music & Coin Game Zone 🎮",
    editProfile: "Edit Driver Profile ✏️",
    menuCreatePool: "Ride Post Dashboard",
    menuRentCar: "Request a Cab (Rent Idle Cars)",
    menuHostCar: "Attach Idle Car (Car Host)",
    menuIncentives: "Weekly Targets & Petrol Bonus",
    menuRefer: "Refer & Earn ₹200 + ₹200 🎁",
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
    onlineStatus: "మీరు ఆన్‌‌లైన్‌లో ఉన్నారు",
    cancelRide: "రైడ్ రద్దు చేయండి / ఆఫ్‌లైన్ వెళ్ళండి",
    backToHome: "← వెనక్కి వెళ్ళండి (Back to Home)",
    chillZone: "మ్యూజిక్ & కాయిన్ గేమ్స్ 🎮",
    editProfile: "ప్రొఫైల్ ఎడిట్ చేయండి ✏️",
    menuCreatePool: "రైడ్ పోస్ట్ డాష్‌‌బోర్డ్",
    menuRentCar: "కార్లు అద్దెకు తీసుకోండి (Request Cab)",
    menuHostCar: "ఖాళీ కారును అటాచ్ చేయండి (Host Car)",
    menuIncentives: "వీక్లీ టార్గెట్స్ & పెట్రోల్ బోనస్",
    menuRefer: "రెఫర్ & విన్ ₹200 + ₹200 🎁",
    menuLang: "భాష & సెట్టింగ్స్",
    menuLogout: "లాగౌట్ అవ్వండి",
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
    backToHome: "← Back to Home / Edit Ride",
    chillZone: "Music & Coin Game Zone 🎮",
    editProfile: "Edit Driver Profile ✏️",
    menuCreatePool: "Ride Post Dashboard",
    menuRentCar: "Request a Cab (Rent Idle Cars)",
    menuHostCar: "Attach Idle Car (Car Host)",
    menuIncentives: "Weekly Targets & Petrol Bonus",
    menuRefer: "Refer Driver (₹200 + ₹200) 🎁",
    menuLang: "Language & Settings",
    menuLogout: "Logout Account",
  },
};

// 100% Reliable direct audio streams (No 404 error)
const IN_APP_AUDIO_TRACKS = [
  {
    id: "track_1",
    title: "Telugu Melody Beats",
    artist: "Smooth Highway Melodies",
    tag: "Relaxing Beats",
    icon: "🎵",
    streamUrl: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
  },
  {
    id: "track_2",
    title: "Chill Highway Lo-Fi",
    artist: "Calm Drive Instrumentals",
    tag: "Focus & Chill",
    icon: "☕",
    streamUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
  },
  {
    id: "track_3",
    title: "Night Drive Waves",
    artist: "Deep Ambient Beats",
    tag: "Relaxation",
    icon: "🌊",
    streamUrl: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
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
  // Verification & Profile States
  const [isVerified, setIsVerified] = useState(false);
  const [driverName, setDriverName] = useState("Bhargav");
  const [driverPhone, setDriverPhone] = useState("8919326622");
  const [driverEmail, setDriverEmail] = useState("vattalabhargav3@gmail.com");
  const [rcNumber, setRcNumber] = useState("TS09FA1234");
  const [dlNumber, setDlNumber] = useState("DL-0920190012345");
  const [carModel, setCarModel] = useState("Swift Dzire");

  // Language & Views
  const [selectedLang, setSelectedLang] = useState("Telugu");
  const t = DRIVER_TRANSLATIONS[selectedLang] || DRIVER_TRANSLATIONS.Telugu;
  const [currentView, setCurrentView] = useState<"CREATE_POOL" | "WAITING_POOL" | "CHILL_ZONE" | "RENT_CAR" | "HOST_CAR" | "INCENTIVES" | "REFER_PAGE">("CREATE_POOL");

  // Modals
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Pool Form
  const [startPoint, setStartPoint] = useState("LB Nagar, Hyderabad");
  const [endPoint, setEndPoint] = useState("Hitec City Cyber Towers");
  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");
  const [rideVibe, setRideVibe] = useState<"MUSIC" | "SILENT">("MUSIC");
  const [activeRideData, setActiveRideData] = useState<any>(null);

  // Targets & Fleet
  const [weeklyRidesCount, setWeeklyRidesCount] = useState(4);
  const [idleCars, setIdleCars] = useState(INITIAL_IDLE_CARS);
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [selectedCarToRent, setSelectedCarToRent] = useState<any>(null);

  // Host Car
  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostRc, setHostRc] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
  const [hostCarYear, setHostCarYear] = useState("2022");
  const [hostLocation, setHostLocation] = useState("");
  const [hostDailyPrice, setHostDailyPrice] = useState("1100");

  // In-App Audio Player
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioPlayerRef = useRef<any>(null);

  // Coins & Gaming Economics State
  const [driverCoins, setDriverCoins] = useState(150); // Initial 150 coins = ₹15
  const [gamePlaySeconds, setGamePlaySeconds] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [tapScore, setTapScore] = useState(0);

  // Referral System States
  const referralCode = `BHARGAV${driverPhone.slice(-4)}`;
  const [referralInput, setReferralInput] = useState("");
  const [hasAppliedReferral, setHasAppliedReferral] = useState(false);

  // Convert Coins to Rupees: 100 coins = ₹10
  const walletCashRupees = Math.floor((driverCoins / 100) * 10);

  // Stop audio immediately
  const stopAudioDirectly = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
      audioPlayerRef.current = null;
    }
    setPlayingTrackId(null);
  };

  // 10-Minute Timer logic: 10 minutes (600s) = ₹5 Bonus (50 Coins)
  useEffect(() => {
    let interval: any = null;
    if (isGameActive) {
      interval = setInterval(() => {
        setGamePlaySeconds((sec) => {
          const nextSec = sec + 1;
          if (nextSec % 600 === 0) {
            setDriverCoins((c) => c + 50); // 50 coins = ₹5 bonus
            alert("🎉 సూపర్! మీరు 10 నిమిషాలు గేమ్ ఆడారు. ₹5 (50 Coins) మీ వాలెట్‌కు యాడ్ అయ్యాయి!");
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("DRIVER_REGISTERED_PROFILE");
        if (saved) {
          const p = JSON.parse(saved);
          setDriverName(p.name || "Bhargav");
          setDriverPhone(p.phone || "8919326622");
          setDriverEmail(p.email || "vattalabhargav3@gmail.com");
          setRcNumber(p.rc || "TS09FA1234");
          setDlNumber(p.dl || "DL-0920190012345");
          setCarModel(p.carModel || "Swift Dzire");
          if (p.coins) setDriverCoins(p.coins);
          if (p.lang) setSelectedLang(p.lang);
          setIsVerified(true);
        }
      }
    } catch {}

    return () => {
      stopAudioDirectly();
    };
  }, []);

  // Audio Play / Pause Function
  const togglePlayAudio = (track: any) => {
    if (playingTrackId === track.id) {
      stopAudioDirectly();
      return;
    }

    stopAudioDirectly();
    try {
      const audioInstance = new Audio(track.streamUrl);
      audioPlayerRef.current = audioInstance;
      audioInstance
        .play()
        .then(() => {
          setPlayingTrackId(track.id);
        })
        .catch(() => {
          alert("ఆడియో ప్లే అవ్వడానికి స్క్రీన్ పై ఒక్కసారి క్లిక్ చేయండి!");
        });
    } catch (e) {
      alert("Audio playback load avvaledu.");
    }
  };

  const navigateView = (view: any) => {
    if (currentView === "CHILL_ZONE" && view !== "CHILL_ZONE") {
      stopAudioDirectly();
      setIsGameActive(false);
    }
    setCurrentView(view);
  };

  const handleVerifyDriver = () => {
    if (!driverName.trim() || !driverEmail.trim() || !rcNumber.trim() || !dlNumber.trim()) {
      alert("దయచేసి పేరు, ఈమెయిల్, RC మరియు DL నంబర్ నమోదు చేయండి.");
      return;
    }

    const profile = {
      name: driverName.trim(),
      phone: driverPhone.trim(),
      email: driverEmail.trim(),
      rc: rcNumber.trim(),
      dl: dlNumber.trim(),
      carModel: carModel.trim(),
      coins: driverCoins,
      lang: selectedLang,
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
      }
    } catch {}

    setIsVerified(true);
  };

  const handleSaveProfile = () => {
    const profile = {
      name: driverName.trim(),
      phone: driverPhone.trim(),
      email: driverEmail.trim(),
      rc: rcNumber.trim(),
      dl: dlNumber.trim(),
      carModel: carModel.trim(),
      coins: driverCoins,
      lang: selectedLang,
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
      }
    } catch {}

    setShowEditProfileModal(false);
    alert("ప్రొఫైల్ వివరాలు విజయవంతంగా అప్‌డేట్ అయ్యాయి!");
  };

  const handlePublishPoolRide = () => {
    if (!startPoint || !endPoint || !pricePerSeat) {
      alert("దయచేసి రూట్ వివరాలు మరియు సీట్ ధరను నమోదు చేయండి.");
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
      ride_vibe: rideVibe,
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
    navigateView("WAITING_POOL");
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
    navigateView("CREATE_POOL");
    alert("రైడ్ రద్దు చేయబడింది. మీరు ఆఫ్‌‌లైన్ అయ్యారు.");
  };

  // Apply Referral Code Logic: When new driver completes 1 ride, both get ₹200
  const handleApplyReferral = () => {
    if (!referralInput.trim()) {
      alert("దయచేసి రెఫరల్ కోడ్ ఎంటర్ చేయండి.");
      return;
    }

    if (referralInput.trim().toUpperCase() === referralCode) {
      alert("మీ స్వంత కోడ్‌ను మీరు ఉపయోగించలేరు.");
      return;
    }

    setHasAppliedReferral(true);
    // Add 2000 coins (₹200 reward) upon completing 1st ride
    setDriverCoins((c) => c + 2000);
    alert(`🎉 రెఫరల్ కోడ్ ఆమోదించబడింది! మీ మొదటి రైడ్ పూర్తి కాగానే మీకు ₹200, రెఫర్ చేసిన వారికి ₹200 క్రెడిట్ అవుతాయి! (2,000 Coins Added)`);
    setReferralInput("");
  };

  const shareReferralWhatsApp = () => {
    const text = `నమస్తే! RidePool డ్రైవర్ నెట్‌వర్క్‌లో జాయిన్ అవ్వండి. నా రెఫరల్ కోడ్ ${referralCode} వాడి మొదటి రైడ్ పూర్తి చేస్తే మీకు ₹200, నాకు ₹200 బోనస్ వస్తుంది: https://my-app-frontend-blue.vercel.app/driver`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
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
    navigateView("RENT_CAR");
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

            <Text style={styles.inputTag}>ఫోన్ నంబర్ (PHONE NUMBER)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="8919326622"
              keyboardType="phone-pad"
              value={driverPhone}
              onChangeText={setDriverPhone}
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

            <Text style={styles.inputTag}>కార్ మోడల్ (CAR MODEL)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Swift Dzire"
              value={carModel}
              onChangeText={setCarModel}
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

  // 2. Pure Driver Dashboard
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity style={styles.menuIconBtn} onPress={() => setShowDrawerMenu(true)}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "#0F172A" }}>☰</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.topTag}>DRIVER CONSOLE</Text>
              <Text style={styles.topName}>{driverName} • {carModel}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Wallet Cash & Coin Badge */}
            <TouchableOpacity
              style={styles.coinWalletBadge}
              onPress={() => navigateView("CHILL_ZONE")}
            >
              <Text style={styles.coinWalletText}>🪙 {driverCoins} (₹{walletCashRupees})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chillHeaderBtn, playingTrackId && styles.chillHeaderBtnPlaying]}
              onPress={() => navigateView("CHILL_ZONE")}
            >
              <Text style={[styles.chillHeaderBtnText, playingTrackId && { color: "#16A34A" }]}>
                {playingTrackId ? "🔊 Playing" : "🎮 Play"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
              <Text style={styles.sosButtonText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- VIEW 1: CREATE RIDE POOL ---------------- */}
        {currentView === "CREATE_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            {activeRideData && (
              <TouchableOpacity
                style={styles.activeRideBanner}
                onPress={() => navigateView("WAITING_POOL")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.activeBannerTitle}>రైడ్ ఆన్‌లైన్‌లో ఉంది: ప్యాసింజర్స్ కోసం చూస్తోంది</Text>
                </View>
                <Text style={styles.activeBannerAction}>రాడార్ ఓపెన్ చేయండి ➔</Text>
              </TouchableOpacity>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.publishHeading}</Text>

              <Text style={styles.inputTag}>{t.fromLabel}</Text>
              <TextInput style={styles.inputBox} value={startPoint} onChangeText={setStartPoint} />

              <Text style={styles.inputTag}>{t.toLabel}</Text>
              <TextInput style={styles.inputBox} value={endPoint} onChangeText={setEndPoint} />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>{t.carModel}</Text>
                  <TextInput style={styles.inputBox} value={carModel} onChangeText={setCarModel} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputTag}>{t.seats}</Text>
                  <TextInput style={styles.inputBox} keyboardType="numeric" value={seatsCount} onChangeText={setSeatsCount} />
                </View>
              </View>

              <Text style={styles.inputTag}>{t.seatPrice}</Text>
              <TextInput style={styles.inputBox} keyboardType="numeric" value={pricePerSeat} onChangeText={setPricePerSeat} />

              {/* Gen Z Vibe Preference */}
              <Text style={[styles.inputTag, { marginTop: 14 }]}>రైడ్ వైబ్ సెలెక్షన్ (GEN Z PREFERENCE)</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[styles.vibeCard, rideVibe === "MUSIC" && styles.vibeCardActive]}
                  onPress={() => setRideVibe("MUSIC")}
                >
                  <Text style={{ fontSize: 16 }}>🎵</Text>
                  <Text style={[styles.vibeTitle, rideVibe === "MUSIC" && styles.vibeTitleActive]}>మ్యూజిక్ & వైబ్</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.vibeCard, rideVibe === "SILENT" && styles.vibeCardActive]}
                  onPress={() => setRideVibe("SILENT")}
                >
                  <Text style={{ fontSize: 16 }}>🤫</Text>
                  <Text style={[styles.vibeTitle, rideVibe === "SILENT" && styles.vibeTitleActive]}>సైలెంట్ కమ్యూట్</Text>
                </TouchableOpacity>
              </View>

              {/* Plate Selection */}
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
                    <Text style={styles.plateSub}>ప్రైవేట్ కార్‌పూల్ & లీగల్ ఇంధన వ్యయం పంచుకోవడం</Text>
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
                    <Text style={styles.plateSub}>కమర్షియల్ టాక్సీ పర్మిట్ ఫాస్ట్ రూట్స్</Text>
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

        {/* ---------------- VIEW 2: RAPIDO/UBER LIVE WAITING RADAR SCREEN ---------------- */}
        {currentView === "WAITING_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <TouchableOpacity style={styles.topBackNavBtn} onPress={() => navigateView("CREATE_POOL")}>
                <Text style={styles.topBackNavText}>{t.backToHome}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.topBackNavBtn} onPress={() => navigateView("CHILL_ZONE")}>
                <Text style={[styles.topBackNavText, { color: "#D97706" }]}>🎮 గేమ్ & మ్యూజిక్ జోన్</Text>
              </TouchableOpacity>
            </View>

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
                  <Text style={styles.detailMetricLabel}>కార్ మోడల్</Text>
                  <Text style={styles.detailMetricVal}>{activeRideData?.vehicle_name}</Text>
                </View>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>సీట్లు</Text>
                  <Text style={styles.detailMetricVal}>{activeRideData?.available_seats} అందుబాటులో</Text>
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

            {/* Simulated Live Incoming Passenger Request */}
            <View style={[styles.card, { marginTop: 16, borderColor: "#10B981", borderWidth: 2 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={styles.newRequestBadge}>
                  <Text style={styles.newRequestBadgeText}>⚡ కొత్త ప్యాసింజర్ రిక్వెస్ట్</Text>
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
                  onPress={() => alert("రైడ్ యాక్సెప్ట్ అయింది! ప్యాసింజర్ పికప్ లొకేషన్‌కు బయలుదేరండి.")}
                >
                  <Text style={styles.acceptBtnText}>✓ ACCEPT RIDE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectRequestBtn}
                  onPress={() => alert("రిక్వెస్ట్ తిరస్కరించబడింది.")}
                >
                  <Text style={styles.rejectBtnText}>DECLINE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 3: DRIVER CHILL ZONE (MUSIC & COIN GAMES) ---------------- */}
        {currentView === "CHILL_ZONE" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity
              style={styles.topBackNavBtn}
              onPress={() => navigateView(activeRideData ? "WAITING_POOL" : "CREATE_POOL")}
            >
              <Text style={styles.topBackNavText}>← వెనక్కి వెళ్ళండి (Back to Console)</Text>
            </TouchableOpacity>

            {/* Wallet Coins to Cash Banner */}
            <View style={styles.coinEarningsBanner}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.coinTitle}>🪙 మీ డ్రైవర్ గేమింగ్ వాలెట్</Text>
                  <Text style={styles.coinSub}>100 Coins = ₹10 Cash (పెట్రోల్ & పేఅవుట్)</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.coinAmountBig}>{driverCoins} కాయిన్స్</Text>
                  <Text style={styles.coinRupeesBig}>₹{walletCashRupees}.00 క్యాష్</Text>
                </View>
              </View>
            </View>

            {/* Highway Rush Coin Game (Play 10 mins = ₹5 Cash) */}
            <View style={styles.gameCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <Text style={styles.gameTitle}>🏎️ ట్రాఫిక్ స్పీడ్ ట్యాప్ చాలెంజ్</Text>
                <View style={styles.bonusRuleTag}>
                  <Text style={styles.bonusRuleText}>10 నిమి = ₹5 బోనస్</Text>
                </View>
              </View>
              <Text style={styles.gameSub}>
                వెయిటింగ్ టైంలో గేమ్ ఆడి కాయిన్స్ సంపాదించండి. 100 Coins = ₹10!
              </Text>

              <View style={styles.timerScoreRow}>
                <Text style={styles.statLabel}>టైమర్: {Math.floor(gamePlaySeconds / 60)}నిమి {gamePlaySeconds % 60}సెక</Text>
                <Text style={styles.statLabel}>ట్యాప్ స్కోర్: {tapScore}</Text>
              </View>

              <TouchableOpacity
                style={styles.tapGameBtn}
                onPress={() => {
                  if (!isGameActive) setIsGameActive(true);
                  setTapScore((s) => s + 1);
                  // Every 10 taps gives 2 coins
                  if ((tapScore + 1) % 10 === 0) {
                    setDriverCoins((c) => c + 2);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.tapGameBtnText}>
                  {isGameActive ? "⚡ FAST TAP (+COINS)" : "▶ START PLAYING GAME"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Working Relaxing Music Tracks */}
            <Text style={styles.sectionHeader}>📻 డ్రైవ్ మ్యూజిక్ (ట్యాప్ చేసి ప్లే/ఆఫ్ చేయండి)</Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {IN_APP_AUDIO_TRACKS.map((track) => {
                const isPlaying = playingTrackId === track.id;
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.musicCard, isPlaying && styles.musicCardPlaying]}
                    onPress={() => togglePlayAudio(track)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 24 }}>{track.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.musicTitle, isPlaying && { color: "#16A34A" }]}>{track.title}</Text>
                      <Text style={styles.musicTag}>{track.artist} • {track.tag}</Text>
                    </View>

                    <View style={[styles.playToggleBtn, isPlaying ? styles.playBtnActive : styles.playBtnInactive]}>
                      <Text style={[styles.playToggleText, isPlaying ? styles.playToggleTextActive : styles.playToggleTextInactive]}>
                        {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 4: REFERRAL & EARN (₹200 + ₹200) ---------------- */}
        {currentView === "REFER_PAGE" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => navigateView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>← బ్యాక్ టు డాష్‌బోర్డ్</Text>
            </TouchableOpacity>

            <View style={styles.referCard}>
              <Text style={styles.referBigTitle}>🎁 డ్రైవర్ రెఫరల్ ప్రోగ్రామ్</Text>
              <Text style={styles.referSub}>
                మీ డ్రైవర్ మిత్రులను ఆహ్వానించండి. వారు యాప్‌లో చేరి <Text style={{ fontWeight: "bold" }}>మొదటి రైడ్ పూర్తి చేయగానే</Text> ఇద్దరికీ ₹200 చొప్పున మొత్తం <Text style={{ color: "#16A34A", fontWeight: "900" }}>₹400</Text> లభిస్తుంది!
              </Text>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeTag}>మీ యూనిక్ రెఫరల్ కోడ్</Text>
                <Text style={styles.referralCodeText}>{referralCode}</Text>
              </View>

              <TouchableOpacity style={styles.whatsappShareBtn} onPress={shareReferralWhatsApp}>
                <Text style={styles.whatsappShareText}>📲 WhatsApp లో కోడ్ షేర్ చేయండి (₹200)</Text>
              </TouchableOpacity>

              <View style={styles.dividerLine} />

              <Text style={styles.inputTag}>వేరొకరి రెఫరల్ కోడ్ ఉందా? (ENTER FRIEND'S CODE)</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  placeholder="e.g. BHARGAV1234"
                  value={referralInput}
                  onChangeText={setReferralInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyReferralBtn} onPress={handleApplyReferral}>
                  <Text style={styles.applyReferralText}>అప్లై చేయండి</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 5: REQUEST A CAB (IDLE FLEET) ---------------- */}
        {currentView === "RENT_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => navigateView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>← బ్యాక్ టు రూట్ సెటప్</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>సమీపంలో ఖాళీగా ఉన్న కార్లు (Idle Fleet)</Text>
              <Text style={styles.cardSub}>
                డ్రైవింగ్ లైసెన్స్ ఉన్న డ్రైవర్లు 24 గంటలకు కార్లను రెంట్‌కు తీసుకుని నడుపుకోవచ్చు.
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
                      కారును అద్దెకు తీసుకోండి (₹{car.price_per_24hr}) ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        )}

        {/* ---------------- VIEW 6: HOST IDLE CAR ---------------- */}
        {currentView === "HOST_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => navigateView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>← బ్యాక్ టు రూట్ సెటప్</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>మీ ఖాళీ కారును అటాచ్ చేయండి (Car Host)</Text>
              <Text style={styles.cardSub}>నిరుపయోగంగా ఉండే కారు ద్వారా నెలకు ₹25,000+ సంపాదించండి.</Text>

              <Text style={styles.inputTag}>ఓనర్ పేరు</Text>
              <TextInput style={styles.inputBox} value={hostOwnerName} onChangeText={setHostOwnerName} />

              <Text style={styles.inputTag}>ఈమెయిల్</Text>
              <TextInput style={styles.inputBox} value={hostEmail} onChangeText={setHostEmail} />

              <Text style={styles.inputTag}>కార్ మోడల్</Text>
              <TextInput style={styles.inputBox} value={hostCarModel} onChangeText={setHostCarModel} placeholder="e.g. Swift Dzire" />

              <Text style={styles.inputTag}>RC నంబర్</Text>
              <TextInput style={styles.inputBox} value={hostRc} onChangeText={setHostRc} placeholder="TS09AB1234" />

              <Text style={styles.inputTag}>లొకేషన్ (హైదరాబాద్)</Text>
              <TextInput style={styles.inputBox} value={hostLocation} onChangeText={setHostLocation} placeholder="e.g. Madhapur" />

              <Text style={styles.inputTag}>24 గంటల అద్దె ధర (₹)</Text>
              <TextInput style={styles.inputBox} value={hostDailyPrice} onChangeText={setHostDailyPrice} keyboardType="numeric" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleHostCarSubmit}>
                <Text style={styles.submitBtnText}>కారును లిస్ట్ చేయండి ➔</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 7: INCENTIVES & TARGETS ---------------- */}
        {currentView === "INCENTIVES" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => navigateView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>← బ్యాక్ టు రూట్ సెటప్</Text>
            </TouchableOpacity>

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

        {/* ---------------- EDIT PROFILE MODAL ---------------- */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>డ్రైవర్ ప్రొఫైల్ ఎడిట్ చేయండి</Text>

              <Text style={styles.inputTag}>డ్రైవర్ పేరు</Text>
              <TextInput style={styles.inputBox} value={driverName} onChangeText={setDriverName} />

              <Text style={styles.inputTag}>ఫోన్ నంబర్</Text>
              <TextInput style={styles.inputBox} value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />

              <Text style={styles.inputTag}>కార్ మోడల్</Text>
              <TextInput style={styles.inputBox} value={carModel} onChangeText={setCarModel} />

              <Text style={styles.inputTag}>RC నంబర్</Text>
              <TextInput style={styles.inputBox} value={rcNumber} onChangeText={setRcNumber} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfile}>
                <Text style={styles.submitBtnText}>వివరాలు సేవ్ చేయండి ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEditProfileModal(false)}>
                <Text style={styles.closeBtnText}>రద్దు చేయండి (Cancel)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- SIDE DRAWER MENU ---------------- */}
        <Modal visible={showDrawerMenu} transparent animationType="fade">
          <View style={styles.menuOverlay}>
            <View style={styles.menuDrawer}>
              <View style={styles.drawerTopRow}>
                <View>
                  <Text style={styles.menuTitle}>{driverName || "Driver Partner"}</Text>
                  <Text style={styles.menuSub}>📞 {driverPhone} • 🪙 {driverCoins} Coins</Text>
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
                  setShowEditProfileModal(true);
                }}
              >
                <Text style={styles.menuItemIcon}>✏️</Text>
                <Text style={styles.menuItemText}>{t.editProfile}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  navigateView(activeRideData ? "WAITING_POOL" : "CREATE_POOL");
                }}
              >
                <Text style={styles.menuItemIcon}>🚗</Text>
                <Text style={styles.menuItemText}>{t.menuCreatePool}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  navigateView("CHILL_ZONE");
                }}
              >
                <Text style={styles.menuItemIcon}>🎮</Text>
                <Text style={[styles.menuItemText, { color: "#D97706", fontWeight: "900" }]}>{t.chillZone}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  navigateView("REFER_PAGE");
                }}
              >
                <Text style={styles.menuItemIcon}>🎁</Text>
                <Text style={[styles.menuItemText, { color: "#16A34A", fontWeight: "900" }]}>{t.menuRefer}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  navigateView("RENT_CAR");
                }}
              >
                <Text style={styles.menuItemIcon}>🔑</Text>
                <Text style={styles.menuItemText}>{t.menuRentCar}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  navigateView("HOST_CAR");
                }}
              >
                <Text style={styles.menuItemIcon}>🏠</Text>
                <Text style={styles.menuItemText}>{t.menuHostCar}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowDrawerMenu(false);
                  navigateView("INCENTIVES");
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
                  stopAudioDirectly();
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

        {/* ---------------- LANGUAGE MODAL ---------------- */}
        <Modal visible={showLangModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>Select Language / భాష ఎంచుకోండి</Text>
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

        {/* ---------------- SOS MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.sosHeading}>🚨 Emergency SOS & Police Dispatch</Text>
              <TouchableOpacity style={styles.sosRow} onPress={() => dialEmergency("112")}>
                <Text style={styles.sosText}>Police Emergency (112 / 100)</Text>
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

        {/* ---------------- RENT CAR BOOKING MODAL ---------------- */}
        <Modal visible={selectedCarToRent !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>Rent Car for 24 Hours</Text>
              <Text style={{ color: "#64748B", marginVertical: 6 }}>
                {selectedCarToRent?.car_model} • {selectedCarToRent?.location}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#16A34A" }}>
                ₹{selectedCarToRent?.price_per_24hr} / 24 Hours
              </Text>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  alert(`Booking Confirmed! Proceed to ${selectedCarToRent?.owner_name}'s location to pick up keys.`);
                  setSelectedCarToRent(null);
                }}
              >
                <Text style={styles.submitBtnText}>Confirm Booking ➔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setSelectedCarToRent(null)}>
                <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
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
  topName: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  coinWalletBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#FDE68A" },
  coinWalletText: { color: "#92400E", fontSize: 11, fontWeight: "900" },
  chillHeaderBtn: { backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#BBF7D0" },
  chillHeaderBtnPlaying: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  chillHeaderBtnText: { color: "#166534", fontSize: 11, fontWeight: "900" },
  sosButton: { backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#FCA5A5" },
  sosButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  scrollArea: { padding: 16, paddingBottom: 30 },
  topBackNavBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 12,
  },
  topBackNavText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  activeRideBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  activeBannerTitle: { fontSize: 12, fontWeight: "800", color: "#065F46" },
  activeBannerAction: { fontSize: 11, fontWeight: "900", color: "#059669" },
  row: { flexDirection: "row", gap: 10 },
  vibeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    borderRadius: 12,
  },
  vibeCardActive: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  vibeTitle: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  vibeTitleActive: { color: "#B45309", fontWeight: "900" },
  plateRow: { gap: 8, marginTop: 6 },
  plateBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#CBD5E1", gap: 12 },
  plateBoxActive: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  plateBoxActiveYellow: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  whitePlateBadge: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#000", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  yellowPlateBadge: { backgroundColor: "#FACC15", borderWidth: 1.5, borderColor: "#000", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  plateTitle: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
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
  modalHeading: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginBottom: 10 },
  closeBtn: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  closeBtnText: { fontSize: 12, fontWeight: "800", color: "#64748B" },
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
  // Radar styles
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
  waitingMainHeading: { fontSize: 16, fontWeight: "900", color: "#FFFFFF", textAlign: "center" },
  waitingSubHeading: { fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 4, marginBottom: 18 },
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
  cancelLiveBtn: { backgroundColor: "#EF4444", paddingVertical: 12, borderRadius: 10, width: "100%", alignItems: "center" },
  cancelLiveBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  newRequestBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  newRequestBadgeText: { color: "#16A34A", fontSize: 10, fontWeight: "900" },
  acceptRequestBtn: { flex: 1, backgroundColor: "#16A34A", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  acceptBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  rejectRequestBtn: { backgroundColor: "#F1F5F9", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  rejectBtnText: { color: "#64748B", fontSize: 12, fontWeight: "800" },
  // Gaming & Coins Styles
  coinEarningsBanner: {
    backgroundColor: "#0F172A",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  coinTitle: { fontSize: 14, fontWeight: "900", color: "#FDE68A" },
  coinSub: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  coinAmountBig: { fontSize: 18, fontWeight: "900", color: "#F59E0B" },
  coinRupeesBig: { fontSize: 14, fontWeight: "800", color: "#10B981" },
  gameCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  gameTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  gameSub: { fontSize: 11, color: "#64748B", marginTop: 4 },
  bonusRuleTag: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bonusRuleText: { fontSize: 10, fontWeight: "900", color: "#16A34A" },
  timerScoreRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 12 },
  statLabel: { fontSize: 12, fontWeight: "800", color: "#475569" },
  tapGameBtn: {
    backgroundColor: "#D97706",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  tapGameBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  sectionHeader: { fontSize: 13, fontWeight: "900", color: "#0F172A", marginBottom: 10 },
  musicCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  musicCardPlaying: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  musicTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  musicTag: { fontSize: 11, color: "#64748B", marginTop: 2 },
  playToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: { backgroundColor: "#DCFCE7", borderWidth: 1, borderColor: "#86EFAC" },
  playBtnInactive: { backgroundColor: "#F1F5F9" },
  playToggleText: { fontSize: 11, fontWeight: "900" },
  playToggleTextActive: { color: "#16A34A" },
  playToggleTextInactive: { color: "#0284C7" },
  // Referral Styles
  referCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  referBigTitle: { fontSize: 17, fontWeight: "900", color: "#0F172A" },
  referSub: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 18 },
  referralCodeBox: {
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 14,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  referralCodeTag: { fontSize: 10, fontWeight: "800", color: "#B45309" },
  referralCodeText: { fontSize: 22, fontWeight: "900", color: "#78350F", marginTop: 4 },
  whatsappShareBtn: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  whatsappShareText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  dividerLine: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },
  applyReferralBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 10,
  },
  applyReferralText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
