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
  // Evaluate Hiring Drive Eligibility
  const handleCheckDriveEligibility = async (drive) => {
    setSelectedDriveForEligibility(drive);
    setLoadingEligibility(true);
    try {
      const res = await fetch(`${API_URL}/api/institution/hiring-drives/${drive._id}/eligible-students`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setEligibilityData(d.data);
      }
    } catch (err) {
      showToast('Failed to compute eligibility', 'error');
    } finally {
      setLoadingEligibility(false);
    }
  };

  // Assign Student to Faculty Mentor
  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!selectedAcademician || !assignStudentId) return;

    try {
      const res = await fetch(`${API_URL}/api/institution/academicians/${selectedAcademician._id}/assign-student`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify({ studentId: assignStudentId }),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Student assigned to faculty mentor');
        setShowAssignModal(false);
        setAssignStudentId('');
        loadDashboardData();
      } else {
        showToast(d.message || 'Error assigning student', 'error');
      }
    } catch (err) {
      showToast('Error assigning student', 'error');
    }
  };
  // Unassign Student
  const handleUnassignStudent = async (academicianId, studentId) => {
    if (!window.confirm('Unassign this student from faculty mentor?')) return;
    try {
      const res = await fetch(`${API_URL}/api/institution/academicians/${academicianId}/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'omit',
        headers: authHeaders,
      });
      const d = await res.json();
      if (d.success) {
        showToast('Student unassigned successfully');
        loadDashboardData();
      }
    } catch (err) {
      showToast('Error unassigning student', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#050c0a] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      {/* Ambient Executive Mesh Lights */}
      <div className="fixed -top-40 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 -left-20 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm flex items-center gap-3 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Navigation */}
      <header className="border-b border-emerald-950/80 bg-[#061410]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-3.5">
          <BrandLogo size="sm" showText={false} role="institution" glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Career{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#FF5100] via-[#FF7A00] to-[#FFA726] bg-clip-text text-transparent">
                  Odyssey
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wide">
                🏛️ Institution Admin
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70 font-medium">
              {institutionInfo?.name || user?.collegeName || 'National Engineering Academy'} • {institutionInfo?.code || 'INST'}
            </p>
          </div>
        </div>
{/* Global Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#06120e]/90 p-1 rounded-xl border border-emerald-950/80">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'students', label: 'Cohort', badge: metrics.totalStudents },
            { id: 'academicians', label: 'Faculty', badge: facultyWorkload.academicians.length },
            { id: 'skills', label: 'Skill Gap Radar' },
            { id: 'industry', label: 'Demand vs Supply' },
            { id: 'placements', label: 'Placements' },
            { id: 'drives', label: 'Hiring Drives', badge: hiringDrives.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-zinc-400 hover:text-emerald-200 hover:bg-emerald-950/40'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id
                      ? 'bg-emerald-800 text-white'
                      : tab.badge === 'Live'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile & Exit Button */}
        <HeaderUserMenu
          user={user}
          onLogout={logout}
          role="institution"
          subtitle={user?.email || 'Institution Admin'}
        />
      </header>

      {/* Mobile Tab Scroll Bar */}
      <div className="flex lg:hidden px-4 pt-3 pb-1 overflow-x-auto gap-1.5 border-b border-emerald-950/60 bg-[#06120e]/95">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: 'Cohort' },
          { id: 'academicians', label: 'Faculty' },
          { id: 'skills', label: 'Skill Gap' },
          { id: 'industry', label: 'Demand' },
          { id: 'placements', label: 'Placements' },
          { id: 'drives', label: 'Drives' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
