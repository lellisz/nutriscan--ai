/**
 * Sentry Error Tracking Integration
 * 
 * Sentry captures errors and sends them to sentry.io for tracking
 * 
 * Setup:
 * 1. Create Sentry account at https://sentry.io (free tier)
 * 2. Create new project for "JavaScript" + "React"
 * 3. Copy the DSN (looks like: https://key@sentry.io/projectid)
 * 4. Add to .env: VITE_SENTRY_DSN=your-dsn-here
 * 5. Uncomment the code below to enable
 */

// Sentry is now configured with VITE_SENTRY_DSN from .env.local
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("Sentry DSN not configured. Errors will not be tracked.");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Release tracking for better error grouping
    release: "1.0.0",
    // Only report errors in production
    enabled: import.meta.env.PROD,
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Ignore failed 3rd party plugin page error messages
      "error loading script",
      // Network errors from browser extensions
      "NetworkError",
      // Random plugins/extensions
      "Can't find variable: ZiteReader",
      "jigsaw is not defined",
      "ComboSearch is not defined",
    ],
    // Capture breadcrumbs (user actions)
    maxBreadcrumbs: 50,
    beforeSend(event, hint) {
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;
        if (
          error.message?.includes("Non-Error promise rejection") ||
          error.message?.includes("Script error")
        ) {
          return null;
        }
      }
      return event;
    },
  });
  
  console.log("Sentry initialized successfully");
}

/**
 * Capture an exception with Sentry
 * Usage: captureException(error, { requestId: 'req_123' })
 */
export function captureException(error, context = {}) {
  try {
    Sentry.captureException(error, { contexts: { custom: context } });
  } catch (err) {
    console.error("Sentry exception:", error, context);
  }
}

/**
 * Capture a message with Sentry
 * Usage: captureMessage('User clicked button', { userId: '123' })
 */
export function captureMessage(message, level = "info", context = {}) {
  try {
    Sentry.captureMessage(message, level);
  } catch (err) {
    console.log(`Sentry message [${level}]:`, message, context);
  }
}

/**
 * Set user context for error tracking
 * Usage: setUserContext({ id: '123', email: 'user@example.com' })
 */
export function setUserContext(user) {
  try {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  } catch (err) {
    console.log("Sentry user context:", user);
  }
}

/**
 * Add breadcrumb for tracing user actions
 * Usage: addBreadcrumb({ message: 'User scanned food', category: 'scan' })
 */
export function addBreadcrumb(breadcrumb) {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (err) {
    console.log("Sentry breadcrumb:", breadcrumb);
  }
}
