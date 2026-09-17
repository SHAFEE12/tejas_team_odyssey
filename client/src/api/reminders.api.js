/**
 * reminders.api.js
 *
 * Client API methods for Reminders & Daily Career Planner (/api/reminders).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/reminders`;

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
 * GET /api/reminders
 * List reminders with optional query parameters { status, type, priority }
 */
export const getReminders = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.type && params.type !== 'ALL') query.set('type', params.type);
  if (params.priority && params.priority !== 'ALL') query.set('priority', params.priority);
  const qs = query.toString();
  return request(`${BASE_URL}${qs ? `?${qs}` : ''}`);
};

/**
 * GET /api/reminders/:id
 * Retrieve a single reminder
 */
export const getReminder = (id) => request(`${BASE_URL}/${id}`);

/**
 * POST /api/reminders
 * Create a custom user reminder
 */
export const createReminder = (payload) =>
  request(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/**
 * PUT /api/reminders/:id
 * Update an existing reminder
 */
export const updateReminder = (id, payload) =>
  request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

/**
 * POST /api/reminders/:id/complete
 * Mark reminder as completed
 */
export const completeReminder = (id) =>
  request(`${BASE_URL}/${id}/complete`, {
    method: 'POST',
  });

/**
 * POST /api/reminders/:id/dismiss
 * Mark reminder as dismissed
 */
export const dismissReminder = (id) =>
  request(`${BASE_URL}/${id}/dismiss`, {
    method: 'POST',
  });

/**
 * DELETE /api/reminders/:id
 * Remove a reminder
 */
export const deleteReminder = (id) =>
  request(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });

/**
 * GET /api/reminders/daily-plan
 * Retrieve today's prioritized career execution plan
 */
export const getDailyPlan = () => request(`${BASE_URL}/daily-plan`);
