import { Stack } from "expo-router";
import { LogBox } from "react-native";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }} />
    );
}