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
{/* Main Container */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── TAB: OVERVIEW ────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8">
                {/* Executive Hero */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                    
                      Institutional Placement Intelligence Active
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      {institutionInfo?.name || 'Institutional Console'}
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-3xl leading-relaxed">
                      Central university console for cohort career readiness oversight, engineering skill gap aggregation, faculty workload balance, and campus recruitment pipeline execution.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowDriveModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
                    >
                      + Launch Campus Drive
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white text-xs md:text-sm font-bold tracking-wide transition-all border border-zinc-700/70 shadow-md cursor-pointer"
                    >
                      Browse Cohort
                    </button>
                  </div>
                </div>

                {/* Executive KPIs Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Total Enrolled Cohort</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{metrics.totalStudents}</span>
                      <span className="text-sm font-semibold text-zinc-400">students</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Across all departments
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Average Readiness</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">{metrics.averageCareerReadiness}</span>
                      <span className="text-sm font-semibold text-zinc-400">/ 100</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      {metrics.studentsPlacementReady} placement ready (score &ge; 70)
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Students At Risk</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className={`text-4xl md:text-5xl font-black tracking-tight ${metrics.studentsAtRisk > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {metrics.studentsAtRisk}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">flagged</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Score &lt; 40 or severe deficit
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Placement Offers</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">{metrics.totalOffers}</span>
                      <span className="text-sm font-semibold text-zinc-400">offers ({metrics.conversionRate}%)</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      {metrics.totalApplications} total applications logged
                    </span>
                  </div>
                </div>
 {/* Department Analytics Cards */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-4">Department Cohort Breakdown</h2>
                  {departments.length === 0 ? (
                    <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center text-xs md:text-sm text-zinc-400 font-medium">
                      No departments configured yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                      {departments.map((d, idx) => (
                        <div key={idx} className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-lg hover:border-zinc-700 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-base md:text-lg font-bold text-white">{d.department}</h3>
                              <span className="text-xs md:text-sm font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                                {d.averageReadiness}/100
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 text-xs text-zinc-300 my-3.5 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
                              <div>
                                <span className="text-zinc-400 font-semibold block text-[11px] uppercase tracking-wider">Enrolled</span>
                                <span className="text-white font-bold text-sm">{d.studentCount} students</span>
                              </div>
                              <div>
                                <span className="text-zinc-400 font-semibold block text-[11px] uppercase tracking-wider">Placement Ready</span>
                                <span className="text-emerald-400 font-bold text-sm">{d.placementReadyStudents}</span>
                              </div>
                              <div>
                                <span className="text-zinc-400 font-semibold block text-[11px] uppercase tracking-wider">At Risk</span>
                                <span className="text-amber-400 font-bold text-sm">{d.studentsAtRisk}</span>
                              </div>
                              <div>
                                <span className="text-zinc-400 font-semibold block text-[11px] uppercase tracking-wider">Project Coverage</span>
                                <span className="text-white font-bold text-sm">{d.projectCoverageRate}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                            <span className="font-medium">Active Application Rate</span>
                            <span className="text-zinc-200 font-bold">{d.activeApplicationRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: STUDENTS COHORT ──────────────────────────────────── */}
            {activeTab === 'students' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Enrolled Student Cohort
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Student Cohort Directory
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Enrolled students strictly isolated to {institutionInfo?.name || 'your educational institution'} ({students.length} students currently enrolled).
                    </p>
                  </div>
                </div>

                {/* Sub-KPI HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Total Enrolled</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{students.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">students</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Institution roster
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Placement Ready</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">
                        {students.filter(s => (s.readinessScore || 0) >= 70).length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">candidates</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Score &ge; 70 benchmark
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Active in Funnel</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">
                        {students.filter(s => ['PLACED', 'IN_PROCESS', 'APPLIED'].includes(s.placementStatus)).length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">engaged</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Applied or in review
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Flagged At-Risk</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className={`text-4xl md:text-5xl font-black tracking-tight ${students.filter(s => (s.readinessScore || 0) < 40).length > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {students.filter(s => (s.readinessScore || 0) < 40).length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">flagged</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Score &lt; 40 or missing proofs
                    </span>
                  </div>
                </div>
     {/* Filters HUD */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 shadow-lg">
                  <input
                    type="text"
                    value={studentFilters.search}
                    onChange={(e) => setStudentFilters({ ...studentFilters, search: e.target.value })}
                    placeholder="Search name, roll no, goal..."
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />

                  <select
                    value={studentFilters.department}
                    onChange={(e) => setStudentFilters({ ...studentFilters, department: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none font-medium"
                  >
                    <option value="">All Departments</option>
                    {institutionInfo?.departments?.map((dep, i) => (
                      <option key={i} value={dep}>{dep}</option>
                    ))}
                  </select>

                  <select
                    value={studentFilters.batch}
                    onChange={(e) => setStudentFilters({ ...studentFilters, batch: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none font-medium"
                  >
                    <option value="">All Batches</option>
                    <option value="2025">Batch 2025</option>
                    <option value="2026">Batch 2026</option>
                    <option value="2027">Batch 2027</option>
                  </select>

                  <select
                    value={studentFilters.readiness}
                    onChange={(e) => setStudentFilters({ ...studentFilters, readiness: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none font-medium"
                  >
                    <option value="">All Readiness</option>
                    <option value="ready">Placement Ready (&ge;70)</option>
                    <option value="progressing">Progressing (40-69)</option>
                    <option value="at_risk">At Risk (&lt;40)</option>
                  </select>

                  <select
                    value={studentFilters.placementStatus}
                    onChange={(e) => setStudentFilters({ ...studentFilters, placementStatus: e.target.value })}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none font-medium"
                  >
                    <option value="">All Placement Status</option>
                    <option value="PLACED">Placed / Offer</option>
                    <option value="IN_PROCESS">In Process / Interview</option>
                    <option value="APPLIED">Applied</option>
                    <option value="NOT_APPLIED">Not Applied</option>
                  </select>
                </div>

                {/* Cohort Table */}
                {students.length === 0 ? (
                  <div className="p-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 text-center text-sm text-zinc-400 font-medium">
                    No students match the current filter criteria.
                  </div>
                ) : (
                  <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40 shadow-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                          <th className="p-4 font-bold">Student Name</th>
                          <th className="p-4 font-bold">Department</th>
                          <th className="p-4 font-bold">Batch</th>
                          <th className="p-4 font-bold">Target Role</th>
                          <th className="p-4 font-bold">Readiness</th>
                          <th className="p-4 font-bold">Placement Status</th>
                          <th className="p-4 font-bold">Assigned Mentor</th>
                          <th className="p-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {students.map((st) => (
                          <tr key={st._id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-white text-sm block">{st.name}</span>
                              <span className="text-xs text-zinc-400 font-mono mt-0.5">{st.registrationNumber || 'Pending'}</span>
                            </td>
                            <td className="p-4 text-zinc-200 font-medium">{st.department}</td>
                            <td className="p-4 text-zinc-300 font-mono font-medium">{st.batch}</td>
                            <td className="p-4 text-indigo-300 font-bold">{st.targetRole || 'Engineering'}</td>
                            <td className="p-4">
                              <span
                                className={`font-mono font-black px-2.5 py-1 rounded-lg text-xs ${
                                  st.readinessScore >= 70
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : st.readinessScore >= 40
                                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {st.readinessScore}/100
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded-full font-bold ${
                                  st.placementStatus === 'PLACED'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : st.placementStatus === 'IN_PROCESS'
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}
                              >
                                {st.placementStatus}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-300 font-medium">
                              {st.assignedMentor?.name || <span className="text-zinc-500 font-normal">Unassigned</span>}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleViewStudent360(st)}
                                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
                              >
                                View 360°
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
     {/* ── TAB: ACADEMICIANS / FACULTY WORKLOAD ───────────────────── */}
            {activeTab === 'academicians' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Faculty Mentorship Roster
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Faculty Workload &amp; Allocation
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Balance mentoring capacity across academic departments (Average: {facultyWorkload.averageWorkload} students/mentor).
                    </p>
                  </div>
                </div>

                {/* Sub-KPI HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Registered Faculty</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{facultyWorkload.academicians.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">professors</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Active mentors
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Average Workload</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">{facultyWorkload.averageWorkload}</span>
                      <span className="text-sm font-semibold text-zinc-400">students/mentor</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Target threshold: 25 max
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Total Mentees</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{facultyWorkload.totalAssignedStudents}</span>
                      <span className="text-sm font-semibold text-zinc-400">assigned</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Under active guidance
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">High Load Flag</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className={`text-4xl md:text-5xl font-black tracking-tight ${facultyWorkload.academicians.filter(f => f.workloadStatus === 'HIGH LOAD').length > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {facultyWorkload.academicians.filter(f => f.workloadStatus === 'HIGH LOAD').length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">mentors</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Rebalancing recommended
                    </span>
                  </div>
                </div>

                {facultyWorkload.academicians.length === 0 ? (
                  <div className="p-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 text-center text-sm text-zinc-400 font-medium">
                    No faculty profiles registered for this institution yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facultyWorkload.academicians.map((fac) => (
                      <div key={fac._id} className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <h3 className="text-base font-bold text-white tracking-tight">{fac.user?.name || 'Faculty Member'}</h3>
                              <p className="text-xs text-zinc-400 font-medium mt-0.5">{fac.user?.email}</p>
                            </div>
                            <span
                              className={`text-xs uppercase font-mono px-2.5 py-1 rounded-full font-bold ${
                                fac.workloadStatus === 'HIGH LOAD'
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  : fac.workloadStatus === 'NORMAL'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              {fac.workloadStatus}
                            </span>
                          </div>

                          <div className="text-xs text-zinc-300 my-4 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80 flex items-center justify-between font-medium">
                            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">Department</span>
                            <span className="text-zinc-100 font-bold">{fac.department}</span>
                          </div>

                          <div className="flex items-baseline justify-between text-xs py-1">
                            <span className="text-zinc-400 font-medium">Assigned Cohort</span>
                            <span className="text-2xl font-black font-mono text-indigo-400">{fac.assignedStudentsCount} students</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedAcademician(fac);
                              setShowAssignModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                          >
                            + Allocate Student
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
  {/* ── TAB: SKILL GAP RADAR ─────────────────────────────────── */}
            {activeTab === 'skills' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Cohort Competency Telemetry
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Institutional Skill Gap Radar
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Aggregated competencies and deficit severity across {skillGaps.totalStudentsAnalyzed} analyzed student portfolios.
                    </p>
                  </div>
                </div>

                {/* Sub-KPI HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Students Analyzed</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{skillGaps.totalStudentsAnalyzed}</span>
                      <span className="text-sm font-semibold text-zinc-400">profiles</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Portfolio skill telemetry
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Critical Deficits</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-rose-400 tracking-tight">{skillGaps.topMissingSkills.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">skills</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Demanded by industry
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Mastered Competencies</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">{skillGaps.topCoveredSkills.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">skills</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Verified capabilities
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Average Gap Rate</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">
                        {skillGaps.topMissingSkills.length > 0 ? Math.round(skillGaps.topMissingSkills.reduce((acc, s) => acc + (s.missingPercentage || 0), 0) / skillGaps.topMissingSkills.length) : 0}%
                      </span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Across deficit skills
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Missing Skills */}
                  <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 flex flex-col shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-1 tracking-tight">Top Missing Engineering Skills</h2>
                    <p className="text-xs text-zinc-400 mb-5 font-medium">Required by active job opportunities but lacking in cohort</p>

                    {skillGaps.topMissingSkills.length === 0 ? (
                      <div className="p-12 text-center text-xs text-zinc-500">No critical skill gaps flagged.</div>
                    ) : (
                      <div className="divide-y divide-zinc-800/60">
                        {skillGaps.topMissingSkills.map((sk, i) => (
                          <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-base font-bold text-zinc-100 block">{sk.skill}</span>
                              <span className="text-xs text-zinc-400 font-medium">
                                Demanded in {sk.industryDemandCount} opportunities
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                                  sk.severity === 'HIGH'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {sk.missingPercentage}% missing
                              </span>
                              <span className="text-xs text-zinc-400 font-mono block mt-1">
                                {sk.studentsMissing} students
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
 {/* Top Covered Skills */}
                  <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 flex flex-col shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-1 tracking-tight">Top Mastered Competencies</h2>
                    <p className="text-xs text-zinc-400 mb-5 font-medium">Verified student capabilities across engineering batches</p>

                    {skillGaps.topCoveredSkills.length === 0 ? (
                      <div className="p-12 text-center text-xs text-zinc-500">No student skills documented yet.</div>
                    ) : (
                      <div className="divide-y divide-zinc-800/60">
                        {skillGaps.topCoveredSkills.map((sk, i) => (
                          <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                            <span className="text-base font-bold text-zinc-100">{sk.skill}</span>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                {sk.coveragePercentage}% coverage
                              </span>
                              <span className="text-xs text-zinc-400 font-mono block mt-1">
                                {sk.studentCount} students
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}