import { useEffect } from 'react';

export function PageViewTracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }

    const locale = navigator.language;
    const country = locale.includes('-') ? locale.split('-').pop() : null;

    void fetch('/api/track-page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        path: `${window.location.pathname}${window.location.search}`,
        page_title: document.title,
        referrer: document.referrer || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale,
        country,
        user_agent: navigator.userAgent,
      }),
    });
  }, []);

  return null;
}
