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

// Complete Multi-Language Dictionary
const DRIVER_TRANSLATIONS: any = {
  English: {
    dashboardTitle: "DRIVER CONSOLE",
    publishHeading: "Route Setup",
    fromLabel: "STARTING POINT (PICKUP)",
    toLabel: "END POINT (DROP)",
    useLiveLocation: "📍 Use My Current Live Location",
    carModel: "CAR MODEL",
    seats: "SEATS OFFERED",
    seatPrice: "PRICE PER SEAT (₹)",
    plateType: "NUMBER PLATE TYPE",
    whitePlateTitle: "Green Saver / Eco Commute",
    whitePlateSub: "Private carpool & fuel cost sharing (Legal)",
    yellowPlateTitle: "Commercial Express / Pro Pool",
    yellowPlateSub: "Commercial taxi permit fast routes",
    publishBtn: "Publish Ride to Live Pool ➔",
    waitingText: "Looking for nearby passengers...",
    onlineStatus: "YOU ARE ONLINE",
    cancelRide: "Cancel Ride / Go Offline",
    backToHome: "← Back to Home / Edit Ride",
    editProfile: "Edit Driver Profile ✏️",
    menuCreatePool: "Ride Post Dashboard",
    menuRentCar: "Request a Cab (Rent Idle Cars)",
    menuHostCar: "Attach Idle Car (Car Host)",
    menuIncentives: "Weekly Targets & Petrol Bonus",
    menuRefer: "Refer & Earn ₹200 + ₹200 🎁",
    menuLang: "Language & Settings",
    menuLogout: "Logout Driver Account",
    vibeHeading: "RIDE VIBE PREFERENCE",
    vibeMusic: "Music & Shared Aux",
    vibeQuiet: "Quiet Commute (Silent)",
    activeRideBannerText: "Active Ride Online: Looking for Passengers",
    viewRadarAction: "View Radar ➔",
    newRequestBadge: "⚡ NEW PASSENGER REQUEST",
    acceptBtn: "✓ ACCEPT RIDE",
    declineBtn: "DECLINE",
    referTitle: "🎁 Driver Referral Program",
    referSub: "Invite other drivers. When they complete their 1st ride, both of you get ₹200 each (Total ₹400)!",
    referYourCode: "YOUR UNIQUE REFERRAL CODE",
    shareWhatsApp: "📲 Share Code on WhatsApp (₹200)",
    enterFriendCode: "HAVE A FRIEND'S REFERRAL CODE?",
    applyCodeBtn: "Apply Code",
    rentCarsHeading: "Nearby Idle Cars for Rent",
    rentCarsSub: "Licensed drivers can rent idle cars for 24 hours to drive and earn.",
    rentPer24hr: "/ 24 Hours",
    rentAction: "Rent this Car",
    hostCarHeading: "Attach Your Idle Car (Car Host)",
    hostCarSub: "Earn ₹25,000+ monthly passive income from your idle car.",
    ownerName: "OWNER NAME",
    emailId: "EMAIL ID",
    carModelYear: "CAR MODEL & YEAR",
    rcNumber: "RC NUMBER",
    parkingLocation: "PARKING LOCATION (HYDERABAD)",
    dailyRentPrice: "24 HOURS RENTAL RATE (₹)",
    hostSubmitBtn: "List Idle Car ➔",
    targetsHeading: "WEEKLY DRIVER TARGETS",
    targetsSub: "Completed trips this week (Up & Down pooled together)",
    ridesCompleted: "Rides Completed",
    target1: "Target 1: 5 Rides / Week ➔ ₹500 Petrol Bonus",
    target2: "Target 2: 10 Rides / Week ➔ ₹1,500 Petrol Bonus",
    target1Done: "✓ Target reached! ₹500 credited to wallet.",
    target2Done: "🎉 Target reached! ₹1,500 petrol bonus unlocked!",
    ridesLeft: "more rides left",
    saveProfileBtn: "Save Profile Details ➔",
    cancelBtn: "Cancel",
    closeBtn: "Close",
    sosTitle: "🚨 Emergency SOS & Police Dispatch",
    policeText: "Police Emergency (112 / 100)",
    sheTeamsText: "SHE Teams (1091)",
  },
  Telugu: {
    dashboardTitle: "డ్రైవర్ కన్సోల్",
    publishHeading: "రైడ్ పోస్ట్ వివరాలు",
    fromLabel: "స్టార్టింగ్ పాయింట్ (పికప్)",
    toLabel: "ఎండ్ పాయింట్ (డ్రాప్)",
    useLiveLocation: "📍 నా ప్రస్తుత లైవ్ లొకేషన్ వాడండి",
    carModel: "కార్ మోడల్",
    seats: "అందుబాటులో ఉన్న సీట్లు",
    seatPrice: "సీటు అమౌంట్ (₹)",
    plateType: "నెంబర్ ప్లేట్ రకం",
    whitePlateTitle: "Green Saver / Eco Commute",
    whitePlateSub: "ప్రైవేట్ కార్‌పూల్ & లీగల్ ఇంధన వ్యయం పంచుకోవడం",
    yellowPlateTitle: "Commercial Express / Pro Pool",
    yellowPlateSub: "కమర్షియల్ టాక్సీ పర్మిట్ ఫాస్ట్ రూట్స్",
    publishBtn: "రైడ్ పబ్లిష్ చేయండి ➔",
    waitingText: "ప్యాసింజర్ల కోసం వెతుకుతోంది...",
    onlineStatus: "మీరు ఆన్‌లైన్‌లో ఉన్నారు",
    cancelRide: "రైడ్ రద్దు చేయండి / ఆఫ్‌లైన్ వెళ్ళండి",
    backToHome: "← వెనక్కి వెళ్ళండి (Back to Home)",
    editProfile: "ప్రొఫైల్ ఎడిట్ చేయండి ✏️",
    menuCreatePool: "రైడ్ పోస్ట్ డాష్‌బోర్డ్",
    menuRentCar: "కార్లు అద్దెకు తీసుకోండి (Request Cab)",
    menuHostCar: "ఖాళీ కారును అటాచ్ చేయండి (Host Car)",
    menuIncentives: "వీక్లీ టార్గెట్స్ & పెట్రోల్ బోనస్",
    menuRefer: "రెఫర్ & విన్ ₹200 + ₹200 🎁",
    menuLang: "భాష & సెట్టింగ్స్",
    menuLogout: "లాగౌట్ అవ్వండి",
    vibeHeading: "రైడ్ వైబ్ సెలెక్షన్",
    vibeMusic: "మ్యూజిక్ & వైబ్",
    vibeQuiet: "సైలెంట్ కమ్యూట్",
    activeRideBannerText: "రైడ్ ఆన్‌లైన్‌లో ఉంది: ప్యాసింజర్స్ కోసం చూస్తోంది",
    viewRadarAction: "రాడార్ ఓపెన్ చేయండి ➔",
    newRequestBadge: "⚡ కొత్త ప్యాసింజర్ రిక్వెస్ట్",
    acceptBtn: "✓ రైడ్ యాక్సెప్ట్ చేయండి",
    declineBtn: "డిక్లైన్",
    referTitle: "🎁 డ్రైవర్ రెఫరల్ ప్రోగ్రామ్",
    referSub: "మిత్రులను ఆహ్వానించండి. వారు మొదటి రైడ్ పూర్తి చేయగానే ఇద్దరికీ ₹200 చొప్పున ₹400 లభిస్తుంది!",
    referYourCode: "మీ యూనిక్ రెఫరల్ కోడ్",
    shareWhatsApp: "📲 WhatsApp లో షేర్ చేయండి (₹200)",
    enterFriendCode: "మిత్రుల రెఫరల్ కోడ్ ఎంటర్ చేయండి",
    applyCodeBtn: "అప్లై చేయండి",
    rentCarsHeading: "సమీపంలో ఖాళీగా ఉన్న కార్లు (Idle Fleet)",
    rentCarsSub: "లైసెన్స్ ఉన్న డ్రైవర్లు 24 గంటలకు కార్లను రెంట్‌కు తీసుకుని నడుపుకోవచ్చు.",
    rentPer24hr: "/ 24 గంటలు",
    rentAction: "కారును అద్దెకు తీసుకోండి",
    hostCarHeading: "మీ ఖాళీ కారును అటాచ్ చేయండి (Car Host)",
    hostCarSub: "నిరుపయోగంగా ఉండే కారు ద్వారా నెలకు ₹25,000+ సంపాదించండి.",
    ownerName: "ఓనర్ పేరు",
    emailId: "ఈమెయిల్ ఐడీ",
    carModelYear: "కార్ మోడల్ & ఇయర్",
    rcNumber: "RC నంబర్",
    parkingLocation: "పార్కింగ్ లొకేషన్ (హైదరాబాద్)",
    dailyRentPrice: "24 గంటల అద్దె ధర (₹)",
    hostSubmitBtn: "కారును లిస్ట్ చేయండి ➔",
    targetsHeading: "వీక్లీ డ్రైవర్ టార్గెట్స్",
    targetsSub: "ఈ వారం పూర్తి చేసిన ట్రిప్పులు (Up & Down కలిపి)",
    ridesCompleted: "రైడ్లు పూర్తయ్యాయి",
    target1: "టార్గెట్ 1: 5 రైడ్స్ / వారం ➔ ₹500 పెట్రోల్ బోనస్",
    target2: "టార్గెట్ 2: 10 రైడ్స్ / వారం ➔ ₹1,500 పెట్రోల్ బోనస్",
    target1Done: "✓ టార్గెట్ పూర్తయింది! ₹500 క్రెడిట్ అయింది.",
    target2Done: "🎉 అద్భుతం! ₹1,500 పెట్రోల్ బోనస్ గెలుచుకున్నారు!",
    ridesLeft: "రైడ్లు మిగిలి ఉన్నాయి",
    saveProfileBtn: "వివరాలు సేవ్ చేయండి ➔",
    cancelBtn: "రద్దు చేయండి",
    closeBtn: "మూసివేయండి",
    sosTitle: "🚨 ఎమర్జెన్సీ రక్షణ కేంద్రం",
    policeText: "పోలీస్ ఎమర్జెన్సీ (112 / 100)",
    sheTeamsText: "SHE Teams (1091)",
  },
  Tenglish: {
    dashboardTitle: "DRIVER CONSOLE",
    publishHeading: "Ride Post Setup",
    fromLabel: "STARTING POINT (PICKUP)",
    toLabel: "END POINT (DROP)",
    useLiveLocation: "📍 Naa Current Live Location Use Cheyandi",
    carModel: "CAR MODEL",
    seats: "SEATS OFFERED",
    seatPrice: "SEAT AMOUNT (₹)",
    plateType: "NUMBER PLATE TYPE",
    whitePlateTitle: "Green Saver / Eco Commute",
    whitePlateSub: "Private carpool & fuel sharing (Legal)",
    yellowPlateTitle: "Commercial Express / Pro Pool",
    yellowPlateSub: "Commercial taxi permit fast routes",
    publishBtn: "Ride Publish Cheyandi ➔",
    waitingText: "Passengers kosam search chesthondi...",
    onlineStatus: "MEERU ONLINE LO UNNARU",
    cancelRide: "Ride Cancel / Go Offline",
    backToHome: "← Back to Home / Edit Ride",
    editProfile: "Edit Driver Profile ✏️",
    menuCreatePool: "Ride Post Dashboard",
    menuRentCar: "Request a Cab (Rent Idle Cars)",
    menuHostCar: "Attach Idle Car (Car Host)",
    menuIncentives: "Weekly Targets & Petrol Bonus",
    menuRefer: "Refer Driver (₹200 + ₹200) 🎁",
    menuLang: "Language & Settings",
    menuLogout: "Logout Account",
    vibeHeading: "RIDE VIBE PREFERENCE",
    vibeMusic: "Music & Shared Aux",
    vibeQuiet: "Quiet Commute (Silent)",
    activeRideBannerText: "Active Ride Online: Passengers kosam waiting",
    viewRadarAction: "Radar Choodandi ➔",
    newRequestBadge: "⚡ NEW PASSENGER REQUEST",
    acceptBtn: "✓ ACCEPT RIDE",
    declineBtn: "DECLINE",
    referTitle: "🎁 Driver Referral Program",
    referSub: "Friends ni invite cheyandi. 1st ride avvagane iddariki ₹200 each (Total ₹400) vasthundi!",
    referYourCode: "MEE UNIQUE REFERRAL CODE",
    shareWhatsApp: "📲 WhatsApp lo Share Cheyandi (₹200)",
    enterFriendCode: "FRIEND REFERRAL CODE ENTER CHEYANDI",
    applyCodeBtn: "Apply Code",
    rentCarsHeading: "Nearby Idle Cars for Rent",
    rentCarsSub: "License unna drivers 24 hours rent ki car theesukoni drive chesukovachu.",
    rentPer24hr: "/ 24 Hours",
    rentAction: "Rent this Car",
    hostCarHeading: "Attach Your Idle Car (Car Host)",
    hostCarSub: "Idle car nundi nelaki ₹25,000+ passive income earn cheyandi.",
    ownerName: "OWNER NAME",
    emailId: "EMAIL ID",
    carModelYear: "CAR MODEL & YEAR",
    rcNumber: "RC NUMBER",
    parkingLocation: "PARKING LOCATION (HYDERABAD)",
    dailyRentPrice: "24 HOURS RENTAL RATE (₹)",
    hostSubmitBtn: "List Idle Car ➔",
    targetsHeading: "WEEKLY DRIVER TARGETS",
    targetsSub: "Ee week trips count (Up & Down kalipi)",
    ridesCompleted: "Rides Completed",
    target1: "Target 1: 5 Rides / Week ➔ ₹500 Petrol Bonus",
    target2: "Target 2: 10 Rides / Week ➔ ₹1,500 Petrol Bonus",
    target1Done: "✓ Target complete! ₹500 wallet lo add aindi.",
    target2Done: "🎉 Super! ₹1,500 petrol bonus unlock aindi!",
    ridesLeft: "rides migili unnayi",
    saveProfileBtn: "Save Profile ➔",
    cancelBtn: "Cancel",
    closeBtn: "Close",
    sosTitle: "🚨 Emergency Safety & SOS",
    policeText: "Police Emergency (112 / 100)",
    sheTeamsText: "SHE Teams (1091)",
  },
  Hindi: {
    dashboardTitle: "ड्राइवर कंसोल",
    publishHeading: "रूट सेटअप",
    fromLabel: "पिकअप स्थान",
    toLabel: "ड्रॉप स्थान",
    useLiveLocation: "📍 मेरी वर्तमान लाइव लोकेशन उपयोग करें",
    carModel: "कार मॉडल",
    seats: "उपलब्ध सीटें",
    seatPrice: "प्रति सीट किराया (₹)",
    plateType: "नंबर प्लेट प्रकार",
    whitePlateTitle: "Green Saver / Eco Commute",
    whitePlateSub: "प्राइवेट कारपूल व लीगल ईंधन शेयरिंग",
    yellowPlateTitle: "Commercial Express / Pro Pool",
    yellowPlateSub: "कमर्शियल टैक्सी परमिट फास्ट रूट्स",
    publishBtn: "राइड पब्लिश करें ➔",
    waitingText: "यात्रियों की तलाश जारी है...",
    onlineStatus: "आप ऑनलाइन हैं",
    cancelRide: "राइड रद्द करें / ऑफलाइन जाएं",
    backToHome: "← वापस जाएं (Back to Home)",
    editProfile: "प्रोफ़ाइल संपादित करें ✏️",
    menuCreatePool: "राइड पोस्ट डैशबोर्ड",
    menuRentCar: "कार किराए पर लें (Request Cab)",
    menuHostCar: "खाली कार जोड़ें (Host Car)",
    menuIncentives: "साप्ताहिक लक्ष्य और पेट्रोल बोनस",
    menuRefer: "रेफर करें और ₹200 + ₹200 पाएं 🎁",
    menuLang: "भाषा और सेटिंग्स",
    menuLogout: "लॉगआउट करें",
    vibeHeading: "राइड वाइब प्राथमिकता",
    vibeMusic: "म्यूजिक और शेयर ऑक्स",
    vibeQuiet: "शांत कम्यूट (साइलेंट)",
    activeRideBannerText: "राइड ऑनलाइन है: यात्री खोजे जा रहे हैं",
    viewRadarAction: "रडार खोलें ➔",
    newRequestBadge: "⚡ नया यात्री अनुरोध",
    acceptBtn: "✓ राइड स्वीकार करें",
    declineBtn: "अस्वीकार करें",
    referTitle: "🎁 ड्राइवर रेफरल प्रोग्राम",
    referSub: "दोस्तों को आमंत्रित करें। पहली राइड पूरी होने पर दोनों को ₹200-₹200 मिलेंगे!",
    referYourCode: "आपका रेफरल कोड",
    shareWhatsApp: "📲 WhatsApp पर शेयर करें (₹200)",
    enterFriendCode: "दोस्त का रेफरल कोड दर्ज करें",
    applyCodeBtn: "लागू करें",
    rentCarsHeading: "किराए के लिए उपलब्ध खाली कारें",
    rentCarsSub: "ड्राइवर 24 घंटे के लिए कार किराए पर लेकर चला सकते हैं।",
    rentPer24hr: "/ 24 घंटे",
    rentAction: "कार किराए पर लें",
    hostCarHeading: "अपनी खाली कार जोड़ें (Car Host)",
    hostCarSub: "अपनी खाली कार से महीने में ₹25,000+ कमाएं।",
    ownerName: "मालिक का नाम",
    emailId: "ईमेल आईडी",
    carModelYear: "कार मॉडल और वर्ष",
    rcNumber: "आरसी नंबर",
    parkingLocation: "पार्किंग स्थान (हैदराबाद)",
    dailyRentPrice: "24 घंटे का किराया (₹)",
    hostSubmitBtn: "कार लिस्ट करें ➔",
    targetsHeading: "साप्ताहिक ड्राइवर लक्ष्य",
    targetsSub: "इस सप्ताह की कुल ट्रिप्स (अप व डाउन मिलाकर)",
    ridesCompleted: "राइड्स पूरी हुईं",
    target1: "लक्ष्य 1: 5 राइड्स / सप्ताह ➔ ₹500 पेट्रोल बोनस",
    target2: "लक्ष्य 2: 10 राइड्स / सप्ताह ➔ ₹1,500 पेट्रोल बोनस",
    target1Done: "✓ लक्ष्य पूरा हुआ! ₹500 जोड़े गए।",
    target2Done: "🎉 बधाई! ₹1,500 पेट्रोल बोनस मिला!",
    ridesLeft: "राइड्स बाकी हैं",
    saveProfileBtn: "विवरण सहेजें ➔",
    cancelBtn: "रद्द करें",
    closeBtn: "बंद करें",
    sosTitle: "🚨 आपातकालीन सुरक्षा केंद्र",
    policeText: "पुलिस आपातकाल (112 / 100)",
    sheTeamsText: "शी टीम्स (1091)",
  },
};

