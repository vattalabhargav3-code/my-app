import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Booking, Ride } from "@/src/api";
import { Icon } from "@/src/components/ui";

interface CheckoutSheetProps {
  ride: Ride;
  token: string;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}

export function CheckoutSheet({ ride, token, onClose, onBooked }: CheckoutSheetProps) {
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"upi_intent" | "upi_qr">("upi_intent");
  const [processing, setProcessing] = useState(false);

  // Platform UPI Configuration
  const receiverUPI = "8919326622@ybl";
  const receiverName = "RiderX Commute";
  const farePerSeat = ride.price_per_seat || 90;
  const platformFee = 5;
  const totalAmount = farePerSeat * selectedSeats + platformFee;

  // Standard UPI URI format
  const upiTransactionNote = `Ride_${ride.id.slice(-5)}_${Date.now().toString().slice(-4)}`;
  const upiUrl = `upi://pay?pa=${receiverUPI}&pn=${encodeURIComponent(
    receiverName
  )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(upiTransactionNote)}`;

  // Quick QR API URL for scanning via web/desktop
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiUrl
  )}`;

  const handleUpiAppRedirect = async () => {
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported || Platform.OS === "android" || Platform.OS === "ios") {
        await Linking.openURL(upiUrl);
      } else {
        setPaymentMethod("upi_qr");
      }
    } catch {
      setPaymentMethod("upi_qr");
    }
  };

  const handleConfirmOnlinePayment = () => {
    setProcessing(true);

    // Dynamic 4-digit ride OTP for security
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking: Booking = {
      id: "bk_" + Date.now(),
      ride_id: ride.id,
      passenger_id: "usr_passenger_current",
      passenger_name: "Bhargav",
      pickup_point: ride.from_location,
      destination_point: ride.to_location,
      seats_booked: selectedSeats,
      total_price: totalAmount,
      status: "confirmed",
      otp: generatedOtp,
      payment_mode: paymentMethod,
      payment_status: "completed",
    } as any;

    setTimeout(() => {
      setProcessing(false);
      const successMessage = `Online Payment Successful (₹${totalAmount})!\n\nYour Ride Start OTP: ${generatedOtp}\nShare this OTP with your driver upon boarding.`;
      
      if (Platform.OS === "web") {
        window.alert(`🎉 ${successMessage}`);
      } else {
        Alert.alert("Ride Booked Successfully!", successMessage);
      }
      onBooked(newBooking);
    }, 1200);
  };

  return (
    <View style={styles.sheetContainer}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View>
          <Text style={styles.sheetTitle}>Online Checkout</Text>
          <Text style={styles.sheetSubtitle}>100% Secure Digital Commute Payment</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Icon name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Ride Overview Card */}
      <View style={styles.routeCard}>
        <Text style={styles.driverName}>Driver: {ride.driver_name || "Verified Partner"}</Text>
        <Text style={styles.routePath}>
          {ride.from_location} ➔ {ride.to_location}
        </Text>
        <Text style={styles.departureInfo}>Departure: {ride.departure_time || "Today shortly"}</Text>
      </View>

      {/* Seat Count Selector */}
      <View style={styles.seatRow}>
        <Text style={styles.seatLabel}>Number of Seats</Text>
        <View style={styles.seatCounter}>
          <TouchableOpacity
            disabled={selectedSeats <= 1}
            onPress={() => setSelectedSeats((s) => s - 1)}
            style={[styles.countBtn, selectedSeats <= 1 && styles.countBtnDisabled]}
          >
            <Text style={styles.countBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.seatNum}>{selectedSeats}</Text>
          <TouchableOpacity
            disabled={selectedSeats >= (ride.available_seats || 3)}
            onPress={() => setSelectedSeats((s) => s + 1)}
            style={[
              styles.countBtn,
              selectedSeats >= (ride.available_seats || 3) && styles.countBtnDisabled,
            ]}
          >
            <Text style={styles.countBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Online Payment Method Tabs (No Cash) */}
      <Text style={styles.sectionHeading}>ONLINE PAYMENT METHOD</Text>
      <View style={styles.paymentMethodsGrid}>
        <TouchableOpacity
          onPress={() => setPaymentMethod("upi_intent")}
          style={[styles.methodCard, paymentMethod === "upi_intent" && styles.methodCardActive]}
        >
          <Text style={styles.methodEmoji}>⚡</Text>
          <Text style={[styles.methodTitle, paymentMethod === "upi_intent" && styles.activeText]}>
            Instant UPI App
          </Text>
          <Text style={styles.methodSub}>Google Pay / PhonePe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPaymentMethod("upi_qr")}
          style={[styles.methodCard, paymentMethod === "upi_qr" && styles.methodCardActive]}
        >
          <Text style={styles.methodEmoji}>📱</Text>
          <Text style={[styles.methodTitle, paymentMethod === "upi_qr" && styles.activeText]}>
            Scan & Pay QR
          </Text>
          <Text style={styles.methodSub}>Any Banking / UPI App</Text>
        </TouchableOpacity>
      </View>

      {/* UPI Deep-Link Action Button */}
      {paymentMethod === "upi_intent" && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUpiAppRedirect}
          style={styles.openUpiBtn}
        >
          <Text style={styles.openUpiBtnText}>Open Installed UPI App (₹{totalAmount}) ➔</Text>
        </TouchableOpacity>
      )}

      {/* QR Code Container */}
      {paymentMethod === "upi_qr" && (
        <View style={styles.qrContainer}>
          <Image source={{ uri: qrApiUrl }} style={styles.qrImage} resizeMode="contain" />
          <Text style={styles.qrNote}>Scan using any UPI App to Pay</Text>
          <Text style={styles.qrUpiTag}>Receiver: {receiverUPI}</Text>
        </View>
      )}

      {/* Fare Breakdown */}
      <View style={styles.fareBreakdown}>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Seat Fare ({selectedSeats}x)</Text>
          <Text style={styles.fareVal}>₹{farePerSeat * selectedSeats}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Platform Safety & Tech Fee</Text>
          <Text style={styles.fareVal}>₹{platformFee}</Text>
        </View>
        <View style={[styles.fareRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Payable Online</Text>
          <Text style={styles.totalVal}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Verify & Pay Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={processing}
        onPress={handleConfirmOnlinePayment}
        style={styles.confirmBtn}
      >
        {processing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmBtnText}>Pay Online & Confirm (₹{totalAmount})</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: "100%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  routeCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  driverName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0284C7",
  },
  routePath: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 4,
  },
  departureInfo: {
    fontSize: 11,
    color: "#64748B",
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  seatLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  seatCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  countBtnDisabled: {
    opacity: 0.4,
  },
  countBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  seatNum: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  paymentMethodsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  methodCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodCardActive: {
    borderColor: "#0284C7",
    backgroundColor: "#F0F9FF",
  },
  methodEmoji: {
    fontSize: 20,
    marginBottom: 3,
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  activeText: {
    color: "#0284C7",
  },
  methodSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  openUpiBtn: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  openUpiBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  qrImage: {
    width: 140,
    height: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  qrNote: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginTop: 8,
  },
  qrUpiTag: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  fareBreakdown: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    gap: 4,
    marginBottom: 14,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fareLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  fareVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  totalVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0284C7",
  },
  confirmBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
