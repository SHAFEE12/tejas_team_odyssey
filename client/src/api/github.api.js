/**
 * github.api.js — Client-side helpers for /api/github
 *
 * INTEGRATION: REAL GitHub data.
 * The backend fetches from api.github.com using Node built-in https.
 * No OAuth. Public GitHub data only.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE = `${API_URL}/api/github`;

const request = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let data = {};
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
};

/** GET /api/github — fetch cached GitHub profile */
export const getGitHubProfile = () => request(BASE);

/** PUT /api/github — save username without syncing */
export const saveGitHubUsername = (username) =>
  request(BASE, { method: 'PUT', body: JSON.stringify({ username }) });

/** POST /api/github/sync — fetch real data from GitHub API */
export const syncGitHub = () =>
  request(`${BASE}/sync`, { method: 'POST' });

/** DELETE /api/github/disconnect — clear stored data */
export const disconnectGitHub = () =>
  request(`${BASE}/disconnect`, { method: 'DELETE' });
