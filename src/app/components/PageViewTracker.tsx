import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function PageViewTracker() {
  useEffect(() => {
    if (!supabase || window.location.pathname.startsWith('/admin')) {
      return;
    }

    const locale = navigator.language;
    const country = locale.includes('-') ? locale.split('-').pop() : null;

    void supabase.functions.invoke('track-page-view', {
      body: {
        path: `${window.location.pathname}${window.location.search}`,
        page_title: document.title,
        referrer: document.referrer || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale,
        country,
        user_agent: navigator.userAgent,
      },
    });
  }, []);

  return null;
}
