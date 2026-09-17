/**
 * careerOutcome.api.js
 *
 * Client API for Career Outcome & Trajectory Engine (/api/career-outcome).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/career-outcome`;

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
 * Get aggregated career outcome, trajectory, stage, funnel, and bottleneck.
 */
export const getCareerOutcome = () => {
  return request(`${BASE_URL}`);
};

/**
 * Get historical trajectory snapshot trends.
 */
export const getTrajectoryTrends = () => {
  return request(`${BASE_URL}/trends`);
};

/**
 * Get career conversion funnel.
 */
export const getCareerFunnel = () => {
  return request(`${BASE_URL}/funnel`);
};

/**
 * Get career milestones.
 */
export const getCareerMilestones = () => {
  return request(`${BASE_URL}/milestones`);
};

/**
 * Create a new career milestone.
 */
export const createCareerMilestone = (milestone) => {
  return request(`${BASE_URL}/milestones`, {
    method: 'POST',
    body: JSON.stringify(milestone),
  });
};

/**
 * Update milestone status or progress.
 */
export const updateCareerMilestone = (id, updates) => {
  return request(`${BASE_URL}/milestones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

/**
 * Get 7-day outcome review.
 */
export const getWeeklyOutcomeReview = () => {
  return request(`${BASE_URL}/weekly-review`);
};

/**
 * Get 30-day outcome review.
 */
export const getMonthlyOutcomeReview = () => {
  return request(`${BASE_URL}/monthly-review`);
};

/**
 * Force refresh and capture fresh trajectory snapshot.
 */
export const refreshCareerOutcome = () => {
  return request(`${BASE_URL}/refresh`, {
    method: 'POST',
  });
};
