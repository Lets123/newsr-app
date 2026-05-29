import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw, Smartphone } from "lucide-react";
import { fetchAppRelease } from "../data/appReleaseService";

function SettingsPage() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRelease = async () => {
    setError("");
    try {
      const next = await fetchAppRelease();
      setRelease(next);
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
    if (!release?.version) return "No Android release published yet";
    return release.version;
  }, [release?.version]);

  const openDownload = () => {
    if (!release?.downloadUrl) return;
    window.open(release.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-600">Android update check and download.</p>
          </div>
          <button
            onClick={loadRelease}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Find update
          </button>
        </div>
      </header>

      <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-sky-700" />
            <h2 className="text-sm font-bold text-slate-900">Latest Android build</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {release?.hasRelease ? `Release ${releaseLabel}` : "Waiting for the first automated APK build."}
          </p>

          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openDownload}
                disabled={!release?.downloadUrl}
                className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
              >
                <Download size={16} />
                Download latest APK
              </button>
              <button
                onClick={() => window.open(release?.releaseUrl || "https://github.com/Lets123/newsr-app/releases/latest", "_blank", "noopener,noreferrer")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download size={16} />
                Open release page
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold text-slate-900">Release details</h2>
          <p className="mt-1 text-sm text-slate-600">
            The backend resolves the newest GitHub release automatically, then redirects the download button to the
            latest APK asset.
          </p>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Download link</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {release?.downloadUrl || "No download link available yet."}
            </p>
          </div>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {loading ? "Checking..." : release?.hasRelease ? "Ready to download" : "Waiting for first build"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {release?.updatedAt ? `Published ${new Date(release.updatedAt).toLocaleString()}` : "No release published yet."}
            </p>
            {release?.notes ? <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{release.notes}</p> : null}
          </div>
        </article>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export default SettingsPage;
