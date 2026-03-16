/**
 * Analytics Events Tracking
 * 
 * Tracks user actions for funnel analysis: signup → onboarding → scan → dashboard
 * 
 * Usage:
 *   trackEvent('user_signup', { email: 'user@example.com', method: 'email' })
 *   trackEvent('scan_success', { food: 'apple', duration: 2500 })
 *   trackEvent('scan_error', { error: 'timeout', attempt: 2 })
 */

class Analytics {
  constructor() {
    this.queue = [];
    this.isEnabled = true;
    this.sessionId = this.#generateSessionId();
    this.userId = null;
  }

  #generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Set current user ID for tracking (call after login)
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Clear user ID (call at logout)
   */
  clearUserId() {
    this.userId = null;
  }

  /**
   * Track an analytics event
   */
  trackEvent(name, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      name,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : null,
      properties: {
        ...properties,
        env: import.meta.env.MODE,
      },
    };

    // Log to console in dev
    if (import.meta.env.DEV) {
      console.log(
        `%c[Analytics] ${name}`,
        "color: #0066cc; font-weight: bold",
        properties
      );
    }

    // Queue for sending to analytics backend
    this.queue.push(event);

    // Send immediately (in production, would batch these)
    this.#sendEvent(event);
  }

  /**
   * Send event to analytics backend
   * In a real app, this would POST to your analytics service (Mixpanel, Amplitude, etc)
   */
  #sendEvent(event) {
    // For now, just log. Later integrate with PostHog, Plausible, etc.
    if (import.meta.env.PROD) {
      // Example: POST to your analytics endpoint
      // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })
      console.log("Analytics event queued:", event.name);
    }
  }

  /**
   * Track page view
   */
  trackPageView(page) {
    this.trackEvent("page_view", { page });
  }

  /**
   * Convenience methods for common events
   */

  trackSignup(method = "email") {
    this.trackEvent("user_signup", { method });
  }

  trackSignin(method = "email") {
    this.trackEvent("user_signin", { method });
  }

  trackSignout() {
    this.trackEvent("user_signout", {});
    this.clearUserId();
  }

  trackOnboarding(data) {
    this.trackEvent("onboarding_complete", {
      age: data.age,
      gender: data.gender,
      goal: data.goal,
      bmi: data.bmi,
    });
  }

  trackScanStart() {
    this.trackEvent("scan_start", {});
  }

  trackScanSuccess(analysis) {
    this.trackEvent("scan_success", {
      food: analysis.food_name,
      category: analysis.category,
      confidence: analysis.confidence,
      duration_ms: 0, // Set by caller if available
    });
  }

  trackScanError(error, retryCount = 0) {
    this.trackEvent("scan_error", {
      error: error.message,
      errorType: error.constructor.name,
      retryCount,
    });
  }

  trackRateLimit(count = 0) {
    this.trackEvent("rate_limit_hit", { scanCount: count });
  }

  trackErrorBoundary(componentStack) {
    this.trackEvent("error_boundary_triggered", {
      componentStack: componentStack.substring(0, 200), // Truncate
    });
  }
}

export const analytics = new Analytics();

export default analytics;
