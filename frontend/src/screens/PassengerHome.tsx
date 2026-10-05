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
import RideCard from "@/src/components/RideCard";
import LocationPickerModal from "@/src/components/LocationPickerModal";
import InteractiveMap from "@/src/components/InteractiveMap";

// Language Dictionary
const TRANSLATIONS: any = {
  English: {
    home: "Home",
    myRides: "My Rides",
    offers: "Offers",
    profile: "Profile",
    searchTitle: "Find a Ride Pool",
    pickupLabel: "PICKUP LOCATION",
    dropLabel: "DROP DESTINATION",
    searchBtn: "Search Carpools ➔",
    livePools: "Available Rides",
    sosHeader: "Emergency & Safety Hub",
    settingsTitle: "App Settings & Language",
  },
  Telugu: {
    home: "హోమ్",
    myRides: "నా రైడ్స్",
    offers: "ఆఫర్లు",
    profile: "ప్రొఫైల్",
    searchTitle: "కార్‌పూల్ రైడ్ వెతకండి",
    pickupLabel: "పికప్ లొకేషన్",
    dropLabel: "డ్రాప్ లొకేషన్",
    searchBtn: "రైడ్స్ వెతకండి ➔",
    livePools: "అందుబాటులో ఉన్న రైడ్లు",
    sosHeader: "అత్యవసర రక్షణ కేంద్రం",
    settingsTitle: "సెట్టింగ్స్ & భాష",
  },
  Hindi: {
    home: "होम",
    myRides: "मेरी राइड्स",
    offers: "ऑफ़र्स",
    profile: "प्रोफ़ाइल",
    searchTitle: "राइड पूल खोजें",
    pickupLabel: "पिकअप स्थान",
    dropLabel: "ड्रॉप स्थान",
    searchBtn: "राइड्स खोजें ➔",
    livePools: "उपलब्ध राइड्स",
    sosHeader: "आपातकालीन और सुरक्षा केंद्र",
    settingsTitle: "सेटिंग्स और भाषा",
  },
  Tenglish: {
    home: "Home",
    myRides: "Naa Rides",
    offers: "Offers",
    profile: "Profile",
    searchTitle: "Ride Pool Vethakandi",
    pickupLabel: "PICKUP POINT",
    dropLabel: "DROP POINT",
    searchBtn: "Pools Choodandi ➔",
    livePools: "Live Rides",
    sosHeader: "Emergency & Safety",
    settingsTitle: "Settings & Language",
  },
};

