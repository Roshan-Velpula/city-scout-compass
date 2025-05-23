
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';
import { ProfileUpdate } from '@/types/profiles';
import { toast } from 'sonner';

type Profile = Tables<'profiles'>;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, metadata?: { full_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  getGoogleAuthToken: () => Promise<string | null>;
  deleteAccount: () => Promise<void>;
  resetUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_PROJECT_ID = 'zgdrcbdrmnhvfzygyecx';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Defer profile fetch to avoid potential deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting auth session:', error.message);
          setLoading(false);
          return;
        }
        
        if (data.session?.user) {
          console.log('Found existing session');
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in auth initialization:', err);
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Get the current URL to use as the redirect URL
      const redirectUrl = window.location.origin;
      console.log("Using redirect URL for Google auth:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Only request basic scopes needed for authentication
          scopes: 'email profile'
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in with email:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: { full_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        }
      });

      if (error) {
        console.error('Error signing up with email:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out, current session:', session ? 'exists' : 'none');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error.message);
        throw error;
      }
      
      setSession(null);
      setUser(null);
      setProfile(null);
      
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      navigate('/');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error.message);
        throw error;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const getGoogleAuthToken = async (): Promise<string | null> => {
    try {
      if (!session) return null;
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
        throw error;
      }
      
      const providerToken = data.session?.provider_token;
      
      if (!providerToken) {
        console.warn('No provider token available. User may need to re-authenticate.');
        return null;
      }
      
      return providerToken;
    } catch (error) {
      console.error('Error getting Google auth token:', error);
      return null;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user || !session) throw new Error('User not authenticated');
      
      const token = session.access_token;
      
      const response = await fetch(`https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      console.log('Account deletion successful, clearing session');
      
      setSession(null);
      setUser(null);
      setProfile(null);
      
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.log('Expected sign out error after account deletion:', signOutError);
      }
      
      navigate('/');
      toast.success('Your account has been successfully deleted');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
      throw error;
    }
  };

  const resetUserData = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      const updates: ProfileUpdate = {
        onboarding_completed: false,
        has_personality_insights: false,
        preference_chosen: false,
        personality_tiles: null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error resetting user data:', error.message);
        throw error;
      }

      try {
        const userFolder = `user_data/${user.id}`;
        await supabase.storage
          .from('user_files')
          .remove([`${userFolder}/personality_report.txt`]);
      } catch (fileError) {
        console.log('Note: No personality report file to delete or error deleting:', fileError);
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      navigate('/');
    } catch (error) {
      console.error('Error resetting user data:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
        getGoogleAuthToken,
        deleteAccount,
        resetUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
