/**
 * AppContext — centralized student application state.
 *
 * Responsibilities:
 *  - Load the student SkillProfile once when authenticated.
 *  - Expose profile data to all student pages without re-fetching.
 *  - Provide saveProfile() that auto-detects POST (create) vs PUT (update).
 *  - Clear profile state when the user logs out.
 *
 * Data contract (mirrors backend SkillProfile model):
 *  profile = { skills[{name,level,yearsOfExperience}], targetRole, targetIndustry }
 *
 * Does NOT duplicate auth state — use useAuth() for user/token.
 * Does NOT touch localStorage directly — uses skillProfile.api.js.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AuthContext } from './AuthContext';
import {
  getSkillProfile,
  createSkillProfile,
  updateSkillProfile,
} from '../api/skillProfile.api';

export const AppContext = createContext(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const { isAuthenticated, user } = useContext(AuthContext);

  // undefined = not fetched yet | null = no profile (404) | object = loaded
  const [profile,          setProfile]          = useState(undefined);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError,     setProfileError]     = useState(null);
  const [isSaving,         setIsSaving]         = useState(false);
  const [saveError,        setSaveError]        = useState(null);
  const [saveSuccess,      setSaveSuccess]      = useState(false);

  // Tracks server existence so saveProfile picks POST vs PUT
  const profileExistsRef = useRef(false);

  // Fetch once on auth change
  useEffect(() => {
    // Skill profiles are private student records.  AppProvider wraps every
    // dashboard, so avoid making a student-only request after a demo-role
    // switch to academia, industry, or admin.
    if (!isAuthenticated || user?.role !== 'student') {
      setProfile(undefined);
      setProfileError(null);
      profileExistsRef.current = false;
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const data = await getSkillProfile();
        if (cancelled) return;
        setProfile(data.profile ?? null);
        profileExistsRef.current = Boolean(data.profile);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 404) {
          setProfile(null);
          profileExistsRef.current = false;
        } else {
          setProfileError(err.message || 'Unable to load your profile. Please try again.');
          setProfile(null);
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.role]);

  const saveProfile = useCallback(async ({ skills, targetRole, targetIndustry }) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload = {
      skills:         Array.isArray(skills) ? skills : [],
      targetRole:     (targetRole     ?? '').trim(),
      targetIndustry: (targetIndustry ?? '').trim(),
    };

    try {
      let result;
      if (profileExistsRef.current) {
        result = await updateSkillProfile(payload);
      } else {
        try {
          result = await createSkillProfile(payload);
          profileExistsRef.current = true;
        } catch (createErr) {
          if (createErr.status === 409) {
            // Race: profile already existed — fall back to PUT
            result = await updateSkillProfile(payload);
            profileExistsRef.current = true;
          } else {
            throw createErr;
          }
        }
      }
      setProfile(result.profile ?? payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Unable to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(undefined);
    profileExistsRef.current = false;
  }, []);

  const dismissSaveStatus = useCallback(() => {
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  return (
    <AppContext.Provider value={{
      profile,
      isLoadingProfile,
      profileError,
      isSaving,
      saveError,
      saveSuccess,
      saveProfile,
      clearProfile,
      dismissSaveStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
}