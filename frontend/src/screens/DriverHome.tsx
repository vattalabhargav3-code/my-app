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
