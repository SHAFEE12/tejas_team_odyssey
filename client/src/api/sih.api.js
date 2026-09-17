/**
 * sih.api.js
 *
 * Client API services for SIH 26044 (Assessments, Internships, Matching, Academia).
 * Uses standard fetch with authorization tokens and API_URL.
 */

import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAssessments = async (type = '') => {
  const url = type && type !== 'ALL'
    ? `${API_URL}/api/assessments?type=${encodeURIComponent(type)}`
    : `${API_URL}/api/assessments`;

  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch assessments');
  return data.data || [];
};

export const getMyAssessmentAttempts = async () => {
  const res = await fetch(`${API_URL}/api/assessments/attempts/my`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch attempts');
  return data.data || [];
};

export const submitAssessmentAttempt = async (assessmentId, answers) => {
  const res = await fetch(`${API_URL}/api/assessments/${assessmentId}/attempt`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit assessment');
  return data.data;
};

export const getStudentInternships = async (studentId) => {
  const res = await fetch(`${API_URL}/api/matching/student/${studentId}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch internships');
  return data.data || [];
};

export const applyToInternship = async (opportunityId) => {
  const res = await fetch(`${API_URL}/api/applications`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      opportunityId,
      type: 'INTERNSHIP',
      status: 'APPLIED',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to apply');
  return data.data;
};

export const getMyApplications = async () => {
  const res = await fetch(`${API_URL}/api/applications`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch applications');
  if (Array.isArray(data.data)) return data.data;
  if (data.data?.applications && Array.isArray(data.data.applications)) return data.data.applications;
  return [];
};

export const getAcademiaOverview = async () => {
  const res = await fetch(`${API_URL}/api/academia/overview`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch overview');
  return data.data;
};

export const getAcademiaStudents = async () => {
  const res = await fetch(`${API_URL}/api/academia/students`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
  return data.data || [];
};

export const verifyStudentSkill = async (studentId, skillId, score, comments) => {
  const res = await fetch(`${API_URL}/api/academia/verify-skill`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ studentId, skillId, score, comments }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to verify skill');
  return data.data;
};

export const getPlacementCycles = async () => {
  const res = await fetch(`${API_URL}/api/placements/cycles`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) return [];
  return data.data || [];
};

export const getPlacementRecords = async () => {
  const res = await fetch(`${API_URL}/api/placements/records`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) return [];
  return data.data || [];
};
