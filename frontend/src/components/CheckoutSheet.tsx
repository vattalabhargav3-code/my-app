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
  const [processing, setProcessing] = useState(false);

  // Platform Escrow UPI Configuration
  const platformUPI = "8919326622@ybl";
  const platformName = "RiderX Escrow";
  const farePerSeat = ride.price_per_seat || 90;
  const platformFee = 5;
  const totalAmount = farePerSeat * selectedSeats + platformFee;

  const txnRef = `RX_${ride.id.slice(-4)}_${Date.now().toString().slice(-4)}`;
  const baseUpiParams = `pa=${platformUPI}&pn=${encodeURIComponent(platformName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(txnRef)}`;
  
  const genericUpiUrl = `upi://pay?${baseUpiParams}`;
  const gpayUrl = `gpay://upi/pay?${baseUpiParams}`;
  const phonepeUrl = `phonepe://pay?${baseUpiParams}`;
  const paytmUrl = `paytmmp://pay?${baseUpiParams}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(genericUpiUrl)}`;

  const handleOpenUPI = async (appUrl: string) => {
    try {
      if (Platform.OS === "web") {
        window.location.href = appUrl;
      } else {
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
          await Linking.openURL(appUrl);
        } else {
          await Linking.openURL(genericUpiUrl);
        }
      }
    } catch {
      Linking.openURL(genericUpiUrl);
    }
  };

  // Passenger confirms payment -> Booking gets created with status 'paid_escrow'
  const handlePaymentDoneAndBook = () => {
    setProcessing(true);
    const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const createdBooking: any = {
      id: "bk_" + Date.now(),
      ride_id: ride.id,
      passenger_id: "usr_passenger_current",
      passenger_name: "Bhargav",
      pickup_point: ride.from_location,
      destination_point: ride.to_location,
      seats_booked: selectedSeats,
      fare_paid: farePerSeat * selectedSeats,
      total_price: totalAmount,
      status: "confirmed",
      otp: rideOtp,
      payment_status: "paid_in_escrow", // Held safely in platform escrow
      created_at: new Date().toISOString(),
    };

    // Save active booking in local shared state so driver can verify it
    if (typeof window !== "undefined") {
      try {
        const pendingList = JSON.parse(localStorage.getItem("riderx_pending_escrow_rides") || "[]");
        pendingList.push({
          ...createdBooking,
          driver_payout_amount: farePerSeat * selectedSeats,
        });
        localStorage.setItem("riderx_pending_escrow_rides", JSON.stringify(pendingList));
      } catch {}
    }

    setTimeout(() => {
      setProcessing(false);
      const alertMsg = `Payment Successful: ₹${totalAmount}\n\nYour Ride Start OTP: ${rideOtp}\n\nShare this 4-digit OTP with your driver once you reach your destination to complete the trip.`;
      
      if (Platform.OS === "web") {
        window.alert(`🎉 BOOKING CONFIRMED!\n\n${alertMsg}`);
      } else {
        Alert.alert("🎉 Booking Confirmed!", alertMsg);
      }
      onBooked(createdBooking);
    }, 1200);
  };

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.sheetHeader}>
        <View>
          <Text style={styles.sheetTitle}>Complete Payment to Book</Text>
          <Text style={styles.sheetSubtitle}>Amount remains safe in escrow until you reach destination</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Icon name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      <View style={styles.qrCard}>
        <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
        <Text style={styles.qrNote}>Scan to Pay ₹{totalAmount}</Text>
        <Text style={styles.escrowBadge}>🛡️ RiderX Escrow Protected</Text>
      </View>

      {/* UPI Apps Row */}
      <Text style={styles.orText}>OR PAY DIRECTLY WITH APP</Text>
      <View style={styles.appButtonsRow}>
        <TouchableOpacity
          onPress={() => handleOpenUPI(gpayUrl)}
          style={[styles.appBtn, { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }]}
        >
          <Text style={styles.appEmoji}>🟢</Text>
          <Text style={[styles.appBtnTitle, { color: "#166534" }]}>Google Pay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleOpenUPI(phonepeUrl)}
          style={[styles.appBtn, { backgroundColor: "#FAF5FF", borderColor: "#D8B4FE" }]}
        >
          <Text style={styles.appEmoji}>🟣</Text>
          <Text style={[styles.appBtnTitle, { color: "#6B21A8" }]}>PhonePe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleOpenUPI(paytmUrl)}
          style={[styles.appBtn, { backgroundColor: "#F0F9FF", borderColor: "#7DD3FC" }]}
        >
          <Text style={styles.appEmoji}>🔵</Text>
          <Text style={[styles.appBtnTitle, { color: "#0369A1" }]}>Paytm</Text>
        </TouchableOpacity>
      </View>

      {/* Fare Breakdown */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summaryLabel}>Total Fare (with ₹5 Safety Fee)</Text>
          <Text style={styles.summaryAmount}>₹{totalAmount}</Text>
        </View>

        <View style={styles.counterRow}>
          <TouchableOpacity
            disabled={selectedSeats <= 1}
            onPress={() => setSelectedSeats((s) => s - 1)}
            style={[styles.counterBtn, selectedSeats <= 1 && { opacity: 0.3 }]}
          >
            <Text style={styles.counterBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterVal}>{selectedSeats} Seat{selectedSeats > 1 ? "s" : ""}</Text>
          <TouchableOpacity
            disabled={selectedSeats >= (ride.available_seats || 3)}
            onPress={() => setSelectedSeats((s) => s + 1)}
            style={[styles.counterBtn, selectedSeats >= (ride.available_seats || 3) && { opacity: 0.3 }]}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={processing}
        onPress={handlePaymentDoneAndBook}
        style={styles.doneBtn}
      >
        {processing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.doneBtnText}>I Completed Payment (Confirm Ride) ➔</Text>
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
    alignItems: "center",
  },
  sheetHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 11,
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
  qrCard: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
    width: "100%",
  },
  qrImage: {
    width: 140,
    height: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  qrNote: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 6,
  },
  escrowBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
    marginTop: 2,
  },
  orText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  appButtonsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  appBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  appEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  appBtnTitle: {
    fontSize: 11,
    fontWeight: "800",
  },
  summaryBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0284C7",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  counterVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  doneBtn: {
    width: "100%",
    backgroundColor: "#0284C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
