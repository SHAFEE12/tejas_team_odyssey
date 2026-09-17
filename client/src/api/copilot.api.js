/**
 * copilot.api.js
 *
 * Client API methods for Career Copilot (/api/copilot).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/copilot`;

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
 * POST /api/copilot/query
 * Analyzes natural language career questions against stored student state.
 */
export const queryCopilot = ({ message }) => {
  return request(`${BASE_URL}/query`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

/**
 * GET /api/copilot/context
 * Retrieves safe normalized career context.
 */
export const getCopilotContext = () => {
  return request(`${BASE_URL}/context`);
};

/**
 * GET /api/copilot/status
 * Retrieves safe operational diagnostics for Copilot (no secrets).
 */
export const getCopilotStatus = () => {
  return request(`${BASE_URL}/status`);
};

