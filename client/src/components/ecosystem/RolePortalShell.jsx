import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_URL } from '../../utils/constants';
import BrandLogo from '../common/BrandLogo';
import HeaderUserMenu from '../common/HeaderUserMenu';

export default function RolePortalShell({
  roleTitle,
  roleBadge,
  portalType,
  description,
  capabilities = []
}) {
  const { user, token, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    fetch(`${API_URL}/api/ecosystem/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success) {
          setProfileData(data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch ecosystem profile:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showText={false} role={portalType} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Career{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#FF5100] via-[#FF7A00] to-[#FFA726] bg-clip-text text-transparent">
                  Odyssey
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                {roleBadge}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{roleTitle}</p>
          </div>
        </div>

        <HeaderUserMenu
          user={user}
          onLogout={logout}
          role={portalType}
          subtitle={user?.email || roleTitle}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Welcome Card */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                Multi-Role Career Ecosystem Active
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {roleTitle}
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                {description}
              </p>
            </div>

            <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-800 min-w-[200px]">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium block">
                Tenant Identity
              </span>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                {profileData?.institution?.name || profileData?.industry?.companyName || user?.collegeName || 'Verified Independent'}
              </p>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Role: <span className="font-mono text-indigo-400">{user?.role}</span>
              </span>
            </div>
          </div>

          {/* Foundation Notice */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
              ℹ
            </div>
            <div className="text-xs leading-relaxed text-zinc-400">
              <span className="font-medium text-zinc-200">Ecosystem Foundation Tier: </span>
              Your account is successfully authenticated with role-based access control. The multi-role data model, canonical skill taxonomy, and institutional links are established in this phase without mock data.
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            Ecosystem Core Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 mb-3 text-sm font-mono">
                    0{idx + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-1">{cap.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{cap.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Status</span>
                  <span className="text-amber-400/90 font-medium">Foundation</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-xs text-zinc-600">
        Career Odyssey Engineering Career Ecosystem &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}