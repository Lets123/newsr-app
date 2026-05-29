import React, { useMemo, useState } from "react";
import {
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
import {
  calculateSellingPrice,
  isSellingPriceValid,
  lookupProductByCode,
  normalizeProductCode,
} from "../utils/inventoryLogic";

type Product = {
  id: string;
  productCode: string;
  name: string;
  category: string;
  image: string | null;
  costPrice: number;
  sellingPrice: number;
  stock: number;
};

function InventoryScreen(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [markupPercentage, setMarkupPercentage] = useState("25");
  const [stock, setStock] = useState("");
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [codeHint, setCodeHint] = useState("");
  const [formError, setFormError] = useState("");
  const [detailsAutofilledFromCode, setDetailsAutofilledFromCode] = useState(false);

  const calculatedSellingPrice = useMemo(() => {
    return calculateSellingPrice(costPrice, markupPercentage);
  }, [costPrice, markupPercentage]);

  const handleImageSelect = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1 });
    if (result.didCancel || result.errorCode || !result.assets?.length) return;
    setImageUri(result.assets[0].uri || null);
  };

  const handleImageCapture = async () => {
    const result = await launchCamera({ mediaType: "photo", cameraType: "back", saveToPhotos: true });
    if (result.didCancel || result.errorCode || !result.assets?.length) return;
    setImageUri(result.assets[0].uri || null);
  };

  const resetForm = () => {
    setImageUri(null);
    setProductCode("");
    setName("");
    setCategory("");
    setCostPrice("");
    setSellingPrice("");
    setMarkupPercentage("25");
    setStock("");
    setAutoCalculate(false);
    setCodeHint("");
    setFormError("");
    setDetailsAutofilledFromCode(false);
  };

  const applyProductCodeLookup = (rawCode: string, showNotFoundHint: boolean) => {
    const normalizedCode = normalizeProductCode(rawCode);
    if (!normalizedCode) {
      setCodeHint("");
      if (detailsAutofilledFromCode) {
        setName("");
        setCategory("");
        setDetailsAutofilledFromCode(false);
      }
      return;
    }

    const mapped = lookupProductByCode(normalizedCode);
    if (mapped) {
      setName(mapped.name);
      setCategory(mapped.category);
      setCodeHint("");
      setDetailsAutofilledFromCode(true);
      return;
    }

    if (detailsAutofilledFromCode) {
      setName("");
      setCategory("");
    }
    setDetailsAutofilledFromCode(false);
    setCodeHint(showNotFoundHint ? "Code not found in mapping; enter details manually." : "");
  };

  const handleProductCodeBlur = () => {
    const normalizedCode = normalizeProductCode(productCode);
    if (normalizedCode !== productCode) {
      setProductCode(normalizedCode);
    }
    applyProductCodeLookup(normalizedCode, true);
  };

  const handleSubmit = () => {
    const normalizedCode = normalizeProductCode(productCode);
    const normalizedName = name.trim();
    const normalizedCategory = category.trim();
    const finalPrice = autoCalculate ? calculatedSellingPrice : sellingPrice;
    const parsedCostPrice = Number(costPrice);
    const parsedSellingPrice = Number(finalPrice);

    if (!normalizedCode || !normalizedName || !normalizedCategory || !costPrice || !finalPrice) {
      setFormError("Please fill Product Code, Product Name, Category, Cost Price, and Selling Price.");
      return;
    }

    if (!Number.isFinite(parsedCostPrice) || !Number.isFinite(parsedSellingPrice)) {
      setFormError("Cost Price and Selling Price must be valid numbers.");
      return;
    }

    if (!isSellingPriceValid(parsedCostPrice, parsedSellingPrice)) {
      setFormError("Selling Price must be greater than or equal to Cost Price.");
      return;
    }

    setFormError("");

    const next: Product = {
      id: Date.now().toString(),
      productCode: normalizedCode,
      name: normalizedName,
      category: normalizedCategory,
      image: imageUri,
      costPrice: parsedCostPrice,
      sellingPrice: parsedSellingPrice,
      stock: Number(stock || 0),
    };
    setProducts((prev) => [next, ...prev]);
    resetForm();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Inventory (Android)</Text>

      <View style={styles.buttons}>
        <Button title="Select Image" onPress={handleImageSelect} />
        <View style={styles.buttonGap} />
        <Button title="Capture Image" onPress={handleImageCapture} />
      </View>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      <TextInput
        value={productCode}
        onChangeText={(value) => {
          setProductCode(value);
          applyProductCodeLookup(value, false);
          setFormError("");
        }}
        onBlur={handleProductCodeBlur}
        placeholder="Product Code"
        style={styles.input}
      />
      {codeHint ? <Text style={styles.hintText}>{codeHint}</Text> : null}
      <TextInput
        value={name}
        onChangeText={(value) => {
          setName(value);
          setDetailsAutofilledFromCode(false);
          setFormError("");
        }}
        placeholder="Product Name"
        style={styles.input}
      />
      <TextInput
        value={category}
        onChangeText={(value) => {
          setCategory(value);
          setDetailsAutofilledFromCode(false);
          setFormError("");
        }}
        placeholder="Category"
        style={styles.input}
      />
      <TextInput
        value={costPrice}
        onChangeText={(value) => {
          setCostPrice(value);
          setFormError("");
        }}
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
        onChangeText={(value) => {
          setSellingPrice(value);
          setFormError("");
        }}
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

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitLabel}>Add Product</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const margin =
            item.costPrice > 0
              ? (((item.sellingPrice - item.costPrice) / item.costPrice) * 100).toFixed(1)
              : "0.0";

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
                <Text style={styles.rowText}>Code: {item.productCode}</Text>
                <Text style={styles.rowText}>Category: {item.category}</Text>
                <Text style={styles.rowText}>Cost: ${item.costPrice.toFixed(2)}</Text>
                <Text style={styles.rowText}>Selling: ${item.sellingPrice.toFixed(2)}</Text>
                <Text style={styles.rowText}>Margin: {margin}%</Text>
                <Text style={styles.rowText}>Stock: {item.stock}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  buttons: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  buttonGap: { width: 10 },
  preview: { width: "100%", height: 160, borderRadius: 8, marginBottom: 8, backgroundColor: "#e5e7eb" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  inputDisabled: { backgroundColor: "#f1f5f9", color: "#64748b" },
  hintText: {
    color: "#b45309",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
    paddingHorizontal: 2,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  switchLabel: { fontSize: 14, color: "#334155", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 8,
  },
  submitLabel: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  list: { paddingBottom: 24, gap: 8 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  row: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: "#dbeafe" },
  thumbPlaceholder: { justifyContent: "center", alignItems: "center" },
  thumbText: { fontSize: 11, color: "#475569" },
  rowContent: { marginLeft: 10, flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  rowText: { fontSize: 12, color: "#334155" },
});

export default InventoryScreen;
