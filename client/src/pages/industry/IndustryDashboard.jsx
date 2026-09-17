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