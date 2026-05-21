import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";

const API_BASE_URL = "http://10.0.2.2:4000";

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Request failed: ${response.status}`);
  return payload;
}

function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [markupPercentage, setMarkupPercentage] = useState("25");
  const [stock, setStock] = useState("");
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await parseJsonResponse(await fetch(`${API_BASE_URL}/api/v1/inventory`));
      setProducts(data || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const calculatedSellingPrice = useMemo(() => {
    const cost = Number(costPrice);
    const markup = Number(markupPercentage);
    if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(markup)) {
      return "";
    }
    return (cost * (1 + markup / 100)).toFixed(2);
  }, [costPrice, markupPercentage]);

  const handleImageSelect = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1, includeBase64: true });
    if (result.didCancel || result.errorCode || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setImageDataUrl(`data:${asset.type || "image/jpeg"};base64,${asset.base64}`);
  };

  const handleImageCapture = async () => {
    const result = await launchCamera({
      mediaType: "photo",
      cameraType: "back",
      saveToPhotos: true,
      includeBase64: true,
    });
    if (result.didCancel || result.errorCode || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setImageDataUrl(`data:${asset.type || "image/jpeg"};base64,${asset.base64}`);
  };

  const resetForm = () => {
    setImageDataUrl(null);
    setSku("");
    setName("");
    setCostPrice("");
    setSellingPrice("");
    setMarkupPercentage("25");
    setStock("");
    setAutoCalculate(false);
  };

  const handleSubmit = async () => {
    const finalPrice = autoCalculate ? calculatedSellingPrice : sellingPrice;
    if (!sku || !name || !finalPrice) return;

    try {
      setLoading(true);
      await parseJsonResponse(
        await fetch(`${API_BASE_URL}/api/v1/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku,
            name,
            image: imageDataUrl || "",
            costPrice: Number(costPrice || 0),
            sellingPrice: Number(finalPrice || 0),
            stock: Number(stock || 0),
            reorderLevel: 0,
          }),
        }),
      );

      await loadInventory();
      resetForm();
      setError("");
    } catch (submitError) {
      setError(submitError.message || "Could not save product.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const margin =
      item.costPrice > 0 ? (((item.sellingPrice - item.costPrice) / item.costPrice) * 100).toFixed(1) : "0.0";
    return (
      <View style={styles.row}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.thumbText}>No Img</Text>
          </View>
        )}
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          <Text style={styles.rowText}>SKU: {item.sku}</Text>
          <Text style={styles.rowText}>Cost: ${Number(item.costPrice || 0).toFixed(2)}</Text>
          <Text style={styles.rowText}>Selling: ${Number(item.sellingPrice || 0).toFixed(2)}</Text>
          <Text style={styles.rowText}>Margin: {margin}%</Text>
          <Text style={styles.rowText}>Stock: {item.stock}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Inventory (Android)</Text>
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.buttons}>
        <Button title="Select Image" onPress={handleImageSelect} />
        <View style={styles.buttonGap} />
        <Button title="Capture Image" onPress={handleImageCapture} />
      </View>

      {imageDataUrl ? <Image source={{ uri: imageDataUrl }} style={styles.preview} /> : null}

      <TextInput value={sku} onChangeText={setSku} placeholder="SKU" style={styles.input} />
      <TextInput value={name} onChangeText={setName} placeholder="Product Name" style={styles.input} />
      <TextInput
        value={costPrice}
        onChangeText={setCostPrice}
        placeholder="Cost Price"
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        value={markupPercentage}
        onChangeText={setMarkupPercentage}
        placeholder="Markup %"
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Auto-calc selling price</Text>
        <Switch value={autoCalculate} onValueChange={setAutoCalculate} />
      </View>

      <TextInput
        value={autoCalculate ? calculatedSellingPrice : sellingPrice}
        onChangeText={setSellingPrice}
        placeholder="Selling Price"
        keyboardType="numeric"
        editable={!autoCalculate}
        style={[styles.input, autoCalculate && styles.inputDisabled]}
      />
      <TextInput
        value={stock}
        onChangeText={setStock}
        placeholder="Stock Qty"
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitLabel}>{loading ? "Saving..." : "Add Product"}</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#0f766e" style={{ marginTop: 8 }} /> : null}

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  error: {
    color: "#b91c1c",
    fontWeight: "600",
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  buttonGap: {
    width: 10,
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#e5e7eb",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 8,
  },
  submitLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 24,
    gap: 8,
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 24,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
  },
  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbText: {
    fontSize: 11,
    color: "#475569",
  },
  rowContent: {
    marginLeft: 10,
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  rowText: {
    fontSize: 12,
    color: "#334155",
  },
});

export default InventoryScreen;
