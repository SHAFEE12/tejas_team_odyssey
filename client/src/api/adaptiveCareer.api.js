/**
 * adaptiveCareer.api.js
 *
 * Client API for Adaptive Career Operating System (/api/adaptive-career).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/adaptive-career`;

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
 * Get active adaptive plan (cached or fresh).
 */
export const getAdaptivePlan = () => {
  return request(`${BASE_URL}/plan`);
};

/**
 * Get live adaptive weekly plan.
 */
export const getWeeklyPlan = () => {
  return request(`${BASE_URL}/weekly`);
};

/**
 * Get live adaptive daily plan.
 */
export const getDailyPlan = () => {
  return request(`${BASE_URL}/daily`);
};

/**
 * Get historical adaptive plan snapshots.
 */
export const getSnapshots = () => {
  return request(`${BASE_URL}/snapshots`);
};

/**
 * Get execution friction analysis.
 */
export const getFriction = () => {
  return request(`${BASE_URL}/friction`);
};

/**
 * Update student plan preference or pause status.
 */
export const updatePreferences = (preferences) => {
  return request(`${BASE_URL}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};

/**
 * Force refresh and generate new adaptive snapshot.
 */
export const refreshPlan = () => {
  return request(`${BASE_URL}/refresh`, {
    method: 'POST',
  });
};
