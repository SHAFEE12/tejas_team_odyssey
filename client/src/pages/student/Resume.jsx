/**
 * Resume.jsx — /student/resume
 *
 * Real Resume Analyzer dashboard.
 * Supports PDF & DOCX uploads, real text parsing, section & skill extraction,
 * ATS compatibility evaluation, career goal matching, skills comparison with
 * SkillProfile, measurable achievement detection, and actionable recommendations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  uploadResume,
  getResume,
  reanalyzeResume,
  deleteResume,
  downloadOriginalResume,
  getResumeDownloadUrl,
  getAnalyzerStatus,
} from '../../api/resume.api';
import { updateSkillProfile, getSkillProfile } from '../../api/skillProfile.api';
import { getProjects } from '../../api/projects.api';
import { ROUTES } from '../../utils/constants';
import ModernResumePreview from '../../components/resume/ModernResumePreview';
import ResumeUpgradeStudio from '../../components/resume/ResumeUpgradeStudio';
import EnhancvReportSidebar from '../../components/resume/EnhancvReportSidebar';
import { generateUpgradedResumeData } from '../../utils/resumeUpgradeEngine';

/* ── Inline Icons ────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  upload:   ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  file:     ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  check:    'M20 6L9 17l-5-5',
  alert:    ['M12 9v2m0 4h.01', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'],
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  trash:    ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2', 'M10 11v6', 'M14 11v6'],
  download: ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  arrow:    'M5 12h14M12 5l7 7-7 7',
  info:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 16v-4', 'M12 8h.01'],
  target:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  skills:   ['M12 2L2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  github:   'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  external: ['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  sparkle:  ['M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'],
  server:   ['M4 4h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M4 14h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2z', 'M6 8h.01', 'M6 18h.01'],
  copy:     ['M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.653 2H10a2 2 0 00-2 2z', 'M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2'],
  close:    ['M18 6L6 18', 'M6 6l12 12'],
};

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getScoreStatusTheme(status) {
  switch (status) {
    case 'Excellent':
    case 'Strong':
      return {
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        ringColor: '#10b981',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-400',
      };
    case 'Good Foundation':
      return {
        badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        ringColor: '#3b82f6',
        barColor: 'bg-blue-500',
        textColor: 'text-blue-400',
      };
    case 'Needs Improvement':
      return {
        badgeBg: 'bg-[#FC8200]/10 text-[#FC8200] border-[#FC8200]/20',
        ringColor: '#FC8200',
        barColor: 'bg-[#FC8200]',
        textColor: 'text-[#FC8200]',
      };
    default:
      return {
        badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
        ringColor: '#ef4444',
        barColor: 'bg-red-500',
        textColor: 'text-red-400',
      };
  }
}

export default function Resume() {
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('modern_studio'); // 'modern_studio' | 'overview' | 'skills' | 'ats' | 'projects'
  const [viewMode, setViewMode] = useState('modern'); // 'modern' | 'split' | 'original'
  const [layout, setLayout] = useState('modern-ats');
  const [accentColor, setAccentColor] = useState('#2f4858');
  const [editableProjects, setEditableProjects] = useState(null);
  const [isUpgradedEdition, setIsUpgradedEdition] = useState(true);
  const [isEnrichedWithPlatformData, setIsEnrichedWithPlatformData] = useState(true);
  const [platformProjects, setPlatformProjects] = useState([]);
  const [platformSkillProfile, setPlatformSkillProfile] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [atsBannerOpen, setAtsBannerOpen] = useState(true);
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillAddSuccess, setSkillAddSuccess] = useState(null);
  const [analyzerStatus, setAnalyzerStatus] = useState(null);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const fileInputRef = useRef(null);

  // Refresh or check Google Gemini AI engine status
  const refreshAnalyzerStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await getAnalyzerStatus();
      if (res?.data) {
        setAnalyzerStatus(res.data);
      }
    } catch (e) {
      console.warn('Analyzer status check failed:', e);
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  // Fetch student's existing resume, platform projects, and skill profile on mount
  const fetchResumeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, projectsRes, profileRes, statusRes] = await Promise.allSettled([
        getResume(),
        getProjects(),
        getSkillProfile(),
        getAnalyzerStatus(),
      ]);

      if (res.status === 'fulfilled' && res.value?.success && res.value?.data) {
        setResumeData(res.value.data);
      } else {
        setResumeData(null);
      }

      if (projectsRes.status === 'fulfilled' && projectsRes.value?.success && projectsRes.value?.data?.projects) {
        setPlatformProjects(projectsRes.value.data.projects);
      }

      if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
        setPlatformSkillProfile(profileRes.value.profile);
      }

      if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
        setAnalyzerStatus(statusRes.value.data);
      }
    } catch (err) {
      if (err.status === 404) {
        setResumeData(null);
      } else {
        setError(err.message || 'Failed to load resume data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch original PDF blob for embedded document viewer
  useEffect(() => {
    let activeUrl = null;
    let isCancelled = false;

    if (resumeData && (resumeData.mimeType?.includes('pdf') || resumeData.originalFileName?.toLowerCase().endsWith('.pdf'))) {
      downloadOriginalResume()
        .then((blob) => {
          if (isCancelled) return;
          // Ensure blob is explicitly typed as application/pdf for native browser PDF preview
          const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          activeUrl = url;
          setPdfBlobUrl(url);
        })
        .catch((err) => {
          console.warn('Could not create inline PDF blob:', err);
        });
    } else {
      setPdfBlobUrl(null);
    }

    return () => {
      isCancelled = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [resumeData?.storageKey, resumeData?._id]);

  // Handle applying an AI/ATS upgraded bullet point
  const handleApplyUpgradedBullet = (projIndex, bulletIndex, upgradedText) => {
    setEditableProjects((prev) => {
      const baseProjects = prev ? [...prev] : [...(activeProjects || [])];
      return baseProjects.map((p, pIdx) => {
        if (pIdx !== projIndex) return p;
        const newBullets = [...(p.bullets || [])];
        newBullets[bulletIndex] = upgradedText;
        return { ...p, bullets: newBullets };
      });
    });
  };

  // Download original uploaded document file
  const handleDownloadOriginal = async () => {
    setDownloadingOriginal(true);
    try {
      const blob = await downloadOriginalResume();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeData?.originalFileName || 'Original_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download original uploaded file.');
    } finally {
      setDownloadingOriginal(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, [fetchResumeData]);

  // Handle File Upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file must be 10 MB or smaller.');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      setError('Invalid file format. Please upload a PDF or DOCX document.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await uploadResume(file);
      if (res?.success && res?.data) {
        setResumeData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to upload resume.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process and analyze resume document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Re-analyze
  const handleReanalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await reanalyzeResume();
      if (res?.success && res?.data) {
        setResumeData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to re-analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your uploaded resume and analysis?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteResume();
      setResumeData(null);
    } catch (err) {
      setError(err.message || 'Failed to delete resume.');
    } finally {
      setLoading(false);
    }
  };

  // Add a resume-detected skill into student's SkillProfile
  const handleAddSkillToProfile = async (skillName) => {
    setAddingSkill(true);
    setSkillAddSuccess(null);
    try {
      const profileRes = await getSkillProfile();
      const existingSkills = profileRes?.profile?.skills || [];

      // Avoid duplicates
      if (existingSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
        setSkillAddSuccess(`"${skillName}" is already in your profile.`);
        return;
      }

      const updatedSkills = [
        ...existingSkills,
        { name: skillName, level: 'intermediate', yearsOfExperience: 0 },
      ];

      await updateSkillProfile({
        targetRole: profileRes?.profile?.targetRole || '',
        targetIndustry: profileRes?.profile?.targetIndustry || '',
        skills: updatedSkills,
      });

      setSkillAddSuccess(`Added "${skillName}" to My Skills successfully!`);
      // Refresh resume analysis so comparison updates
      await handleReanalyze();
    } catch (err) {
      setError(err.message || 'Failed to update skill profile.');
    } finally {
      setAddingSkill(false);
    }
  };

  const analysis = resumeData?.analysis;
  const isNeedsOcr = resumeData?.status === 'needs_ocr' || analysis?.status === 'needs_ocr';
  const score = analysis?.resumeScore ?? 0;
  const statusLabel = analysis?.statusLabel ?? 'Needs Improvement';
  const scoreTheme = getScoreStatusTheme(statusLabel);

  // Intelligent upgrade & platform data enrichment
  const upgradedData = isUpgradedEdition && resumeData
    ? generateUpgradedResumeData(
        analysis,
        isEnrichedWithPlatformData ? platformProjects : [],
        isEnrichedWithPlatformData ? platformSkillProfile : null
      )
    : {
        candidate: analysis?.candidate || {},
        targetRole: analysis?.roleMatch?.targetRole || 'Software Development',
        summary: analysis?.candidate?.summary || '',
        skills: analysis?.skills || {},
        education: analysis?.education || [],
        projects: analysis?.projects || [],
      };

  const activeProjects = editableProjects || upgradedData.projects;
  const activeCandidate = upgradedData.candidate;
  const activeEducation = upgradedData.education;
  const activeSkills = upgradedData.skills;
  const activeSummary = upgradedData.summary;
  const activeRole = upgradedData.targetRole;

  // SVG circular gauge
  const radius = 58;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Resume Analyzer</h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
              Evidence-Based
            </span>
            <button
              type="button"
              onClick={() => setShowEngineModal(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                analyzerStatus?.online
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700/60'
              }`}
              title="Click to view Google Gemini AI Engine details"
            >
              <span className={`w-2 h-2 rounded-full ${analyzerStatus?.online ? 'bg-purple-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{analyzerStatus?.online ? '✨ Gemini AI Engine' : 'Native Engine'}</span>
              {analyzerStatus?.online && <span className="text-[10px] text-purple-400/80 font-mono">({analyzerStatus?.model || 'gemini-3.6-flash'})</span>}
            </button>
          </div>
          <p className="text-sm text-zinc-400 max-w-[650px] leading-relaxed">
            Upload your resume (PDF, Word, Images, or Text) for real text extraction, ATS compatibility evaluation,
            target-role alignment, and quantified achievement detection.
          </p>
        </div>

        {resumeData && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files[0])}
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt,.rtf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || analyzing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              <Icon d={ICONS.upload} size={14} />
              <span>Replace Resume</span>
            </button>

            <button
              onClick={handleReanalyze}
              disabled={uploading || analyzing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white bg-[#FC8200] hover:bg-amber-500 transition-all disabled:opacity-50"
            >
              <Icon d={ICONS.refresh} size={14} className={analyzing ? 'animate-spin' : ''} />
              <span>{analyzing ? 'Analyzing...' : 'Re-analyze'}</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={uploading || analyzing}
              title="Delete resume"
              className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            >
              <Icon d={ICONS.trash} size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Notification / Alerts ── */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <Icon d={ICONS.alert} size={18} className="text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-red-300">{error}</p>
          </div>
        </div>
      )}

      {skillAddSuccess && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-emerald-300 font-medium">
            <Icon d={ICONS.check} size={16} className="text-emerald-400" />
            <span>{skillAddSuccess}</span>
          </div>
          <button
            onClick={() => setSkillAddSuccess(null)}
            className="text-[12px] text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-44 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
        </div>
      ) : uploading ? (
        /* ── Uploading / Analyzing In-Progress View ── */
        <div className="rounded-2xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#FC8200]/10 border border-[#FC8200]/20 flex items-center justify-center text-[#FC8200] mb-4 animate-bounce">
            <Icon d={ICONS.sparkle} size={24} />
          </div>
          <h3 className="text-[18px] font-bold text-white mb-2">Analyzing Resume Document...</h3>
          <p className="text-[13px] text-zinc-400 max-w-[420px] leading-relaxed mb-6">
            Extracting text layer, verifying ATS formatting, identifying technical competencies, and
            evaluating evidence strength.
          </p>
          <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#FC8200] rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      ) : !resumeData ? (
        /* ── Empty State / Drag & Drop Upload ── */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-2xl border-2 border-dashed border-zinc-700/80 hover:border-[#FC8200]/60 bg-gradient-to-b from-zinc-900/40 to-zinc-950 p-10 md:p-14 text-center transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt,.rtf"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#FC8200]/40 group-hover:bg-[#FC8200]/10 flex items-center justify-center text-zinc-400 group-hover:text-[#FC8200] mx-auto mb-5 transition-all duration-300">
            <Icon d={ICONS.upload} size={28} />
          </div>

          <h3 className="text-[19px] font-bold text-white tracking-tight mb-2">
            Upload your resume for real ATS & skill analysis
          </h3>
          <p className="text-[13px] text-zinc-400 max-w-[480px] mx-auto leading-relaxed mb-6">
            Drag and drop your document here, or click to browse. We support PDF, Word (.docx),
            Images (.png, .jpg, .webp), and Text (.txt, .rtf) formats up to 10 MB.
          </p>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-[#FC8200] hover:bg-amber-500 shadow-lg shadow-[#FC8200]/20 transition-all"
          >
            <Icon d={ICONS.file} size={15} />
            <span>Select Document</span>
          </button>

          {/* Feature Pillars Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/[0.06] text-left">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-zinc-200 text-[13px] font-semibold mb-1">
                <Icon d={ICONS.check} size={14} className="text-emerald-400" />
                <span>ATS Compatibility</span>
              </div>
              <p className="text-[12px] text-zinc-500">
                Checks section headers, readability, and clean formatting indexing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-zinc-200 text-[13px] font-semibold mb-1">
                <Icon d={ICONS.target} size={14} className="text-blue-400" />
                <span>Target Role Match</span>
              </div>
              <p className="text-[12px] text-zinc-500">
                Evaluates alignment with your defined target role competencies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-zinc-200 text-[13px] font-semibold mb-1">
                <Icon d={ICONS.sparkle} size={14} className="text-amber-400" />
                <span>Quantified Evidence</span>
              </div>
              <p className="text-[12px] text-zinc-500">
                Detects measurable metrics, project technologies, and impact bullets.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Main Full Analysis View ── */
        <div className="space-y-8">
          {/* Advisory banner for image-based/low-text resumes */}
          {isNeedsOcr && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Icon d={ICONS.alert} size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200">Image-Based / Low-Text Document</h4>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    This file has limited digital text. Recruiter ATS tools prefer digital text. We've unlocked your Modern Resume Studio below so you can customize and export a clean ATS-friendly PDF.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FC8200] hover:bg-amber-500 transition-all"
                >
                  Upload New Document
                </button>
              </div>
            </div>
          )}

          {/* Document Meta Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] text-[12px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#FC8200]/10 border border-[#FC8200]/20 flex items-center justify-center text-[#FC8200]">
                <Icon d={ICONS.file} size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-200 truncate">{resumeData.originalFileName}</p>
                <p className="text-zinc-500">
                  {formatFileSize(resumeData.fileSize)} · Uploaded {formatDate(resumeData.uploadedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {analysis?.metadata?.parser === 'gemini-ai' || analysis?.metadata?.engine === 'gemini-ai' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  ✨ Google Gemini AI Engine
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Native Deterministic Parser
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-medium">
                {analysis?.metadata?.wordCount || 0} words
              </span>
            </div>
          </div>

          {/* ── Hero Score Card ── */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--dash-card-border)] bg-gradient-to-br from-zinc-900/90 via-zinc-900/40 to-zinc-950 p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
              {/* Circular Gauge */}
              <div className="relative flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                <svg width="155" height="155" className="rotate-[-90deg]">
                  <circle
                    cx="77.5"
                    cy="77.5"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx="77.5"
                    cy="77.5"
                    r={radius}
                    stroke={scoreTheme.ringColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[34px] font-black text-white tracking-tight leading-none">
                    {score}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">
                    out of 100
                  </span>
                </div>
              </div>

              {/* Score Breakdown Bars */}
              <div className="flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className={`text-[12px] font-bold tracking-wide uppercase px-3 py-0.5 rounded-full border ${scoreTheme.badgeBg}`}>
                    {statusLabel}
                  </span>
                  <span className="text-[12px] text-zinc-500">
                    Calculated on {formatDate(analysis?.metadata?.analyzedAt)}
                  </span>
                </div>

                <h2 className="text-[18px] font-bold text-white tracking-tight mb-4">
                  {statusLabel === 'Excellent' && 'Outstanding resume! Strong alignment and quantified impact.'}
                  {statusLabel === 'Strong' && 'Solid profile with clear ATS structure and technical evidence.'}
                  {statusLabel === 'Good Foundation' && 'Good core content. Quantifying metrics will elevate your score.'}
                  {statusLabel === 'Needs Improvement' && 'Key sections or technical alignments need expansion.'}
                  {statusLabel === 'Needs Major Improvement' && 'Essential headers, contact info, or skills require immediate attention.'}
                </h2>

                {/* 4 Pillars Mini Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <PillarProgressBar
                    label="ATS Compatibility"
                    value={analysis?.scores?.ats ?? 0}
                    barColor="bg-emerald-400"
                  />
                  <PillarProgressBar
                    label="Content Quality"
                    value={analysis?.scores?.contentQuality ?? 0}
                    barColor="bg-blue-400"
                  />
                  <PillarProgressBar
                    label="Role Alignment"
                    value={analysis?.scores?.roleAlignment ?? 0}
                    barColor="bg-amber-400"
                  />
                  <PillarProgressBar
                    label="Evidence Strength"
                    value={analysis?.scores?.evidenceStrength ?? 0}
                    barColor="bg-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Navigation Tabs ── */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 overflow-x-auto">
            {[
              { id: 'modern_studio', label: '✨ Resume Upgrade Studio' },
              { id: 'overview', label: 'Overview & Recommendations' },
              { id: 'skills', label: 'Skills & Profile Gap' },
              { id: 'ats', label: 'ATS Diagnostics' },
              { id: 'projects', label: 'Projects & Experience' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Resume Upgrade Studio (Enhancv Style Layout) ── */}
          {activeTab === 'modern_studio' && (
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Left Column: Enhancv Report Sidebar (Score, CTA, Checklist Categories) */}
              <EnhancvReportSidebar
                score={score}
                analysis={analysis}
                onUpgradeClick={() => setViewMode('modern')}
              />

              {/* Right Column: ATS Compatibility Banner + Two-Way Toggle + Modern Resume Preview & Upgrade Studio */}
              <div className="flex-1 w-full space-y-6 min-w-0">
                {/* 1. ATS COMPATIBILITY Banner */}
                <div className="bg-[#0e0f15] text-zinc-100 rounded-2xl shadow-xl border border-white/[0.08] p-6 space-y-5">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setAtsBannerOpen(!atsBannerOpen)}
                  >
                    <h3 className="text-xs font-bold tracking-wide text-zinc-200 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block shadow-[0_0_8px_#f97316]" />
                      01 ATS Compatibility
                    </h3>
                    <span className="text-zinc-400 text-xs">{atsBannerOpen ? '▲' : '▼'}</span>
                  </div>

                  {atsBannerOpen && (
                    <div className="space-y-5 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">ATS Compatibility</h4>
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                            Your resume is well-structured and ATS-friendly based on Career Odyssey's compatibility checks.
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xl font-bold text-emerald-400">
                            {analysis?.scores?.ats ?? (analysis?.ats?.score ?? 0)} / 100
                          </span>
                        </div>
                      </div>

                      {/* Progress Visual Bar with Marker Inside Distinct Card Container */}
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-emerald-400">
                            {analysis?.scores?.ats ?? (analysis?.ats?.score ?? 0)}% ATS Compatibility
                          </span>
                          <span className="text-amber-400">Formatting/content signals to improve</span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full flex overflow-hidden p-0.5 border border-white/10 relative">
                          <div
                            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 shadow-[0_0_8px_#10b981]"
                            style={{ width: `${Math.min(100, Math.max(0, analysis?.scores?.ats ?? (analysis?.ats?.score ?? 0)))}%` }}
                          />
                          <div
                            className="h-full bg-amber-400 rounded-r-full opacity-80"
                            style={{ width: `${Math.min(100, Math.max(0, 100 - (analysis?.scores?.ats ?? (analysis?.ats?.score ?? 0))))}%` }}
                          />
                        </div>
                        <p className="text-center text-xs text-zinc-300 pt-1">
                          These improvement signals are primarily related to resume structure, formatting, content clarity, and role alignment.
                        </p>
                      </div>

                      {/* Detected Checks and Areas to Improve */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider">
                            Detected checks:
                          </span>
                          <ul className="space-y-1 text-xs text-zinc-300">
                            {analysis?.ats?.passedChecks && analysis.ats.passedChecks.length > 0 ? (
                              analysis.ats.passedChecks.slice(0, 4).map((check, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-400">✓</span>
                                  <span>{check}</span>
                                </li>
                              ))
                            ) : (
                              <>
                                <li className="flex items-start gap-1.5"><span className="text-emerald-400">✓</span><span>Standard section headings</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-emerald-400">✓</span><span>Contact information</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-emerald-400">✓</span><span>Professional document format</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-emerald-400">✓</span><span>Clear resume structure</span></li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-amber-400 block uppercase tracking-wider">
                            Areas to improve:
                          </span>
                          <ul className="space-y-1 text-xs text-zinc-300">
                            {analysis?.ats?.warnings && analysis.ats.warnings.length > 0 ? (
                              analysis.ats.warnings.slice(0, 3).map((warn, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-400">•</span>
                                  <span>{warn}</span>
                                </li>
                              ))
                            ) : (
                              <>
                                <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span><span>Add stronger role-specific keywords</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span><span>Include more quantified achievements</span></li>
                                <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span><span>Strengthen project descriptions with measurable impact</span></li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Important Informational Disclaimer */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
                        <span className="text-zinc-500 mt-0.5">ℹ</span>
                        <span>
                          This is a Career Odyssey compatibility assessment based on resume structure, content, skills, and role alignment. It does not reproduce, certify, or guarantee the behavior of any specific employer ATS.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Intelligent Content & Platform Data Enrichment Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-1">
                      Content Mode:
                    </span>
                    <button
                      onClick={() => {
                        setIsUpgradedEdition(true);
                        setEditableProjects(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isUpgradedEdition
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-white bg-white/5'
                      }`}
                    >
                      <span>⚡ View: Enhanced Layout</span>
                      {isUpgradedEdition && <span className="text-[10px] bg-blue-700 px-1 rounded">Active</span>}
                    </button>
                    <button
                      onClick={() => {
                        setIsUpgradedEdition(false);
                        setEditableProjects(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !isUpgradedEdition
                          ? 'bg-zinc-700 text-white shadow'
                          : 'text-zinc-400 hover:text-white bg-white/5'
                      }`}
                    >
                      📄 View: Raw Parsed
                    </button>
                  </div>

                  {isUpgradedEdition && (
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 select-none bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                        <input
                          type="checkbox"
                          checked={isEnrichedWithPlatformData}
                          onChange={(e) => {
                            setIsEnrichedWithPlatformData(e.target.checked);
                            setEditableProjects(null);
                          }}
                          className="w-4 h-4 rounded border-zinc-700 text-[#0070f3] focus:ring-0 cursor-pointer"
                        />
                        <span>
                          Use <strong className="text-white font-bold">{platformProjects.length} verified projects</strong> from Career Odyssey
                        </span>
                      </label>
                      <p className="text-[11px] text-zinc-400 pl-1">
                        Add project evidence from your Projects workspace to strengthen resume evidence.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. "Your resume, two ways" / Three-Way View Mode Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📑</span>
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                      Resume View
                    </span>
                  </div>
                  <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0 gap-1">
                    <button
                      onClick={() => setViewMode('modern')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'modern'
                          ? 'bg-blue-600 text-white shadow font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      📑 Modern Layout
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'split'
                          ? 'bg-purple-600 text-white shadow font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      ⫴ Side-by-Side
                    </button>
                    <button
                      onClick={() => setViewMode('original')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'original'
                          ? 'bg-white text-zinc-950 shadow font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      📖 Original PDF
                    </button>
                  </div>
                </div>

                {/* 4. VIEW MODE: SIDE-BY-SIDE (COMPARE ORIGINAL PDF VS UPGRADED RESUME) */}
                {viewMode === 'split' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                      {/* Left: Original PDF Viewer */}
                      <div className="flex flex-col">
                        <div className="p-3 bg-zinc-800/90 rounded-t-xl text-xs font-bold text-zinc-200 border border-zinc-700 border-b-0 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span>📖</span>
                            <span>BEFORE: Original Uploaded Document</span>
                          </span>
                          <a
                            href={getResumeDownloadUrl(true)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#60a5fa] hover:underline font-normal"
                          >
                            Open Fullscreen ↗
                          </a>
                        </div>
                        <div className="w-full h-[880px] bg-zinc-900 rounded-b-xl overflow-hidden border border-zinc-700 shadow-xl flex flex-col">
                          {pdfBlobUrl || resumeData ? (
                            <iframe
                              src={pdfBlobUrl || getResumeDownloadUrl(true)}
                              title="Original Uploaded PDF"
                              className="w-full flex-1 border-none bg-zinc-800"
                            />
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                              <p className="font-semibold text-white mb-2">Original PDF Document</p>
                              <p className="text-xs text-zinc-500 mb-4">{resumeData?.originalFileName}</p>
                              <button
                                onClick={handleDownloadOriginal}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                              >
                                Download Original File
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Modern Upgraded ATS Template */}
                      <div className="flex flex-col">
                        <div className="p-3 bg-emerald-500/20 rounded-t-xl text-xs font-bold text-emerald-300 border border-emerald-500/30 border-b-0 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span>⚡</span>
                            <span>AFTER: Upgraded ATS-Friendly Modern Template</span>
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                            Clean Structure
                          </span>
                        </div>
                        <div className="h-[880px] overflow-y-auto rounded-b-xl border border-zinc-700 shadow-xl bg-[#0c0e14] p-3 sm:p-5 flex justify-center">
                          <div className="w-full max-w-[780px]">
                            <ModernResumePreview
                              candidate={activeCandidate}
                              targetRole={activeRole}
                              education={activeEducation}
                              projects={activeProjects}
                              experience={upgradedData.experience || analysis?.experience || []}
                              achievements={upgradedData.achievements || analysis?.achievements || []}
                              skills={activeSkills}
                              summary={activeSummary}
                              layout={layout}
                              accentColor={accentColor}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resume Upgrade Studio Controls below Split View */}
                    <ResumeUpgradeStudio
                      layout={layout}
                      setLayout={setLayout}
                      accentColor={accentColor}
                      setAccentColor={setAccentColor}
                      candidateData={activeCandidate}
                      projectsData={activeProjects}
                      onApplyUpgradedBullet={handleApplyUpgradedBullet}
                      originalFileName={resumeData?.originalFileName}
                    />
                  </div>
                )}

                {/* 5. VIEW MODE: UPGRADED MODERN (FULL) */}
                {viewMode === 'modern' && (
                  <div className="space-y-6">
                    {/* ATS-Friendly Template Header Pill */}
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                      <span>✓ Standardized template - structured for clean ATS compatibility</span>
                    </div>

                    {/* The Live Modern Industry Resume Preview */}
                    <ModernResumePreview
                      candidate={activeCandidate}
                      targetRole={activeRole}
                      education={activeEducation}
                      projects={activeProjects}
                      experience={upgradedData.experience || analysis?.experience || []}
                      achievements={upgradedData.achievements || analysis?.achievements || []}
                      skills={activeSkills}
                      summary={activeSummary}
                      layout={layout}
                      accentColor={accentColor}
                    />

                    {/* Resume Upgrade Studio Controls (Layout switch, color picker, bullet optimizer, multi-format export) */}
                    <ResumeUpgradeStudio
                      layout={layout}
                      setLayout={setLayout}
                      accentColor={accentColor}
                      setAccentColor={setAccentColor}
                      candidateData={activeCandidate}
                      projectsData={activeProjects}
                      onApplyUpgradedBullet={handleApplyUpgradedBullet}
                      originalFileName={resumeData?.originalFileName}
                    />
                  </div>
                )}

                {/* 6. VIEW MODE: ORIGINAL PDF DOCUMENT (FULL) */}
                {viewMode === 'original' && (
                  <div className="space-y-6">
                    {/* Full Embedded PDF Viewer */}
                    <div className="w-full h-[850px] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl flex flex-col">
                      <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="font-bold text-white">Original Uploaded Document:</span>
                          <span className="font-mono text-zinc-400 truncate max-w-[280px]">
                            {resumeData?.originalFileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={getResumeDownloadUrl(true)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-all"
                          >
                            Open in New Tab ↗
                          </a>
                          <button
                            onClick={handleDownloadOriginal}
                            disabled={downloadingOriginal}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0070f3] hover:bg-blue-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Icon d={ICONS.download} size={14} />
                            <span>{downloadingOriginal ? 'Downloading...' : 'Download File'}</span>
                          </button>
                        </div>
                      </div>

                      {pdfBlobUrl || resumeData ? (
                        <iframe
                          src={pdfBlobUrl || getResumeDownloadUrl(true)}
                          title="Original Uploaded PDF"
                          className="w-full flex-1 border-none bg-zinc-800"
                        />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                          <p className="font-bold text-white text-base mb-2">Original Document</p>
                          <p className="text-xs text-zinc-500 mb-6">{resumeData?.originalFileName}</p>
                          <button
                            onClick={handleDownloadOriginal}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                          >
                            Download Original Document
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Raw Text Stream Inspection Drawer */}
                    <div className="bg-white text-zinc-900 rounded-2xl shadow-xl border border-zinc-200 p-6 md:p-8 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                          Extracted Text Layer ({resumeData?.extractedText ? resumeData.extractedText.split(/\s+/).length : analysis?.metadata?.wordCount || 0} words)
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {formatFileSize(resumeData?.fileSize)} · Uploaded {formatDate(resumeData?.uploadedAt)}
                        </span>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 font-mono text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                        {resumeData?.extractedText || 'No raw text stored. The document was analyzed via structured parser heuristics.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 1: Overview & Recommendations ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Target Role Matching Card */}
              <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Icon d={ICONS.target} size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Target Role Alignment</h3>
                      <p className="text-xs text-zinc-400">
                        {analysis?.roleMatch?.targetRole ? (
                          <>
                            Targeting <span className="text-zinc-300 font-medium">{analysis.roleMatch.targetRole}</span>
                            {analysis.roleMatch.targetIndustry && ` (${analysis.roleMatch.targetIndustry})`}
                          </>
                        ) : (
                          'No target role defined in Career Goal'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-amber-400">
                      {analysis?.roleMatch?.score ?? 0} / 100
                    </span>
                    <span className="block text-xs text-zinc-400">Alignment Index</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/[0.04]">
                  {/* Matched Skills */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
                      Matched Competencies ({analysis?.roleMatch?.matchedSkills?.length || 0})
                    </span>
                    {analysis?.roleMatch?.matchedSkills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.roleMatch.matchedSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            <Icon d={ICONS.check} size={11} className="text-emerald-400" />
                            <span>{s}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">No expected role skills detected yet.</p>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 block mb-2">
                      Missing Expected Skills ({analysis?.roleMatch?.missingSkills?.length || 0})
                    </span>
                    {analysis?.roleMatch?.missingSkills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.roleMatch.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-orange-500/10 text-amber-300 border border-orange-500/20"
                          >
                            <span className="text-orange-400">⚠</span>
                            <span>{s}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">Great job! All core role requirements detected.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              {analysis?.recommendations?.length > 0 && (
                <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Icon d={ICONS.info} size={14} />
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Targeted Resume Recommendations
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                        <div className="flex-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2">
                            [{rec.category}]
                          </span>
                          <span className="text-xs text-zinc-300">{rec.text}</span>
                        </div>
                        {rec.impact && (
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {rec.impact} Impact
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Candidate Info Card */}
              <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4">
                  Extracted Header & Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem label="Full Name" value={analysis?.candidate?.name} />
                  <InfoItem label="Email" value={analysis?.candidate?.email} />
                  <InfoItem label="Phone" value={analysis?.candidate?.phone} />
                  <InfoItem
                    label="GitHub"
                    value={analysis?.links?.github}
                    isLink
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Skills & Profile Gap ── */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Skill Comparison Table */}
              <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                <h3 className="text-sm font-semibold text-zinc-100 mb-2">
                  Resume Skills vs Career Odyssey Profile
                </h3>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  Compare skills detected on your resume document with your My Skills inventory.
                  You can synchronize new resume skills with one click.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Common */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Common Skills
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {analysis?.skillComparison?.common?.length || 0}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis?.skillComparison?.common?.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-md text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        >
                          ✓ {s}
                        </span>
                      ))}
                      {(!analysis?.skillComparison?.common || analysis.skillComparison.common.length === 0) && (
                        <span className="text-xs text-zinc-500">None yet</span>
                      )}
                    </div>
                  </div>

                  {/* Missing from Resume */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        In Profile, Not On Resume
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {analysis?.skillComparison?.missingFromResume?.length || 0}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis?.skillComparison?.missingFromResume?.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        >
                          ⚠ {s}
                        </span>
                      ))}
                      {(!analysis?.skillComparison?.missingFromResume || analysis.skillComparison.missingFromResume.length === 0) && (
                        <span className="text-xs text-zinc-500">All profile skills present</span>
                      )}
                    </div>
                  </div>

                  {/* Resume Only */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        On Resume, Not In Profile
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {analysis?.skillComparison?.resumeOnly?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {analysis?.skillComparison?.resumeOnly?.map((s) => (
                        <div key={s} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-zinc-300 truncate">{s}</span>
                          <button
                            onClick={() => handleAddSkillToProfile(s)}
                            disabled={addingSkill}
                            className="shrink-0 text-xs font-semibold text-orange-400 hover:text-amber-400 transition-colors"
                          >
                            + Add to My Skills
                          </button>
                        </div>
                      ))}
                      {(!analysis?.skillComparison?.resumeOnly || analysis.skillComparison.resumeOnly.length === 0) && (
                        <span className="text-xs text-zinc-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Detected Skills by Category */}
              <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4">
                  All Detected Skills ({analysis?.skills?.detected?.length || 0})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {analysis?.skills?.detected?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{item.name}</p>
                        <p className="text-xs text-zinc-400">{item.category}</p>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                        {Math.round(item.confidence * 100)}% conf
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: ATS Diagnostics ── */}
          {activeTab === 'ats' && (
            <div className="space-y-6">
              {/* ATS Compatibility Breakdown */}
              <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      ATS Compatibility Assessment
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Simulated evaluation based on standard Applicant Tracking System parser heuristics.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400">
                      {analysis?.ats?.score ?? 0} / 100
                    </span>
                  </div>
                </div>

                {/* Sub-check bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-white/[0.04]">
                  <AtsMetricTile
                    label="Extractability"
                    earned={analysis?.ats?.breakdown?.textExtractability ?? 0}
                    max={20}
                  />
                  <AtsMetricTile
                    label="Section Structure"
                    earned={analysis?.ats?.breakdown?.sectionStructure ?? 0}
                    max={20}
                  />
                  <AtsMetricTile
                    label="Keyword Indexing"
                    earned={analysis?.ats?.breakdown?.keywordCoverage ?? 0}
                    max={20}
                  />
                  <AtsMetricTile
                    label="Contact & Links"
                    earned={analysis?.ats?.breakdown?.contactLinks ?? 0}
                    max={20}
                  />
                  <AtsMetricTile
                    label="Formatting"
                    earned={analysis?.ats?.breakdown?.formattingSimplicity ?? 0}
                    max={20}
                  />
                </div>
              </div>

              {/* Passed vs Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Passed Checks */}
                <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <Icon d={ICONS.check} size={15} />
                    <span>Passed ATS Diagnostics ({analysis?.ats?.passedChecks?.length || 0})</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysis?.ats?.passedChecks?.map((check, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <h4 className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <Icon d={ICONS.alert} size={15} />
                    <span>ATS Warnings & Recommendations ({analysis?.ats?.warnings?.length || 0})</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysis?.ats?.warnings?.map((warn, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Informational Disclaimer */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                <span className="text-zinc-500 mt-0.5">ℹ</span>
                <span>
                  This is a Career Odyssey compatibility assessment based on resume structure, content, skills, and role alignment. It does not reproduce, certify, or guarantee the behavior of any specific employer ATS.
                </span>
              </div>
            </div>
          )}

          {/* ── TAB 4: Projects & Experience ── */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Evidence Ratio Banner */}
              <div className="p-5 rounded-xl border border-[var(--dash-card-border)] bg-gradient-to-r from-purple-500/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 mb-1">
                    Quantified Metric Density
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Bullets containing measurable results, percentages, scale, or performance numbers.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-bold text-purple-400">
                    {analysis?.quality?.quantifiedAchievements || 0} / {analysis?.quality?.totalBullets || 0}
                  </span>
                  <span className="block text-xs text-zinc-400">Quantified Bullets</span>
                </div>
              </div>

              {/* Projects List */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-100">Extracted Projects</h3>
                {analysis?.projects?.length > 0 ? (
                  analysis.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-orange-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Repository</span>
                            <Icon d={ICONS.external} size={11} />
                          </a>
                        )}
                      </div>

                      {/* Tech Stack */}
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {proj.technologies.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-zinc-300 border border-white/10"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bullets */}
                      {proj.bullets?.length > 0 && (
                        <ul className="space-y-1.5 mt-2">
                          {proj.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="text-xs text-zinc-400 flex items-start gap-2">
                              <span className="text-orange-400 mt-0.5">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No project records explicitly identified.</p>
                )}
              </div>

              {/* Education Section */}
              <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4">Extracted Education</h3>
                {analysis?.education?.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">{edu.degree}</p>
                          <p className="text-xs text-zinc-400">{edu.institution}</p>
                        </div>
                        <div className="text-right">
                          {edu.cgpa && (
                            <span className="text-xs font-bold text-amber-400 block">
                              CGPA: {edu.cgpa}
                            </span>
                          )}
                          {edu.graduationYear && (
                            <span className="text-xs text-zinc-400 font-mono">
                              Grad: {edu.graduationYear}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No educational credentials identified.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Journey Next Steps Card ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/20 via-[#0f121d] to-[#0d101a] border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
            Next In Your Career Journey
          </span>
          <h4 className="text-sm font-bold text-white">Find High-Confidence Opportunities Matching Your Evidence</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Your verified resume evidence and project portfolio now power the 7-factor matching engine. Explore tailored roles and track your application funnel.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            to={ROUTES.STUDENT_OPPORTUNITIES}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5"
          >
            <span>Explore Opportunities</span>
            <Icon d={ICONS.arrow} size={12} />
          </Link>
          <Link
            to={ROUTES.STUDENT_APPLICATIONS}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors"
          >
            Applications Pipeline
          </Link>
        </div>
      </div>

      {/* ── Google Gemini AI Engine Details Modal ── */}
      {showEngineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-[540px] rounded-2xl bg-[#0f121d] border border-zinc-700/80 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Icon d={ICONS.sparkle} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini AI Engine</h3>
                  <p className="text-xs text-zinc-400">Cloud-native multimodal resume parsing & deep ATS evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setShowEngineModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Icon d={ICONS.close} size={16} />
              </button>
            </div>

            {/* Engine Status Banner */}
            <div className={`p-4 rounded-xl border mb-5 flex items-center justify-between gap-3 ${
              analyzerStatus?.online
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${analyzerStatus?.online ? 'bg-purple-400 animate-pulse' : 'bg-amber-400'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold">
                    {analyzerStatus?.online ? `Gemini AI Online (${analyzerStatus?.model || 'gemini-3.6-flash'})` : 'Native Deterministic Engine Active'}
                  </p>
                  <p className="text-[11px] opacity-80 truncate">
                    {analyzerStatus?.online
                      ? `Active response latency: ${analyzerStatus?.latencyMs || 0}ms · Google Gemini Cloud API connected`
                      : 'Google Gemini AI unreachable — automated zero-downtime deterministic fallback engaged'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={refreshAnalyzerStatus}
                disabled={checkingStatus}
                className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
              >
                {checkingStatus ? 'Checking...' : 'Check Status'}
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-300 space-y-3 mb-5">
              <div className="flex items-start gap-2.5">
                <Icon d={ICONS.sparkle} size={15} className="text-purple-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">Multimodal Document Parsing:</strong> Directly extracts structured text, work history, projects, and education from PDFs, scans, DOCX, and images.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon d={ICONS.check} size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">Semantic ATS Evaluation:</strong> Cross-checks keywords against industry job requirements and real candidate technical benchmarks.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon d={ICONS.sparkle} size={15} className="text-amber-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">Quantified Evidence Detection:</strong> Detects metrics (percentages, revenues, latencies, team sizes) and actionable impact bullet points.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon d={ICONS.check} size={15} className="text-blue-400 mt-0.5 shrink-0" />
                <span><strong className="text-white">Zero-Downtime Guarantee:</strong> If cloud connectivity fluctuates, Career Odyssey continues without interruptions using our local deterministic analyzer.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] text-zinc-500">
                Active Engine: <span className="font-mono text-purple-300 font-semibold">{analyzerStatus?.activeEngine || 'gemini-ai'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowEngineModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pillar Progress Bar Subcomponent ────────────────────────── */
function PillarProgressBar({ label, value, barColor }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-zinc-200">{value} / 100</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* ── Info Item Tile ─────────────────────────────────────────── */
function InfoItem({ label, value, isLink = false }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
        {label}
      </span>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-orange-400 hover:underline truncate block"
          >
            {value.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-xs text-zinc-200 font-medium truncate block">{value}</span>
        )
      ) : (
        <span className="text-xs text-zinc-600 italic">Not detected</span>
      )}
    </div>
  );
}

/* ── ATS Metric Tile ────────────────────────────────────────── */
function AtsMetricTile({ label, earned, max }) {
  const pct = Math.round((earned / max) * 100);
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
      <span className="text-xs text-zinc-400 block mb-1 truncate">{label}</span>
      <span className="text-sm font-bold text-zinc-200">
        {earned}/{max}
      </span>
      <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}