/**
 * applications.api.js
 *
 * Client-side API helpers for /api/applications.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/applications`;

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
 * GET /api/applications
 * Returns student's tracked applications and pipeline metrics.
 */
export const getApplications = () => request(BASE_URL);

/**
 * GET /api/applications/:id
 * Returns single application detail including resolved supporting projects.
 */
export const getApplicationById = (id) => request(`${BASE_URL}/${id}`);

/**
 * POST /api/applications
 * Save or track an opportunity as an application.
 */
export const createApplication = (payload) =>
  request(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/**
 * PUT /api/applications/:id
 * Update status, notes, dates, resume version, project references, etc.
 */
export const updateApplication = (id, payload) =>
  request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

/**
 * DELETE /api/applications/:id
 * Remove application from tracker.
 */
export const deleteApplication = (id) =>
  request(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });

/**
 * GET /api/projects
 * Fetch student projects to link as supporting evidence
 */
export const getStudentProjects = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/projects`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return { data: { portfolio: [] } };
  return res.json();
};
