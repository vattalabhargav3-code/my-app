import React, { useEffect, useRef, useState } from "react";
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
import { Icon } from "@/src/components/ui";

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (placeName: string, lat: number, lon: number) => void;
  title?: string;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiYmhhcmdhdjE4MTkiLCJhIjoiY211bnJxOGJ6MDJnNjJ4cGNucWV3ZTB5ZyJ9.eeQZMTPajF3ggl5E1ovH0Q";

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  title = "Set your location",
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [centerCoords, setCenterCoords] = useState({ lat: 17.3457, lon: 78.5522 }); // Sagar Road / Hyderabad Corridor
  const [pickedAddress, setPickedAddress] = useState("Locating your point...");
  const [detecting, setDetecting] = useState(false);

  // Mapbox Fastest Autocomplete (Focused on Telangana / AP)
  const searchPlaces = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        text.trim()
      )}.json?access_token=${MAPBOX_TOKEN}&country=in&proximity=78.55,17.34&types=neighborhood,locality,place,poi,address&limit=5`;

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

  // Reverse geocoding on pin drag/movement
  const reverseGeocode = async (lat: number, lon: number) => {
    setDetecting(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&types=neighborhood,locality,place,poi,address&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        setPickedAddress(data.features[0].place_name);
      } else {
        setPickedAddress(`Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch {
      setPickedAddress("Hyderabad Corridor");
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (visible) {
      reverseGeocode(centerCoords.lat, centerCoords.lon);
    }
  }, [visible]);

  const handleSelectSearchResult = (feature: any) => {
    const lon = feature.center[0];
    const lat = feature.center[1];
    setCenterCoords({ lat, lon });
    setPickedAddress(feature.place_name);
    setQuery("");
    setResults([]);
    reverseGeocode(lat, lon);
  };

  const handleConfirmLocation = () => {
    const cleanShortName = pickedAddress.split(",")[0] + ", " + (pickedAddress.split(",")[1] || "Hyderabad").trim();
    onSelect(cleanShortName, centerCoords.lat, centerCoords.lon);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Full-screen fast interactive Mapbox Webview */}
        <View style={styles.mapFullscreen}>
          <iframe
            title="mapbox-live"
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=true&access_token=${MAPBOX_TOKEN}#15/${centerCoords.lat}/${centerCoords.lon}`}
            style={{ width: "100%", height: "100%", border: "none" }}
          />

          {/* Center Target Pin (Uber/Rapido style) */}
          <View style={styles.fixedPinContainer} pointerEvents="none">
            <View style={styles.pinBubble}>
              <View style={styles.pinCenterDot} />
            </View>
            <View style={styles.pinStem} />
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* Top Floating Header & Search */}
        <View style={styles.topFloatHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backCircleBtn}>
            <Icon name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Icon name="magnify" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pickup or destination area..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={searchPlaces}
            />
            {loading && <ActivityIndicator size="small" color="#0284C7" />}
          </View>
        </View>

        {/* Dropdown search autocomplete results */}
        {results.length > 0 && (
          <View style={styles.searchResultsDropdown}>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <Icon name="map-marker-outline" size={18} color="#0284C7" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resPrimaryText}>{item.text}</Text>
                    <Text style={styles.resSecondaryText} numberOfLines={1}>
                      {item.place_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Bottom Sheet Card (Uber/Rapido style) */}
        <View style={styles.bottomCard}>
          <Text style={styles.cardInstruction}>Select your location</Text>
          <Text style={styles.cardSubInstruction}>Move the map or search to adjust point</Text>

          <View style={styles.locationPreviewBox}>
            <View style={styles.activeDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewAddressText} numberOfLines={2}>
                {detecting ? "Locating exact spot..." : pickedAddress}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConfirmLocation}
            style={styles.confirmActionButton}
          >
            <Text style={styles.confirmActionButtonText}>Confirm Location ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  mapFullscreen: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  fixedPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -36 }],
    alignItems: "center",
  },
  pinBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  pinCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  pinStem: {
    width: 3,
    height: 10,
    backgroundColor: "#DC2626",
  },
  pinShadow: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.25)",
    marginTop: 1,
  },
  topFloatHeader: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  searchResultsDropdown: {
    position: "absolute",
    top: 105,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxHeight: 220,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  resPrimaryText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  resSecondaryText: {
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
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  cardInstruction: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSubInstruction: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 12,
  },
  locationPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  previewAddressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  confirmActionButton: {
    backgroundColor: "#FFC000", // Rapido / Uber Style Prominent Yellow/Gold
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmActionButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
});
