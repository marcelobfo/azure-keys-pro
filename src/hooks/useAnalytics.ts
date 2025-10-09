import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsEvent {
  event_type: string;
  user_id?: string;
  session_id?: string;
  page_path?: string;
  data?: any;
}

interface AnalyticsSummary {
  date: string;
  page_views: number;
  unique_visitors: number;
  property_views: number;
  leads_generated: number;
  favorites_added: number;
  visits_scheduled: number;
  chat_messages: number;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  // Track to external platforms (GA, Facebook Pixel)
  const trackToExternalPlatforms = useCallback((eventType: string, data?: any) => {
    try {
      // Push to Google Tag Manager dataLayer
      if (window.dataLayer) {
        window.dataLayer.push({
          event: eventType,
          ...data,
          timestamp: new Date().toISOString(),
        });
      }

      // Track with Google Analytics gtag
      if (window.gtag) {
        window.gtag('event', eventType, data);
      }

      // Track with Facebook Pixel
      if (window.fbq) {
        // Map custom events to Facebook standard events when possible
        const fbEventMap: Record<string, string> = {
          view_property: 'ViewContent',
          schedule_visit: 'Schedule',
          favorite_added: 'AddToWishlist',
          lead_generated: 'Lead',
          contact_form: 'Contact',
        };
        const fbEvent = fbEventMap[eventType] || eventType;
        window.fbq('track', fbEvent, data);
      }
    } catch (error) {
      console.error('Error tracking to external platforms:', error);
    }
  }, []);

  // Track an analytics event
  const trackEvent = useCallback(async (eventType: string, data?: any, pagePath?: string) => {
    try {
      const event: AnalyticsEvent = {
        event_type: eventType,
        user_id: user?.id,
        session_id: sessionId,
        page_path: pagePath || window.location.pathname,
        data: data || {}
      };

      const { error } = await supabase
        .from('analytics_events')
        .insert(event);

      if (error) {
        console.error('Error tracking analytics event:', error);
      } else {
        console.log(`Analytics event tracked: ${eventType}`);
      }

      // Track to external platforms
      trackToExternalPlatforms(eventType, data);

      // Also trigger universal webhook
      await triggerWebhook(eventType, data);
    } catch (error) {
      console.error('Error in trackEvent:', error);
    }
  }, [user?.id, sessionId, trackToExternalPlatforms]);

  // Trigger universal webhook
  const triggerWebhook = async (eventType: string, data?: any) => {
    try {
      await fetch('/webhook-universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventType,
          user_id: user?.id,
          data: data || {},
          timestamp: new Date().toISOString(),
          source: 'analytics'
        })
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
    }
  };

  // Track page view automatically
  const trackPageView = useCallback(() => {
    trackEvent('page_view', {
      title: document.title,
      referrer: document.referrer
    });
  }, [trackEvent]);

  // Track unique visitor (once per session)
  const trackUniqueVisitor = useCallback(() => {
    const hasTracked = sessionStorage.getItem(`visitor_tracked_${sessionId}`);
    if (!hasTracked) {
      trackEvent('unique_visitor', {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`
      });
      sessionStorage.setItem(`visitor_tracked_${sessionId}`, 'true');
    }
  }, [trackEvent, sessionId]);

  // Auto-track page views and unique visitors
  useEffect(() => {
    trackPageView();
    trackUniqueVisitor();
  }, [trackPageView, trackUniqueVisitor]);

  return {
    trackEvent,
    trackPageView,
    trackUniqueVisitor,
    trackToExternalPlatforms,
    sessionId
  };
};

// Hook to fetch analytics data for dashboard
export const useAnalyticsDashboard = () => {
  const [summary, setSummary] = useState<AnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('analytics_summary')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching analytics:', error);
      } else {
        setSummary(data || []);
      }
    } catch (error) {
      console.error('Error in fetchAnalytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopProperties = useCallback(async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, view_count')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top properties:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchTopProperties:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    summary,
    loading,
    fetchAnalytics,
    fetchTopProperties
  };
};