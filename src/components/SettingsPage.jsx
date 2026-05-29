import { useEffect, useMemo, useState } from "react";
import { Download, Link2, RefreshCcw, Save, Smartphone } from "lucide-react";
import { fetchAppRelease, saveAppRelease } from "../data/appReleaseService";

const initialDraft = {
  version: "",
  downloadUrl: "",
  notes: "",
};

function SettingsPage() {
  const [draft, setDraft] = useState(initialDraft);
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRelease = async () => {
    setError("");
    try {
      const next = await fetchAppRelease();
      setRelease(next);
      setDraft({
        version: next.version,
        downloadUrl: next.downloadUrl,
        notes: next.notes,
      });
    } catch (loadError) {
      setError(loadError.message || "Could not load update info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelease();
  }, []);

  const releaseLabel = useMemo(() => {
    if (!release?.version) return "No Android release saved yet";
    return `Version ${release.version}`;
  }, [release?.version]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = await saveAppRelease(draft);
      setRelease(result.release);
      setDraft({
        version: result.release.version,
        downloadUrl: result.release.downloadUrl,
        notes: result.release.notes,
      });
      setMessage("Android release link saved.");
    } catch (saveError) {
      setError(saveError.message || "Could not save update info.");
    } finally {
      setSaving(false);
    }
  };

  const openDownload = () => {
    if (!release?.downloadUrl) return;
    window.open(release.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const copyDownloadUrl = async () => {
    if (!release?.downloadUrl) return;
    try {
      await navigator.clipboard.writeText(release.downloadUrl);
      setMessage("Download link copied.");
    } catch {
      setError("Could not copy the link.");
    }
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-600">Android update link and app release controls.</p>
          </div>
          <button
            onClick={loadRelease}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Check for update
          </button>
        </div>
      </header>

      <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-sky-700" />
            <h2 className="text-sm font-bold text-slate-900">Android release</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">{releaseLabel}</p>

          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Version</span>
              <input
                value={draft.version}
                onChange={(event) => setDraft((prev) => ({ ...prev, version: event.target.value }))}
                placeholder="1.0.0"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Download URL
              </span>
              <input
                value={draft.downloadUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, downloadUrl: event.target.value }))}
                placeholder="/downloads/latest.apk or https://..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Release notes</span>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                rows={4}
                placeholder="What changed in this build?"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save update link"}
              </button>
              <button
                onClick={openDownload}
                disabled={!release?.downloadUrl}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Download size={16} />
                Open download
              </button>
              <button
                onClick={copyDownloadUrl}
                disabled={!release?.downloadUrl}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Link2 size={16} />
                Copy link
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Current link</h2>
          <p className="mt-1 text-sm text-slate-600">
            Put the APK on a stable host, then paste the direct file URL here. A same-origin path such as
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">/downloads/latest.apk</code> works
            well if you upload the file with the app deploy.
          </p>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Download link</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {release?.downloadUrl || "No download link saved yet."}
            </p>
          </div>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {loading ? "Checking..." : release?.downloadUrl ? "Ready to share" : "Waiting for APK link"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {release?.updatedAt ? `Last saved ${new Date(release.updatedAt).toLocaleString()}` : "No release saved yet."}
            </p>
          </div>
        </article>
      </section>

      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export default SettingsPage;
