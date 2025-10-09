import { useEffect } from 'react';
import { useTrackingScripts } from '@/hooks/useTrackingScripts';

const AnalyticsTracker = () => {
  const { config, loading } = useTrackingScripts();

  useEffect(() => {
    if (!loading && config) {
      console.log('Analytics tracking configured:', {
        gtm: config.gtm_enabled ? config.gtm_id : 'disabled',
        ga: config.ga_enabled ? config.ga_measurement_id : 'disabled',
        fb: config.facebook_pixel_enabled ? config.facebook_pixel_id : 'disabled',
      });
    }
  }, [loading, config]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;
