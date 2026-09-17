import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_URL } from '../../utils/constants';
import BrandLogo from '../../components/common/BrandLogo';
import HeaderUserMenu from '../../components/common/HeaderUserMenu';

export default function InstitutionDashboard() {
  const { user, token, logout } = useAuth();

  // Navigation Tabs: overview, students, academicians, skills, industry, placements, drives
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalAcademicians: 0,
    activeMentors: 0,
    averageCareerReadiness: 0,
    studentsAtRisk: 0,
    studentsPlacementReady: 0,
    activeOpportunities: 0,
    totalApplications: 0,
    totalOffers: 0,
    conversionRate: 0,
  });

  // Secondary Tab States
  const [students, setStudents] = useState([]);
  const [studentFilters, setStudentFilters] = useState({
    search: '',
    department: '',
    batch: '',
    readiness: '',
    placementStatus: '',
  });

  const [departments, setDepartments] = useState([]);
  const [facultyWorkload, setFacultyWorkload] = useState({ academicians: [], averageWorkload: 0, totalAssignedStudents: 0 });
  const [skillGaps, setSkillGaps] = useState({ topMissingSkills: [], topCoveredSkills: [], totalStudentsAnalyzed: 0, skillProficiencyDistribution: [] });
  const [industryDemand, setIndustryDemand] = useState({ totalOpportunities: 0, comparisons: [], domainDemand: [] });
  const [placements, setPlacements] = useState({ funnel: {}, conversionRates: {}, departmentBreakdown: [] });
  const [hiringDrives, setHiringDrives] = useState([]);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [student360, setStudent360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  const [showDriveModal, setShowDriveModal] = useState(false);
  const [newDrive, setNewDrive] = useState({
    title: '',
    company: '',
    departments: '',
    eligibleBatches: '2025, 2026',
    minCgpa: 7.0,
    minReadinessScore: 60,
    requiredSkills: '',
    deadline: '',
  });

  const [selectedDriveForEligibility, setSelectedDriveForEligibility] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAcademician, setSelectedAcademician] = useState(null);
  const [assignStudentId, setAssignStudentId] = useState('');

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
 // Load Main Dashboard Overview
  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashRes, deptRes, facRes, skillRes, demandRes, placeRes, driveRes] = await Promise.all([
        fetch(`${API_URL}/api/institution/dashboard`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/institution/departments`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/institution/academicians`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/institution/skill-gaps`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/institution/industry-demand`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/institution/placements`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/institution/hiring-drives`, { credentials: 'omit', headers: authHeaders }),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.success) {
          setInstitutionInfo(d.data.institution);
          setMetrics(d.data.metrics);
        }
      }
      if (deptRes.ok) {
        const d = await deptRes.json();
        if (d.success) setDepartments(d.data);
      }
      if (facRes.ok) {
        const d = await facRes.json();
        if (d.success) setFacultyWorkload(d.data);
      }
      if (skillRes.ok) {
        const d = await skillRes.json();
        if (d.success) setSkillGaps(d.data);
      }
      if (demandRes.ok) {
        const d = await demandRes.json();
        if (d.success) setIndustryDemand(d.data);
      }
      if (placeRes.ok) {
        const d = await placeRes.json();
        if (d.success) setPlacements(d.data);
      }
      if (driveRes.ok) {
        const d = await driveRes.json();
        if (d.success) setHiringDrives(d.data);
      }
    } catch (err) {
      console.error('Failed to load institution data:', err);
      showToast('Error loading institution analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);
 // Load Students with Active Filters
  const loadStudents = async () => {
    if (!token) return;
    const query = new URLSearchParams();
    if (studentFilters.search) query.set('search', studentFilters.search);
    if (studentFilters.department) query.set('department', studentFilters.department);
    if (studentFilters.batch) query.set('batch', studentFilters.batch);
    if (studentFilters.readiness) query.set('readiness', studentFilters.readiness);
    if (studentFilters.placementStatus) query.set('placementStatus', studentFilters.placementStatus);

    try {
      const res = await fetch(`${API_URL}/api/institution/students?${query.toString()}`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setStudents(d.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab, studentFilters]);