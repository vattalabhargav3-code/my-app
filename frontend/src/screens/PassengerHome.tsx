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

// Popular Hyderabad Hubs Database
const HYDERABAD_HUBS = [
  { name: "Hitec City Cyber Towers", sub: "Madhapur, Hyderabad", lat: 17.4435, lon: 78.3772 },
  { name: "Gachibowli DLF Cybercity", sub: "Gachibowli, Hyderabad", lat: 17.4401, lon: 78.3489 },
  { name: "LB Nagar Ring Road", sub: "LB Nagar, Hyderabad", lat: 17.3457, lon: 78.5522 },
  { name: "Secunderabad Railway Station", sub: "Secunderabad, Hyderabad", lat: 17.4399, lon: 78.4983 },
  { name: "Kukatpally Housing Board (KPHB)", sub: "Kukatpally, Hyderabad", lat: 17.4947, lon: 78.3996 },
  { name: "B.N. Reddy Nagar", sub: "Sagar Highway, Hyderabad", lat: 17.3312, lon: 78.5638 },
];

export function PassengerHome({ navigation }: any) {
  // Authentication & Profile States
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [passengerName, setPassengerName] = useState("Bhargav");
  const [passengerPhone, setPassengerPhone] = useState("8919326622");
  const [passengerEmail, setPassengerEmail] = useState("vattalabhargav3@gmail.com");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [studentOrEmpId, setStudentOrEmpId] = useState("");
  const [walletBalance, setWalletBalance] = useState(0); // Zero by default

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"RIDE" | "POOLS" | "REWARDS" | "PROFILE">("RIDE");

  // Route Locations
  const [pickupAddress, setPickupAddress] = useState("TCS Junction, HITEC City Road, Madhapur");
  const [pickupCoords, setPickupCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [dropAddress, setDropAddress] = useState("");
  const [dropCoords, setDropCoords] = useState({ lat: 17.4483, lon: 78.3915 });

  // Map Modal States (Only opens on search tap)
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeTarget, setActiveTarget] = useState<"PICKUP" | "DROP">("DROP");
  const [modalPinCoords, setModalPinCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [modalResolvedAddress, setModalResolvedAddress] = useState("Cyber Towers, Hyderabad");
  const [isModalResolving, setIsModalResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Plate Filters & Searching
  const [plateFilter, setPlateFilter] = useState<"ALL" | "WHITE" | "YELLOW">("ALL");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [isSearchingRides, setIsSearchingRides] = useState(false);
  const [matchedRides, setMatchedRides] = useState<any[]>([]);

  // Confirmed Real Ride (Empty by default)
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Payment Gateway Modals
  const [showRidePaymentModal, setShowRidePaymentModal] = useState(false);
  const [pendingRideToPay, setPendingRideToPay] = useState<any | null>(null);
  const [selectedPayService, setSelectedPayService] = useState<"PHONEPE" | "GPAY" | "PAYTM" | "QR">("PHONEPE");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState("200");

  // Side Drawer & Profile
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Leaflet DOM Ref for Modal Map Only
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

  // Reverse Geocode
  const reverseGeocode = async (lat: number, lon: number) => {
    setIsModalResolving(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        setModalResolvedAddress(`${parts[0] \vert{}\vert{} ""}, ${parts[1] || ""}, Hyderabad`);
      } else {
        setModalResolvedAddress(`Location (${lat.toFixed(4)},${lon.toFixed(4)})`);
      }
    } catch {
      setModalResolvedAddress(`Location (${lat.toFixed(4)},${lon.toFixed
