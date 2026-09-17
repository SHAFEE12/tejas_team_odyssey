/**
 * auth.api.js
 *
 * Client API functions for authentication and current user retrieval.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

/**
 * Fetch the authenticated user profile from /api/auth/me.
 * @returns {Promise<{ success: boolean, user: Object }>}
 */
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Upload or update user avatar.
 * Accepts FormData (file upload) or JSON object ({ avatar: string }).
 * @param {FormData|{ avatar: string }} payload
 * @returns {Promise<{ success: boolean, message: string, avatar: string, user: Object }>}
 */
export const updateAvatarApi = async (payload) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const isFormData = payload instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  };

  const response = await fetch(`${API_URL}/api/auth/avatar`, {
    method: 'POST',
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Delete / remove user avatar.
 * @returns {Promise<{ success: boolean, message: string, avatar: string, user: Object }>}
 */
export const deleteAvatarApi = async () => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/auth/avatar`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Update authenticated user's core profile attributes (registrationNumber, collegeName, name).
 * @param {{ registrationNumber?: string, collegeName?: string, name?: string }} payload
 * @returns {Promise<{ success: boolean, message: string, user: Object }>}
 */
export const updateProfileApi = async (payload) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
