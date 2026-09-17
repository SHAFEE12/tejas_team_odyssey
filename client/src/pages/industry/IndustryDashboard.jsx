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