/**
 * skillGap.api.js — Client-side helpers for /api/skill-gap
 *
 * Deterministic skill gap analysis is calculated on the backend
 * from the student's SkillProfile, Resume Analyzer, GitHub, and DSA profiles.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/skill-gap`;

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
 * GET /api/skill-gap — fetches deterministic skill gap analysis and summary
 */
export const getSkillGap = () => request(BASE_URL);
