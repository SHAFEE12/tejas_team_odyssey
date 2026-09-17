/**
 * DSA.jsx — /student/dsa
 *
 * Full-featured DSA & LeetCode Progress Tracker.
 * Supports:
 *  1. Live public LeetCode profile synchronization (Total, Easy, Medium, Hard, Ranking, Contest Rating).
 *  2. Manual personal practice tracking (Streaks, Target Goal, Focus Topics).
 *  3. Clear distinction between verified synced data and self-reported metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getDSAProfile,
  saveDSAProfile,
  connectLeetCode,
  syncLeetCode,
  disconnectLeetCode,
} from '../../api/dsa.api';

/* ── Inline Icons ────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
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

const ICONS = {
  dsa:      ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  check:    'M20 6L9 17l-5-5',
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  alert:    ['M12 9v2m0 4h.01', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'],
  external: ['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  unlink:   ['M18.36 6.64a9 9 0 11-12.73 0', 'M12 2v10'],
  streak:   ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  target:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', 'M9 12l2 2 4-4'],
};

const NUM = (v) => {
  const n = parseInt(v, 10);
  return isNaN(n) || n < 0 ? 0 : n;
};

const FOCUS_OPTIONS = [
  'Arrays', 'Strings', 'Hash Maps', 'Two Pointers', 'Sliding Window',
  'Binary Search', 'Recursion', 'Dynamic Programming', 'Graphs', 'BFS/DFS',
  'Trees', 'Heaps', 'Sorting', 'Greedy', 'Backtracking', 'Stack/Queue', 'Math', 'Bit Manipulation'
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DSA() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  // LeetCode connection & sync state
  const [lcInputUser, setLcInputUser] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connErr, setConnErr] = useState(null);
  const [connSuccess, setConnSuccess] = useState(null);

  // Manual personal tracking form state
  const [easy, setEasy] = useState('');
  const [medium, setMedium] = useState('');
  const [hard, setHard] = useState('');
  const [target, setTarget] = useState('');
  const [streak, setStreak] = useState('');
  const [longest, setLongest] = useState('');
  const [topics, setTopics] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  const syncFormFields = useCallback((p) => {
    if (!p) return;
    setEasy(String(p.easySolved ?? ''));
    setMedium(String(p.mediumSolved ?? ''));
    setHard(String(p.hardSolved ?? ''));
    setTarget(String(p.targetTotal ?? ''));
    setStreak(String(p.currentStreak ?? ''));
    setLongest(String(p.longestStreak ?? ''));
    setTopics(Array.isArray(p.focusTopics) ? p.focusTopics : []);
    setLcInputUser(p.leetcodeUsername || '');
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getDSAProfile();
      if (data?.profile) {
        setProfile(data.profile);
        syncFormFields(data.profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      if (err.status === 404) {
        setProfile(null);
      } else {
        setFetchErr(err.message || 'Unable to load DSA profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [syncFormFields]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Connect LeetCode
  const handleConnect = async (e) => {
    e?.preventDefault();
    if (!lcInputUser.trim()) {
      setConnErr('Please enter your public LeetCode username.');
      return;
    }

    setConnecting(true);
    setConnErr(null);
    setConnSuccess(null);

    try {
      const res = await connectLeetCode(lcInputUser.trim());
      if (res?.profile) {
        setProfile(res.profile);
        syncFormFields(res.profile);
        setConnSuccess(`Connected & synchronized @${res.profile.leetcodeUsername}!`);
        setTimeout(() => setConnSuccess(null), 4000);
      }
    } catch (err) {
      setConnErr(err.message || 'Failed to connect LeetCode profile.');
    } finally {
      setConnecting(false);
    }
  };

  // Sync LeetCode
  const handleSync = async () => {
    setSyncing(true);
    setConnErr(null);
    setConnSuccess(null);

    try {
      const res = await syncLeetCode();
      if (res?.profile) {
        setProfile(res.profile);
        syncFormFields(res.profile);
        setConnSuccess('LeetCode statistics updated successfully!');
        setTimeout(() => setConnSuccess(null), 4000);
      }
    } catch (err) {
      setConnErr(err.message || 'Sync failed. Cached data was preserved.');
      // Refresh local profile to reflect error status if recorded
      loadProfile();
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect LeetCode
  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your LeetCode profile? Your personal practice goals and streaks will remain saved.')) {
      return;
    }

    setDisconnecting(true);
    setConnErr(null);
    setConnSuccess(null);

    try {
      const res = await disconnectLeetCode();
      if (res?.profile) {
        setProfile(res.profile);
        syncFormFields(res.profile);
        setConnSuccess('LeetCode profile disconnected.');
        setTimeout(() => setConnSuccess(null), 3000);
      }
    } catch (err) {
      setConnErr(err.message || 'Failed to disconnect profile.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Save manual personal tracking
  const handleSaveManual = async (e) => {
    e?.preventDefault();
    setSaveErr(null);
    setSaveOk(false);

    const st = NUM(streak);
    const lng = NUM(longest);

    if (st > lng) {
      setSaveErr('Current streak cannot exceed longest streak.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        easySolved: NUM(easy),
        mediumSolved: NUM(medium),
        hardSolved: NUM(hard),
        targetTotal: NUM(target),
        currentStreak: st,
        longestStreak: lng,
        focusTopics: topics,
      };

      if (!profile?.leetcodeConnected && lcInputUser.trim()) {
        payload.leetcodeUsername = lcInputUser.trim().toLowerCase();
      }

      const result = await saveDSAProfile(payload);
      if (result?.profile) {
        setProfile(result.profile);
        syncFormFields(result.profile);
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 3000);
      }
    } catch (err) {
      setSaveErr(err.message || 'Unable to save personal tracking details.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTopic = (t) => {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  // Determine active statistics (LeetCode Synced vs Manual Entry)
  const isConnected = Boolean(profile?.leetcodeConnected && profile?.leetcodeData);
  const lcData = profile?.leetcodeData;

  const displayEasy = isConnected ? (lcData?.easySolved ?? 0) : NUM(easy);
  const displayMedium = isConnected ? (lcData?.mediumSolved ?? 0) : NUM(medium);
  const displayHard = isConnected ? (lcData?.hardSolved ?? 0) : NUM(hard);
  const displayTotal = isConnected
    ? (lcData?.totalSolved ?? (displayEasy + displayMedium + displayHard))
    : displayEasy + displayMedium + displayHard;

  const targetNum = NUM(target);
  const targetPct = targetNum > 0 ? Math.min(100, Math.round((displayTotal / targetNum) * 100)) : 0;
  const currentStreakNum = isConnected && profile?.currentStreak ? profile.currentStreak : NUM(streak);
  const longestStreakNum = isConnected && profile?.longestStreak ? profile.longestStreak : NUM(longest);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-3 w-56 bg-white/[0.03] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-36 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Icon d={ICONS.dsa} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">DSA Problem Tracker</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 border border-orange-500/25 text-orange-400 font-mono">
              Streak & LeetCode Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Track daily algorithmic practice, sync public LeetCode statistics, maintain problem-solving streaks, and strengthen technical interview readiness for your target role.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LeetCode Synced
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/[0.03] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Manual Tracking
            </span>
          )}
        </div>
      </div>

      {/* ── Alerts & Notifications ── */}
      {connErr && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25 flex items-start gap-3 shadow-lg animate-fade-in">
          <Icon d={ICONS.alert} size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-semibold text-rose-300">{connErr}</p>
          </div>
        </div>
      )}

      {connSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300 font-semibold shadow-lg animate-fade-in">
          <Icon d={ICONS.check} size={16} className="text-emerald-400 shrink-0" />
          <span>{connSuccess}</span>
        </div>
      )}

      {profile?.leetcodeSyncError && !connErr && (
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-300 shadow-md">
          <div className="flex items-center gap-2">
            <Icon d={ICONS.alert} size={15} className="text-amber-400 shrink-0" />
            <span>{profile.leetcodeSyncError}</span>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="font-bold underline hover:text-white cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* ── Section 1: LeetCode Integration Box ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 p-6 sm:p-7 shadow-2xl">
        {!isConnected ? (
          /* Disconnected State: Engaging Onboarding */
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Icon d={ICONS.shield} size={16} />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Connect Public LeetCode Profile
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Automatically synchronize your solved problem count (Easy, Medium, Hard), acceptance rate, and global ranking without sharing any private credentials.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs shrink-0">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-zinc-300 font-medium">Auto Count Sync</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  <span className="text-zinc-300 font-medium">Contest Ratings</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                  <span className="text-sky-400">✓</span>
                  <span className="text-zinc-300 font-medium">Public API Only</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
                  <span className="text-purple-400">✓</span>
                  <span className="text-zinc-300 font-medium">No Auth Needed</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConnect} className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">@</span>
                <input
                  type="text"
                  placeholder="e.g. neetcode"
                  value={lcInputUser}
                  onChange={(e) => setLcInputUser(e.target.value)}
                  disabled={connecting}
                  className="w-full pl-8 pr-4 py-2.5 text-xs bg-black/40 border border-white/10 text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/25 transition-all disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={connecting || !lcInputUser.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Icon d={ICONS.refresh} size={14} className={connecting ? 'animate-spin' : ''} />
                <span>{connecting ? 'Connecting...' : 'Connect LeetCode →'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Connected State: Developer Profile Bar */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {lcData?.avatarUrl ? (
                <img
                  src={lcData.avatarUrl}
                  alt={profile.leetcodeUsername}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/40 shadow-lg shadow-orange-500/15 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg shrink-0">
                  {profile.leetcodeUsername.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base sm:text-lg font-black text-white">
                    @{profile.leetcodeUsername}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono">
                    <Icon d={ICONS.check} size={12} />
                    <span>Synced from LeetCode Public Data</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-0.5">
                  {profile.leetcodeProfileUrl && (
                    <a
                      href={profile.leetcodeProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:text-orange-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Public Profile</span>
                      <Icon d={ICONS.external} size={11} />
                    </a>
                  )}
                  <span>·</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Last synced: {formatDate(profile.leetcodeLastSyncedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing || disconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Icon d={ICONS.refresh} size={13} className={syncing ? 'animate-spin text-orange-400' : 'text-orange-400'} />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={syncing || disconnecting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Icon d={ICONS.unlink} size={13} />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Streak & Habit Engine Hero Card ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-amber-950/20 via-[#0d0f17] to-zinc-950 p-6 sm:p-7 shadow-xl border-t-2 border-t-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
            🔥
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 font-mono tracking-wide">
                Daily Habit Cadence
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                Active Streak
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentStreakNum} {currentStreakNum === 1 ? 'Day' : 'Days'}
              </h2>
              <span className="text-xs text-zinc-400">
                · Personal Best: <strong className="text-amber-300 font-semibold">{longestStreakNum} Days</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Rhythm Dots */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-400 block tracking-wide">
            Weekly Rhythm Cadence
          </span>
          <div className="flex items-center gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
              const isFilled = currentStreakNum > 0 && idx < Math.min(7, currentStreakNum);
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${
                      isFilled
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                        : 'bg-white/[0.03] border border-white/[0.06] text-zinc-500'
                    }`}
                  >
                    {isFilled ? '✓' : '·'}
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: Problem Solving Metrics Grid ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-2">
              <span>📊</span>
              <span>Problem Solving Breakdown</span>
            </h3>
            <span className="text-[11px] text-zinc-500">
              {isConnected ? '✓ Verified from LeetCode public API' : 'Self-Reported practice counts'}
            </span>
          </div>
          {targetNum > 0 && (
            <span className="text-xs text-zinc-400 font-mono">
              Target Progress: <strong className="text-white font-semibold">{displayTotal}</strong> / {targetNum} ({targetPct}%)
            </span>
          )}
        </div>

        {/* Target Progress Bar */}
        {targetNum > 0 && (
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-zinc-900 border border-white/10 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-[#f97316] rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${targetPct}%` }}
              />
            </div>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            label="Total Solved"
            value={displayTotal}
            icon="🏆"
            color="text-white"
            topBorder="border-t-2 border-t-zinc-500/60"
            gradient="from-white/[0.03] to-zinc-950"
          />
          <StatBox
            label="Easy"
            value={displayEasy}
            icon="🟢"
            color="text-emerald-400"
            topBorder="border-t-2 border-t-emerald-500"
            gradient="from-emerald-950/20 via-[#0d0f17] to-zinc-950"
          />
          <StatBox
            label="Medium"
            value={displayMedium}
            icon="🟡"
            color="text-amber-400"
            topBorder="border-t-2 border-t-amber-500"
            gradient="from-amber-950/20 via-[#0d0f17] to-zinc-950"
          />
          <StatBox
            label="Hard"
            value={displayHard}
            icon="🔴"
            color="text-rose-400"
            topBorder="border-t-2 border-t-rose-500"
            gradient="from-rose-950/20 via-[#0d0f17] to-zinc-950"
          />
        </div>

        {/* Competitive Metrics (Global Ranking, Contest Rating, Acceptance Rate) */}
        {isConnected && (lcData?.ranking || lcData?.contestRating || lcData?.acceptanceRate) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {lcData.ranking && (
              <div className="p-4.5 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Global Ranking
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">
                    #{lcData.ranking.toLocaleString()}
                  </span>
                </div>
                <span className="text-xl">🌐</span>
              </div>
            )}
            {lcData.contestRating && (
              <div className="p-4.5 rounded-2xl bg-gradient-to-b from-amber-950/20 via-[#0d0f17] to-zinc-950 border border-white/[0.08] flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Contest Rating
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                      {lcData.contestRating}
                    </span>
                    {lcData.topPercentage && (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Top {lcData.topPercentage}%
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xl">⚡</span>
              </div>
            )}
            {lcData.acceptanceRate && (
              <div className="p-4.5 rounded-2xl bg-gradient-to-b from-emerald-950/20 via-[#0d0f17] to-zinc-950 border border-white/[0.08] flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Acceptance Rate
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    {lcData.acceptanceRate}%
                  </span>
                </div>
                <span className="text-xl">🎯</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 4: Personal Practice Tracking & Goals Form ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <span>🎯</span>
              <span>Personal Goals & Focus Topics</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Set personal problem volume targets, track daily habit records, and highlight target topic areas.
            </p>
          </div>
        </div>

        {saveErr && (
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-xs text-rose-300 font-semibold">
            {saveErr}
          </div>
        )}

        {saveOk && (
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <Icon d={ICONS.check} size={15} className="text-emerald-400" />
            <span>Personal goals and topics saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveManual} className="space-y-6">
          {/* Practice Streaks & Targets Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Target Solved Goal
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-36 px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/25"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Current Streak (Days)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 7"
                value={streak}
                onChange={(e) => setStreak(e.target.value)}
                className="w-36 px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/25"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Longest Streak (Days)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 21"
                value={longest}
                onChange={(e) => setLongest(e.target.value)}
                className="w-36 px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/25"
              />
            </div>
          </div>

          {/* Manual Problem Counts (When not connected to LeetCode) */}
          {!isConnected && (
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <span className="block text-xs font-bold text-zinc-300">
                Manual Problem Breakdown (Self-Reported)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">Easy Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={easy}
                    onChange={(e) => setEasy(e.target.value)}
                    className="w-36 px-3.5 py-2 text-xs bg-black/40 border border-white/10 text-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">Medium Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-36 px-3.5 py-2 text-xs bg-black/40 border border-white/10 text-amber-300 rounded-xl focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">Hard Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={hard}
                    onChange={(e) => setHard(e.target.value)}
                    className="w-36 px-3.5 py-2 text-xs bg-black/40 border border-white/10 text-rose-300 rounded-xl focus:outline-none focus:border-rose-500/60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Focus Topics Multi-select */}
          <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-400">
                Core Focus Areas ({topics.length} selected)
              </label>
              {topics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTopics([])}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((topic) => {
                const selected = topics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      selected
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-orange-500/20 scale-[1.02]'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06]'
                    }`}
                  >
                    {selected && <span className="text-white">✓</span>}
                    <span>{topic}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex justify-start">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Practice Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Stat Box Subcomponent ───────────────────────────────────── */
function StatBox({ label, value, icon, color, topBorder, gradient }) {
  return (
    <div className={`p-5 rounded-2xl border border-white/[0.08] ${topBorder} bg-gradient-to-b ${gradient} shadow-lg flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${color}`}>
        {value.toLocaleString()}
      </p>
      <span className="text-[10px] text-zinc-500 mt-1">Questions completed</span>
    </div>
  );
}