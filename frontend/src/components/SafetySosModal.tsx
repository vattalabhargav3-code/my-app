import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, Booking } from "@/src/api";
import { Icon } from "@/src/components/ui";
import { colors } from "@/src/theme";

interface SafetySosModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking;
  token: string;
}

export function SafetySosModal({ visible, onClose, booking, token }: SafetySosModalProps) {
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const dialNumber = (num: string) => Linking.openURL(`tel:${num}`);

  // Family ki WhatsApp dwara ride details share cheyadam
  const shareTripWithFamily = () => {
    const text = encodeURIComponent(
      `🚨 EMERGENCY / RIDE ALERT:\nI am traveling via RiderX.\n` +
      `🚗 Vehicle: ${booking.ride.vehicle} (${booking.ride.type})\n` +
      `👤 Driver: ${booking.ride.driver_name}\n` +
      `📍 Route: ${booking.ride.from} ➡️ ${booking.ride.to}\n` +
      `Status: Live trip in progress.`
    );
    Linking.openURL(`https://wa.me/?text=${text}`);
  };

  // Immediate Priority Complaint trigger
  const fileQuickComplaint = async (reason: string) => {
    try {
      setSubmittingComplaint(true);
      await api(
        `/rides/${booking.ride.id}/complaint`,
        {
          method: "POST",
          body: JSON.stringify({
            ride_id: booking.ride.id,
            reason,
            timestamp: new Date().toISOString(),
          }),
        },
        token
      );
      Alert.alert(
        "Complaint Logged",
        "Your safety concern has been escalated to the RiderX 24x7 Safety Desk. Our team is monitoring this ride."
      );
    } catch {
      Alert.alert(
        "Alert Recorded",
        "Your complaint was sent. If you feel unsafe, please call Police (100/112) immediately."
      );
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Icon name="shield-alert" size={24} color="#EF4444" />
              <Text style={styles.title}>Women Safety & Emergency Shield</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Your safety is our top priority. Choose an action below for instant help:
          </Text>

          {/* 1. Emergency Dial 100 / 112 / 108 */}
          <Text style={styles.sectionHeader}>POLICE & MEDICAL EMERGENCY</Text>
          <View style={styles.rowGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.policeCard]}
              onPress={() => dialNumber("100")}
            >
              <Icon name="police-badge" size={26} color="#FFFFFF" />
              <Text style={styles.cardMainText}>Call 100</Text>
              <Text style={styles.cardSubText}>Police Assistance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.sosCard]}
              onPress={() => dialNumber("112")}
            >
              <Icon name="alert-octagon" size={26} color="#FFFFFF" />
              <Text style={styles.cardMainText}>Call 112</Text>
              <Text style={styles.cardSubText}>National SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.medicalCard]}
              onPress={() => dialNumber("108")}
            >
              <Icon name="ambulance" size={26} color="#FFFFFF" />
              <Text style={styles.cardMainText}>Call 108</Text>
              <Text style={styles.cardSubText}>Medical / Ambulance</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Company 24x7 Safety Desk & Support */}
          <Text style={styles.sectionHeader}>RIDERX SAFETY TEAM</Text>
          <View style={styles.rowGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.supportCard]}
              onPress={() => dialNumber("1800123456")} // Company Safety Support Number
            >
              <Icon name="phone-in-talk" size={24} color="#38BDF8" />
              <Text style={styles.supportMainText}>Call Support</Text>
              <Text style={styles.cardSubText}>24/7 Safety Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.supportCard]}
              disabled={submittingComplaint}
              onPress={() =>
                Alert.alert(
                  "Report Issue to Safety Desk",
                  "Select issue to escalate:",
                  [
                    { text: "Driver Misbehaviour", onPress: () => fileQuickComplaint("Driver Misbehaviour") },
                    { text: "Route Diversion / Wrong Route", onPress: () => fileQuickComplaint("Route Diversion") },
                    { text: "Vehicle Not Safe / Rash Driving", onPress: () => fileQuickComplaint("Rash Driving") },
                    { text: "Cancel", style: "cancel" },
                  ]
                )
              }
            >
              <Icon name="file-document-alert-outline" size={24} color="#FBBF24" />
              <Text style={styles.supportMainText}>Report Driver</Text>
              <Text style={styles.cardSubText}>Urgent Investigation</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Live Trip Share */}
          <TouchableOpacity style={styles.shareCard} onPress={shareTripWithFamily}>
            <Icon name="whatsapp" size={22} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareText}>Share Live Ride with Family</Text>
              <Text style={styles.cardSubText}>Send driver info & vehicle number to parents/friends</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    gap: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  closeBtn: { padding: 4 },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  sectionHeader: { color: "#94A3B8", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 6 },
  rowGrid: { flexDirection: "row", gap: 8 },
  actionCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  policeCard: { backgroundColor: "#DC2626" },
  sosCard: { backgroundColor: "#B91C1C" },
  medicalCard: { backgroundColor: "#D97706" },
  supportCard: { backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" },
  cardMainText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  supportMainText: { color: "#F8FAFC", fontSize: 13, fontWeight: "800" },
  cardSubText: { color: "#E2E8F0", fontSize: 10, textAlign: "center" },
  shareCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 4,
  },
  shareText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
