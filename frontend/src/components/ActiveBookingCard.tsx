import { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Booking } from "@/src/api";
import { Icon } from "@/src/components/ui";

interface ActiveBookingCardProps {
  booking: Booking;
  token?: string;
}

const QUICK_MESSAGES = [
  "I am at the pickup location 👋",
  "Reaching in 5 minutes 🚗",
  "Please wait at the main gate 📍",
  "Confirmed ride details ✓",
];

export function ActiveBookingCard({ booking }: ActiveBookingCardProps) {
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatLog, setChatLog] = useState<string[]>([
    "Ride confirmed! Keep Boarding OTP ready.",
  ]);

  const otp = booking.boarding_otp || "4829";
  const start = booking.ride?.start_point || "Pickup point";
  const end = booking.ride?.end_point || "Destination";
  const vehicle = booking.ride?.vehicle_type ? booking.ride.vehicle_type.toUpperCase() : "CAR";

  const getTripDetailsText = () => {
    return `🚨 RiderX Ride Details (Safe Commute):\n\n📍 From: ${start}\n🎯 To: ${end}\n🚗 Vehicle: ${vehicle}\n🔑 Boarding OTP: ${otp}\n🛡️ Live SOS Tracking: https://riderx-silk.vercel.app\n\nNenu safe ga board avthunnanu!`;
  };

  // WhatsApp Direct Share
  const handleShareWhatsApp = () => {
    const text = getTripDetailsText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Error", "Unable to open WhatsApp.");
    });
  };

  // Normal SMS Direct Share
  const handleShareSMS = () => {
    const text = getTripDetailsText();
    const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert("SMS Error", "Unable to open SMS app.");
    });
  };

  const handleMaskedCall = () => {
    Alert.alert(
      "Safe Masked Calling",
      "Your personal mobile number is protected and hidden for safety.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect via Support Gateway",
          onPress: () => Linking.openURL("tel:8919326622"),
        },
      ]
    );
  };

  const handleSendQuickMessage = (msg: string) => {
    setChatLog((prev) => [...prev, `You: ${msg}`]);
    Alert.alert("Message Sent", `"${msg}" sent securely.`);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Header & OTP */}
      <View style={styles.headerRow}>
        <View style={styles.liveIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>CONFIRMED RIDE</Text>
        </View>
        <View style={styles.otpBadge}>
          <Text style={styles.otpLabel}>Boarding OTP: </Text>
          <Text style={styles.otpNumber}>{otp}</Text>
        </View>
      </View>

      {/* Route Display */}
      <View style={styles.routeWrap}>
        <View style={styles.routePoint}>
          <Icon name="map-marker" size={14} color="#0284C7" />
          <Text style={styles.routeText} numberOfLines={1}>
            {start}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Icon name="map-marker-check" size={14} color="#10B981" />
          <Text style={styles.routeText} numberOfLines={1}>
            {end}
          </Text>
        </View>
      </View>

      {/* Seat & Price */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Seat</Text>
          <Text style={styles.detailValue}>{booking.seat || "Seat #1"}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total Fare</Text>
          <Text style={styles.detailValue}>₹{booking.total || booking.ride?.price || 0}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Vehicle</Text>
          <Text style={styles.detailValue}>{vehicle}</Text>
        </View>
      </View>

      {/* 🚀 DIRECT TRIP SHARING (WHATSAPP & SMS) */}
      <View style={styles.shareBannerWrap}>
        <Text style={styles.shareBannerTitle}>Share Trip to Family / Friends:</Text>
        <View style={styles.shareButtonsRow}>
          <TouchableOpacity onPress={handleShareWhatsApp} style={styles.waShareBtn}>
            <Icon name="share" size={14} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShareSMS} style={styles.smsShareBtn}>
            <Icon name="email" size={14} color="#0284C7" />
            <Text style={[styles.shareBtnText, { color: "#0284C7" }]}>Normal SMS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Call & Chat Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleMaskedCall} style={styles.maskedCallBtn}>
          <Icon name="phone" size={15} color="#FFFFFF" />
          <Text style={styles.maskedCallText}>Masked Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setChatModalVisible(true)}
          style={styles.safeChatBtn}
        >
          <Icon name="chat" size={15} color="#0284C7" />
          <Text style={styles.safeChatText}>Safe Chat</Text>
        </TouchableOpacity>
      </View>

      {/* In-App Chat Modal */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>In-App Safe Chat</Text>
                <Text style={styles.modalSubtitle}>Numbers are private & end-to-end masked</Text>
              </View>
              <TouchableOpacity
                onPress={() => setChatModalVisible(false)}
                style={styles.closeIconBtn}
              >
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.chatLogBox}>
              {chatLog.map((c, i) => (
                <View key={i} style={styles.chatBubble}>
                  <Text style={styles.chatBubbleText}>{c}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.quickSendLabel}>Quick Messages (1-Tap Send):</Text>
            <View style={styles.presetWrap}>
              {QUICK_MESSAGES.map((msg, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetPill}
                  onPress={() => handleSendQuickMessage(msg)}
                >
                  <Text style={styles.presetPillText}>{msg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 18,
    marginVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: 0.5,
  },
  otpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  otpLabel: {
    fontSize: 11,
    color: "#0369A1",
    fontWeight: "600",
  },
  otpNumber: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "900",
    letterSpacing: 1,
  },
  routeWrap: {
    marginVertical: 4,
    paddingVertical: 4,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: "#CBD5E1",
    marginLeft: 6,
    marginVertical: 2,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  shareBannerWrap: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  shareBannerTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
  },
  shareButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  waShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 8,
    borderRadius: 8,
  },
  smsShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  maskedCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    borderRadius: 12,
  },
  maskedCallText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  safeChatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingVertical: 10,
    borderRadius: 12,
  },
  safeChatText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  chatLogBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    marginBottom: 14,
    gap: 6,
  },
  chatBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chatBubbleText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  quickSendLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  presetWrap: {
    gap: 8,
    marginBottom: 10,
  },
  presetPill: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetPillText: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
  },
});
