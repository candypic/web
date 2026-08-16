import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  crewProfile: null,
  isSuperAdmin: false,
  isAdmin: false,
  isCrew: false,
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
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user?.email) {
        await fetchProfile(data.session.user.email);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.email) {
        await fetchProfile(newSession.user.email);
      } else {
        setCrewProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const userEmail = session?.user?.email?.toLowerCase().trim() || '';
  const isSuperAdmin =
    userEmail === 'chandan@candypic.com' ||
    userEmail === 'admin@candypic.in' ||
    userEmail === 'prajnaprabhu9@gmail.com';
  const isAdmin = isSuperAdmin || crewProfile?.role === 'Admin' || crewProfile?.role === 'Studio Lead';
  const isCrew = Boolean(crewProfile) || !isSuperAdmin;

  const value = {
    session,
    user: session?.user ?? null,
    crewProfile,
    isSuperAdmin,
    isAdmin,
    isCrew,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