const QUICK_HYDERABAD_HUBS = [
  "Hitec City Cyber Towers",
  "Gachibowli DLF",
  "Madhapur Metro Station",
  "LB Nagar Ring Road",
  "Kukatpally KPHB",
  "Secunderabad Station",
  "Financial District",
  "Banjara Hills Road No 12",
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
  const [isVerified, setIsVerified] = useState(false);
  const [driverName, setDriverName] = useState("Bhargav");
  const [driverPhone, setDriverPhone] = useState("8919326622");
  const [driverEmail, setDriverEmail] = useState("vattalabhargav3@gmail.com");
  const [rcNumber, setRcNumber] = useState("TS09FA1234");
  const [dlNumber, setDlNumber] = useState("DL-0920190012345");
  const [carModel, setCarModel] = useState("Swift Dzire");

  const [selectedLang, setSelectedLang] = useState("English");
  const t = DRIVER_TRANSLATIONS[selectedLang] || DRIVER_TRANSLATIONS.English;
  const [currentView, setCurrentView] = useState<"CREATE_POOL" | "WAITING_POOL" | "RENT_CAR" | "HOST_CAR" | "INCENTIVES" | "REFER_PAGE">("CREATE_POOL");

  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Route & Live GPS
  const [startPoint, setStartPoint] = useState("LB Nagar, Hyderabad");
  const [endPoint, setEndPoint] = useState("Hitec City Cyber Towers");
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  const [seatsCount, setSeatsCount] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("110");
  const [plateType, setPlateType] = useState<"WHITE" | "YELLOW">("WHITE");
  const [rideVibe, setRideVibe] = useState<"MUSIC" | "SILENT">("MUSIC");
  const [activeRideData, setActiveRideData] = useState<any>(null);

  const [weeklyRidesCount, setWeeklyRidesCount] = useState(4);
  const [idleCars, setIdleCars] = useState(INITIAL_IDLE_CARS);
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [selectedCarToRent, setSelectedCarToRent] = useState<any>(null);

  const [hostOwnerName, setHostOwnerName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [hostRc, setHostRc] = useState("");
  const [hostCarModel, setHostCarModel] = useState("");
  const [hostCarYear, setHostCarYear] = useState("2022");
  const [hostLocation, setHostLocation] = useState("");
  const [hostDailyPrice, setHostDailyPrice] = useState("1100");

  const referralCode = `BHARGAV${driverPhone.slice(-4)}`;
  const [referralInput, setReferralInput] = useState("");

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
          if (p.lang) setSelectedLang(p.lang);
          setIsVerified(true);
        }
      }
    } catch {}
  }, []);

  // Fetch Live GPS Current Location for Pickup
  const fetchCurrentLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setStartPoint(`Live GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Current Location)`);
          setIsFetchingGps(false);
          alert("📍 Live GPS Location fetched successfully!");
        },
        (error) => {
          setIsFetchingGps(false);
          alert("GPS permission denied or unavailable. Please type your location manually.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported on this device.");
    }
  };

  const handleVerifyDriver = () => {
    if (!driverName.trim() || !driverEmail.trim() || !rcNumber.trim() || !dlNumber.trim()) {
      alert("Please enter Name, Email, RC and DL details.");
      return;
    }

    const profile = {
      name: driverName.trim(),
      phone: driverPhone.trim(),
      email: driverEmail.trim(),
      rc: rcNumber.trim(),
      dl: dlNumber.trim(),
      carModel: carModel.trim(),
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
      lang: selectedLang,
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("DRIVER_REGISTERED_PROFILE", JSON.stringify(profile));
      }
    } catch {}

    setShowEditProfileModal(false);
    alert("Profile details updated successfully!");
  };

  const handlePublishPoolRide = () => {
    if (!startPoint || !endPoint || !pricePerSeat) {
      alert("Please enter Pickup, Drop, and Seat Price.");
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
  };

  const handleApplyReferral = () => {
    if (!referralInput.trim()) {
      alert("Please enter a referral code.");
      return;
    }

    if (referralInput.trim().toUpperCase() === referralCode) {
      alert("You cannot use your own referral code.");
      return;
    }

    alert(`🎉 Referral applied! Once your 1st ride is complete, ₹200 will be credited to both of your wallets!`);
    setReferralInput("");
  };

  const shareReferralWhatsApp = () => {
    const text = `Join RidePool Driver Network! Use my referral code ${referralCode} and when you complete your 1st ride, both of us get ₹200: https://my-app-frontend-blue.vercel.app/driver`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleHostCarSubmit = () => {
    if (!hostOwnerName || !hostCarModel || !hostLocation || !hostDailyPrice) {
      alert("Please enter car details, location, and daily rent price.");
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
    alert("Your idle car has been listed successfully!");
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
            <Text style={styles.onboardTitle}>Driver Verification & Login</Text>
            <Text style={styles.onboardSub}>
              Enter your details to publish rides or rent idle vehicles.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputTag}>DRIVER NAME</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. Bhargav Vattala"
              value={driverName}
              onChangeText={setDriverName}
            />

            <Text style={styles.inputTag}>PHONE NUMBER</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="8919326622"
              keyboardType="phone-pad"
              value={driverPhone}
              onChangeText={setDriverPhone}
            />

            <Text style={styles.inputTag}>EMAIL ID</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="vattalabhargav3@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={driverEmail}
              onChangeText={setDriverEmail}
            />

            <Text style={styles.inputTag}>CAR MODEL</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Swift Dzire"
              value={carModel}
              onChangeText={setCarModel}
            />

            <Text style={styles.inputTag}>VEHICLE RC NUMBER</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. TS09FA1234"
              value={rcNumber}
              onChangeText={setRcNumber}
            />

            <Text style={styles.inputTag}>DRIVING LICENCE NUMBER</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. DL-0920190012345"
              value={dlNumber}
              onChangeText={setDlNumber}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyDriver}>
              <Text style={styles.submitBtnText}>Verify & Login ➔</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Main Driver Dashboard
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
              <Text style={styles.topTag}>{t.dashboardTitle}</Text>
              <Text style={styles.topName}>{driverName} • {carModel}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={styles.langSelectorBadge}
              onPress={() => setShowLangModal(true)}
            >
              <Text style={styles.langSelectorText}>🌐 {selectedLang}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
              <Text style={styles.sosButtonText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- VIEW 1: CREATE RIDE POOL WITH LIVE GPS ---------------- */}
        {currentView === "CREATE_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            {activeRideData && (
              <TouchableOpacity
                style={styles.activeRideBanner}
                onPress={() => setCurrentView("WAITING_POOL")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.activeBannerTitle}>{t.activeRideBannerText}</Text>
                </View>
                <Text style={styles.activeBannerAction}>{t.viewRadarAction}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.publishHeading}</Text>

              {/* Pickup Input + Live GPS Trigger Button */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Text style={styles.inputTag}>{t.fromLabel}</Text>
                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={fetchCurrentLocation}
                  disabled={isFetchingGps}
                >
                  {isFetchingGps ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                  ) : (
                    <Text style={styles.gpsButtonText}>{t.useLiveLocation}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.inputBox}
                value={startPoint}
                onChangeText={setStartPoint}
                placeholder="Enter pickup point"
              />

              {/* Destination Drop Input */}
              <Text style={styles.inputTag}>{t.toLabel}</Text>
              <TextInput
                style={styles.inputBox}
                value={endPoint}
                onChangeText={setEndPoint}
                placeholder="Enter drop destination"
              />

              {/* Quick Destination Selectors */}
              <View style={styles.quickHubWrap}>
                {QUICK_HYDERABAD_HUBS.map((hub) => (
                  <TouchableOpacity
                    key={hub}
                    style={styles.quickHubChip}
                    onPress={() => setEndPoint(hub)}
                  >
                    <Text style={styles.quickHubText}>{hub}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Car & Seats */}
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

              {/* Seat Price */}
              <Text style={styles.inputTag}>{t.seatPrice}</Text>
              <TextInput style={styles.inputBox} keyboardType="numeric" value={pricePerSeat} onChangeText={setPricePerSeat} />

              {/* Vibe Selection */}
              <Text style={[styles.inputTag, { marginTop: 14 }]}>{t.vibeHeading}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[styles.vibeCard, rideVibe === "MUSIC" && styles.vibeCardActive]}
                  onPress={() => setRideVibe("MUSIC")}
                >
                  <Text style={{ fontSize: 16 }}>🎵</Text>
                  <Text style={[styles.vibeTitle, rideVibe === "MUSIC" && styles.vibeTitleActive]}>{t.vibeMusic}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.vibeCard, rideVibe === "SILENT" && styles.vibeCardActive]}
                  onPress={() => setRideVibe("SILENT")}
                >
                  <Text style={{ fontSize: 16 }}>🤫</Text>
                  <Text style={[styles.vibeTitle, rideVibe === "SILENT" && styles.vibeTitleActive]}>{t.vibeQuiet}</Text>
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
                    <Text style={styles.plateTitle}>{t.whitePlateTitle}</Text>
                    <Text style={styles.plateSub}>{t.whitePlateSub}</Text>
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
                    <Text style={styles.plateTitle}>{t.yellowPlateTitle}</Text>
                    <Text style={styles.plateSub}>{t.yellowPlateSub}</Text>
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

        {/* ---------------- VIEW 2: WAITING RADAR SCREEN ---------------- */}
        {currentView === "WAITING_POOL" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <TouchableOpacity style={styles.topBackNavBtn} onPress={() => setCurrentView("CREATE_POOL")}>
                <Text style={styles.topBackNavText}>{t.backToHome}</Text>
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
                Route: <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>{activeRideData?.from_location}</Text> ➔ <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>{activeRideData?.to_location}</Text>
              </Text>

              <View style={styles.activeRideDetailsBox}>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>{t.carModel}</Text>
                  <Text style={styles.detailMetricVal}>{activeRideData?.vehicle_name}</Text>
                </View>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>{t.seats}</Text>
                  <Text style={styles.detailMetricVal}>{activeRideData?.available_seats}</Text>
                </View>
                <View style={styles.detailMetricCol}>
                  <Text style={styles.detailMetricLabel}>{t.seatPrice}</Text>
                  <Text style={[styles.detailMetricVal, { color: "#10B981" }]}>₹{activeRideData?.price_per_seat}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelLiveBtn} onPress={handleCancelActiveRide}>
                <Text style={styles.cancelLiveBtnText}>✕ {t.cancelRide}</Text>
              </TouchableOpacity>
            </View>

            {/* Passenger Request Match */}
            <View style={[styles.card, { marginTop: 16, borderColor: "#10B981", borderWidth: 2 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={styles.newRequestBadge}>
                  <Text style={styles.newRequestBadgeText}>{t.newRequestBadge}</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#16A34A", fontSize: 16 }}>₹{activeRideData?.price_per_seat}</Text>
              </View>

              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0F172A", marginTop: 8 }}>
                Vattala (Passenger)
              </Text>
              <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                Pickup: {activeRideData?.from_location} (300m away)
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.acceptRequestBtn}
                  onPress={() => alert("Ride Accepted! Navigate to passenger pickup point.")}
                >
                  <Text style={styles.acceptBtnText}>{t.acceptBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectRequestBtn}
                  onPress={() => alert("Request Declined.")}
                >
                  <Text style={styles.rejectBtnText}>{t.declineBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 3: REFERRAL PAGE ---------------- */}
        {currentView === "REFER_PAGE" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => setCurrentView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>{t.backToHome}</Text>
            </TouchableOpacity>

            <View style={styles.referCard}>
              <Text style={styles.referBigTitle}>{t.referTitle}</Text>
              <Text style={styles.referSub}>{t.referSub}</Text>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeTag}>{t.referYourCode}</Text>
                <Text style={styles.referralCodeText}>{referralCode}</Text>
              </View>

              <TouchableOpacity style={styles.whatsappShareBtn} onPress={shareReferralWhatsApp}>
                <Text style={styles.whatsappShareText}>{t.shareWhatsApp}</Text>
              </TouchableOpacity>

              <View style={styles.dividerLine} />

              <Text style={styles.inputTag}>{t.enterFriendCode}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[styles.inputBox, { flex: 1 }]}
                  placeholder="e.g. BHARGAV1234"
                  value={referralInput}
                  onChangeText={setReferralInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyReferralBtn} onPress={handleApplyReferral}>
                  <Text style={styles.applyReferralText}>{t.applyCodeBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 4: RENT CAR ---------------- */}
        {currentView === "RENT_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => setCurrentView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>{t.backToHome}</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.rentCarsHeading}</Text>
              <Text style={styles.cardSub}>{t.rentCarsSub}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Search area (e.g. Gachibowli, LB Nagar)..."
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
                      <Text style={styles.carRentDuration}>{t.rentPer24hr}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: "#0F172A", marginTop: 12 }]}
                    onPress={() => setSelectedCarToRent(car)}
                  >
                    <Text style={[styles.submitBtnText, { color: "#FFFFFF" }]}>
                      {t.rentAction} (₹{car.price_per_24hr}) ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
        )}

        {/* ---------------- VIEW 5: HOST CAR ---------------- */}
        {currentView === "HOST_CAR" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => setCurrentView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>{t.backToHome}</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.hostCarHeading}</Text>
              <Text style={styles.cardSub}>{t.hostCarSub}</Text>

              <Text style={styles.inputTag}>{t.ownerName}</Text>
              <TextInput style={styles.inputBox} value={hostOwnerName} onChangeText={setHostOwnerName} />

              <Text style={styles.inputTag}>{t.emailId}</Text>
              <TextInput style={styles.inputBox} value={hostEmail} onChangeText={setHostEmail} />

              <Text style={styles.inputTag}>{t.carModelYear}</Text>
              <TextInput style={styles.inputBox} value={hostCarModel} onChangeText={setHostCarModel} placeholder="e.g. Swift Dzire" />

              <Text style={styles.inputTag}>{t.rcNumber}</Text>
              <TextInput style={styles.inputBox} value={hostRc} onChangeText={setHostRc} placeholder="TS09AB1234" />

              <Text style={styles.inputTag}>{t.parkingLocation}</Text>
              <TextInput style={styles.inputBox} value={hostLocation} onChangeText={setHostLocation} placeholder="e.g. Madhapur" />

              <Text style={styles.inputTag}>{t.dailyRentPrice}</Text>
              <TextInput style={styles.inputBox} value={hostDailyPrice} onChangeText={setHostDailyPrice} keyboardType="numeric" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleHostCarSubmit}>
                <Text style={styles.submitBtnText}>{t.hostSubmitBtn}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- VIEW 6: INCENTIVES ---------------- */}
        {currentView === "INCENTIVES" && (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <TouchableOpacity style={styles.topBackNavBtn} onPress={() => setCurrentView("CREATE_POOL")}>
              <Text style={styles.topBackNavText}>{t.backToHome}</Text>
            </TouchableOpacity>

            <View style={styles.targetStatusCard}>
              <Text style={styles.targetCardTag}>{t.targetsHeading}</Text>
              <Text style={styles.targetCountBig}>{weeklyRidesCount} {t.ridesCompleted}</Text>
              <Text style={styles.targetSub}>{t.targetsSub}</Text>
            </View>

            <View style={styles.incentiveBox}>
              <Text style={styles.incentiveTitle}>{t.target1}</Text>
              <Text style={styles.progressStatusText}>
                {weeklyRidesCount >= 5 ? t.target1Done : `${5 - weeklyRidesCount} ${t.ridesLeft}`}
              </Text>
            </View>

            <View style={[styles.incentiveBox, { borderColor: "#F59E0B" }]}>
              <Text style={styles.incentiveTitle}>{t.target2}</Text>
              <Text style={styles.progressStatusText}>
                {weeklyRidesCount >= 10 ? t.target2Done : `${10 - weeklyRidesCount} ${t.ridesLeft}`}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ---------------- EDIT PROFILE MODAL ---------------- */}
        <Modal visible={showEditProfileModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>{t.editProfile}</Text>

              <Text style={styles.inputTag}>NAME</Text>
              <TextInput style={styles.inputBox} value={driverName} onChangeText={setDriverName} />

              <Text style={styles.inputTag}>PHONE</Text>
              <TextInput style={styles.inputBox} value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />

              <Text style={styles.inputTag}>CAR MODEL</Text>
              <TextInput style={styles.inputBox} value={carModel} onChangeText={setCarModel} />

              <Text style={styles.inputTag}>RC NUMBER</Text>
              <TextInput style={styles.inputBox} value={rcNumber} onChangeText={setRcNumber} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfile}>
                <Text style={styles.submitBtnText}>{t.saveProfileBtn}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEditProfileModal(false)}>
                <Text style={styles.closeBtnText}>{t.cancelBtn}</Text>
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
                  <Text style={styles.menuSub}>📞 {driverPhone} • {carModel}</Text>
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
                  setCurrentView("REFER_PAGE");
                }}
              >
                <Text style={styles.menuItemIcon}>🎁</Text>
                <Text style={[styles.menuItemText, { color: "#16A34A", fontWeight: "900" }]}>{t.menuRefer}</Text>
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
                <Text style={styles.menuItemText}>{t.sosTitle}</Text>
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

        {/* ---------------- LANGUAGE MODAL ---------------- */}
        <Modal visible={showLangModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>Select Language / భాష ఎంచుకోండి</Text>
              <View style={{ gap: 10, marginVertical: 14 }}>
                {[
                  { id: "English", label: "English" },
                  { id: "Telugu", label: "తెలుగు (Telugu)" },
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
                <Text style={styles.closeBtnText}>{t.closeBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- SOS MODAL ---------------- */}
        <Modal visible={showSosModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.sosHeading}>{t.sosTitle}</Text>
              <TouchableOpacity style={styles.sosRow} onPress={() => dialEmergency("112")}>
                <Text style={styles.sosText}>{t.policeText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sosRow, { backgroundColor: "#FDF2F8" }]} onPress={() => dialEmergency("1091")}>
                <Text style={[styles.sosText, { color: "#BE185D" }]}>{t.sheTeamsText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSosModal(false)}>
                <Text style={styles.closeBtnText}>{t.closeBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- RENT CAR MODAL ---------------- */}
        <Modal visible={selectedCarToRent !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetModal}>
              <Text style={styles.modalHeading}>Rent Car for 24 Hours</Text>
              <Text style={{ color: "#64748B", marginVertical: 6 }}>
                {selectedCarToRent?.car_model} • {selectedCarToRent?.location}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#16A34A" }}>
                ₹{selectedCarToRent?.price_per_24hr} {t.rentPer24hr}
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
                <Text style={{ color: "#64748B", fontWeight: "700" }}>{t.cancelBtn}</Text>
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
  langSelectorBadge: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#BFDBFE" },
  langSelectorText: { color: "#1D4ED8", fontSize: 11, fontWeight: "800" },
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
  gpsButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsButtonText: { color: "#0284C7", fontSize: 10, fontWeight: "800" },
  quickHubWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  quickHubChip: { backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  quickHubText: { fontSize: 10, color: "#475569", fontWeight: "700" },
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
