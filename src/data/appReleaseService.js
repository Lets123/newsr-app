async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return payload;
}

export async function fetchAppRelease() {
  const payload = await parseJsonResponse(await fetch("/api/v1/app-release"));
  return {
    id: payload.id ?? null,
    version: String(payload.version || ""),
    notes: String(payload.notes || ""),
    downloadUrl: String(payload.downloadUrl || "/api/v1/android-download"),
    releaseUrl: String(payload.releaseUrl || "https://github.com/Lets123/newsr-app/releases/latest"),
    assetName: String(payload.assetName || "newsr-app-release.apk"),
    updatedAt: payload.updatedAt || null,
    hasRelease: Boolean(payload.hasRelease),
    error: String(payload.error || ""),
  };
}
