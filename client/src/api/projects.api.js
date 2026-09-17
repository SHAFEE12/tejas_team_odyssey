/**
 * projects.api.js — Client-side helpers for /api/projects
 *
 * Provides API helpers for personal projects portfolio, personalized recommendations,
 * milestone tracking, GitHub linking, and live deployments.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/projects`;

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
 * GET /api/projects — fetches student's projects and portfolio summary
 */
export const getProjects = () => request(BASE_URL);

/**
 * GET /api/projects/recommendations — fetches personalized project recommendations
 */
export const getProjectRecommendations = () => request(`${BASE_URL}/recommendations`);

/**
 * GET /api/projects/:projectId — fetches a single project by ID
 */
export const getProjectById = (projectId) => request(`${BASE_URL}/${projectId}`);

/**
 * POST /api/projects — creates a project from a blueprint or custom input
 */
export const createProject = (projectData) =>
  request(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

/**
 * PUT /api/projects/:projectId — updates project details or status
 */
export const updateProject = (projectId, updateData) =>
  request(`${BASE_URL}/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });

/**
 * PUT /api/projects/:projectId/milestones/:milestoneId — updates milestone status
 */
export const updateMilestoneStatus = (projectId, milestoneId, status) =>
  request(`${BASE_URL}/${projectId}/milestones/${milestoneId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

/**
 * DELETE /api/projects/:projectId — deletes project
 */
export const deleteProject = (projectId) =>
  request(`${BASE_URL}/${projectId}`, {
    method: 'DELETE',
  });

/**
 * POST /api/projects/:projectId/github — links GitHub repo to project
 */
export const connectGithubRepo = (projectId, githubUrl) =>
  request(`${BASE_URL}/${projectId}/github`, {
    method: 'POST',
    body: JSON.stringify({ githubUrl }),
  });

/**
 * DELETE /api/projects/:projectId/github — unlinks GitHub repo
 */
export const disconnectGithubRepo = (projectId) =>
  request(`${BASE_URL}/${projectId}/github`, {
    method: 'DELETE',
  });

/**
 * POST /api/projects/:projectId/deployment — links deployment URL
 */
export const updateDeployment = (projectId, deploymentUrl, provider) =>
  request(`${BASE_URL}/${projectId}/deployment`, {
    method: 'POST',
    body: JSON.stringify({ deploymentUrl, provider }),
  });
