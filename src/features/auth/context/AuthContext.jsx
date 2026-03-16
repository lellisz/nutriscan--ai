import React, { createContext, useState, useEffect } from "react";
import { getSupabaseClient } from "../../../lib/supabase";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";
import { setUserContext, captureException } from "../../../lib/sentry";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    bootstrapSession();
  }, []);

  async function bootstrapSession() {
    try {
      const supabase = getSupabaseClient();
      
      // Get current session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      if (user) {
        logger.info("Session restored", { userId: user.id, email: user.email });
        analytics.setUserId(user.id);
        setUserContext(user);
      }

      // Listen for auth state changes (token refresh, signout, etc)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          logger.info("Auth state changed", { event, userId: session?.user?.id });

          switch (event) {
            case "INITIAL_SESSION":
              // Already handled in getUser() above
              break;

            case "SIGNED_IN":
              if (session?.user) {
                setUser(session.user);
                analytics.setUserId(session.user.id);
                setUserContext(session.user);
                logger.info("User signed in (via listener)", { userId: session.user.id });
              }
              break;

            case "SIGNED_OUT":
              setUser(null);
              setUserContext(null);
              analytics.setUserId(null);
              logger.info("User signed out (via listener)");
              break;

            case "TOKEN_REFRESHED":
              if (session?.user) {
                setUser(session.user);
                logger.info("Token refreshed", { userId: session.user.id });
              }
              break;

            case "USER_UPDATED":
              if (session?.user) {
                setUser(session.user);
                setUserContext(session.user);
                logger.info("User updated", { userId: session.user.id });
              }
              break;

            case "MFA_CHALLENGE_VERIFIED":
              if (session?.user) {
                setUser(session.user);
                logger.info("MFA challenge verified", { userId: session.user.id });
              }
              break;

            default:
              logger.info(`Unhandled auth event: ${event}`);
          }
        }
      );

      // Cleanup subscription on unmount
      return () => {
        subscription?.unsubscribe();
      };
    } catch (err) {
      logger.error("Session bootstrap failed", { error: err.message });
      setError(err.message);
      captureException(err, { context: "bootstrapSession" });
    } finally {
      setLoading(false);
    }
  }

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

      setUser(data.user);
      logger.info("User signed up", { userId: data.user?.id, email });
      analytics.setUserId(data.user?.id);
      setUserContext(data.user);
      return data.user;
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

      setUser(data.user);
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

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
