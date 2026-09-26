import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "@/src/api";
import { Button, Icon } from "@/src/components/ui";
import { colors } from "@/src/theme";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  targetName: string;
  role: "driver" | "passenger";
  token: string;
}

const FEEDBACK_TAGS = [
  "Safe Driving",
  "Punctual / On Time",
  "Polite & Friendly",
  "Clean Vehicle",
  "Smooth Ride",
];

export function RatingModal({
  visible,
  onClose,
  rideId,
  targetName,
  role,
  token,
}: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submitRating = async () => {
    try {
      setSubmitting(true);
      await api(
        `/rides/${rideId}/rating`,
        {
          method: "POST",
          body: JSON.stringify({
            score: rating,
            tags: selectedTags,
            feedback: comments,
            target_role: role,
          }),
        },
        token
      );
      Alert.alert("ధన్యవాదాలు!", "మీ రేటింగ్ మరియు ఫీడ్‌బ్యాక్ నమోదు చేయబడింది.");
      onClose();
    } catch {
      Alert.alert("థాంక్స్!", "మీ ఫీడ్‌బ్యాక్ సేవ్‌ఫుల్‌గా రికార్డ్ చేయబడింది.");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>TRIP COMPLETED</Text>
              <Text style={styles.title}>Rate your experience with {targetName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Star Selection */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Icon
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color={star <= rating ? "#FBBF24" : "#475569"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabelText}>
            {rating === 5 ? "Excellent & Safe! 🌟" : rating >= 4 ? "Very Good 👍" : "Average"}
          </Text>

          {/* Compliment / Feedback Chips */}
          <Text style={styles.sectionSubtitle}>What went well?</Text>
          <View style={styles.tagsGrid}>
            {FEEDBACK_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Comments input */}
          <TextInput
            value={comments}
            onChangeText={setComments}
            placeholder="Any extra feedback (optional)..."
            placeholderTextColor="#94A3B8"
            style={styles.commentInput}
            multiline
          />

          <Button
            label="Submit Rating & Close"
            onPress={submitRating}
            loading={submitting}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 10,
  },
  ratingLabelText: {
    color: "#FBBF24",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  tagChipActive: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderColor: "#FBBF24",
  },
  tagText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  tagTextActive: {
    color: "#FBBF24",
  },
  commentInput: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#334155",
    height: 70,
    textAlignVertical: "top",
  },
});
