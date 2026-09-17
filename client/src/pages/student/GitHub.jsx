/**
 * GitHub.jsx — /student/github
 *
 * INTEGRATION: REAL GitHub public API data.
 * Data is fetched server-side via Node built-in https (no OAuth).
 * No fake values. Unavailable fields show "—".
 *
 * Flow:
 *  1. Load cached profile (GET /api/github)
 *  2. If no username → show connect form
 *  3. If username but no sync → show sync prompt
 *  4. If connected → show real GitHub dashboard
 *  5. Sync button → POST /api/github/sync → real GitHub data
 *  6. Disconnect → DELETE /api/github/disconnect
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getGitHubProfile,
  saveGitHubUsername,
  syncGitHub,
  disconnectGitHub,
} from "../../api/github.api";
import { ROUTES } from "../../utils/constants";

/* ── Icon ────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const GH_ICONS = {
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  repo: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  fork: ['M6 3v12', 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 9a9 9 0 0 1-9 9'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  gist: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  check: 'M20 6L9 17l-5-5',
  alert: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  sync: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  external: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  location: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  company: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  sparkles: ['M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z'],
  arrow: 'M5 12h14M12 5l7 7-7 7',
};

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  HTML: '#e34f26',
  CSS: '#1572b6',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Shell: '#89e051',
  Kotlin: '#a97bff',
  Swift: '#f05138',
  Dart: '#00b4ab',
};

/* ── Modern Stat Card ────────────────────────────────────────── */
function StatCard({ label, value, icon, accentColor, topBorder }) {
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950/80 border border-white/[0.08] ${topBorder} shadow-lg flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${accentColor || "text-white"}`}>
        {value !== null && value !== undefined ? value.toLocaleString() : "—"}
      </p>
      <span className="text-[10px] text-zinc-500 mt-1">Verified public</span>
    </div>
  );
}

/* ── Repository Card ─────────────────────────────────────────── */
function RepoCard({ repo }) {
  const langColor = LANG_COLORS[repo.language] || '#ea580c';

  return (
    <a
      href={repo.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between p-4.5 rounded-2xl bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 border border-white/[0.08] hover:border-orange-500/35 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-200"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-400 group-hover:text-orange-400 transition-colors shrink-0">
              <Icon d={GH_ICONS.repo} size={14} />
            </span>
            <p className="text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
              {repo.name}
            </p>
            {repo.isForked && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/[0.05] border border-white/10 text-zinc-400 align-middle">
                fork
              </span>
            )}
          </div>
          <Icon
            d={GH_ICONS.external}
            size={13}
            className="text-zinc-500 group-hover:text-orange-400 shrink-0 mt-0.5 transition-colors"
          />
        </div>

        {repo.description ? (
          <p className="text-[12px] text-zinc-400 leading-relaxed line-clamp-2">
            {repo.description}
          </p>
        ) : (
          <p className="text-[12px] text-zinc-600 italic">No description provided.</p>
        )}
      </div>

      <div className="flex items-center gap-3.5 mt-4 pt-3 border-t border-white/[0.06] flex-wrap text-xs">
        {repo.language && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: langColor }}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        )}
        {repo.stargazers > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <Icon d={GH_ICONS.star} size={11} />
            {repo.stargazers}
          </span>
        )}
        {repo.forks > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
            <Icon d={GH_ICONS.fork} size={11} />
            {repo.forks}
          </span>
        )}
        {repo.updatedAt && (
          <span className="text-[11px] text-zinc-500 ml-auto font-mono">
            {new Date(repo.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </a>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function GitHub() {
  const [profile, setProfile] = useState(undefined); // undefined=loading, null=not found
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncErr, setSyncErr] = useState(null);
  const [syncOk, setSyncOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [inputErr, setInputErr] = useState("");

  /* ── Load cached profile on mount ─────────────────────────── */
  const loadProfile = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    getGitHubProfile()
      .then((data) => {
        setProfile(data.profile);
        setUsernameInput(data.profile?.username || "");
      })
      .catch((err) => {
        if (err.status === 404) {
          setProfile(null);
        } else {
          setFetchErr(err.message || "Unable to load GitHub profile.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ── Save username (without sync) ─────────────────────────── */
  const handleSaveUsername = async () => {
    const clean = usernameInput.trim();
    if (!clean) {
      setInputErr("Please enter a GitHub username.");
      return;
    }
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(clean)) {
      setInputErr("Invalid GitHub username format.");
      return;
    }
    setInputErr("");
    setSaveErr(null);
    setSaving(true);
    try {
      const result = await saveGitHubUsername(clean);
      setProfile(result.profile);
    } catch (err) {
      setSaveErr(err.message || "Failed to save username.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Sync with GitHub ────────────────────────────────────── */
  const handleSync = async () => {
    setSyncing(true);
    setSyncErr(null);
    setSyncOk(false);
    try {
      const result = await syncGitHub();
      setProfile(result.profile);
      setSyncOk(true);
      setTimeout(() => setSyncOk(false), 4000);
    } catch (err) {
      setSyncErr(err.message || "Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  /* ── Disconnect ──────────────────────────────────────────── */
  const handleDisconnect = async () => {
    if (!window.confirm("Remove your GitHub connection? Your synced data will be cleared.")) return;
    try {
      await disconnectGitHub();
      setProfile(null);
      setUsernameInput("");
      setSyncErr(null);
      setSyncOk(false);
    } catch (err) {
      setSyncErr(err.message || "Failed to disconnect.");
    }
  };

  /* ── Loading skeleton ────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-3 w-48 bg-white/[0.03] rounded animate-pulse" />
          </div>
        </div>
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-white/[0.05]" />
          <div className="h-4 w-1/3 bg-white/[0.05] rounded" />
          <div className="h-3 w-1/2 bg-white/[0.03] rounded" />
        </div>
      </div>
    );
  }

  /* ── Fetch error ─────────────────────────────────────────── */
  if (fetchErr) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-300">{fetchErr}</p>
          <button
            type="button"
            onClick={loadProfile}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isConnected = profile?.connected && profile?.username;
  const hasSavedUsername = profile?.username;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-7">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
              <Icon d={GH_ICONS.github} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">GitHub Showcase</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 border border-sky-500/25 text-sky-400">
              Proof Pillar Evidence
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
            {isConnected
              ? `Live repository and commit data verified from @${profile.username}.`
              : hasSavedUsername
              ? `@${profile.username} — profile saved, awaiting initial sync.`
              : "Connect your public GitHub profile to power ATS Resume proof, project validation, and skill verification."}
          </p>
        </div>

        {/* Status Beacon */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider flex items-center gap-2 shadow-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected · Real Data
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* ── Banners ─────────────────────────────────────────────── */}
      {syncOk && (
        <div role="status" className="flex items-center gap-3 px-4.5 py-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 text-emerald-400 text-xs font-semibold shadow-lg animate-fade-in">
          <Icon d={GH_ICONS.check} size={16} />
          <span>GitHub repositories and language metrics synced successfully. Real data is live.</span>
        </div>
      )}
      {(syncErr || saveErr) && (
        <div role="alert" className="flex items-center gap-3 px-4.5 py-3 rounded-2xl border border-rose-500/25 bg-rose-950/20 text-rose-400 text-xs font-semibold shadow-lg animate-fade-in">
          <Icon d={GH_ICONS.alert} size={16} />
          <span>{syncErr || saveErr}</span>
        </div>
      )}

      {/* ── DISCONNECTED / ONBOARDING SHOWCASE ───────────────────── */}
      {!isConnected && (
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h2 className="text-lg font-bold text-white">Connect Your GitHub Portfolio</h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Unlock automated technical verification. We query GitHub's public API to index your public repositories, languages, stars, and project metadata without requiring private OAuth tokens.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span className="text-zinc-300 font-medium">Auto-ATS Bullets</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                <span className="text-orange-400">✓</span>
                <span className="text-zinc-300 font-medium">+15 Proof Score</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                <span className="text-sky-400">✓</span>
                <span className="text-zinc-300 font-medium">Verified Repos</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                <span className="text-purple-400">✓</span>
                <span className="text-zinc-300 font-medium">Language Ratios</span>
              </div>
            </div>
          </div>

          {/* Connect Input Form */}
          <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="gh-username" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Enter Public GitHub Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">@</span>
                <input
                  id="gh-username"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setInputErr("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                  placeholder="torvalds"
                  disabled={saving}
                  className="w-full pl-8 pr-4 py-2.5 text-xs bg-black/40 border border-white/10 text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/25 transition-all disabled:opacity-50"
                />
              </div>
              {inputErr && <p className="text-[11px] text-rose-400 mt-1">{inputErr}</p>}
            </div>

            <div className="flex items-end gap-2.5">
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white text-xs font-bold hover:from-[#f97316] hover:to-[#fb923c] transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Saving..." : hasSavedUsername ? "Update Username" : "Connect Profile"}
              </button>

              {hasSavedUsername && (
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {syncing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Icon d={GH_ICONS.sync} size={13} className="text-orange-400" />
                      Sync Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONNECTED PROFILE OVERVIEW ───────────────────────────── */}
      {isConnected && (
        <>
          {/* Developer Identity Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 p-6 sm:p-7 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex items-start gap-4.5">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`@${profile.username}`}
                    className="w-16 h-16 rounded-2xl border-2 border-orange-500/40 shadow-lg shadow-orange-500/15 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xl text-orange-400 shrink-0">
                    👨‍💻
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {profile.name || profile.username}
                    </h2>
                    <a
                      href={profile.profileUrl || `https://github.com/${profile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/25 font-mono"
                    >
                      <span>@{profile.username}</span>
                      <Icon d={GH_ICONS.external} size={11} />
                    </a>
                  </div>

                  {profile.bio && (
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-500">
                    {profile.company && (
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Icon d={GH_ICONS.company} size={12} className="text-zinc-500" />
                        <span>{profile.company}</span>
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Icon d={GH_ICONS.location} size={12} className="text-zinc-500" />
                        <span>{profile.location}</span>
                      </span>
                    )}
                    {profile.lastSyncedAt && (
                      <span className="text-zinc-500 font-mono text-[11px]">
                        Last synced: {new Date(profile.lastSyncedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync + Disconnect Controls */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-start">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {syncing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Icon d={GH_ICONS.sync} size={13} className="text-orange-400" />
                      <span>Sync Repos</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats Grid (6 Items) ─────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              label="Repositories"
              value={profile.publicRepos}
              icon={<Icon d={GH_ICONS.repo} size={16} />}
              accentColor="text-white"
              topBorder="border-t-2 border-t-zinc-500/50"
            />
            <StatCard
              label="Total Stars"
              value={profile.totalStars}
              icon={<Icon d={GH_ICONS.star} size={16} className="text-amber-400" />}
              accentColor="text-amber-300"
              topBorder="border-t-2 border-t-amber-500"
            />
            <StatCard
              label="Forks Count"
              value={profile.totalForks}
              icon={<Icon d={GH_ICONS.fork} size={16} className="text-sky-400" />}
              accentColor="text-sky-400"
              topBorder="border-t-2 border-t-sky-500"
            />
            <StatCard
              label="Followers"
              value={profile.followers}
              icon={<Icon d={GH_ICONS.users} size={16} className="text-emerald-400" />}
              accentColor="text-emerald-400"
              topBorder="border-t-2 border-t-emerald-500"
            />
            <StatCard
              label="Following"
              value={profile.following}
              icon={<Icon d={GH_ICONS.user} size={16} className="text-purple-400" />}
              accentColor="text-purple-400"
              topBorder="border-t-2 border-t-purple-500"
            />
            <StatCard
              label="Public Gists"
              value={profile.publicGists}
              icon={<Icon d={GH_ICONS.gist} size={16} className="text-orange-400" />}
              accentColor="text-orange-400"
              topBorder="border-t-2 border-t-orange-500"
            />
          </div>

          {/* ── Top Languages Breakdown ──────────────────────────────── */}
          {profile.languages?.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-zinc-950 p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <span>💻</span>
                  <span>Primary Languages (Indexed by Repository Frequency)</span>
                </h3>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {profile.languages.length} detected
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.languages.map((lang) => {
                  const color = LANG_COLORS[lang] || '#ea580c';
                  return (
                    <span
                      key={lang}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-white/10 text-zinc-200 bg-white/[0.03] flex items-center gap-2 shadow-sm hover:border-white/20 transition-colors"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span>{lang}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Top Repositories Grid ────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-zinc-950 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <span>📁</span>
                <span>Top Public Repositories (Ranked by Stars & Recency)</span>
              </h3>
              {profile.publicRepos > 6 && (
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                >
                  <span>View all {profile.publicRepos} on GitHub</span>
                  <Icon d={GH_ICONS.external} size={11} />
                </a>
              )}
            </div>

            {profile.repositories?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.repositories.map((repo) => (
                  <RepoCard key={repo.id || repo.name} repo={repo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-zinc-500">
                No public repositories found for this user account.
              </div>
            )}
          </div>

          {/* Notice Box */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 flex items-start gap-3">
            <span className="text-zinc-400 text-sm mt-0.5">ℹ️</span>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              <strong className="text-zinc-300 font-semibold">Privacy & API Note:</strong> Contribution heatmaps and commit graphs require authenticated GitHub OAuth tokens. Only public profile and repository data is retrieved and indexed to preserve complete account privacy.
            </p>
          </div>

          {/* ── Journey Next Steps Card ── */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-950/20 via-[#0f121d] to-[#0d101a] border border-orange-500/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
                Next In Your Career Journey
              </span>
              <h4 className="text-sm font-bold text-white">Unlock High-Match Roles with Verified Code Telemetry</h4>
              <p className="text-xs text-zinc-400 max-w-xl">
                Your public repositories and language activity contribute directly to your 7-factor matching score. Explore tailored opportunities ranked by fit.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                to={ROUTES.STUDENT_OPPORTUNITIES}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5"
              >
                <span>Explore Opportunities</span>
                <Icon d={GH_ICONS.arrow} size={12} />
              </Link>
              <Link
                to={ROUTES.STUDENT_COMMAND_CENTER}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors"
              >
                Command Center
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}