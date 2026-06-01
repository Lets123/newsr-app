import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const APP_URL = "https://newsr-app.onrender.com";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <View style={styles.container}>
        <WebView source={{ uri: APP_URL }} style={styles.webview} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1 },
  webview: { flex: 1 },
});
