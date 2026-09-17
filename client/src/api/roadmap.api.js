/**
 * roadmap.api.js — Client-side helpers for /api/roadmap
 *
 * Deterministic personalized roadmap calculated and stored on the backend.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/roadmap`;

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
 * GET /api/roadmap — fetches the student's current personalized roadmap
 */
export const getRoadmap = () => request(BASE_URL);

/**
 * POST /api/roadmap/generate — regenerates roadmap from fresh student data
 */
export const generateRoadmap = () =>
  request(`${BASE_URL}/generate`, {
    method: 'POST',
  });

/**
 * PUT /api/roadmap/tasks/:taskId — updates task completion status
 */
export const updateTaskStatus = (taskId, status) =>
  request(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

/**
 * DELETE /api/roadmap — resets student's roadmap
 */
export const deleteRoadmap = () =>
  request(BASE_URL, {
    method: 'DELETE',
  });
