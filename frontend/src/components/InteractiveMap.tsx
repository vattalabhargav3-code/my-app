import React, { useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface InteractiveMapProps {
  lat: number;
  lon: number;
  onLocationChange?: (lat: number, lon: number) => void;
  height?: number | string;
}

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmhhcmdhdjE4MTkiLCJhIjoiY211bnJxOGJ6MDJnNjJ4cGNucWV3ZTB5ZyJ9.eeQZMTPajF3ggl5E1ovH0Q";

export default function InteractiveMap({
  lat,
  lon,
  onLocationChange,
  height = 320,
}: InteractiveMapProps) {
  const [zoom, setZoom] = useState(14);
  const [currentCoords, setCurrentCoords] = useState({ lat, lon });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  // Props మారినప్పుడు అప్డేట్ అవ్వడానికి
  React.useEffect(() => {
    setCurrentCoords({ lat, lon });
  }, [lat, lon]);

  const zoomIn = () => setZoom((z) => Math.min(z + 1, 18));
  const zoomOut = () => setZoom((z) => Math.max(z - 1, 9));

  // మ్యాప్‌ను మౌస్‌తో లేదా టచ్‌‌తో డ్రాగ్ చేసినప్పుడు కోఆర్డినేట్స్ మార్చే లాజిక్
  const handleMouseDown = (e: any) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX || e.pageX, y: e.clientY || e.pageY };
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging.current) return;
    const clientX = e.clientX || e.pageX;
    const clientY = e.clientY || e.pageY;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;

    if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
      // జూమ్ లెవెల్ బట్టి మూమెంట్ స్పీడ్
      const factor = 0.00015 * Math.pow(2, 14 - zoom);
      const newLon = currentCoords.lon - dx * factor;
      const newLat = currentCoords.lat + dy * factor;

      setCurrentCoords({ lat: newLat, lon: newLon });
      startPos.current = { x: clientX, y: clientY };
      if (onLocationChange) {
        onLocationChange(newLat, newLon);
      }
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${currentCoords.lon.toFixed(
    4
  )},${currentCoords.lat.toFixed(4)},${zoom},0/900x600@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <View
      style={[styles.mapContainer, { height: height as any }]}
      // @ts-ignore Web mouse drag events
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map Image Layer */}
      {/* @ts-ignore */}
      <img
        src={mapUrl}
        alt="Live Map"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "grab",
          userSelect: "none",
        }}
      />

      {/* Rapido Style Center Pin */}
      <View style={styles.fixedPin} pointerEvents="none">
        <View style={styles.pinBubble}>
          <View style={styles.pinDot} />
        </View>
        <View style={styles.pinLeg} />
        <View style={styles.pinShadow} />
      </View>

      {/* Zoom In & Zoom Out Buttons */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} activeOpacity={0.7}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} activeOpacity={0.7}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Recenter or Hint badge */}
      <View style={styles.dragHintBadge} pointerEvents="none">
        <Text style={styles.dragHintText}>🖐️ Drag map to adjust pin</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    position: "relative",
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
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
    elevation: 4,
  },
  pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF" },
  pinLeg: { width: 2.5, height: 8, backgroundColor: "#EF4444" },
  pinShadow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.25)",
    marginTop: 2,
  },
  zoomControls: {
    position: "absolute",
    right: 14,
    bottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    zIndex: 15,
    overflow: "hidden",
  },
  zoomBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  zoomText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dragHintBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 12,
  },
  dragHintText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
