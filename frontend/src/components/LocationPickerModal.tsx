import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (placeName: string, lat: number, lon: number) => void;
  title?: string;
}

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmhhcmdhdjE4MTkiLCJhIjoiY211bnJxOGJ6MDJnNjJ4cGNucWV3ZTB5ZyJ9.eeQZMTPajF3ggl5E1ovH0Q";

const QUICK_HUBS = [
  { name: "Hitec City", lat: 17.4435, lon: 78.3772 },
  { name: "Madhapur", lat: 17.4483, lon: 78.3915 },
  { name: "Gachibowli", lat: 17.4401, lon: 78.3489 },
  { name: "LB Nagar", lat: 17.3457, lon: 78.5522 },
  { name: "Kukatpally", lat: 17.4947, lon: 78.3996 },
  { name: "Secunderabad", lat: 17.4399, lon: 78.4983 },
  { name: "Dilsukhnagar", lat: 17.3688, lon: 78.5247 },
  { name: "Banjara Hills", lat: 17.4156, lon: 78.4357 },
  { name: "Financial District", lat: 17.4141, lon: 78.3412 },
];

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  title = "Set your location",
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: 17.4435, lon: 78.3772 });
  const [address, setAddress] = useState("Hitec City, Hyderabad");

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        text.trim()
      )}.json?access_token=${MAPBOX_TOKEN}&country=in&proximity=78.4867,17.3850&types=neighborhood,locality,place,poi,address&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.features) {
        setResults(data.features);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const pickLocation = (name: string, lat: number, lon: number) => {
    setCoords({ lat, lon });
    setAddress(name);
    setQuery("");
    setResults([]);
  };

  const handleConfirm = () => {
    onSelect(address, coords.lat, coords.lon);
    onClose();
  };

  const mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${coords.lon},${coords.lat},14.5,0/800x600@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Dynamic Static Map Background (Web-safe render) */}
        <View style={styles.mapLayer}>
          {/* @ts-ignore */}
          <img
            src={mapImageUrl}
            alt="Location Map"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          <View style={styles.fixedPin} pointerEvents="none">
            <View style={styles.pinBubble}>
              <View style={styles.pinDot} />
            </View>
            <View style={styles.pinLeg} />
          </View>
        </View>

        {/* Top Header with Back button & Live Search */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <Text style={styles.searchIconText}>🔍</Text>
            <TextInput
              style={styles.input}
              placeholder="Search any colony, metro or area..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={handleSearch}
            />
            {loading && <ActivityIndicator size="small" color="#0284C7" />}
          </View>
        </View>

        {/* Live Search Autocomplete Results Dropdown */}
        {results.length > 0 && (
          <View style={styles.resultsBox}>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resRow}
                  onPress={() => {
                    const shortName = item.text + ", Hyderabad";
                    pickLocation(shortName, item.center[1], item.center[0]);
                  }}
                >
                  <Text style={styles.resPinIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resPrimary}>{item.text}</Text>
                    <Text style={styles.resSecondary} numberOfLines={1}>
                      {item.place_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Bottom Sheet for Confirming Selection */}
        <View style={styles.bottomCard}>
          <Text style={styles.sheetHeading}>{title}</Text>
          <Text style={styles.sheetSub}>Tap quick hubs or type any area above to update pin</Text>

          <View style={styles.chipsWrap}>
            {QUICK_HUBS.map((hub) => (
              <TouchableOpacity
                key={hub.name}
                onPress={() => pickLocation(`${hub.name}, Hyderabad`, hub.lat, hub.lon)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{hub.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.selectedRow}>
            <View style={styles.redDot} />
            <Text style={styles.selectedText} numberOfLines={2}>
              {address}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleConfirm}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmBtnText}>Confirm Location ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Named మరియు Default exports రెండూ ఇవ్వడం వల్ల ఏ ఇంపోర్ట్ మిస్సింగ్ ఎర్రర్ రాదు
export default LocationPickerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  mapLayer: {
    flex: 1,
    width: "100%",
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  fixedPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -28 }],
    alignItems: "center",
    zIndex: 10,
  },
  pinBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  pinLeg: {
    width: 2.5,
    height: 8,
    backgroundColor: "#EF4444",
  },
  topHeader: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 100,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    elevation: 4,
  },
  searchIconText: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  resultsBox: {
    position: "absolute",
    top: 95,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    maxHeight: 220,
    paddingVertical: 6,
    elevation: 6,
    zIndex: 101,
  },
  resRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  resPinIcon: {
    fontSize: 16,
  },
  resPrimary: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  resSecondary: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    elevation: 8,
    zIndex: 90,
  },
  sheetHeading: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  sheetSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  selectedText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: "#FFC000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
});
