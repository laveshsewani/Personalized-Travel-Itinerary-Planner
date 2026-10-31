import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../api/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isDemo: false,

  initAuth: async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({
            session,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            },
            isDemo: false,
            loading: false,
          });

          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
              set({
                session: newSession,
                user: {
                  id: newSession.user.id,
                  email: newSession.user.email,
                  name: newSession.user.user_metadata?.full_name || newSession.user.email.split('@')[0],
                },
                isDemo: false,
              });
            } else {
              set({ session: null, user: null, isDemo: false });
            }
          });
          return;
        }
      }

      // Check for saved demo session
      const savedDemo = localStorage.getItem('yatra_demo_user');
      if (savedDemo) {
        set({ user: JSON.parse(savedDemo), isDemo: true, loading: false });
        return;
      }

      set({ loading: false, user: null });
    } catch (err) {
      console.warn('Auth init error:', err);
      set({ loading: false, user: null });
    }
  },

  signInWithPassword: async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured yet. Use Demo Mode to explore instantly.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
      },
      isDemo: false,
    });
    return data;
  },

  signUpWithPassword: async (email, password, fullName) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured yet. Use Demo Mode to explore instantly.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },

  signInDemo: (email = 'traveler@yatra.local', name = 'Aarav Sharma') => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email,
      name,
    };
    localStorage.setItem('yatra_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('yatra_demo_token', 'demo_token');
    set({ user: demoUser, isDemo: true, session: null });
  },

  signOut: async () => {
    try {
      if (supabase && isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn(e);
    }
    localStorage.removeItem('yatra_demo_user');
    localStorage.removeItem('yatra_demo_token');
    set({ user: null, session: null, isDemo: false });
  },
}));
