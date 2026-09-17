/**
 * opportunities.api.js — Client-side helpers for /api/opportunities
 *
 * Provides API helpers for opportunity discovery, fit scoring, and
 * application pipeline tracking.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/opportunities`;

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
    error.data   = data;
    throw error;
  }

  return data;
};

/**
 * GET /api/opportunities
 * Returns all active opportunities ranked by fit score.
 * Optional params: { type, domain, remote }
 */
export const getOpportunities = (params = {}) => {
  const query = new URLSearchParams();
  if (params.type)   query.set('type',   params.type);
  if (params.domain) query.set('domain', params.domain);
  if (params.remote) query.set('remote', 'true');
  const qs = query.toString();
  return request(`${BASE_URL}${qs ? `?${qs}` : ''}`);
};

/**
 * GET /api/opportunities/applications
 * Returns the student's own applications (all statuses).
 */
export const getApplications = () => request(`${BASE_URL}/applications`);

/**
 * GET /api/opportunities/:id
 * Returns a single opportunity with full fit score breakdown.
 */
export const getOpportunityById = (id) => request(`${BASE_URL}/${id}`);

/**
 * POST /api/opportunities/:id/save
 * Saves an opportunity or marks it as applied.
 */
export const saveOpportunity = (id, status = 'saved', notes = '') =>
  request(`${BASE_URL}/${id}/save`, {
    method: 'POST',
    body: JSON.stringify({ status, notes }),
  });

/**
 * PUT /api/opportunities/applications/:appId
 * Updates application status or notes.
 */
export const updateApplication = (appId, updates) =>
  request(`${BASE_URL}/applications/${appId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

/**
 * DELETE /api/opportunities/applications/:appId
 * Removes a saved/applied application.
 */
export const deleteApplication = (appId) =>
  request(`${BASE_URL}/applications/${appId}`, {
    method: 'DELETE',
  });