export default function PassengerHome({ navigation }: any) {
  // Onboarding / Profile States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [userPhone, setUserPhone] = useState("8919326622");
  const [selectedLanguage, setSelectedLanguage] = useState("Tenglish");

  // App Navigation & Modals
  const [currentTab, setCurrentTab] = useState<"HOME" | "RIDES" | "OFFERS" | "PROFILE">("HOME");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyHub, setShowEmergencyHub] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);

  // Map & Route States
  const [coords, setCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [pickup, setPickup] = useState("Hitec City, Hyderabad");
  const [drop, setDrop] = useState("LB Nagar, Hyderabad");
  const [modalType, setModalType] = useState<"pickup" | "drop" | null>(null);

  // Rides & Live Booking
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRideForBooking, setSelectedRideForBooking] = useState<any>(null);
  const [activeBookedRide, setActiveBookedRide] = useState<any>(null);
  const [isRideStarted, setIsRideStarted] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.English;

  // Local Storage Sync (ఇక్కడ 2000 తీసేసి 7000 కి మార్చాం - సూపర్ ఫాస్ట్ పెర్ఫార్మెన్స్)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("PASSENGER_USER_PROFILE");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserName(parsed.name || "");
        setUserEmail(parsed.email || "");
        setEmployeeId(parsed.employeeId || "");
        setUserPhone(parsed.phone || "8919326622");
        setSelectedLanguage(parsed.language || "Tenglish");
        setIsLoggedIn(true);
      }
    } catch {}

    const syncRides = () => {
      try {
        const stored = localStorage.getItem("SHARED_CARPOOL_RIDES");
        if (stored) {
          setRides(JSON.parse(stored));
        }
      } catch {}
    };

    syncRides();
    const interval = setInterval(syncRides, 7000); // 7 సెకన్లకు ఒకసారి మాత్రమే బ్యాక్‌గ్రౌండ్ సింక్
    return () => clearInterval(interval);
  }, []);

  // Save Profile Details
  const handleSaveProfile = (skipId: boolean = false) => {
    if (!userName.trim() || !userEmail.trim()) {
      alert("Name mariyu Email ID enter cheyandi");
      return;
    }

    const profileData = {
      name: userName.trim(),
      email: userEmail.trim(),
      phone: userPhone.trim(),
      employeeId: skipId ? "Not Provided" : employeeId.trim(),
      language: selectedLanguage,
    };

    try {
      localStorage.setItem("PASSENGER_USER_PROFILE", JSON.stringify(profileData));
    } catch {}

    setIsLoggedIn(true);
    setShowEditProfile(false);
  };

  // Confirm Booking (Strictly Online Payment Only)
  const handleConfirmOnlineBooking = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      const bookingData = {
        bookingId: "BK-" + Math.floor(100000 + Math.random() * 900000),
        ride: selectedRideForBooking,
        driverNumber: selectedRideForBooking.phone || "8919326622",
        driverLocation: selectedRideForBooking.from_location,
        driverCoords: coords,
        farePaid: appliedCoupon
          ? Math.round(selectedRideForBooking.price_per_seat * 0.8)
          : selectedRideForBooking.price_per_seat,
        status: "CONFIRMED",
      };
      setActiveBookedRide(bookingData);
      setSelectedRideForBooking(null);
      setCurrentTab("RIDES");
      alert("Payment Successful! Ride booked via UPI.");
    }, 1000);
  };

  // Share Live Journey on WhatsApp
  const shareLiveJourney = () => {
    const text = `🚨 LIVE RIDE TRACKING: Nenu ${pickup} nundi ${drop} varaku Carpool lo unnanu. Booking ID: ${activeBookedRide?.bookingId}. Driver Phone: ${activeBookedRide?.driverNumber}. Live location: https://maps.google.com/?q=${coords.lat},${coords.lon}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  // Call Helper
  const dialEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => alert(`Calling ${number}...`));
  };

  // ---------------- 1. LOGIN / ONBOARDING SCREEN ----------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginSafeArea}>
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <Text style={styles.loginHeaderTitle}>Welcome to RidePool 👋</Text>
          <Text style={styles.loginSub}>Daily office commutes made safe & affordable</Text>

          <View style={styles.formGroup}>
            <Text style={styles.fieldTitle}>What should we call you? :)</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="e.g. Bhargav"
              placeholderTextColor="#94A3B8"
              value={userName}
              onChangeText={setUserName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldTitle}>Email ID (Login)</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="vattalabhargav3@gmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={userEmail}
              onChangeText={setUserEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.optionalRow}>
              <Text style={styles.fieldTitle}>
                Work / College ID Card <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <TouchableOpacity onPress={() => handleSaveProfile(true)}>
                <Text style={styles.skipBtnText}>Skip ➔</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.loginInput}
              placeholder="e.g. EMP8919 or College Roll ID"
              placeholderTextColor="#94A3B8"
              value={employeeId}
              onChangeText={setEmployeeId}
            />
            <Text style={styles.idHelperText}>
              ID card verify cheskunte Corporate Commuter Badge vasthundi.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.startCommuteBtn}
            onPress={() => handleSaveProfile(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.startCommuteBtnText}>Start Commute ➔</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------- 2. MAIN PASSENGER DASHBOARD ----------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>PASSENGER POOL</Text>
            <Text style={styles.headerTitle}>Hi, {userName || "Commuter"} 👋</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TouchableOpacity
              style={styles.headerSosBtn}
              onPress={() => setShowEmergencyHub(true)}
            >
              <Text style={styles.headerSosText}>🚨 SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openDriverBtn}
              onPress={() => {
                if (navigation && navigation.navigate) {
                  navigation.navigate("DriverHome");
                } else {
                  window.location.href = "/driver";
                }
              }}
            >
              <Text style={styles.openDriverText}>🚗 Driver App ➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- PASSENGER SCREENS ---------------- */}
        <View style={{ flex: 1 }}>
          {/* TAB 1: HOME (Rapido Half-Screen Map + Search Kinda) */}
          {currentTab === "HOME" && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <InteractiveMap
                lat={coords.lat}
                lon={coords.lon}
                height={260}
                onLocationChange={(newLat, newLon) => setCoords({ lat: newLat, lon: newLon })}
              />

              <View style={styles.searchUnderMapCard}>
                <TouchableOpacity
                  style={styles.inputLocationRow}
                  onPress={() => setModalType("pickup")}
                >
                  <View style={styles.greenCircle} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputTag}>{t.pickupLabel}</Text>
                    <Text style={styles.inputText} numberOfLines={1}>{pickup}</Text>
                  </View>
                  <Text style={styles.editSign}>✏️</Text>
                </TouchableOpacity>

                <View style={styles.inputDivider} />

                <TouchableOpacity
                  style={styles.inputLocationRow}
                  onPress={() => setModalType("drop")}
                >
                  <View style={styles.redCircle} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputTag}>{t.dropLabel}</Text>
                    <Text style={styles.inputText} numberOfLines={1}>{drop}</Text>
                  </View>
                  <Text style={styles.editSign}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.searchRidesBtn}
                  onPress={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 400);
                  }}
                >
                  <Text style={styles.searchRidesBtnText}>{t.searchBtn}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.ridesHeaderRow}>
                <Text style={styles.ridesSectionTitle}>{t.livePools}</Text>
                <Text style={styles.ridesCountBadge}>
                  {rides.length > 0 ? `${rides.length} Pools Live` : "Waiting for Drivers"}
                </Text>
              </View>

              {rides.length === 0 ? (
                <View style={styles.noRidesCard}>
                  <Text style={styles.noRidesTitle}>No live rides published yet</Text>
                  <Text style={styles.noRidesSub}>
                    Driver App lo ride create cheyagane ventane ikkadiki live sync avthundi.
                  </Text>
                </View>
              ) : (
                rides.map((item) => {
                  const finalFare = appliedCoupon
                    ? Math.round(item.price_per_seat * 0.8)
                    : item.price_per_seat;
                  return (
                    <View key={item.id} style={{ marginHorizontal: 16 }}>
                      <RideCard
                        ride={{ ...item, price_per_seat: finalFare }}
                        onPress={() => setSelectedRideForBooking({ ...item, price_per_seat: finalFare })}
                      />
                    </View>
                  );
                })
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          )}

          {/* TAB 2: MY RIDES (Live Tracking, Booking ID & Driver Info) */}
          {currentTab === "RIDES" && (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.tabBigTitle}>My Confirmed Journey</Text>

              {activeBookedRide ? (
                <View style={styles.bookingConfirmedCard}>
                  <View style={styles.bookingBadgeRow}>
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedBadgeText}>✓ CONFIRMED (ONLINE PAID)</Text>
                    </View>
                    <Text style={styles.bookingIdText}>ID: {activeBookedRide.bookingId}</Text>
                  </View>

                  <Text style={styles.journeyRouteText}>
                    {activeBookedRide.ride.from_location} ➔ {activeBookedRide.ride.to_location}
                  </Text>

                  {/* Driver Details Card */}
                  <View style={styles.driverInfoCard}>
                    <View style={styles.driverAvatar}>
                      <Text style={{ fontSize: 22 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.driverName}>{activeBookedRide.ride.driver_name}</Text>
                      <Text style={styles.driverVehicle}>
                        {activeBookedRide.ride.vehicle_name} • {activeBookedRide.ride.vehicle_number || "TS09FA1234"}
                      </Text>
                      <Text style={styles.driverPhone}>📞 {activeBookedRide.driverNumber}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.callDriverBtn}
                      onPress={() => dialEmergency(activeBookedRide.driverNumber)}
                    >
                      <Text style={styles.callDriverText}>Call Driver</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Live Journey Map Tracker */}
                  <View style={styles.liveMapWrap}>
                    <InteractiveMap
                      lat={coords.lat}
                      lon={coords.lon}
                      height={200}
                    />
                    <View style={styles.driverTrackingOverlay}>
                      <Text style={styles.driverTrackingText}>
                        🚗 Driver is {isRideStarted ? "En Route (On Trip)" : "5 mins away from pickup"}
                      </Text>
                    </View>
                  </View>

                  {/* Journey Action Buttons */}
                  <View style={{ gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      style={styles.whatsappShareBtn}
                      onPress={shareLiveJourney}
                    >
                      <Text style={styles.whatsappShareText}>
                        📲 Share Live Journey to WhatsApp (Emergency)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.startRideBtn, isRideStarted && { backgroundColor: "#16A34A" }]}
                      onPress={() => {
                        setIsRideStarted(!isRideStarted);
                        alert(isRideStarted ? "Ride Completed!" : "Ride Started! Live tracking active.");
                      }}
                    >
                      <Text style={styles.startRideBtnText}>
                        {isRideStarted ? "✓ End Journey" : "▶ Start Journey Tracking"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.noRidesCard}>
                  <Text style={styles.noRidesTitle}>No active ride booking</Text>
                  <Text style={styles.noRidesSub}>
                    Book a pool from Home tab with instant online payment to track live driver status.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* TAB 3: OFFERS */}
          {currentTab === "OFFERS" && (
            <ScrollView contentContainerStyle={styles.offersScroll}>
              <Text style={styles.tabBigTitle}>Exclusive Offers & Promos</Text>
              <Text style={styles.tabSubDesc}>Apply promo discounts directly to your daily rides</Text>

              <View style={styles.offerCard}>
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>FLAT 20% OFF</Text>
                </View>
                <Text style={styles.offerCode}>CODE: FIRSTPOOL</Text>
                <Text style={styles.offerDesc}>Get 20% off on your office commute pools.</Text>
                <TouchableOpacity
                  style={[styles.applyOfferBtn, appliedCoupon === "FIRSTPOOL" && styles.appliedBtn]}
                  onPress={() => {
                    if (appliedCoupon === "FIRSTPOOL") {
                      setAppliedCoupon(null);
                      alert("Coupon removed");
                    } else {
                      setAppliedCoupon("FIRSTPOOL");
                      alert("Coupon FIRSTPOOL applied! 20% OFF Active.");
                    }
                  }}
                >
                  <Text style={styles.applyOfferText}>
                    {appliedCoupon === "FIRSTPOOL" ? "✓ APPLIED" : "APPLY COUPON"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* TAB 4: PROFILE */}
          {currentTab === "PROFILE" && (
            <ScrollView contentContainerStyle={styles.profileContent}>
              <View style={styles.profileAvatar}>
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
              <Text style={styles.profileName}>{userName || "Bhargav Vattala"}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <Text style={styles.profileTag}>
                {employeeId && employeeId !== "Not Provided"
                  ? `Corporate ID: ${employeeId}`
                  : "Verified Commuter"}
              </Text>

              {/* Profile Menu Actions */}
              <View style={styles.profileActionsList}>
                <TouchableOpacity
                  style={styles.profileActionItem}
                  onPress={() => setShowEmergencyHub(true)}
                >
                  <Text style={styles.actionIcon}>🚨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Emergency SOS & SHE Teams</Text>
                    <Text style={styles.actionSub}>24x7 Women Safety & Police helpline</Text>
                  </View>
                  <Text style={styles.actionArrow}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileActionItem}
                  onPress={() => setShowSettings(true)}
                >
                  <Text style={styles.actionIcon}>⚙️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Settings & Language</Text>
                    <Text style={styles.actionSub}>Telugu, English, Hindi, Tenglish</Text>
                  </View>
                  <Text style={styles.actionArrow}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileActionItem}
                  onPress={() => setShowReferModal(true)}
                >
                  <Text style={styles.actionIcon}>🎁</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Refer a Friend</Text>
                    <Text style={styles.actionSub}>Earn ₹100 pool credits for each referral</Text>
                  </View>
                  <Text style={styles.actionArrow}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileActionItem}
                  onPress={() => setShowEditProfile(true)}
                >
                  <Text style={styles.actionIcon}>✏️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Edit Profile</Text>
                    <Text style={styles.actionSub}>Change name, email & work ID</Text>
                  </View>
                  <Text style={styles.actionArrow}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileActionItem, { borderBottomWidth: 0 }]}
                  onPress={() => dialEmergency("18002008919")}
                >
                  <Text style={styles.actionIcon}>🎧</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>Customer Care Support</Text>
                    <Text style={styles.actionSub}>Toll-free 1800-200-8919</Text>
                  </View>
                  <Text style={styles.actionArrow}>➔</Text>
                </TouchableOpacity>
              </View>

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  try {
                    localStorage.removeItem("PASSENGER_USER_PROFILE");
                  } catch {}
                  setIsLoggedIn(false);
                }}
              >
                <Text style={styles.logoutBtnText}>🚪 Logout Account</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ---------------- 4 BOTTOM TABS ---------------- */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("HOME")}>
            <Text style={[styles.tabIcon, currentTab === "HOME" && styles.tabActiveText]}>🏠</Text>
            <Text style={[styles.tabLabel, currentTab === "HOME" && styles.tabActiveText]}>{t.home}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("RIDES")}>
            <Text style={[styles.tabIcon, currentTab === "RIDES" && styles.tabActiveText]}>🚗</Text>
            <Text style={[styles.tabLabel, currentTab === "RIDES" && styles.tabActiveText]}>{t.myRides}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("OFFERS")}>
            <Text style={[styles.tabIcon, currentTab === "OFFERS" && styles.tabActiveText]}>🎁</Text>
            <Text style={[styles.tabLabel, currentTab === "OFFERS" && styles.tabActiveText]}>{t.offers}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentTab("PROFILE")}>
            <Text style={[styles.tabIcon, currentTab === "PROFILE" && styles.tabActiveText]}>👤</Text>
            <Text style={[styles.tabLabel, currentTab === "PROFILE" && styles.tabActiveText]}>{t.profile}</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- 3. EMERGENCY SOS & SHE TEAMS MODAL ---------------- */}
        <Modal visible={showEmergencyHub} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.emergencyModalCard}>
              <Text style={styles.emergencyModalTitle}>🚨 Emergency Safety & SHE Teams</Text>
              <Text style={styles.emergencyModalSub}>
                Instant police dispatch, live location relay & women emergency helplines
              </Text>

              <TouchableOpacity
                style={styles.sheTeamBtn}
                onPress={() => dialEmergency("1091")}
              >
                <Text style={styles.sosPhoneIcon}>🌸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheTeamTitle}>SHE Teams Helpline</Text>
                  <Text style={styles.sheTeamSub}>Dial 1091 (Telangana Women Protection)</Text>
                </View>
                <Text style={styles.callTag}>CALL NOW</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.policeSosBtn}
                onPress={() => dialEmergency("112")}
              >
                <Text style={styles.sosPhoneIcon}>🚔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.policeTitle}>Police Emergency (All India)</Text>
                  <Text style={styles.policeSub}>Dial 112 / 100</Text>
                </View>
                <Text style={styles.callTag}>CALL NOW</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customerCareBtn}
                onPress={() => dialEmergency("18002008919")}
              >
                <Text style={styles.sosPhoneIcon}>🎧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>RidePool 24x7 Customer Care</Text>
                  <Text style={styles.supportSub}>Toll-free 1800-200-8919</Text>
                </View>
                <Text style={styles.callTag}>CALL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeSheetBtn}
                onPress={() => setShowEmergencyHub(false)}
              >
                <Text style={styles.closeSheetText}>Close Safety Hub</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 4. SETTINGS & LANGUAGE MODAL ---------------- */}
        <Modal visible={showSettings} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.paymentModalCard}>
              <Text style={styles.modalHeading}>App Settings & Language</Text>
              <Text style={styles.modalSub}>Select your preferred app language:</Text>

              <View style={{ gap: 10, marginVertical: 14 }}>
                {[
                  { id: "Tenglish", label: "Telugu + English (Tenglish)" },
                  { id: "Telugu", label: "తెలుగు (Telugu)" },
                  { id: "English", label: "English" },
                  { id: "Hindi", label: "हिन्दी (Hindi)" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.langItem,
                      selectedLanguage === item.id && styles.langItemActive,
                    ]}
                    onPress={() => {
                      setSelectedLanguage(item.id);
                      handleSaveProfile(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.langText,
                        selectedLanguage === item.id && styles.langTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selectedLanguage === item.id && <Text style={{ color: "#0284C7" }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.closeSheetBtn}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.closeSheetText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 5. REFER A FRIEND MODAL ---------------- */}
        <Modal visible={showReferModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.paymentModalCard}>
              <Text style={styles.modalHeading}>🎁 Refer Friends, Earn Credits</Text>
              <Text style={styles.modalSub}>
                Give your friends 20% off on their first commute and earn ₹100 pool credits!
              </Text>

              <View style={styles.referBox}>
                <Text style={styles.referLabel}>YOUR REFERRAL CODE</Text>
                <Text style={styles.referCode}>BHARGAVPOOL100</Text>
              </View>

              <TouchableOpacity
                style={styles.whatsappShareBtn}
                onPress={() => {
                  const shareText = `Hey! Join RidePool carpooling app with my code BHARGAVPOOL100 and get 20% off on your office rides: https://ridepool.in`;
                  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
                }}
              >
                <Text style={styles.whatsappShareText}>Share Code on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeSheetBtn}
                onPress={() => setShowReferModal(false)}
              >
                <Text style={styles.closeSheetText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 6. EDIT PROFILE MODAL ---------------- */}
        <Modal visible={showEditProfile} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.paymentModalCard}>
              <Text style={styles.modalHeading}>Edit Profile Details</Text>

              <Text style={styles.inputTag}>NAME</Text>
              <TextInput
                style={styles.loginInput}
                value={userName}
                onChangeText={setUserName}
              />

              <Text style={[styles.inputTag, { marginTop: 10 }]}>EMAIL ID</Text>
              <TextInput
                style={styles.loginInput}
                value={userEmail}
                onChangeText={setUserEmail}
              />

              <Text style={[styles.inputTag, { marginTop: 10 }]}>COLLEGE / WORK ID</Text>
              <TextInput
                style={styles.loginInput}
                value={employeeId}
                onChangeText={setEmployeeId}
              />

              <TouchableOpacity
                style={[styles.startCommuteBtn, { marginTop: 18 }]}
                onPress={() => handleSaveProfile(false)}
              >
                <Text style={styles.startCommuteBtnText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeSheetBtn}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.closeSheetText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ---------------- 7. ONLINE PAYMENT CHECKOUT MODAL (STRICTLY NO CASH) ---------------- */}
        <Modal visible={selectedRideForBooking !== null} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.paymentModalCard}>
              <Text style={styles.modalHeading}>Confirm Seat & Online Payment</Text>
              <Text style={styles.modalSub}>
                Driver: {selectedRideForBooking?.driver_name} ({selectedRideForBooking?.vehicle_name})
              </Text>

              <View style={styles.noCashNotice}>
                <Text style={styles.noCashText}>
                  🛡️ 100% Cashless Commute: Only Online Payments are accepted to ensure verified booking safety.
                </Text>
              </View>

              <View style={styles.fareBox}>
                <Text style={styles.fareLabel}>Payable Total (1 Seat)</Text>
                <Text style={styles.fareValue}>
                  ₹
                  {appliedCoupon
                    ? Math.round(selectedRideForBooking?.price_per_seat * 0.8)
                    : selectedRideForBooking?.price_per_seat}
                </Text>
              </View>

              <TouchableOpacity style={styles.upiCard} onPress={handleConfirmOnlineBooking}>
                <Text style={{ fontSize: 22 }}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiName}>Pay via Instant UPI (GPay / PhonePe / Paytm)</Text>
                  <Text style={styles.upiVpa}>vattalabhargav3@okhdfcbank</Text>
                </View>
                <Text style={styles.payArrow}>➔</Text>
              </TouchableOpacity>

              {paymentSuccess && (
                <View style={styles.successTag}>
                  <Text style={styles.successTagText}>✓ Online Payment Approved! Pass Generating...</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedRideForBooking(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={modalType !== null}
          title={modalType === "pickup" ? "Select Pickup Location" : "Select Drop Location"}
          onClose={() => setModalType(null)}
          onSelect={(name, lat, lon) => {
            if (modalType === "pickup") {
              setPickup(name);
              setCoords({ lat, lon });
            } else if (modalType === "drop") {
              setDrop(name);
            }
            setModalType(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Login Styles
  loginSafeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  loginContainer: { padding: 24, paddingTop: 36 },
  loginHeaderTitle: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  loginSub: { fontSize: 13, color: "#64748B", marginTop: 4, marginBottom: 24 },
  formGroup: { marginBottom: 18 },
  fieldTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B", marginBottom: 6 },
  optionalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  optionalTag: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  skipBtnText: { fontSize: 13, fontWeight: "800", color: "#0284C7" },
  loginInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },
  idHelperText: { fontSize: 11, color: "#94A3B8", marginTop: 5 },
  startCommuteBtn: {
    backgroundColor: "#E11D48",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  startCommuteBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },

  // Dashboard Styles
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerSub: { fontSize: 8, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  headerTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  headerSosBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  headerSosText: { color: "#DC2626", fontSize: 11, fontWeight: "900" },
  openDriverBtn: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  openDriverText: { fontSize: 11, fontWeight: "800", color: "#B45309" },
  searchUnderMapCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  inputLocationRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  greenCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  redCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  inputTag: { fontSize: 8, fontWeight: "800", color: "#94A3B8" },
  inputText: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  editSign: { fontSize: 12, opacity: 0.6 },
  inputDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8, marginLeft: 18 },
  searchRidesBtn: {
    backgroundColor: "#FFC000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  searchRidesBtnText: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  ridesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  ridesSectionTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  ridesCountBadge: { fontSize: 11, fontWeight: "700", color: "#0284C7" },
  noRidesCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  noRidesTitle: { fontSize: 14, fontWeight: "800", color: "#334155" },
  noRidesSub: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtn: { alignItems: "center" },
  tabIcon: { fontSize: 18, color: "#64748B" },
  tabLabel: { fontSize: 10, fontWeight: "700", color: "#64748B", marginTop: 2 },
  tabActiveText: { color: "#0284C7" },
  tabBigTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 6 },
  tabSubDesc: { fontSize: 12, color: "#64748B", marginBottom: 16 },

  // Booking Confirmed Card
  bookingConfirmedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bookingBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  confirmedBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  confirmedBadgeText: { color: "#16A34A", fontSize: 10, fontWeight: "900" },
  bookingIdText: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  journeyRouteText: { fontSize: 15, fontWeight: "900", color: "#0F172A", marginBottom: 12 },
  driverInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    gap: 10,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  driverVehicle: { fontSize: 11, color: "#64748B", marginTop: 2 },
  driverPhone: { fontSize: 11, color: "#0284C7", fontWeight: "700", marginTop: 2 },
  callDriverBtn: { backgroundColor: "#0284C7", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  callDriverText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  liveMapWrap: { borderRadius: 14, overflow: "hidden", position: "relative" },
  driverTrackingOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  driverTrackingText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  whatsappShareBtn: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  whatsappShareText: { color: "#16A34A", fontSize: 12, fontWeight: "800" },
  startRideBtn: { backgroundColor: "#0F172A", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  startRideBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  // Profile Styles
  profileContent: { padding: 20, alignItems: "center" },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileName: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  profileEmail: { fontSize: 12, color: "#64748B", marginTop: 2 },
  profileTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  profileActionsList: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  profileActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  actionIcon: { fontSize: 18 },
  actionTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  actionSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  actionArrow: { fontSize: 14, color: "#94A3B8" },
  logoutBtn: { marginTop: 20, padding: 12 },
  logoutBtnText: { color: "#EF4444", fontSize: 13, fontWeight: "800" },

  // Modals & Emergency Sheet
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  emergencyModalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  emergencyModalTitle: { fontSize: 17, fontWeight: "900", color: "#DC2626" },
  emergencyModalSub: { fontSize: 12, color: "#64748B", marginTop: 2, marginBottom: 16 },
  sheTeamBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F8",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FBCFE8",
    gap: 12,
    marginBottom: 10,
  },
  sheTeamTitle: { fontSize: 13, fontWeight: "900", color: "#BE185D" },
  sheTeamSub: { fontSize: 11, color: "#9D174D" },
  policeSosBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    gap: 12,
    marginBottom: 10,
  },
  policeTitle: { fontSize: 13, fontWeight: "900", color: "#B91C1C" },
  policeSub: { fontSize: 11, color: "#991B1B" },
  customerCareBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    gap: 12,
    marginBottom: 10,
  },
  supportTitle: { fontSize: 13, fontWeight: "900", color: "#0369A1" },
  supportSub: { fontSize: 11, color: "#0284C7" },
  callTag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "900",
    color: "#0F172A",
  },
  sosPhoneIcon: { fontSize: 24 },
  closeSheetBtn: { marginTop: 10, alignItems: "center", paddingVertical: 10 },
  closeSheetText: { fontSize: 13, fontWeight: "800", color: "#64748B" },

  // Settings & Lang
  paymentModalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeading: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  modalSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  langItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langItemActive: { borderColor: "#0284C7", backgroundColor: "#F0F9FF" },
  langText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  langTextActive: { color: "#0284C7", fontWeight: "900" },

  // Refer Box
  referBox: {
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  referLabel: { fontSize: 10, fontWeight: "800", color: "#B45309" },
  referCode: { fontSize: 20, fontWeight: "900", color: "#78350F", marginTop: 4 },

  // Online Payment Card (Strictly No Cash)
  noCashNotice: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  noCashText: { fontSize: 11, color: "#1D4ED8", fontWeight: "700" },
  fareBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fareLabel: { fontSize: 12, fontWeight: "700", color: "#475569" },
  fareValue: { fontSize: 18, fontWeight: "900", color: "#16A34A" },
  upiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 10,
  },
  upiName: { fontSize: 12, fontWeight: "800", color: "#14532D" },
  upiVpa: { fontSize: 10, color: "#16A34A" },
  payArrow: { fontSize: 14, fontWeight: "bold", color: "#15803D" },
  successTag: { backgroundColor: "#DCFCE7", padding: 10, borderRadius: 8, marginTop: 10, alignItems: "center" },
  successTagText: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  cancelBtn: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: "#64748B" },

  // Offers Tab
  offersScroll: { padding: 16 },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  offerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0284C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  offerBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  offerCode: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  offerDesc: { fontSize: 11, color: "#64748B", marginTop: 4, marginBottom: 12 },
  applyOfferBtn: { backgroundColor: "#F1F5F9", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  appliedBtn: { backgroundColor: "#DCFCE7" },
  applyOfferText: { fontSize: 11, fontWeight: "800", color: "#0F172A" },
});
