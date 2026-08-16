import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SUPER_ADMIN_EMAILS = ['chandan@candypic.com'];

const AuthContext = createContext({
  session: null,
  user: null,
  crewProfile: null,
  isSuperAdmin: false,
  isAdmin: false,
  isCrew: false,
  isApprovedCrew: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [crewProfile, setCrewProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (email) => {
    if (!email) {
      setCrewProfile(null);
      return;
    }
    try {
      const { data } = await supabase
        .from('crew_profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      setCrewProfile(data || null);
    } catch (e) {
      console.warn('Error fetching crew profile:', e);
      setCrewProfile(null);
    }
  };

  useEffect(() => {
    // A stale/corrupted session token in localStorage (e.g. left over from
    // an earlier login) can make getSession() hang or reject instead of
    // resolving. Without a catch/fallback here, `loading` would stay true
    // forever and every gated route (HomeGate, ProtectedRoute) would spin
    // indefinitely — which is exactly what a stuck normal-profile browser
    // looks like next to a clean incognito window with no stored token.
    let settled = false;
    const finishLoading = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };
    const safetyTimeout = setTimeout(finishLoading, 6000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session?.user?.email) {
          await fetchProfile(data.session.user.email);
        } else {
          // Crew members never get a real Supabase Auth session — they're
          // identified on this device via the email saved to localStorage
          // at registration/approval. Resolve that so the app knows, on
          // every launch, whether this device belongs to approved crew.
          let localEmail = '';
          try {
            localEmail = localStorage.getItem('candy_crew_email') || '';
          } catch (e) {}
          if (localEmail) await fetchProfile(localEmail);
        }
      })
      .catch((err) => {
        console.warn('Session resolution failed, clearing to a logged-out state:', err);
        setSession(null);
        setCrewProfile(null);
      })
      .finally(() => {
        clearTimeout(safetyTimeout);
        finishLoading();
      });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.email) {
        await fetchProfile(newSession.user.email);
      } else {
        setCrewProfile(null);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const userEmail = session?.user?.email?.toLowerCase().trim() || '';
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);
  const isAdmin = isSuperAdmin || crewProfile?.role === 'Admin' || crewProfile?.role === 'Studio Lead';
  const isCrew = Boolean(crewProfile) || !isSuperAdmin;
  // True once this device is recognized as an approved (non-admin) crew
  // member — regardless of whether they ever hold a real login session.
  const isApprovedCrew =
    Boolean(crewProfile) &&
    crewProfile.status === 'approved' &&
    !SUPER_ADMIN_EMAILS.includes((crewProfile.email || '').toLowerCase().trim());

  const value = {
    session,
    user: session?.user ?? null,
    crewProfile,
    isSuperAdmin,
    isAdmin,
    isCrew,
    isApprovedCrew,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

