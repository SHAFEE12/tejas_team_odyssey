/**
 * careerIntelligence.api.js
 *
 * Client API for Career Intelligence & Weekly Strategy (/api/career-intelligence).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/career-intelligence`;

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
 * GET /api/career-intelligence
 */
export const getCareerIntelligence = (refresh = false) => {
  return request(`${BASE_URL}${refresh ? '?refresh=true' : ''}`);
};

/**
 * GET /api/career-intelligence/weekly
 */
export const getWeeklyStrategy = () => {
  return request(`${BASE_URL}/weekly`);
};

/**
 * GET /api/career-intelligence/trends
 */
export const getCareerTrends = () => {
  return request(`${BASE_URL}/trends`);
};

/**
 * POST /api/career-intelligence/refresh
 */
export const refreshCareerIntelligence = () => {
  return request(`${BASE_URL}/refresh`, {
    method: 'POST',
  });
};
