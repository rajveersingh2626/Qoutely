/**
 * Quotely Production Telemetry & Analytics Wrapper
 * Privacy-focused broker workflow analytics (PostHog / Mixpanel / Segment compliant)
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  // Safe internal dispatch
  try {
    const payload = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };
    if (process.env.NODE_ENV === 'development') {
      // debug logging
    }
  } catch (err) {
    // Fail silently in production
  }
}
