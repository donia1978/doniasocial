import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, AppRole, Permission, ROLE_PERMISSIONS, MOCK_USERS, UserProfile } from '@/types/user';

interface UserContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  // Helper functions
  getCurrentUser: () => User | null;
  getUserRole: () => AppRole | null;
  getUserRoles: () => AppRole[];
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  // Auth functions
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Mock mode for testing
  useMockUser: (userId: string) => void;
  clearMockUser: () => void;
  isMockMode: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isMockMode, setIsMockMode] = useState(false);

  // Fetch user roles from Supabase
  const fetchUserRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching roles:', error);
      return ['user'];
    }

    return data?.map(r => r.role as AppRole) || ['user'];
  }, []);

  // Fetch user profile from Supabase
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }, []);

  // Build complete user object
  const buildUser = useCallback(async (supabaseUser: SupabaseUser): Promise<User> => {
    const [userRoles, profile] = await Promise.all([
      fetchUserRoles(supabaseUser.id),
      fetchUserProfile(supabaseUser.id)
    ]);

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.full_name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
      roles: userRoles,
      profile: profile || {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        full_name: null,
        avatar_url: null,
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: profile?.updated_at || new Date().toISOString()
    };
  }, [fetchUserRoles, fetchUserProfile]);

  // Initialize auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);

        if (session?.user && !isMockMode) {
          setTimeout(() => {
            buildUser(session.user).then(user => {
              setUser(user);
              setRoles(user.roles);
              setLoading(false);
            });
          }, 0);
        } else if (!isMockMode) {
          setUser(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user && !isMockMode) {
        buildUser(session.user).then(user => {
          setUser(user);
          setRoles(user.roles);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [buildUser, isMockMode]);

  // Helper functions
  const getCurrentUser = useCallback((): User | null => {
    return user;
  }, [user]);

  const getUserRole = useCallback((): AppRole | null => {
    if (roles.length === 0) return null;
    // Return highest priority role
    const priority: AppRole[] = ['admin', 'medical_staff', 'teacher', 'parent', 'student', 'user'];
    return priority.find(r => roles.includes(r)) || roles[0];
  }, [roles]);

  const getUserRoles = useCallback((): AppRole[] => {
    return roles;
  }, [roles]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return roles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
  }, [roles]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  }, [roles]);

  // Auth functions
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
    clearMockUser();
  };

  // Mock mode functions
  const useMockUser = useCallback((userId: string) => {
    const mockUser = MOCK_USERS.find(u => u.id === userId);
    if (mockUser) {
      setIsMockMode(true);
      setUser(mockUser);
      setRoles(mockUser.roles);
      setLoading(false);
    }
  }, []);

  const clearMockUser = useCallback(() => {
    setIsMockMode(false);
    if (supabaseUser) {
      buildUser(supabaseUser).then(user => {
        setUser(user);
        setRoles(user.roles);
      });
    } else {
      setUser(null);
      setRoles([]);
    }
  }, [supabaseUser, buildUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        roles,
        getCurrentUser,
        getUserRole,
        getUserRoles,
        hasPermission,
        hasRole,
        hasAnyRole,
        signIn,
        signUp,
        signOut,
        useMockUser,
        clearMockUser,
        isMockMode
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
