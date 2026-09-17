import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_URL } from '../../utils/constants';
import BrandLogo from '../../components/common/BrandLogo';
import HeaderUserMenu from '../../components/common/HeaderUserMenu';

export default function AcademicianDashboard() {
  const { user, token, logout } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, assessments, evaluations, mentoring

  // Data States
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    assignedStudentsCount: 0,
    studentsImproving: 0,
    studentsAtRisk: 0,
    averageCareerReadiness: 0,
    pendingAssessments: 0,
    activeMentoringNotes: 0,
    recentEvaluations: [],
  });
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [mentoringActions, setMentoringActions] = useState([]);

  // Search & Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [institutionStudents, setInstitutionStudents] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Student 360 Intelligence Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [student360, setStudent360] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Create Assessment Modal State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    category: 'Technical',
    department: 'Computer Science',
    skills: '',
    maxScore: 100,
    dueDate: '',
  });

  // Create Evaluation Modal State
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [newEval, setNewEval] = useState({
    studentId: '',
    overallScore: 80,
    maxScore: 100,
    feedback: '',
    strengths: '',
    weaknesses: '',
    recommendation: '',
    skillName: 'React',
    skillScore: 85,
    skillLevel: 'intermediate',
  });

  // Create Mentoring Action Modal State
  const [showMentoringModal, setShowMentoringModal] = useState(false);
  const [newMentorAction, setNewMentorAction] = useState({
    studentId: '',
    note: '',
    recommendation: '',
    priority: 'MEDIUM',
    linkedSkill: '',
    suggestedAction: '',
  });

  // Toast / Feedback message
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth Headers helper
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Initial Data Fetch
  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [overviewRes, studentsRes, assessmentsRes, evalsRes, mentoringRes] = await Promise.all([
        fetch(`${API_URL}/api/academician/dashboard`, { credentials: 'omit', credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/academician/students`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/academician/assessments`, { credentials: 'omit', credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/academician/evaluations`, { credentials: 'omit', credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/academician/mentoring`, { credentials: 'omit', credentials: 'omit', headers: authHeaders }),
      ]);

      if (overviewRes.ok) {
        const d = await overviewRes.json();
        if (d.success) setOverview(d.data);
      }
      if (studentsRes.ok) {
        const d = await studentsRes.json();
        if (d.success) setStudents(d.data);
      }
      if (assessmentsRes.ok) {
        const d = await assessmentsRes.json();
        if (d.success) setAssessments(d.data);
      }
      if (evalsRes.ok) {
        const d = await evalsRes.json();
        if (d.success) setEvaluations(d.data);
      }
      if (mentoringRes.ok) {
        const d = await mentoringRes.json();
        if (d.success) setMentoringActions(d.data);
      }
    } catch (err) {
      console.error('Failed to load academician data:', err);
      showToast('Failed to load dashboard data. Retrying...', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  // Search institution students for assignment
  const handleSearchStudents = async (query = '') => {
    setSearchingStudents(true);
    try {
      const res = await fetch(`${API_URL}/api/academician/students/search?search=${encodeURIComponent(query)}`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setInstitutionStudents(d.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Assign Student
  const handleAssignStudent = async (studentId) => {
    try {
      const res = await fetch(`${API_URL}/api/academician/students/${studentId}/assign`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
      });
      const d = await res.json();
      if (d.success) {
        showToast('Student assigned to your mentoring cohort');
        loadDashboardData();
        handleSearchStudents(searchQuery);
      } else {
        showToast(d.message || 'Failed to assign student', 'error');
      }
    } catch (err) {
      showToast('Error assigning student', 'error');
    }
  };

  // Unassign Student
  const handleUnassignStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to unassign this student from your mentoring cohort?')) return;
    try {
      const res = await fetch(`${API_URL}/api/academician/students/${studentId}/assign`, {
        method: 'DELETE',
        credentials: 'omit',
        headers: authHeaders,
      });
      const d = await res.json();
      if (d.success) {
        showToast('Student unassigned');
        loadDashboardData();
        if (selectedStudent?._id === studentId) setSelectedStudent(null);
      }
    } catch (err) {
      showToast('Error unassigning student', 'error');
    }
  };

  // View Student 360 Intelligence
  const handleViewStudent360 = async (student) => {
    setSelectedStudent(student);
    setLoading360(true);
    try {
      const [intelRes, recsRes] = await Promise.all([
        fetch(`${API_URL}/api/academician/students/${student._id}`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/academician/recommendations/${student._id}`, { credentials: 'omit', headers: authHeaders }),
      ]);
      if (intelRes.ok) {
        const d = await intelRes.json();
        if (d.success) setStudent360(d.data);
      }
      if (recsRes.ok) {
        const d = await recsRes.json();
        if (d.success) setRecommendations(d.data);
      }
    } catch (err) {
      showToast('Failed to load 360 career intelligence', 'error');
    } finally {
      setLoading360(false);
    }
  };

  // Create Assessment
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newAssessment.skills
        ? newAssessment.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const res = await fetch(`${API_URL}/api/academician/assessments`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify({
          ...newAssessment,
          skills: skillsArray,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Assessment published successfully');
        setShowAssessmentModal(false);
        setNewAssessment({
          title: '',
          description: '',
          category: 'Technical',
          department: 'Computer Science',
          skills: '',
          maxScore: 100,
          dueDate: '',
        });
        loadDashboardData();
      } else {
        showToast(d.message || 'Error creating assessment', 'error');
      }
    } catch (err) {
      showToast('Error creating assessment', 'error');
    }
  };

  // Create Evaluation
  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    try {
      const strengthsArr = newEval.strengths
        ? newEval.strengths.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const weaknessesArr = newEval.weaknesses
        ? newEval.weaknesses.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        studentId: newEval.studentId,
        overallScore: Number(newEval.overallScore),
        maxScore: Number(newEval.maxScore),
        feedback: newEval.feedback,
        recommendation: newEval.recommendation,
        strengths: strengthsArr,
        weaknesses: weaknessesArr,
        skillEvaluations: [
          {
            skillName: newEval.skillName || 'Engineering Competency',
            score: Number(newEval.skillScore),
            level: newEval.skillLevel,
          },
        ],
      };

      const res = await fetch(`${API_URL}/api/academician/evaluations`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Evaluation submitted successfully');
        setShowEvaluationModal(false);
        loadDashboardData();
      } else {
        showToast(d.message || 'Error submitting evaluation', 'error');
      }
    } catch (err) {
      showToast('Error submitting evaluation', 'error');
    }
  };

  // Create Mentoring Action
  const handleCreateMentoringAction = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/academician/mentoring`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify(newMentorAction),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Mentoring recommendation saved');
        setShowMentoringModal(false);
        setNewMentorAction({
          studentId: '',
          note: '',
          recommendation: '',
          priority: 'MEDIUM',
          linkedSkill: '',
          suggestedAction: '',
        });
        loadDashboardData();
      } else {
        showToast(d.message || 'Error saving mentoring action', 'error');
      }
    } catch (err) {
      showToast('Error saving mentoring action', 'error');
    }
  };

  // Complete Mentoring Action
  const handleCompleteAction = async (actionId) => {
    try {
      const res = await fetch(`${API_URL}/api/academician/recommendations/${actionId}/complete`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
      });
      const d = await res.json();
      if (d.success) {
        showToast('Marked as completed');
        loadDashboardData();
      }
    } catch (err) {
      showToast('Error completing recommendation', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Ambient Scholarly Mesh Lights */}
      <div className="fixed -top-40 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 -left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Toast Notification */}
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

      {/* Navigation Header */}
      <header className="border-b border-indigo-950/80 bg-[#0c0e1a]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-3.5">
          <BrandLogo size="sm" showText={false} role="academician" glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Career{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#FF5100] via-[#FF7A00] to-[#FFA726] bg-clip-text text-transparent">
                  Odyssey
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wide">
                🎓 Academician Portal
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/70 font-medium">Faculty Mentorship, Assessment & Evaluation Console</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#090b16]/90 p-1 rounded-xl border border-indigo-950/80">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'students', label: 'My Students', badge: students.length },
            { id: 'assessments', label: 'Assessments', badge: assessments.length },
            { id: 'evaluations', label: 'Evaluations', badge: evaluations.length },
            { id: 'mentoring', label: 'Mentoring', badge: mentoringActions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-indigo-200 hover:bg-indigo-950/40'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id
                      ? 'bg-indigo-800 text-white'
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
          role="academician"
          subtitle={user?.email || 'Faculty Mentor'}
        />
      </header>

      {/* Mobile Tab Scroll Bar */}
      <div className="flex md:hidden px-4 pt-3 pb-1 overflow-x-auto gap-1.5 border-b border-indigo-950/60 bg-[#0c0e1a]/95">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: 'Students' },
          { id: 'assessments', label: 'Assessments' },
          { id: 'evaluations', label: 'Evaluations' },
          { id: 'mentoring', label: 'Mentoring' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Academic Mentoring Hub
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Welcome, {user?.name || 'Mentor'}
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Guide your assigned engineering cohort, evaluate project and DSA milestones, and deliver deterministic career guidance.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setShowAssignModal(true);
                        handleSearchStudents('');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-base leading-none">+</span> Assign Students
                    </button>
                    <button
                      onClick={() => setShowAssessmentModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white text-xs md:text-sm font-bold tracking-wide transition-all border border-zinc-700/70 cursor-pointer shadow-md"
                    >
                      New Assessment
                    </button>
                  </div>
                </div>

                {/* KPI Metrics HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Assigned Cohort</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{overview.assignedStudentsCount}</span>
                      <span className="text-sm font-semibold text-zinc-400">students</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Active mentoring links
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Average Readiness</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">{overview.averageCareerReadiness}</span>
                      <span className="text-sm font-semibold text-zinc-400">/ 100</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      {overview.studentsImproving} improving trajectory
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">At-Risk Students</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className={`text-4xl md:text-5xl font-black tracking-tight ${overview.studentsAtRisk > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {overview.studentsAtRisk}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">flagged</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Score &lt; 40 or severe gap
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Active Assessments</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{overview.pendingAssessments}</span>
                      <span className="text-sm font-semibold text-zinc-400">published</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Cross-discipline rubrics
                    </span>
                  </div>
                </div>

                {/* Two-Column Overview Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* Left 2 Cols: My Assigned Cohort Preview */}
                  <div className="lg:col-span-2 rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 p-6 md:p-8 flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Assigned Student Cohort</h2>
                        <p className="text-xs md:text-sm text-zinc-300 mt-0.5">Students under your academic advisory</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('students')}
                        className="text-xs md:text-sm text-indigo-400 hover:text-indigo-300 font-bold tracking-wide transition-colors"
                      >
                        View All ({students.length}) →
                      </button>
                    </div>

                    {students.length === 0 ? (
                      <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3 text-lg">
                          👥
                        </div>
                        <h3 className="text-base font-bold text-zinc-200 mb-1">No Students Assigned Yet</h3>
                        <p className="text-xs md:text-sm text-zinc-400 max-w-sm mb-5">
                          Search and assign authorized students from your educational institution to begin monitoring their progress.
                        </p>
                        <button
                          onClick={() => {
                            setShowAssignModal(true);
                            handleSearchStudents('');
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold transition-all shadow-md"
                        >
                          Assign First Student
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/80 overflow-hidden">
                        {students.slice(0, 5).map((s) => (
                          <div key={s._id} className="py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-white">{s.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium mt-0.5">
                                  <span>{s.department}</span>
                                  <span>•</span>
                                  <span className="font-mono text-zinc-400">Roll: {s.registrationNumber || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-sm md:text-base font-mono font-bold text-indigo-400">
                                  {s.readinessScore}/100
                                </span>
                                <span className="text-[11px] font-semibold text-zinc-400 block">Readiness</span>
                              </div>
                              <button
                                onClick={() => handleViewStudent360(s)}
                                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700/80 transition-all shadow-sm cursor-pointer"
                              >
                                View 360°
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right 1 Col: Recent Evaluations & Activities */}
                  <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 p-6 md:p-8 flex flex-col shadow-xl">
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">Recent Evaluations</h2>
                    <p className="text-xs md:text-sm text-zinc-300 mb-5">Latest scored rubrics</p>

                    {evaluations.length === 0 ? (
                      <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center flex flex-col items-center justify-center flex-1">
                        <span className="text-xs text-zinc-400 font-medium">No evaluations recorded yet.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5">
                        {evaluations.slice(0, 4).map((ev) => (
                          <div key={ev._id} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-white">{ev.student?.name || 'Student'}</span>
                              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                {ev.scores?.percentage || ev.scores?.overallScore}%
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{ev.feedback || 'Evaluation completed.'}</p>
                            <span className="text-[11px] font-mono text-zinc-400 mt-2 block">
                              {new Date(ev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MY STUDENTS */}
            {activeTab === 'students' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Assigned Mentee Directory
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Assigned Student Cohort
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Direct mentoring directory for your assigned cohort ({students.length} students enrolled under your academic advisory).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setShowAssignModal(true);
                        handleSearchStudents('');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-base leading-none">+</span> Assign New Student
                    </button>
                  </div>
                </div>

                {/* KPI Metrics HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Total Enrolled</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{students.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">students</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Authorized cohort roster
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Average Readiness</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">{overview.averageCareerReadiness || 0}</span>
                      <span className="text-sm font-semibold text-zinc-400">/ 100</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      {overview.studentsImproving || 0} on improving trajectory
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Placement Ready</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">
                        {students.filter(s => (s.readinessScore || 0) >= 60).length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">candidates</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Readiness &gt;= 60 benchmark
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Attention Needed</span>
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

                {students.length === 0 ? (
                  <div className="p-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 text-center flex flex-col items-center justify-center shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
                      🎓
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Students Assigned Yet</h3>
                    <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                      You do not have any students currently assigned to your mentoring cohort. Search and assign authorized students from your educational institution.
                    </p>
                    <button
                      onClick={() => {
                        setShowAssignModal(true);
                        handleSearchStudents('');
                      }}
                      className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      Assign Student Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((s) => (
                      <div
                        key={s._id}
                        className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 flex flex-col justify-between hover:border-indigo-500/40 shadow-xl transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-base shadow-inner">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">{s.name}</h3>
                                <p className="text-xs text-zinc-400 font-medium truncate max-w-[180px]">{s.email}</p>
                              </div>
                            </div>
                            <span className="text-sm font-mono font-black px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm">
                              {s.readinessScore}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 my-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                            <div>
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Department</span>
                              <span className="text-xs md:text-sm font-bold text-zinc-200 block mt-0.5">{s.department || 'General'}</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Roll / Reg No</span>
                              <span className="text-xs md:text-sm font-bold text-zinc-200 font-mono block mt-0.5">{s.registrationNumber || 'Pending'}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Target Role</span>
                              <span className="text-xs md:text-sm font-bold text-indigo-300 truncate block mt-0.5">{s.targetRole || 'Engineering'}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Skills Tracked</span>
                              <span className="text-xs md:text-sm font-bold text-zinc-200 block mt-0.5">{s.skillsCount || 0} skills</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                          <button
                            onClick={() => handleViewStudent360(s)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 text-center cursor-pointer"
                          >
                            360° Intelligence
                          </button>
                          <button
                            onClick={() => {
                              setNewEval({ ...newEval, studentId: s._id });
                              setShowEvaluationModal(true);
                            }}
                            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold border border-zinc-700/80 transition-all cursor-pointer shadow-sm"
                          >
                            Evaluate
                          </button>
                          <button
                            onClick={() => handleUnassignStudent(s._id)}
                            className="p-2.5 rounded-xl hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Unassign student"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ASSESSMENTS */}
            {activeTab === 'assessments' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Standardized Engineering Rubrics
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Engineering Assessments
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Author and manage technical rubrics across CSE, ECE, EE, Mechanical, and Civil disciplines to evaluate student milestones.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowAssessmentModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-base leading-none">+</span> Author Assessment
                    </button>
                  </div>
                </div>

                {/* KPI Metrics HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Published Rubrics</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{assessments.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">assessments</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Standardized rubric library
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Active Disciplines</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">5</span>
                      <span className="text-sm font-semibold text-zinc-400">branches</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      CSE, ECE, EE, Mech, Civil
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Standard Points</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">100</span>
                      <span className="text-sm font-semibold text-zinc-400">max</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Normalized benchmark ceiling
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Verification Scope</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">100%</span>
                      <span className="text-sm font-semibold text-zinc-400">evidence</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Direct proof & code validation
                    </span>
                  </div>
                </div>

                {assessments.length === 0 ? (
                  <div className="space-y-6">
                    <div className="p-12 md:p-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 text-center flex flex-col items-center justify-center shadow-xl">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
                        📝
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Assessments Created Yet</h3>
                      <p className="text-sm text-zinc-300 max-w-xl mb-6 leading-relaxed">
                        Create technical, DSA, or project rubrics to evaluate your assigned cohort against verified engineering benchmarks.
                      </p>
                      <button
                        onClick={() => setShowAssessmentModal(true)}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        Create First Assessment
                      </button>
                    </div>

                    {/* Assessment Framework Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Benchmark Alignment</span>
                        <h4 className="text-base font-bold text-white">Cross-Discipline Rubrics</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Define standard rubrics across CSE, ECE, EE, Mechanical, and Civil engineering cohorts with normalized scoring ceilings.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Skill Taxonomy</span>
                        <h4 className="text-base font-bold text-white">Canonical Skill Mapping</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Link rubric criteria directly to industry canonical skills (React, Node, Python, Docker) to close verifiable skill gaps.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Deterministic Sync</span>
                        <h4 className="text-base font-bold text-white">Readiness Score Impact</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Assessment grades contribute directly to mentee Career Readiness scores and institutional placement telemetry.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((ass) => (
                      <div
                        key={ass._id}
                        className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 flex flex-col justify-between hover:border-indigo-500/40 shadow-xl transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className="text-xs uppercase font-mono px-2.5 py-1 rounded-lg bg-zinc-800/90 text-zinc-200 font-bold border border-zinc-700">
                              {ass.category}
                            </span>
                            <span className="text-xs font-bold text-indigo-300">
                              {ass.department}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{ass.title}</h3>
                          <p className="text-xs text-zinc-300 line-clamp-2 mb-4 leading-relaxed font-medium">
                            {ass.description || 'Comprehensive evaluation assessment.'}
                          </p>

                          {ass.skills && ass.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {ass.skills.map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300 font-medium">
                          <span className="font-bold text-white">Max: {ass.maxScore} pts</span>
                          <span className="text-zinc-400 font-mono">
                            {ass.dueDate ? `Due: ${new Date(ass.dueDate).toLocaleDateString()}` : 'No deadline'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: EVALUATIONS */}
            {activeTab === 'evaluations' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Scored Rubrics & Telemetry
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Student Evaluations
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Scored rubric assessments, skill taxonomy proficiency evaluations, and verified competency records.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowEvaluationModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-base leading-none">+</span> Record Evaluation
                    </button>
                  </div>
                </div>

                {/* KPI Metrics HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Total Evaluated</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{evaluations.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">records</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Verified evaluation history
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Average Score</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tight">
                        {evaluations.length > 0 ? Math.round(evaluations.reduce((acc, e) => acc + (e.scores?.percentage || e.scores?.overallScore || 0), 0) / evaluations.length) : 0}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">%</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Scored rubric proficiency
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Top Proficiency</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">
                        {evaluations.filter(e => (e.scores?.percentage || e.scores?.overallScore || 0) >= 80).length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">students</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Score &gt;= 80% mastery
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Cohort Coverage</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        {students.length > 0 ? Math.round((new Set(evaluations.map(e => e.student?._id || e.student)).size / students.length) * 100) : 0}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">%</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Assigned students evaluated
                    </span>
                  </div>
                </div>

                {evaluations.length === 0 ? (
                  <div className="space-y-6">
                    <div className="p-12 md:p-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 text-center flex flex-col items-center justify-center shadow-xl">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
                        📊
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Evaluations Logged Yet</h3>
                      <p className="text-sm text-zinc-300 max-w-xl mb-6 leading-relaxed">
                        Record student assessment scores, identify technical strengths, and log actionable mentor recommendations to boost hiring signals.
                      </p>
                      <button
                        onClick={() => setShowEvaluationModal(true)}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        Record First Evaluation
                      </button>
                    </div>

                    {/* Evaluation Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Verifiable Telemetry</span>
                        <h4 className="text-base font-bold text-white">Objective Assessment</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Grade student problem solving, algorithm design, and system architecture with verifiable percentage metrics.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Direct Student Feedback</span>
                        <h4 className="text-base font-bold text-white">Strengths &amp; Gaps</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Deliver specific guidance on student code quality, software patterns, and technical strengths to close critical gaps.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Recruiter 360 Signal</span>
                        <h4 className="text-base font-bold text-white">Placement Intelligence</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Faculty evaluation records are mirrored directly in the candidate 360° dossier when recruiters screen students.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {evaluations.map((ev) => (
                      <div
                        key={ev._id}
                        className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-white text-lg tracking-tight">
                              {ev.student?.name || 'Student Candidate'}
                            </span>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {ev.student?.registrationNumber || 'N/A'}
                            </span>
                            <span className="text-xs text-zinc-400 font-mono">
                              {new Date(ev.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-sm text-zinc-200 leading-relaxed font-medium">{ev.feedback || 'Comprehensive evaluation recorded.'}</p>

                          {ev.recommendation && (
                            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200 font-medium leading-relaxed">
                              <span className="font-bold text-indigo-300">Mentor Recommendation: </span>
                              {ev.recommendation}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-4 md:pt-0 md:pl-8">
                          <div className="text-right">
                            <span className="text-4xl md:text-5xl font-black font-mono text-emerald-400 tracking-tight">
                              {ev.scores?.percentage || ev.scores?.overallScore}%
                            </span>
                            <span className="text-xs font-semibold text-zinc-400 block mt-1">
                              {ev.scores?.overallScore} / {ev.scores?.maxScore} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MENTORING */}
            {activeTab === 'mentoring' && (
              <div className="flex flex-col gap-8">
                {/* Hero Header */}
                <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3.5">
                      Targeted Guidance & Interventions
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Mentoring Notes & Interventions
                    </h1>
                    <p className="text-sm md:text-base text-zinc-300 font-medium mt-2 max-w-2xl leading-relaxed">
                      Targeted recommendations, milestone follow-ups, and strategic interventions for your assigned students.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowMentoringModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold tracking-wide transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-base leading-none">+</span> Add Mentoring Note
                    </button>
                  </div>
                </div>

                {/* KPI Metrics HUD */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Active Notes</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{mentoringActions.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">notes</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Logged advisory guidance
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">High Priority</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className={`text-4xl md:text-5xl font-black tracking-tight ${mentoringActions.filter(m => m.priority === 'HIGH').length > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {mentoringActions.filter(m => m.priority === 'HIGH').length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">interventions</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Urgent skill gaps or blocks
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Resolved</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">
                        {mentoringActions.filter(m => m.status === 'COMPLETED').length}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">milestones</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Completed action items
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                    <span className="text-xs md:text-sm text-zinc-300 font-bold uppercase tracking-wider">Assigned Mentees</span>
                    <div className="mt-3 flex items-baseline gap-2.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{students.length}</span>
                      <span className="text-sm font-semibold text-zinc-400">students</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 mt-3 pt-2.5 border-t border-zinc-800/80">
                      Under active guidance
                    </span>
                  </div>
                </div>

                {mentoringActions.length === 0 ? (
                  <div className="space-y-6">
                    <div className="p-12 md:p-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 text-center flex flex-col items-center justify-center shadow-xl">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
                        💬
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Mentoring Notes Logged Yet</h3>
                      <p className="text-sm text-zinc-300 max-w-xl mb-6 leading-relaxed">
                        Create structured mentoring recommendations linked to student skill gaps, capstone projects, or technical roadmaps.
                      </p>
                      <button
                        onClick={() => setShowMentoringModal(true)}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        Add First Mentoring Note
                      </button>
                    </div>

                    {/* Mentoring Principles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Early Intervention</span>
                        <h4 className="text-base font-bold text-white">Priority Flagging</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Mark high-priority recommendations for students lagging in career readiness or struggling with core concepts.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Targeted Action</span>
                        <h4 className="text-base font-bold text-white">Skill-Linked Advisory</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Link mentoring actions directly to specific canonical skills so students know exactly which roadmap nodes to prioritize.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Milestone Closure</span>
                        <h4 className="text-base font-bold text-white">Track Progress to Completion</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Verify student milestone completions with closed-loop updates that strengthen institutional placement readiness.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {mentoringActions.map((act) => (
                      <div
                        key={act._id}
                        className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 flex flex-col justify-between gap-5 shadow-xl"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span
                                className={`text-xs uppercase font-mono px-3 py-1 rounded-full font-bold ${
                                  act.priority === 'HIGH'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : act.priority === 'MEDIUM'
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}
                              >
                                {act.priority} Priority
                              </span>
                              <span className="text-sm font-bold text-white">
                                Student: {act.student?.name || 'Assigned Student'}
                              </span>
                              {act.status === 'COMPLETED' && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">{act.recommendation}</h3>
                            {act.note && <p className="text-sm text-zinc-300 leading-relaxed font-medium">{act.note}</p>}
                            {act.suggestedAction && (
                              <p className="text-xs text-indigo-300 font-bold mt-1">
                                Suggested Action: {act.suggestedAction}
                              </p>
                            )}
                          </div>

                          {act.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCompleteAction(act._id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>

                        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-medium">
                          <span>
                            {act.linkedSkill ? `Linked Skill: ${act.linkedSkill}` : 'General Advisory'}
                          </span>
                          <span className="font-mono text-zinc-500">
                            {new Date(act.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODAL: ASSIGN STUDENTS FROM INSTITUTION ─────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-white">Assign Students</h3>
                <p className="text-xs text-zinc-400">Search authorized students within your educational institution</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-zinc-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchStudents(e.target.value);
                }}
                placeholder="Search by name, roll number, or department..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-800/60 pr-1">
              {searchingStudents ? (
                <div className="p-8 text-center text-xs text-zinc-500">Searching institution cohort...</div>
              ) : institutionStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">No students found matching query.</div>
              ) : (
                institutionStudents.map((st) => (
                  <div key={st._id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium text-white">{st.name}</h4>
                      <p className="text-[11px] text-zinc-400">
                        {st.department} • Reg: {st.registrationNumber || 'N/A'}
                      </p>
                    </div>

                    {st.isAssignedToMe ? (
                      <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        Assigned to You
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssignStudent(st._id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                      >
                        + Assign
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: 360° STUDENT CAREER INTELLIGENCE ──────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono mb-2">
                  360° Academician Career Intelligence
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                <p className="text-xs text-zinc-400">
                  {student360?.studentProfile?.department || selectedStudent.department} • Roll:{' '}
                  {student360?.studentProfile?.rollNumber || selectedStudent.registrationNumber || 'N/A'} • Target:{' '}
                  <span className="text-indigo-400 font-medium">{student360?.skillProfile?.targetRole || selectedStudent.targetRole}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-zinc-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {loading360 ? (
              <div className="p-12 text-center text-xs text-zinc-500">Loading student career telemetry...</div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* HUD Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block uppercase">Career Readiness</span>
                    <span className="text-2xl font-bold text-indigo-400 mt-1 block">
                      {student360?.readinessScore || 50}/100
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block uppercase">DSA Solved</span>
                    <span className="text-2xl font-bold text-white mt-1 block">
                      {student360?.dsaProfile?.totalSolved || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block uppercase">Projects</span>
                    <span className="text-2xl font-bold text-white mt-1 block">
                      {student360?.projects?.length || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block uppercase">Applications</span>
                    <span className="text-2xl font-bold text-white mt-1 block">
                      {student360?.applications?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Deterministic Mentor Recommendations Feed */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Deterministic Mentor Recommendations</h3>
                  {recommendations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-500">
                      No critical remediation flags detected for this student.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-300">{rec.title}</span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                rec.priority === 'HIGH'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{rec.what}</p>
                          <p className="text-[11px] text-zinc-500">
                            <span className="font-medium text-zinc-400">Why: </span>
                            {rec.why}
                          </p>
                          <p className="text-[11px] text-emerald-400/90 font-medium">
                            Suggested Action: {rec.suggestedAction}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects Portfolio Preview */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Verified Projects ({student360?.projects?.length || 0})</h3>
                  {(!student360?.projects || student360.projects.length === 0) ? (
                    <p className="text-xs text-zinc-500">No projects documented yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {student360.projects.map((proj) => (
                        <div key={proj._id} className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
                          <h4 className="text-xs font-semibold text-zinc-200">{proj.title}</h4>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{proj.description}</p>
                          {proj.skills && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {proj.skills.map((s, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setNewEval({ ...newEval, studentId: selectedStudent._id });
                      setShowEvaluationModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                  >
                    Conduct Evaluation
                  </button>
                  <button
                    onClick={() => {
                      setNewMentorAction({ ...newMentorAction, studentId: selectedStudent._id });
                      setShowMentoringModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    Add Mentoring Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: AUTHOR ASSESSMENT ───────────────────────────────── */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAssessment}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-white">Author Engineering Assessment</h3>
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Assessment Title *</label>
              <input
                type="text"
                required
                value={newAssessment.title}
                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                placeholder="e.g. Distributed Systems Architecture & Concurrency"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Category</label>
                <select
                  value={newAssessment.category}
                  onChange={(e) => setNewAssessment({ ...newAssessment, category: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="Technical">Technical</option>
                  <option value="DSA">DSA</option>
                  <option value="Project">Project</option>
                  <option value="Domain Specific">Domain Specific</option>
                  <option value="Communication">Communication</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Discipline / Department</label>
                <select
                  value={newAssessment.department}
                  onChange={(e) => setNewAssessment({ ...newAssessment, department: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science (CSE)</option>
                  <option value="Electronics & Communication">Electronics (ECE)</option>
                  <option value="Electrical Engineering">Electrical (EE/EEE)</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Civil Engineering">Civil</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Target Skills (comma separated)</label>
              <input
                type="text"
                value={newAssessment.skills}
                onChange={(e) => setNewAssessment({ ...newAssessment, skills: e.target.value })}
                placeholder="e.g. Docker, Kubernetes, Microservices, Go"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Description / Instructions</label>
              <textarea
                rows={3}
                value={newAssessment.description}
                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                placeholder="Specify rubric criteria and deliverables..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Publish Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: RECORD EVALUATION ───────────────────────────────── */}
      {showEvaluationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEvaluation}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-white">Record Student Evaluation</h3>
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Target Student</label>
              <select
                required
                value={newEval.studentId}
                onChange={(e) => setNewEval({ ...newEval, studentId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="">-- Select Assigned Student --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Overall Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newEval.overallScore}
                  onChange={(e) => setNewEval({ ...newEval, overallScore: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Evaluated Skill</label>
                <input
                  type="text"
                  value={newEval.skillName}
                  onChange={(e) => setNewEval({ ...newEval, skillName: e.target.value })}
                  placeholder="e.g. System Design, DSA"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Strengths (comma separated)</label>
              <input
                type="text"
                value={newEval.strengths}
                onChange={(e) => setNewEval({ ...newEval, strengths: e.target.value })}
                placeholder="e.g. Clean modular code, strong test coverage"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Weaknesses (comma separated)</label>
              <input
                type="text"
                value={newEval.weaknesses}
                onChange={(e) => setNewEval({ ...newEval, weaknesses: e.target.value })}
                placeholder="e.g. Missing error handling, unoptimized queries"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Feedback & Recommendations</label>
              <textarea
                rows={2}
                value={newEval.feedback}
                onChange={(e) => setNewEval({ ...newEval, feedback: e.target.value })}
                placeholder="Detailed guidance on technical gaps..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Submit Evaluation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: ADD MENTORING NOTE ───────────────────────────────── */}
      {showMentoringModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMentoringAction}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-white">Create Mentoring Recommendation</h3>
              <button
                type="button"
                onClick={() => setShowMentoringModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Target Student</label>
              <select
                required
                value={newMentorAction.studentId}
                onChange={(e) => setNewMentorAction({ ...newMentorAction, studentId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
              >
                <option value="">-- Select Assigned Student --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Recommendation Summary *</label>
              <input
                type="text"
                required
                value={newMentorAction.recommendation}
                onChange={(e) => setNewMentorAction({ ...newMentorAction, recommendation: e.target.value })}
                placeholder="e.g. Master SQL indexing & complete database project"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Priority</label>
                <select
                  value={newMentorAction.priority}
                  onChange={(e) => setNewMentorAction({ ...newMentorAction, priority: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Linked Skill</label>
                <input
                  type="text"
                  value={newMentorAction.linkedSkill}
                  onChange={(e) => setNewMentorAction({ ...newMentorAction, linkedSkill: e.target.value })}
                  placeholder="e.g. PostgreSQL, Docker"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Detailed Guidance / Note</label>
              <textarea
                rows={3}
                value={newMentorAction.note}
                onChange={(e) => setNewMentorAction({ ...newMentorAction, note: e.target.value })}
                placeholder="Add mentor observation and guidance..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMentoringModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Save Recommendation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}