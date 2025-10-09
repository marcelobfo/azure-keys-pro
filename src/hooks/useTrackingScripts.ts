import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackingConfig {
  gtm_id: string;
  gtm_enabled: boolean;
  ga_measurement_id: string;
  ga_enabled: boolean;
  facebook_pixel_id: string;
  facebook_pixel_enabled: boolean;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

export const useTrackingScripts = () => {
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingConfig();
  }, []);

  const fetchTrackingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'gtm_id',
          'gtm_enabled',
          'ga_measurement_id',
          'ga_enabled',
          'facebook_pixel_id',
          'facebook_pixel_enabled'
        ]);

      if (error) throw error;

      const settings = data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>) || {};

      const trackingConfig: TrackingConfig = {
        gtm_id: settings.gtm_id || '',
        gtm_enabled: settings.gtm_enabled === 'true',
        ga_measurement_id: settings.ga_measurement_id || '',
        ga_enabled: settings.ga_enabled === 'true',
        facebook_pixel_id: settings.facebook_pixel_id || '',
        facebook_pixel_enabled: settings.facebook_pixel_enabled === 'true',
      };

      setConfig(trackingConfig);
      injectScripts(trackingConfig);
    } catch (error) {
      console.error('Error fetching tracking config:', error);
    } finally {
      setLoading(false);
    }
  };

  const injectScripts = (trackingConfig: TrackingConfig) => {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Google Tag Manager
    if (trackingConfig.gtm_enabled && trackingConfig.gtm_id) {
      injectGTM(trackingConfig.gtm_id);
    }

    // Google Analytics
    if (trackingConfig.ga_enabled && trackingConfig.ga_measurement_id) {
      injectGA(trackingConfig.ga_measurement_id);
    }

    // Facebook Pixel
    if (trackingConfig.facebook_pixel_enabled && trackingConfig.facebook_pixel_id) {
      injectFacebookPixel(trackingConfig.facebook_pixel_id);
    }
  };

  const injectGTM = (gtmId: string) => {
    // Remove existing GTM script if any
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`);
    if (existingScript) return;

    // Inject GTM script
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    // Inject GTM noscript
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  };

  const injectGA = (measurementId: string) => {
    // Remove existing GA script if any
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);
    if (existingScript) return;

    // Inject GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
  };

  const injectFacebookPixel = (pixelId: string) => {
    // Check if pixel already loaded
    if (window.fbq) return;

    // Inject Facebook Pixel script
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Add noscript pixel
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  };

  return {
    config,
    loading,
    refetch: fetchTrackingConfig,
  };
};
