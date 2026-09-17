/**
 * resume.api.js — Client-side helpers for /api/resume
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/resume`;

const request = async (url, options = {}) => {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
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
 * Upload resume file (PDF or DOCX)
 */
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  return request(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
};

/**
 * Fetch current student's resume & analysis
 */
export const getResume = () => request(BASE_URL);

/**
 * Re-analyze current stored resume
 */
export const reanalyzeResume = () =>
  request(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Delete current resume and analysis
 */
export const deleteResume = () =>
  request(BASE_URL, {
    method: 'DELETE',
  });

/**
 * Download original resume file as a blob
 */
export const downloadOriginalResume = async () => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/download?inline=true`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download resume file.');
  }

  return response.blob();
};

/**
 * Download or stream original resume file direct URL
 * @param {boolean} inline - If true, sets inline disposition for iframe / preview
 */
export const getResumeDownloadUrl = (inline = false) => {
  const token = getToken();
  return `${BASE_URL}/download?token=${token}${inline ? '&inline=true' : ''}`;
};

/**
 * Check Google Gemini AI resume analyzer engine status
 */
export const getAnalyzerStatus = () => request(`${BASE_URL}/analyzer-status`);

