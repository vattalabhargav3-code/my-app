import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, errorMessage } from "@/src/api";
import { Icon } from "@/src/components/ui";

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
  const [profile, setProfile] = useState<{
    full_name: string;
    phone: string;
    affiliation_badge?: string;
  }>({
    full_name: "",
    phone: initialPhone,
    affiliation_badge: "Campus • Student",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && token) {
      api<any>("/auth/me", {}, token)
        .then((res) => {
          if (res) {
            setProfile({
              full_name: res.full_name || "RiderX User",
              phone: res.phone || initialPhone,
              affiliation_badge: res.affiliation_badge || "Campus • Student",
            });
            setEditName(res.full_name || "");
            setEditBadge(res.affiliation_badge || "Campus • Student");
          }
        })
        .catch(() => {
          setProfile((prev) => ({
            ...prev,
            full_name: prev.full_name || "RiderX Commuter",
          }));
        });
    }
  }, [visible, token, initialPhone]);

  const handleShareLiveTrip = () => {
    const shareMessage = `Hi! Nenu RiderX app lo ride lo unnanu. Na safety kosam live route update share chesthunnanu:\n\nPassenger: ${
      profile.full_name || "User"
    }\nEmergency SOS: Active (112 / 100)\nTracking: https://riderx-silk.vercel.app\n\nSafe travel via RiderX Community.`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert("Share Trip", "Unable to open WhatsApp.");
    });
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await api(
        "/auth/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            full_name: editName,
            affiliation_badge: editBadge,
          }),
        },
        token
      );
      setProfile((prev) => ({
        ...prev,
        full_name: editName,
        affiliation_badge: editBadge,
      }));
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Update", errorMessage(err, "Profile details saved locally."));
      setProfile((prev) => ({
        ...prev,
        full_name: editName,
        affiliation_badge: editBadge,
      }));
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Account & Settings</Text>
              <Text style={styles.sheetSubtitle}>Manage your profile, safety & trips</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{profile.full_name || "RiderX Commuter"}</Text>
                <Text style={styles.userPhone}>{profile.phone || "Verified Mobile"}</Text>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{profile.affiliation_badge}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={styles.editToggleBtn}
              >
                <Icon name={isEditing ? "close" : "pencil"} size={18} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            {isEditing && (
              <View style={styles.editBox}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter Full Name"
                  placeholderTextColor="#64748B"
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Badge / College / Company</Text>
                <TextInput
                  style={styles.textInput}
                  value={editBadge}
                  onChangeText={setEditBadge}
                  placeholder="e.g. Campus • JNTU or Corporate"
                  placeholderTextColor="#64748B"
                />

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={loading}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Profile Details"}</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionLabel}>SAFETY & SHARING</Text>
            <TouchableOpacity onPress={handleShareLiveTrip} style={styles.shareTripCard}>
              <View style={styles.shareTripIconWrap}>
                <Icon name="share" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.shareTripTitle}>Share Live Trip (WhatsApp)</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.shareTripDesc}>
                  Family & friends ki 1-tap tho WhatsApp live safety route link pampandi.
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#10B981" />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>COMMUTE & HISTORY</Text>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                onClose();
                Alert.alert("Past Trips", "Past completed rides and payments history will show here.");
              }}
            >
              <View style={[styles.menuItemIconWrap, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                <Icon name="history" size={18} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>My Ride History</Text>
                <Text style={styles.menuItemSubtitle}>View completed routes & digital receipts</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                onClose();
                Alert.alert(
                  "Emergency Contacts",
                  "National Emergency: 112\nPolice: 100\nAmbulance: 108\nRiderX Support: 8919326622"
                );
              }}
            >
              <View style={[styles.menuItemIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                <Icon name="shield-account" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>Emergency Safety Network</Text>
                <Text style={styles.menuItemSubtitle}>Police (100), Ambulance (108) & SOS</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                onLogout();
              }}
              style={styles.logoutBtn}
            >
              <Icon name="logout" size={18} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Log Out from RiderX</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userPhone: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },
  badgePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8",
  },
  editToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  editBox: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#475569",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    color: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  shareTripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 12,
    borderRadius: 14,
    gap: 12,
    marginBottom: 4,
  },
  shareTripIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  shareTripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#34D399",
  },
  newBadge: {
    backgroundColor: "#059669",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  shareTripDesc: {
    fontSize: 11,
    color: "#A7F3D0",
    marginTop: 2,
    lineHeight: 15,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    gap: 12,
  },
  menuItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 22,
  },
  logoutBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "800",
  },
});
