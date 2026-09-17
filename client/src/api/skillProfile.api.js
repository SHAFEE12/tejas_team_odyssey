import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const BASE_URL = `${API_URL}/api/skills`;

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
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

export const getSkillProfile = async () => {
  return request(BASE_URL);
};

export const createSkillProfile = async ({
  skills = [],
  targetRole = '',
  targetIndustry = '',
}) => {
  return request(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({
      skills,
      targetRole,
      targetIndustry,
    }),
  });
};

export const updateSkillProfile = async ({
  skills,
  targetRole,
  targetIndustry,
}) => {
  const body = {};

  if (skills !== undefined) {
    body.skills = skills;
  }

  if (targetRole !== undefined) {
    body.targetRole = targetRole;
  }

  if (targetIndustry !== undefined) {
    body.targetIndustry = targetIndustry;
  }

  return request(BASE_URL, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};