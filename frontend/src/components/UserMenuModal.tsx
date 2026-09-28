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

  // 1st OPTION: Live Trip Sharing via WhatsApp
  const handleShareLiveTrip = () => {
    const shareMessage = `Hi! Nenu RiderX app lo ride lo unnanu. Na safety kosam na live commute update share chesthunnanu:\n\nPassenger: ${
      profile.full_name || "User"
    }\nEmergency SOS: Active (112 / 100)\nLive Tracking: https://riderx-silk.vercel.app\n\nSafe travel via RiderX Community.`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          // Fallback to Web WhatsApp or SMS
          Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`);
        }
      })
      .catch(() => {
        Alert.alert("Share Trip", "Unable to open WhatsApp. Please check if app is installed.");
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
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Account & Settings</Text>
              <Text style={styles.sheetSubtitle}>Manage your profile, safety & trips</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* User Profile Card */}
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
                <Icon name={isEditing ? "close" : "pencil-outline"} size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* Profile Edit Fields */}
            {isEditing && (
              <View style={styles.editBox}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter Full Name"
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Badge / College / Company</Text>
                <TextInput
                  style={styles.textInput}
                  value={editBadge}
                  onChangeText={setEditBadge}
                  placeholder="e.g. Campus • JNTU or Corporate"
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

            {/* 1ST OPTION: LIVE TRIP SHARING CARD */}
            <Text style={styles.sectionLabel}>SAFETY & SHARING</Text>
            <TouchableOpacity onPress={handleShareLiveTrip} style={styles.shareTripCard}>
              <View style={styles.shareTripIconWrap}>
                <Icon name="whatsapp" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.shareTripTitle}>Share Live Trip</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.shareTripDesc}>
                  Family & friends ki 1-tap tho WhatsApp live safety route link pampandi.
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#059669" />
            </TouchableOpacity>

            {/* Other Menu Options */}
            <Text style={styles.sectionLabel}>COMMUTE & HISTORY</Text>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                onClose();
                Alert.alert("Past Trips", "Past completed rides and payments history will show here.");
              }}
            >
              <View style={[styles.menuItemIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <Icon name="history" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>My Ride History</Text>
                <Text style={styles.menuItemSubtitle}>View completed routes & digital receipts</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94A3B8" />
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
              <View style={[styles.menuItemIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <Icon name="shield-account-outline" size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>Emergency Safety Network</Text>
                <Text style={styles.menuItemSubtitle}>Police (100), Ambulance (108) & SOS</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Logout Action Button */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onLogout();
              }}
              style={styles.logoutBtn}
            >
              <Icon name="logout-variant" size={18} color="#DC2626" />
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
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#0F172A",
  },
  userPhone: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  badgePill: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
  },
  editToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  editBox: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    color: "#0F172A",
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
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  shareTripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 12,
    borderRadius: 14,
    gap: 12,
    marginBottom: 4,
  },
  shareTripIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  shareTripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065F46",
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
    color: "#047857",
    marginTop: 2,
    lineHeight: 15,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
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
    color: "#1E293B",
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 22,
  },
  logoutBtnText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },
});
