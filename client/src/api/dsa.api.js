/**
 * dsa.api.js — Client API helpers for /api/dsa
 *
 * Supports both manual progress tracking and live public LeetCode synchronization.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/dsa`;

const request = async (url, options = {}) => {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/** GET /api/dsa — fetch student DSA profile. Throws 404 if none exists. */
export const getDSAProfile = () => request(BASE_URL);

/**
 * PUT /api/dsa — create or update manual DSA profile.
 */
export const saveDSAProfile = (payload) =>
  request(BASE_URL, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

/**
 * POST /api/dsa/connect — connect and perform initial sync with public LeetCode profile
 */
export const connectLeetCode = (leetcodeUsername) =>
  request(`${BASE_URL}/connect`, {
    method: 'POST',
    body: JSON.stringify({ leetcodeUsername }),
  });

/**
 * POST /api/dsa/sync — re-synchronize latest problem counts from LeetCode
 */
export const syncLeetCode = () =>
  request(`${BASE_URL}/sync`, {
    method: 'POST',
  });

/**
 * POST /api/dsa/disconnect — disconnect LeetCode profile
 */
export const disconnectLeetCode = () =>
  request(`${BASE_URL}/disconnect`, {
    method: 'POST',
  });
