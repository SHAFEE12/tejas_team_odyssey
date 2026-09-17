/**
 * execution.api.js
 *
 * Client API for Career Execution OS (/api/execution).
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/execution`;

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

// Daily & Overview
export const getTodayExecution = (date = null) => {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return request(`${BASE_URL}/today${query}`);
};

export const getExecutionAnalytics = () => {
  return request(`${BASE_URL}/analytics`);
};

export const getWeeklyReview = () => {
  return request(`${BASE_URL}/review`);
};

export const getExecutionHeatmap = (days = 14) => {
  return request(`${BASE_URL}/heatmap?days=${days}`);
};

export const getAdaptivePlan = () => {
  return request(`${BASE_URL}/adaptive-plan`);
};

// Goals
export const getGoals = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE_URL}/goals${query}`);
};

export const createGoal = (goalData) => {
  return request(`${BASE_URL}/goals`, {
    method: 'POST',
    body: JSON.stringify(goalData),
  });
};

export const getGoalById = (id) => {
  return request(`${BASE_URL}/goals/${id}`);
};

export const updateGoal = (id, updateData) => {
  return request(`${BASE_URL}/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

export const completeGoal = (id) => {
  return request(`${BASE_URL}/goals/${id}/complete`, { method: 'POST' });
};

export const pauseGoal = (id) => {
  return request(`${BASE_URL}/goals/${id}/pause`, { method: 'POST' });
};

export const deleteGoal = (id) => {
  return request(`${BASE_URL}/goals/${id}`, { method: 'DELETE' });
};

// Tasks
export const createTask = (taskData) => {
  return request(`${BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

export const updateTask = (id, updateData) => {
  return request(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

export const startTask = (id, note = '') => {
  return request(`${BASE_URL}/tasks/${id}/start`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const pauseTask = (id, minutes = 0, note = '') => {
  return request(`${BASE_URL}/tasks/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ minutes, note }),
  });
};

export const resumeTask = (id, note = '') => {
  return request(`${BASE_URL}/tasks/${id}/resume`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const completeTask = (id, minutes = null, note = '') => {
  return request(`${BASE_URL}/tasks/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ minutes, note }),
  });
};

export const skipTask = (id, note = '') => {
  return request(`${BASE_URL}/tasks/${id}/skip`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const cancelTask = (id, note = '') => {
  return request(`${BASE_URL}/tasks/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const deleteTask = (id) => {
  return request(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
};

// Weekly Check-In
export const getCurrentWeekCheckIn = () => {
  return request(`${BASE_URL}/check-in/current`);
};

export const submitWeeklyCheckIn = ({ selfRating, reflection }) => {
  return request(`${BASE_URL}/check-in`, {
    method: 'POST',
    body: JSON.stringify({ selfRating, reflection }),
  });
};

export const updateWeeklyCheckIn = (id, { selfRating, reflection }) => {
  return request(`${BASE_URL}/check-in/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ selfRating, reflection }),
  });
};
