/**
 * careerScore.api.js — Client-side helpers for /api/career-score
 *
 * Authoritative score is calculated deterministically on the backend
 * from the student's current SkillProfile, DSAProfile, and GitHubProfile.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/career-score`;

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
 * GET /api/career-score — fetches computed readiness score and breakdown
 */
export const getCareerScore = () => request(BASE_URL);
