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
