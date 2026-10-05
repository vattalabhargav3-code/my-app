import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

const ALL_RIDES = [
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
  {
    id: "4",
    driver_name: "Karthik Varma",
    vehicle_name: "BALENO",
    vehicle_type: "car",
    from_location: "Dilsukhnagar",
    to_location: "Financial District",
    price_per_seat: 130,
    available_seats: 2,
    departure_time: "Today, 09:30 AM",
  },
];

export default function PassengerHome({ navigation }: any) {
  const [pickup, setPickup] = useState("LB Nagar, Hyderabad");
  const [drop, setDrop] = useState("Hitec City, Hyderabad");
  const [modalType, setModalType] = useState<"pickup" | "drop" | null>(null);
  const [rides, setRides] = useState(ALL_RIDES);
  const [loading, setLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const handleSelectLocation = (address: string) => {
    if (modalType === "pickup") {
      setPickup(address);
    } else if (modalType === "drop") {
      setDrop(address);
    }
    setModalType(null);
  };

  const handleSearchRides = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // SOS Emergency Trigger
  const triggerSOS = () => {
    const alertMsg = `EMERGENCY SOS: Passenger in transit from ${pickup} to ${drop}. Dialing emergency helpline 112.`;
    Linking.openURL("tel:112").catch(() => {
      alert(alertMsg);
    });
  };

  // WhatsApp Share Route Feature
  const shareOnWhatsApp = () => {
    const text = `Hey! Check my carpool ride route: From ${pickup} To ${drop}. You can join this pool!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(waUrl).catch(() => {
      alert("WhatsApp web share is not available on this browser.");
    });
  };

  // Quick Filter Filter Handler
  const filterRides = (type: string) => {
    setActiveFilter(type);
    if (type === "All") {
      setRides(ALL_RIDES);
    } else if (type === "Lowest Fare") {
      const sorted = [...ALL_RIDES].sort((a, b) => a.price_per_seat - b.price_per_seat);
      setRides(sorted);
    } else if (type === "Most Seats") {
      const sorted = [...ALL_RIDES].sort((a, b) => b.available_seats - a.available_seats);
      setRides(sorted);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.menuIconText}>☰</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerSubtitle}>Commute Smarter</Text>
              <Text style={styles.headerTitle}>Find a Ride Pool</Text>
            </View>
          </View>

          {/* Quick Actions: SOS & WhatsApp */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.sosBtn}
              onPress={triggerSOS}
              activeOpacity={0.85}
            >
              <Text style={styles.sosBtnText}>🚨 SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waBtn}
              onPress={shareOnWhatsApp}
              activeOpacity={0.85}
            >
              <Text style={styles.waBtnText}>💬 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo & Offers Banner */}
        <TouchableOpacity
          style={styles.offerCard}
          activeOpacity={0.9}
          onPress={() => {
            setPromoApplied(!promoApplied);
            alert(
              promoApplied
                ? "Offer Removed!"
                : "Coupon POOL20 Applied! Flat 20% Discount Activated."
            );
          }}
        >
          <View style={styles.offerTag}>
            <Text style={styles.offerTagText}>OFFER</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerHeadline}>
              {promoApplied
                ? "🎉 Promo 'POOL20' Active (20% OFF Applied)"
                : "Save 20% on your daily office commutes!"}
            </Text>
            <Text style={styles.offerSubline}>Tap here to toggle promo discount</Text>
          </View>
          <Text style={styles.offerArrow}>➔</Text>
        </TouchableOpacity>

        {/* Search Route Inputs */}
        <View style={styles.searchCard}>
          <TouchableOpacity
            style={styles.routeItem}
            onPress={() => setModalType("pickup")}
          >
            <View style={styles.greenCircle} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {pickup}
              </Text>
            </View>
            <Text style={styles.editSign}>✏️</Text>
          </TouchableOpacity>

          <View style={styles.routeConnectorLine} />

          <TouchableOpacity
            style={styles.routeItem}
            onPress={() => setModalType("drop")}
          >
            <View style={styles.redCircle} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>DROP DESTINATION</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {drop}
              </Text>
            </View>
            <Text style={styles.editSign}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.findRidesBtn}
            onPress={handleSearchRides}
            activeOpacity={0.85}
          >
            <Text style={styles.findRidesText}>Search Available Rides ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {["All", "Lowest Fare", "Most Seats"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                activeFilter === tab && styles.tabBtnActive,
              ]}
              onPress={() => filterRides(tab)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeFilter === tab && styles.tabBtnTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Carpools List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Available Carpools</Text>
          <Text style={styles.activePoolsCount}>{rides.length} Pools ready</Text>
        </View>

        {/* Ride Cards List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Searching matching pools...</Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const discountedFare = promoApplied
                ? Math.round(item.price_per_seat * 0.8)
                : item.price_per_seat;
              return (
                <RideCard
                  ride={{ ...item, price_per_seat: discountedFare } as any}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      navigation.navigate("RideDetails", { ride: item });
                    } else {
                      alert(`Booking confirmed with ${item.driver_name} (Fare: ₹${discountedFare})`);
                    }
                  }}
                />
              );
            }}
            contentContainerStyle={styles.cardsScrollContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Slide-out Side Menu Drawer */}
        <Modal visible={menuOpen} animationType="fade" transparent={true} onRequestClose={() => setMenuOpen(false)}>
          <View style={styles.menuOverlay}>
            <View style={styles.menuDrawer}>
              <View style={styles.menuTop}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerUserName}>Bhargav Vattala</Text>
                  <Text style={styles.drawerUserRole}>Verified Commuter</Text>
                </View>
                <TouchableOpacity onPress={() => setMenuOpen(false)}>
                  <Text style={styles.drawerCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuOpen(false); alert("Opening My Bookings"); }}>
                <Text style={styles.menuItemIcon}>🚗</Text>
                <Text style={styles.menuItemLabel}>My Bookings & Rides</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuOpen(false); alert("Opening Driver Mode"); }}>
                <Text style={styles.menuItemIcon}>💼</Text>
                <Text style={styles.menuItemLabel}>Switch to Driver Mode</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuOpen(false); alert("Refer friends to get ₹100 pool credits!"); }}>
                <Text style={styles.menuItemIcon}>🎁</Text>
                <Text style={styles.menuItemLabel}>Refer & Earn Credits</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuOpen(false); triggerSOS(); }}>
                <Text style={styles.menuItemIcon}>🛡️</Text>
                <Text style={styles.menuItemLabel}>Safety & Emergency SOS</Text>
              </TouchableOpacity>

              <View style={styles.menuBottom}>
                <Text style={styles.appVersionText}>RideShare v1.0.4 Web</Text>
              </View>
            </View>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setMenuOpen(false)} />
          </View>
        </Modal>

        {/* Interactive Mapbox Location Picker */}
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuIconText: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sosBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  sosBtnText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "900",
  },
  waBtn: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  waBtnText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "800",
  },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    gap: 10,
  },
  offerTag: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offerTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  offerHeadline: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E3A8A",
  },
  offerSubline: {
    fontSize: 10,
    color: "#60A5FA",
    fontWeight: "600",
  },
  offerArrow: {
    fontSize: 14,
    color: "#0284C7",
    fontWeight: "bold",
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  greenCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  redCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  editSign: {
    fontSize: 12,
    opacity: 0.6,
  },
  routeConnectorLine: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
    marginLeft: 22,
  },
  findRidesBtn: {
    backgroundColor: "#FFC000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  findRidesText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtnActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  activePoolsCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  cardsScrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    flexDirection: "row",
  },
  menuDrawer: {
    width: "75%",
    maxWidth: 300,
    backgroundColor: "#FFFFFF",
    height: "100%",
    padding: 20,
    paddingTop: 40,
  },
  menuTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 20,
  },
  drawerUserName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  drawerUserRole: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
  },
  drawerCloseText: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "bold",
    padding: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 20,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  menuBottom: {
    marginTop: "auto",
    paddingTop: 20,
  },
  appVersionText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },
});
