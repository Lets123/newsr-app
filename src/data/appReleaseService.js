async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function resolveDownloadUrl(downloadUrl) {
  const value = String(downloadUrl || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return new URL(value, window.location.origin).toString();
}

export async function fetchAppRelease() {
  const payload = await parseJsonResponse(await fetch("/api/v1/app-release"));
  return {
    id: payload.id ?? null,
    version: String(payload.version || ""),
    downloadUrl: resolveDownloadUrl(payload.downloadUrl),
    notes: String(payload.notes || ""),
    updatedAt: payload.updatedAt || null,
  };
}

export async function saveAppRelease(release) {
  const payload = await parseJsonResponse(
    await fetch("/api/v1/app-release", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(release),
    }),
  );

  return {
    ok: true,
    release: {
      id: payload.release?.id ?? null,
      version: String(payload.release?.version || ""),
      downloadUrl: resolveDownloadUrl(payload.release?.downloadUrl),
      notes: String(payload.release?.notes || ""),
      updatedAt: payload.release?.updatedAt || null,
    },
  };
}
