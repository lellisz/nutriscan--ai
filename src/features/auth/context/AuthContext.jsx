import React, { createContext, useState, useEffect } from "react";
import { getSupabaseClient } from "../../../lib/supabase";
import { getProfile } from "../../../lib/db";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";
import { setUserContext, captureException } from "../../../lib/sentry";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadProfile(userId) {
    try {
      const data = await getProfile(userId);
      setProfile(data);
    } catch (err) {
      logger.warn("Failed to load profile", { error: err.message });
    }
  }

  useEffect(() => {
    let subscription = null;

    async function init() {
      try {
        const supabase = getSupabaseClient();

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        const currentUser = currentSession?.user ?? null;
        setSession(currentSession);
        setUser(currentUser);
        if (currentUser) {
          logger.info("Session restored", { userId: currentUser.id, email: currentUser.email });
          analytics.setUserId(currentUser.id);
          setUserContext(currentUser);
          loadProfile(currentUser.id);
        }

        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            logger.info("Auth state changed", { event, userId: session?.user?.id });

            switch (event) {
              case "INITIAL_SESSION":
                break;

              case "SIGNED_IN":
                if (session?.user) {
                  setSession(session);
                  setUser(session.user);
                  analytics.setUserId(session.user.id);
                  setUserContext(session.user);
                  loadProfile(session.user.id);
                  logger.info("User signed in (via listener)", { userId: session.user.id });
                }
                break;

              case "SIGNED_OUT":
                setSession(null);
                setUser(null);
                setProfile(null);
                setUserContext(null);
                analytics.setUserId(null);
                logger.info("User signed out (via listener)");
                break;

              case "TOKEN_REFRESHED":
                if (session?.user) {
                  setSession(session);
                  setUser(session.user);
                  logger.info("Token refreshed", { userId: session.user.id });
                }
                break;

              case "USER_UPDATED":
                if (session?.user) {
                  setSession(session);
                  setUser(session.user);
                  setUserContext(session.user);
                  logger.info("User updated", { userId: session.user.id });
                }
                break;

              case "MFA_CHALLENGE_VERIFIED":
                if (session?.user) {
                  setSession(session);
                  setUser(session.user);
                  logger.info("MFA challenge verified", { userId: session.user.id });
                }
                break;

              default:
                logger.info(`Unhandled auth event: ${event}`);
            }
          }
        );

        subscription = sub;
      } catch (err) {
        logger.error("Session bootstrap failed", { error: err.message });
        setError(err.message);
        captureException(err, { context: "bootstrapSession" });
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function signUp(email, password) {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      setSession(data.session);
      setUser(data.user);
      if (data.session && data.user) {
        loadProfile(data.user.id);
      }
      logger.info("User signed up", {
        userId: data.user?.id,
        email,
        hasSession: !!data.session,
      });
      analytics.setUserId(data.user?.id);
      setUserContext(data.user);
      return data;
    } catch (err) {
      logger.error("Signup failed", { email, error: err.message });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setSession(data.session);
      setUser(data.user);
      if (data.user) loadProfile(data.user.id);
      logger.info("User signed in", { userId: data.user?.id, email });
      analytics.setUserId(data.user?.id);
      setUserContext(data.user);
      return data.user;
    } catch (err) {
      logger.error("Signin failed", { email, error: err.message });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      logger.info("User signed out");
      analytics.trackSignout();
      setUserContext(null);
      setUser(null);
    } catch (err) {
      logger.error("Signout failed", { error: err.message });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Conta dev/admin: bypassa paywall e rate limiting no frontend
  const isDevAccount = profile?.role === "dev" || profile?.role === "admin";

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user && !!session,
    // true para contas dev/admin: trata como premium no frontend
    isDevAccount,
    isPremium: !!profile?.is_premium || isDevAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
