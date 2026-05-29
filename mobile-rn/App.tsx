import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import InventoryScreen from "./src/screens/InventoryScreen";

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <InventoryScreen />
    </SafeAreaView>
  );
}

export default App;
