import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function DriverHome({ navigation }: any) {
  const [driverPickup, setDriverPickup] = useState("LB Nagar, Hyderabad");
  const [driverDrop, setDriverDrop] = useState("Hitec City Cyber Towers");
  const [driverVehicle, setDriverVehicle] = useState("Swift Dzire");
  const [driverNumber, setDriverNumber] = useState("TS09FA1234");
  const [driverSeats, setDriverSeats] = useState("3");
  const [driverPrice, setDriverPrice] = useState("100");
  const [driverFemaleOnly, setDriverFemaleOnly] = useState(false);

  const handlePublishRide = () => {
    if (!driverPickup || !driverDrop || !driverPrice) {
      alert("Please fill route and seat price");
      return;
    }

    const newRide = {
      id: "ride_" + Date.now(),
      driver_name: "Bhargav (Driver)",
      phone: "8919326622",
      vehicle_name: driverVehicle,
      vehicle_number: driverNumber,
      from_location: driverPickup,
      to_location: driverDrop,
      price_per_seat: Number(driverPrice),
      available_seats: Number(driverSeats),
      departure_time: "Today in 15 mins",
      female_only: driverFemaleOnly,
    };

    // Save to shared sync storage
    try {
      const stored = localStorage.getItem("SHARED_CARPOOL_RIDES");
      const currentList = stored ? JSON.parse(stored) : [];
      const updated = [newRide, ...currentList];
      localStorage.setItem("SHARED_CARPOOL_RIDES", JSON.stringify(updated));
    } catch {
      // fallback
    }

    alert("🎉 Ride published to Passenger App successfully!");
    if (navigation && navigation.navigate) {
      navigation.navigate("PassengerHome");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <Text style={styles.portalTag}>DRIVER PARTNER APP</Text>
          <Text style={styles.heading}>Create & Post a Ride Pool</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <Text style={styles.label}>PICKUP POINT</Text>
            <TextInput
              style={styles.input}
              value={driverPickup}
              onChangeText={setDriverPickup}
            />

            <Text style={styles.label}>DROP POINT</Text>
            <TextInput
              style={styles.input}
              value={driverDrop}
              onChangeText={setDriverDrop}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CAR MODEL</Text>
                <TextInput
                  style={styles.input}
                  value={driverVehicle}
                  onChangeText={setDriverVehicle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>SEATS</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={driverSeats}
                  onChangeText={setDriverSeats}
                />
              </View>
            </View>

            <Text style={styles.label}>PRICE PER SEAT (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={driverPrice}
              onChangeText={setDriverPrice}
            />

            <TouchableOpacity
              style={[styles.pinkBtn, driverFemaleOnly && styles.pinkBtnActive]}
              onPress={() => setDriverFemaleOnly(!driverFemaleOnly)}
            >
              <Text style={styles.pinkBtnText}>
                {driverFemaleOnly ? "🌸 Female-Only Pool: ENABLED" : "🌸 Female-Only Pool"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.publishBtn} onPress={handlePublishRide}>
              <Text style={styles.publishText}>Publish Ride to Passenger App ➔</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  topHeader: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  portalTag: { fontSize: 10, fontWeight: "800", color: "#D97706", letterSpacing: 0.5 },
  heading: { fontSize: 20, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  scrollContent: { padding: 16 },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  label: { fontSize: 10, fontWeight: "800", color: "#64748B", marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
  },
  row: { flexDirection: "row", gap: 10 },
  pinkBtn: {
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
  },
  pinkBtnActive: { backgroundColor: "#FCE7F3", borderColor: "#DB2777" },
  pinkBtnText: { fontSize: 12, fontWeight: "800", color: "#BE185D" },
  publishBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  publishText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
});
