import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RideCard } from "@/src/components/RideCard";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";

// డమ్మీ రైడ్స్ డేటా (స్క్రీన్ వెంటనే లోడ్ అవ్వడానికి)
const INITIAL_RIDES = [
  {
    id: "1",
    driver_name: "Suresh Kumar",
    vehicle_name: "SWIFT DZIRE",
    vehicle_type: "car",
    from_location: "LB Nagar Ring Road",
    to_location: "Hitec City Cyber Towers",
    price_per_seat: 120,
    available_seats: 3,
    departure_time: "Today, 08:30 AM",
  },
  {
    id: "2",
    driver_name: "Ramesh Reddy",
    vehicle_name: "HONDA CITY",
    vehicle_type: "car",
    from_location: "Kukatpally Housing Board",
    to_location: "Gachibowli DLF",
    price_per_seat: 95,
    available_seats: 2,
    departure_time: "Today, 09:00 AM",
  },
  {
    id: "3",
    driver_name: "Venkatesh",
    vehicle_name: "ERTIGA XL",
    vehicle_type: "car",
    from_location: "Secunderabad Station",
    to_location: "Madhapur Metro",
    price_per_seat: 110,
    available_seats: 4,
    departure_time: "Today, 09:15 AM",
  },
];

export default function PassengerHome({ navigation }: any) {
  const [pickup, setPickup] = useState("LB Nagar, Hyderabad");
  const [drop, setDrop] = useState("Hitec City, Hyderabad");
  const [modalType, setModalType] = useState<"pickup" | "drop" | null>(null);
  const [rides, setRides] = useState(INITIAL_RIDES);
  const [loading, setLoading] = useState(false);

  const handleSelectLocation = (address: string, lat: number, lon: number) => {
    if (modalType === "pickup") {
      setPickup(address);
    } else if (modalType === "drop") {
      setDrop(address);
    }
  };

  const handleSearchRides = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Ready for your commute?</Text>
            <Text style={styles.headerTitle}>Find a Ride Pool</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>👤</Text>
          </View>
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          <TouchableOpacity
            style={styles.locationInputRow}
            onPress={() => setModalType("pickup")}
          >
            <View style={styles.greenDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
              <Text style={styles.inputText} numberOfLines={1}>
                {pickup}
              </Text>
            </View>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          <TouchableOpacity
            style={styles.locationInputRow}
            onPress={() => setModalType("drop")}
          >
            <View style={styles.redDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>DROP DESTINATION</Text>
              <Text style={styles.inputText} numberOfLines={1}>
                {drop}
              </Text>
            </View>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchRides}
            activeOpacity={0.85}
          >
            <Text style={styles.searchButtonText}>Search Available Rides ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Available Rides Header */}
        <View style={styles.ridesHeaderRow}>
          <Text style={styles.sectionTitle}>Available Rides</Text>
          <Text style={styles.poolCountBadge}>{rides.length} Pools active</Text>
        </View>

        {/* Rides List */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loaderText}>Searching nearby cars...</Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RideCard
                ride={item as any}
                onPress={() => {
                  if (navigation && navigation.navigate) {
                    navigation.navigate("RideDetails", { ride: item });
                  } else {
                    alert(`Booking seat with ${item.driver_name}`);
                  }
                }}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={modalType !== null}
          title={modalType === "pickup" ? "Select Pickup Point" : "Select Drop Point"}
          onClose={() => setModalType(null)}
          onSelect={handleSelectLocation}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBadgeText: {
    fontSize: 18,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 2,
  },
  inputText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  editIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
    marginLeft: 22,
  },
  searchButton: {
    backgroundColor: "#FFC000",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  ridesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  poolCountBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284C7",
  },
  listContent: {
    paddingBottom: 24,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
