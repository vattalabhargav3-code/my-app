import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "@/src/components/ui";
import { colors } from "@/src/theme";

interface ChatMessage {
  id: string;
  sender: "me" | "other";
  text: string;
  time: string;
}

interface RideChatModalProps {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  rideId: string;
  role: "passenger" | "driver";
}

const QUICK_PROMPTS = [
  "I am at the pickup point",
  "Traffic jam, 5 mins delay",
  "Arrived at landmark",
  "Where are you currently?",
];

export function RideChatModal({
  visible,
  onClose,
  recipientName,
  rideId,
  role,
}: RideChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "other",
      text: `Hello! I am your ${role === "passenger" ? "driver" : "passenger"}. Safe journey!`,
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: content,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInput("");
  };

  // Masked calling (Privacy proxy call)
  const handleMaskedCall = () => {
    Alert.alert(
      "Privacy Masked Call",
      `Connecting to ${recipientName} via Safarway Secure Proxy. Your real phone number will remain hidden.`,
      [
        {
          text: "Connect Secure Call",
          onPress: () => {
            // Virtual proxy routing dialer
            Linking.openURL("tel:1800123456");
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header with Masked Call action */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{recipientName}</Text>
            <View style={styles.privacyPill}>
              <Icon name="shield-check" size={12} color="#22C55E" />
              <Text style={styles.privacyText}>Number Masked & Protected</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleMaskedCall} style={styles.callBtn}>
            <Icon name="phone" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Chat message thread */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === "me" ? styles.myBubble : styles.otherBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.sender === "me" ? styles.myBubbleText : styles.otherBubbleText,
                ]}
              >
                {item.text}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  item.sender === "me" ? styles.myBubbleTime : styles.otherBubbleTime,
                ]}
              >
                {item.time}
              </Text>
            </View>
          )}
        />

        {/* Quick Responses */}
        <View style={styles.quickWrap}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickChip}
              onPress={() => sendMessage(prompt)}
            >
              <Text style={styles.quickText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text Input Footer */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a secure message..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendBtn}>
            <Icon name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 14,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backBtn: {
    padding: 6,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  privacyText: {
    color: "#22C55E",
    fontSize: 11,
    fontWeight: "600",
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "78%",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 14,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1E293B",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#334155",
  },
  bubbleText: {
    fontSize: 14,
  },
  myBubbleText: {
    color: "#0F172A",
    fontWeight: "600",
  },
  otherBubbleText: {
    color: "#F8FAFC",
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myBubbleTime: {
    color: "rgba(15, 23, 42, 0.65)",
  },
  otherBubbleTime: {
    color: "#94A3B8",
  },
  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  quickChip: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickText: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1E293B",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
