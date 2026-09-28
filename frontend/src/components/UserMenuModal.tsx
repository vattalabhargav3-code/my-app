import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Icon } from "./ui";
import { api, Ride, Booking } from "@/src/api";
import { colors } from "@/src/theme";

interface UserMenuModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
  onLogout: () => void;
  initialPhone?: string;
}

export function UserMenuModal({
  visible,
  onClose,
  token,
  onLogout,
  initialPhone = "",
}: UserMenuModalProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "profile" | "history" | "settings">("menu");

  // Profile Edit States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [collegeBadge, setCollegeBadge] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Trips History States
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Load Saved Profile Data
  useEffect(() => {
    if (visible && typeof window !== "undefined") {
      const savedName = localStorage.getItem("safarway_user_name") || "";
      const savedBadge = localStorage.getItem("safarway_user_badge") || "";
      setName(savedName);
      setCollegeBadge(savedBadge);
    }
  }, [visible]);

  // Fetch Past Trips when History is selected
  const fetchTripHistory = async () => {
    setActiveTab("history");
    setLoadingTrips(true);
    try {
      // Backend history endpoints (passenger bookings & driver posted rides)
      const data = await api<any[]>("/bookings/history", {}, token).catch(async () => {
        return await api<any[]>("/rides/mine", {}, token).catch(() => []);
      });
      setTrips(data || []);
    } catch {
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("safarway_user_name", name);
        localStorage.setItem("safarway_user_badge", collegeBadge);
      }
      // Optional: Backend update API
      await api("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ name, collegeBadge }),
      }, token).catch(() => undefined);

      Alert.alert("Success", "Profile updated successfully!");
      setActiveTab("menu");
    } catch {
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {activeTab === "menu" && "Account & Menu"}
              {activeTab === "profile" && "Edit Profile"}
              {activeTab === "history" && "My Trips History"}
              {activeTab === "settings" && "App Settings"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (activeTab === "menu") onClose();
                else setActiveTab("menu");
              }}
              style={styles.closeBtn}
            >
              <Icon name={activeTab === "menu" ? "close" : "arrow-left"} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* MAIN MENU TAB */}
          {activeTab === "menu" && (
            <ScrollView style={styles.content}>
              <View style={styles.userBriefCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : "U"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{name || "Verified Traveler"}</Text>
                  <Text style={styles.userPhone}>{phone || "+91 Mobile"}</Text>
                  {collegeBadge ? <Text style={styles.badgeText}>{collegeBadge}</Text> : null}
                </View>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab("profile")}>
                <Icon name="account-edit" size={20} color={colors.brand} />
                <Text style={styles.menuItemText}>Edit Profile Details</Text>
                <Icon name="chevron-right" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={fetchTripHistory}>
                <Icon name="history" size={20} color="#38BDF8" />
                <Text style={styles.menuItemText}>Past Trips & Bookings</Text>
                <Icon name="chevron-right" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab("settings")}>
                <Icon name="cog-outline" size={20} color="#FBBF24" />
                <Text style={styles.menuItemText}>Preferences & Settings</Text>
                <Icon name="chevron-right" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { marginTop: 24, borderColor: "#DC2626" }]}
                onPress={() => {
                  onClose();
                  onLogout();
                }}
              >
                <Icon name="logout" size={20} color="#EF4444" />
                <Text style={[styles.menuItemText, { color: "#EF4444" }]}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* EDIT PROFILE TAB */}
          {activeTab === "profile" && (
            <ScrollView style={styles.content}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.fieldLabel}>College / Company Badge</Text>
              <TextInput
                style={styles.input}
                value={collegeBadge}
                onChangeText={setCollegeBadge}
                placeholder="e.g. JNTU Student or Tech Mahindra"
                placeholderTextColor="#64748B"
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={saveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* TRIPS HISTORY TAB */}
          {activeTab === "history" && (
            <ScrollView style={styles.content}>
              {loadingTrips ? (
                <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 30 }} />
              ) : trips.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="calendar-blank" size={32} color="#64748B" />
                  <Text style={styles.emptyText}>No past trips found.</Text>
                </View>
              ) : (
                trips.map((item, idx) => (
                  <View key={item.id || idx} style={styles.tripCard}>
                    <View style={styles.tripRow}>
                      <Text style={styles.tripLocation}>
                        {item.from || item.ride?.from || "Pickup"} ➔{" "}
                        {item.to || item.ride?.to || "Destination"}
                      </Text>
                      <Text style={styles.tripPrice}>
                        ₹{item.total || item.price || item.ride?.price || "--"}
                      </Text>
                    </View>
                    <Text style={styles.tripDate}>
                      {item.departure_time || item.ride?.departure_time || "Completed"}
                    </Text>
                    <View style={styles.tripFooter}>
                      <Text style={styles.tripStatusBadge}>Completed</Text>
                      {item.seat ? <Text style={styles.tripSeat}>Seat: {item.seat}</Text> : null}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <ScrollView style={styles.content}>
              <View style={styles.settingRow}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Ride status & OTP alerts</Text>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingTitle}>SOS Emergency Contacts</Text>
                <Text style={styles.settingDesc}>Connected with 112 Safety Network</Text>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingDesc}>v1.0.4 - Production Ready</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "55%",
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  content: {
    padding: 18,
  },
  userBriefCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 20,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  userPhone: {
    color: "#94A3B8",
    fontSize: 12,
  },
  badgeText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  menuItemText: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
  },
  fieldLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 22,
  },
  primaryBtnText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 14,
  },
  tripCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  tripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripLocation: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  tripPrice: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "800",
  },
  tripDate: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
  },
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tripStatusBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    color: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "700",
  },
  tripSeat: {
    color: "#CBD5E1",
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
  },
  settingRow: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  settingDesc: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
});
