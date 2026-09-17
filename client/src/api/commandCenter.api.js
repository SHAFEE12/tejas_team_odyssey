/**
 * commandCenter.api.js
 *
 * Client API for Career Command Center (/api/command-center).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/command-center`;

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

/**
 * Get unified Command Center aggregation.
 */
export const getCommandCenter = () => {
  return request(`${BASE_URL}`);
};

/**
 * Get authentic historical snapshots and metrics trends.
 */
export const getCommandCenterTrends = () => {
  return request(`${BASE_URL}/trends`);
};

/**
 * Get prioritized executable next actions.
 */
export const getCommandCenterActions = () => {
  return request(`${BASE_URL}/actions`);
};

/**
 * Explicitly refresh the Command Center and force a snapshot capture.
 */
export const refreshCommandCenter = () => {
  return request(`${BASE_URL}/refresh`, {
    method: 'POST',
  });
};
