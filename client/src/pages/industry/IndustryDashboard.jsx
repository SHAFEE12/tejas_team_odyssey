import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_URL } from '../../utils/constants';
import BrandLogo from '../../components/common/BrandLogo';
import HeaderUserMenu from '../../components/common/HeaderUserMenu';

export default function IndustryDashboard() {
  const { user, token, logout } = useAuth();

  // Navigation Tabs: overview, opportunities, talent, shortlisted, interviews, offers, profile
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  // Tab Specific States
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applicantsPipeline, setApplicantsPipeline] = useState(null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

  // Talent Search State
  const [talentList, setTalentList] = useState([]);
  const [talentTotal, setTalentTotal] = useState(0);
  const [talentPage, setTalentPage] = useState(1);
  const [loadingTalent, setLoadingTalent] = useState(false);
  const [talentFilters, setTalentFilters] = useState({
    targetRole: '',
    department: '',
    skills: '',
    minReadiness: '',
    hasProjects: '',
    hasGithub: '',
    hasResume: '',
    opportunityId: '',
  });

  // Candidate 360 Dossier Modal
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidate360, setCandidate360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  // Stage Aggregation States
  const [stageCandidates, setStageCandidates] = useState([]);
  const [loadingStageCandidates, setLoadingStageCandidates] = useState(false);

  // Create Opportunity Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOpp, setNewOpp] = useState({
    title: '',
    type: 'full-time',
    domain: 'software-engineering',
    location: 'Bengaluru, India',
    workMode: 'remote',
    experienceLevel: 'entry',
    stipend: 'Competitive',
    requiredSkills: '',
    preferredSkills: '',
    openings: 2,
    deadline: '',
    description: '',
  });

  // Shortlist Modal State
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
  const [candidateToShortlist, setCandidateToShortlist] = useState(null);
  const [targetOppId, setTargetOppId] = useState('');
  const [shortlistNotes, setShortlistNotes] = useState('');

  // Industry Evaluation Rubric State
  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({
    technicalScore: 85,
    communicationScore: 80,
    problemSolvingScore: 85,
    teamworkScore: 80,
    recommendation: 'HIRE',
    strengths: 'Strong clinical data modeling, FHIR adherence',
    weaknesses: 'Needs deeper experience with automated testing on production APIs',
    feedback: 'Candidate demonstrated exemplary domain alignment during interview evaluation.',
  });

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

  // 1. Load Main Dashboard Overview & Profile
  const loadInitialData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashRes, profRes, oppsRes] = await Promise.all([
        fetch(`${API_URL}/api/industry/dashboard`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/industry/profile`, { credentials: 'omit', headers: authHeaders }),
        fetch(`${API_URL}/api/industry/opportunities`, { credentials: 'omit', headers: authHeaders }),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.success) setDashboardData(d.data);
      }
      if (profRes.ok) {
        const p = await profRes.json();
        if (p.success) setCompanyProfile(p.data);
      }
      if (oppsRes.ok) {
        const o = await oppsRes.json();
        if (o.success) setOpportunities(o.data);
      }
    } catch (err) {
      console.error('Error loading industry dashboard:', err);
      showToast('Error loading partner dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [token]);

   // 2. Load Talent Search
  const loadTalent = async () => {
    if (!token) return;
    setLoadingTalent(true);
    try {
      const query = new URLSearchParams();
      if (talentFilters.targetRole) query.set('targetRole', talentFilters.targetRole);
      if (talentFilters.department) query.set('department', talentFilters.department);
      if (talentFilters.skills) query.set('skills', talentFilters.skills);
      if (talentFilters.minReadiness) query.set('minReadiness', talentFilters.minReadiness);
      if (talentFilters.hasProjects) query.set('hasProjects', talentFilters.hasProjects);
      if (talentFilters.hasGithub) query.set('hasGithub', talentFilters.hasGithub);
      if (talentFilters.hasResume) query.set('hasResume', talentFilters.hasResume);
      if (talentFilters.opportunityId) query.set('opportunityId', talentFilters.opportunityId);
      query.set('page', String(talentPage));
      query.set('limit', '10');

      const res = await fetch(`${API_URL}/api/industry/talent?${query.toString()}`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTalentList(d.data.candidates || []);
          setTalentTotal(d.data.total || 0);
        }
      }
    } catch (err) {
      console.error('Error searching talent:', err);
      showToast('Error loading talent search', 'error');
    } finally {
      setLoadingTalent(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'talent') {
      loadTalent();
    }
  }, [activeTab, talentFilters, talentPage]);

  // 3. Load Stage Candidates (Shortlisted, Interviews, Offers)
  const loadStageCandidates = async (stage) => {
    if (!token) return;
    setLoadingStageCandidates(true);
    try {
      const res = await fetch(`${API_URL}/api/industry/${stage}`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setStageCandidates(d.data);
      }
    } catch (err) {
      console.error(`Error loading ${stage}:`, err);
    } finally {
      setLoadingStageCandidates(false);
    }
  };

  useEffect(() => {
    if (['shortlisted', 'interviews', 'offers'].includes(activeTab)) {
      loadStageCandidates(activeTab);
    }
  }, [activeTab]);

  // 4. View Candidate 360 Dossier
  const handleViewCandidate360 = async (studentId, oppId = null) => {
    setSelectedCandidateId(studentId);
    setLoading360(true);
    try {
      const query = oppId ? `?opportunityId=${oppId}` : '';
      const res = await fetch(`${API_URL}/api/industry/talent/${studentId}${query}`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setCandidate360(d.data);
      } else {
        showToast('Unable to load candidate details', 'error');
      }
    } catch (err) {
      showToast('Network error loading candidate 360', 'error');
    } finally {
      setLoading360(false);
    }
  };

  // 5. View Opportunity Pipeline
  const handleViewPipeline = async (opp) => {
    setSelectedOpportunity(opp);
    setLoadingPipeline(true);
    try {
      const res = await fetch(`${API_URL}/api/industry/opportunities/${opp._id}/applicants`, {
        credentials: 'omit',
        headers: authHeaders,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setApplicantsPipeline(d.data);
      }
    } catch (err) {
      showToast('Error loading opportunity pipeline', 'error');
    } finally {
      setLoadingPipeline(false);
    }
  };

  // 6. Transition Applicant Stage
  const handleAdvanceStage = async (appId, newStage) => {
    try {
      const res = await fetch(`${API_URL}/api/industry/applications/${appId}/stage`, {
        method: 'PATCH',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify({ stage: newStage }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`Candidate transitioned to ${newStage}`);
        if (selectedOpportunity) {
          handleViewPipeline(selectedOpportunity);
        }
        loadInitialData();
      } else {
        showToast(d.message || 'Stage transition failed', 'error');
      }
    } catch (err) {
      showToast('Failed to update stage', 'error');
    }
  };
  // 7. Create New Opportunity
  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    try {
      const reqSkillsArr = newOpp.requiredSkills
        ? newOpp.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const prefSkillsArr = newOpp.preferredSkills
        ? newOpp.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch(`${API_URL}/api/industry/opportunities`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify({
          ...newOpp,
          requiredSkills: reqSkillsArr,
          preferredSkills: prefSkillsArr,
        }),
      });

      const d = await res.json();
      if (d.success) {
        showToast('Opportunity published successfully');
        setShowCreateModal(false);
        setNewOpp({
          title: '',
          type: 'full-time',
          domain: 'software-engineering',
          location: 'Bengaluru, India',
          workMode: 'remote',
          experienceLevel: 'entry',
          stipend: 'Competitive',
          requiredSkills: '',
          preferredSkills: '',
          openings: 2,
          deadline: '',
          description: '',
        });
        loadInitialData();
      } else {
        showToast(d.message || 'Failed to create opportunity', 'error');
      }
    } catch (err) {
      showToast('Error publishing opportunity', 'error');
    }
  };

  // 8. Shortlist Candidate from Talent Search
  const handleOpenShortlistModal = (candidate) => {
    setCandidateToShortlist(candidate);
    setTargetOppId(talentFilters.opportunityId || (opportunities[0]?._id || ''));
    setShortlistNotes('');
    setShortlistModalOpen(true);
  };

  const handleConfirmShortlist = async () => {
    if (!targetOppId) {
      showToast('Please select an opportunity to shortlist for', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/industry/opportunities/${targetOppId}/shortlist`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify({
          studentId: candidateToShortlist.studentId,
          notes: shortlistNotes,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`Shortlisted ${candidateToShortlist.name} successfully!`);
        setShortlistModalOpen(false);
        loadInitialData();
      } else {
        showToast(d.message || 'Shortlisting failed', 'error');
      }
    } catch (err) {
      showToast('Error shortlisting candidate', 'error');
    }
  };

  // 8b. Submit Interview Evaluation (Feedback Loop)
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    try {
      const studentId = candidate360?.candidate?._id || selectedCandidateId;
      const res = await fetch(`${API_URL}/api/evaluations`, {
        method: 'POST',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify({
          studentId,
          applicationId: candidate360?.application?._id || undefined,
          technicalScore: Number(evalForm.technicalScore),
          communicationScore: Number(evalForm.communicationScore),
          problemSolvingScore: Number(evalForm.problemSolvingScore),
          teamworkScore: Number(evalForm.teamworkScore),
          recommendation: evalForm.recommendation,
          strengths: typeof evalForm.strengths === 'string' ? evalForm.strengths.split(',').map((s) => s.trim()).filter(Boolean) : evalForm.strengths,
          weaknesses: typeof evalForm.weaknesses === 'string' ? evalForm.weaknesses.split(',').map((s) => s.trim()).filter(Boolean) : evalForm.weaknesses,
          feedback: evalForm.feedback,
        }),
      });

      const d = await res.json();
      if (d.success) {
        showToast(`Evaluation recorded for ${candidate360?.candidate?.name || 'candidate'}! Feedback loop triggered.`);
        setEvalFormOpen(false);
        loadInitialData();
      } else {
        showToast(d.message || 'Evaluation submission failed', 'error');
      }
    } catch (err) {
      console.error('Eval submit error:', err);
      showToast('Network error submitting evaluation', 'error');
    }
  };
  // 9. Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/industry/profile`, {
        method: 'PATCH',
        credentials: 'omit',
        headers: authHeaders,
        body: JSON.stringify(companyProfile),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Company profile updated successfully');
        setCompanyProfile(d.data);
      } else {
        showToast(d.message || 'Error updating profile', 'error');
      }
    } catch (err) {
      showToast('Network error updating profile', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0612] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 relative overflow-hidden">
      {/* Ambient Corporate Recruiter Mesh Lights */}
      <div className="fixed -top-40 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 -left-20 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

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

      {/* Top Header */}
      <header className="border-b border-purple-950/80 bg-[#120a1c]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-3.5">
          <BrandLogo size="sm" showText={false} role="industry" glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Career{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#FF5100] via-[#FF7A00] to-[#FFA726] bg-clip-text text-transparent">
                  Odyssey
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold tracking-wide">
                Industry Partner
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                SIH 26044
              </span>
            </div>
            <p className="text-[11px] text-purple-200/70 font-medium">
              {companyProfile?.companyName || user?.collegeName || 'Corporate Recruiting Console'} • {companyProfile?.domain || 'Technology'}
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#100918]/90 p-1 rounded-xl border border-purple-950/80">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'opportunities', label: 'Jobs & Internships', badge: opportunities.length },
            { id: 'talent', label: 'Talent Search', badge: talentTotal || dashboardData?.metrics?.totalCandidates },
            { id: 'shortlisted', label: 'Shortlisted', badge: dashboardData?.metrics?.shortlisted },
            { id: 'interviews', label: 'Interviews', badge: dashboardData?.metrics?.interviews },
            { id: 'offers', label: 'Offers', badge: dashboardData?.metrics?.offers },
            { id: 'profile', label: 'Company Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedOpportunity(null);
                setApplicantsPipeline(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-purple-200 hover:bg-purple-950/40'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-purple-800/80 text-purple-200' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User & Actions with Exit Button */}
        <HeaderUserMenu
          user={user}
          onLogout={logout}
          role="industry"
          subtitle={companyProfile?.companyName || user?.email || 'Recruiter'}
          extraAction={
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-medium transition-all shadow-md shadow-purple-600/25 flex items-center gap-1.5 border border-purple-400/20 cursor-pointer"
            >
              <span>+</span>
              <span>Post Opportunity</span>
            </button>
          }
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
            <span className="text-xs text-zinc-500">Loading industry recruitment ecosystem...</span>
          </div>
        ) : (
          <>
            {/* ════════ TAB: OVERVIEW ════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Active Openings', value: dashboardData?.metrics?.activeOpportunities ?? 0, hint: 'Current Postings' },
                    { label: 'Talent Pool', value: dashboardData?.metrics?.totalCandidates ?? 0, hint: 'Discoverable Students' },
                    { label: 'Shortlisted', value: dashboardData?.metrics?.shortlisted ?? 0, hint: 'Screening Stage' },
                    { label: 'Interviews', value: dashboardData?.metrics?.interviews ?? 0, hint: 'Active Rounds' },
                    { label: 'Offers Given', value: dashboardData?.metrics?.offers ?? 0, hint: 'Final Offers' },
                    {
                      label: 'Conversion Rate',
                      value: dashboardData?.metrics?.hiringConversion !== undefined ? `${dashboardData.metrics.hiringConversion}%` : '0%',
                      hint: 'Offer vs Applicants',
                    },
                  ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
                      <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                      <div className="text-2xl font-bold text-white my-2">{stat.value}</div>
                      <span className="text-[10px] text-zinc-500">{stat.hint}</span>
                    </div>
                  ))}
                </div>

                {/* Status message if insufficient data */}
                {dashboardData?.status === 'INSUFFICIENT_DATA' && (
                  <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-4 text-xs text-purple-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>ℹ️</span>
                      <span>{dashboardData.message}</span>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-purple-400 underline hover:text-purple-300 font-medium"
                    >
                      Create First Job/Internship →
                    </button>
                  </div>
                )}

                {/* Split Section: Active Opportunities & Quick Talent Sourcing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Active Opportunities */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                        <span>Active Postings</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {opportunities.filter((o) => o.status === 'active').length}
                        </span>
                      </h2>
                      <button
                        onClick={() => setActiveTab('opportunities')}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View All Opportunities →
                      </button>
                    </div>

                    {opportunities.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-500">
                        No active opportunities. Click "Post Opportunity" to publish your first role.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {opportunities.slice(0, 4).map((opp) => (
                          <div
                            key={opp._id}
                            className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3.5 hover:border-zinc-700 transition-all flex items-center justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-zinc-200 capitalize">{opp.title}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-mono">
                                  {opp.type}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                                <span>📍 {opp.location}</span>
                                <span>👥 {opp.openings} Openings</span>
                                <span>📩 {opp.applicantsCount || 0} Applicants</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab('opportunities');
                                handleViewPipeline(opp);
                              }}
                              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                            >
                              Pipeline →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Canonical Sourcing Quick Launch */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white tracking-tight">Talent Discovery Telemetry</h2>
                      <button
                        onClick={() => setActiveTab('talent')}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Explore All Candidates →
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Sourcing in Career Odyssey is linked directly to canonical skill profiles, verified GitHub repository commits, hands-on projects, and institutional career readiness scores.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Multi-Discipline</span>
                        <div className="text-sm font-semibold text-zinc-200 mt-1">Cross-Engineering</div>
                        <p className="text-[11px] text-zinc-400 mt-1">CSE, ECE, EE, Mech, Civil, AI/ML</p>
                      </div>
                      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Evidence-First</span>
                        <div className="text-sm font-semibold text-zinc-200 mt-1">Verified Portfolio</div>
                        <p className="text-[11px] text-zinc-400 mt-1">Direct GitHub and project proofs</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('talent')}
                      className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all"
                    >
                      Launch Talent Search Engine →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ════════ TAB: OPPORTUNITIES (JOBS & INTERNSHIPS) ════════ */}
            {activeTab === 'opportunities' && (
              <div className="space-y-6">
                {applicantsPipeline ? (
                  /* PIPELINE VIEW FOR SELECTED OPPORTUNITY */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setApplicantsPipeline(null)}
                            className="text-xs text-purple-400 hover:text-purple-300 underline mr-2"
                          >
                            ← Back to Opportunities
                          </button>
                          <span className="text-base font-semibold text-white capitalize">{selectedOpportunity?.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {applicantsPipeline.totalApplicants} Total Applicants
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-4">
                          <span>Domain: {selectedOpportunity?.domain}</span>
                          <span>Type: {selectedOpportunity?.type}</span>
                          <span>Openings: {selectedOpportunity?.openings}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTalentFilters({ ...talentFilters, opportunityId: selectedOpportunity._id });
                          setActiveTab('talent');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                      >
                        Source Matching Talent →
                      </button>
                    </div>

                    {/* Kanban Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      {[
                        { key: 'APPLIED', label: 'Applied / New', color: 'border-blue-500/30 text-blue-400' },
                        { key: 'OA', label: 'Online Assessment', color: 'border-amber-500/30 text-amber-400' },
                        { key: 'INTERVIEW', label: 'Interview', color: 'border-purple-500/30 text-purple-400' },
                        { key: 'FINAL_ROUND', label: 'Final Round', color: 'border-indigo-500/30 text-indigo-400' },
                        { key: 'OFFER', label: 'Offered', color: 'border-emerald-500/30 text-emerald-400' },
                        { key: 'REJECTED', label: 'Archived / Rejected', color: 'border-zinc-700 text-zinc-500' },
                      ].map((col) => {
                        const candidates = applicantsPipeline.pipeline[col.key] || [];
                        return (
                          <div key={col.key} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3">
                              <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                {candidates.length}
                              </span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto">
                              {candidates.length === 0 ? (
                                <div className="text-[11px] text-zinc-600 text-center py-6">No candidates in this stage</div>
                              ) : (
                                candidates.map((c) => (
                                  <div
                                    key={c.applicationId}
                                    className="bg-zinc-950/80 border border-zinc-800/70 rounded-lg p-3 space-y-2 hover:border-zinc-700 transition-all text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-zinc-200">{c.name}</span>
                                      <span className="text-[10px] text-zinc-400">{c.department}</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                                      <span>Grad: {c.graduationYear}</span>
                                      <span>CGPA: {c.cgpa || 'N/A'}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1 flex-wrap">
                                      <button
                                        onClick={() => handleViewCandidate360(c.studentId, selectedOpportunity._id)}
                                        className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                                      >
                                        360° Dossier
                                      </button>
                                      <div className="flex items-center gap-1">
                                        {col.key === 'APPLIED' && (
                                          <button
                                            onClick={() => handleAdvanceStage(c.applicationId, 'OA')}
                                            className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px] hover:bg-blue-600/30"
                                          >
                                            To OA
                                          </button>
                                        )}
                                        {col.key === 'OA' && (
                                          <button
                                            onClick={() => handleAdvanceStage(c.applicationId, 'INTERVIEW')}
                                            className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-[10px] hover:bg-purple-600/30"
                                          >
                                            Interview
                                          </button>
                                        )}
                                        {col.key === 'INTERVIEW' && (
                                          <button
                                            onClick={() => handleAdvanceStage(c.applicationId, 'FINAL_ROUND')}
                                            className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 text-[10px] hover:bg-indigo-600/30"
                                          >
                                            Final Round
                                          </button>
                                        )}
                                        {['INTERVIEW', 'FINAL_ROUND'].includes(col.key) && (
                                          <button
                                            onClick={() => handleAdvanceStage(c.applicationId, 'OFFER')}
                                            className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 text-[10px] hover:bg-emerald-600/30"
                                          >
                                            Offer
                                          </button>
                                        )}
                                        {col.key !== 'REJECTED' && (
                                          <button
                                            onClick={() => handleAdvanceStage(c.applicationId, 'REJECTED')}
                                            className="px-1.5 py-0.5 rounded text-zinc-500 hover:text-rose-400 text-[10px]"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* LIST OF OPPORTUNITIES */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-white">Company Opportunities</h2>
                        <p className="text-xs text-zinc-400">Manage your active job postings and candidate pipelines</p>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-md shadow-purple-600/20"
                      >
                        + Post New Opportunity
                      </button>
                    </div>

                    {opportunities.length === 0 ? (
                      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-12 text-center space-y-3">
                        <div className="text-3xl">📋</div>
                        <h3 className="text-sm font-semibold text-zinc-300">No active opportunities</h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                          Publish internship or full-time roles with required canonical skills to begin sourcing candidates.
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors"
                        >
                          Create First Opportunity
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {opportunities.map((opp) => (
                          <div
                            key={opp._id}
                            className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm text-white capitalize">{opp.title}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                                  opp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {opp.status}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 flex items-center gap-3">
                                <span>{opp.type}</span>
                                <span>•</span>
                                <span>{opp.workMode}</span>
                                <span>•</span>
                                <span>{opp.location}</span>
                              </div>
                              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                {opp.description}
                              </p>

                              {/* Skills chips */}
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(opp.requiredSkills || []).slice(0, 4).map((sk, idx) => (
                                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                    {sk}
                                  </span>
                                ))}
                                {(opp.requiredSkills || []).length > 4 && (
                                  <span className="text-[10px] text-zinc-500">+{opp.requiredSkills.length - 4} more</span>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-xs text-zinc-400">
                                <strong className="text-white font-mono">{opp.applicantsCount || 0}</strong> applicants
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewPipeline(opp)}
                                  className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                                >
                                  View Pipeline →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════ TAB: TALENT SEARCH ════════ */}
            {activeTab === 'talent' && (
              <div className="space-y-6">
                {/* Search & Filter Header */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Student Talent Discovery</h2>
                      <p className="text-xs text-zinc-400">Server-side candidate search with canonical skill matching and verified telemetry</p>
                    </div>
                    {talentFilters.opportunityId && (
                      <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-lg text-xs text-purple-300">
                        <span>Matching against opportunity: <strong>{opportunities.find((o) => o._id === talentFilters.opportunityId)?.title}</strong></span>
                        <button
                          onClick={() => setTalentFilters({ ...talentFilters, opportunityId: '' })}
                          className="text-purple-400 hover:text-white font-bold ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  