import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, userType: 'client' | 'provider') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    let mounted = true;

    // Global safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('AuthContext: Safety timeout triggered, forcing loading false');
        setLoading(false);
      }
    }, 5000); // 5 seconds max for initial load

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log('AuthContext: getSession result', session ? 'Session found' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: Loading profile for user', session.user.id);
        loadProfile(session.user.id);
      } else {
        console.log('AuthContext: No user, setting loading false');
        setLoading(false);
      }
    }).catch(err => {
      console.error('AuthContext: getSession error', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('AuthContext: Auth state change', event);
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('AuthContext: Loading profile (auth change)');
          await loadProfile(session.user.id);
        } else {
          console.log('AuthContext: Clearing profile (auth change)');
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Update last_seen_at when profile is loaded or user interacts
  useEffect(() => {
    if (user && profile) {
      const updateLastSeen = async () => {
        const lastUpdate = localStorage.getItem(`last_seen_update_${user.id}`);
        const now = Date.now();

        // Only update once every hour to save resources
        if (!lastUpdate || now - parseInt(lastUpdate) > 3600000) {
          await supabase
            .from('profiles')
            .update({ last_seen_at: new Date().toISOString() } as any)
            .eq('id', user.id);
          localStorage.setItem(`last_seen_update_${user.id}`, now.toString());
        }
      };

      updateLastSeen();
    }
  }, [user, profile]);

  const loadProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Loading profile for', userId);

      // Create a timeout promise for the fetch
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 10000)
      );

      // Race the supabase query against the timeout
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        timeoutPromise
      ]) as any;

      if (error) throw error;

      if (!data) {
        console.log('AuthContext: No profile found for signed-in user, creating one...');

        // Get the pending user type from registration flow
        const pendingType = localStorage.getItem('skilxpress_pending_user_type') as 'client' | 'provider';
        const userType = pendingType || 'client'; // Default to client if not specified

        // Get user info from currently signed in user
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: authUser.email!,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Signed In User',
              user_type: userType,
            } as any);

          if (upsertError) {
            console.error('AuthContext: Error creating/updating profile:', upsertError);
          } else {
            console.log('AuthContext: Profile created/updated automatically as', userType);
            // Load the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            setProfile(newProfile);
            localStorage.removeItem('skilxpress_pending_user_type');
            localStorage.setItem('skilxpress_has_account', 'true');
          }
        }
      } else {
        console.log('AuthContext: Profile loaded', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      console.log('AuthContext: loadProfile finished, setting loading false');
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: 'client' | 'provider') => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          user_type: userType,
        } as any);

      if (profileError) throw profileError;

      // Manually refresh profile state to ensure it's up to date
      await loadProfile(authData.user.id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id);

      if (error) throw error;

      await loadProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        resetPassword,
        refreshProfile,
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
