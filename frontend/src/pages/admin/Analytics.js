import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/analytics/summary').then(({data}) => setData(data)).catch(()=>{}); }, []);
  if (!data) return <div className="meta-mono">loading…</div>;
  const r = data.rolling_7d;
  return (
    <div data-testid="admin-analytics">
      <div className="eyebrow mb-3">governance</div>
      <h1 className="display text-[44px] mb-8">Analytics.</h1>
      <div className="meta-mono mb-3">rolling 7 days</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[
          ['sessions', r.sessions], ['portal logins', r.portal_logins], ['admin logins', r.admin_logins],
          ['content edits', r.content_edits], ['doc downloads', r.doc_downloads], ['inquiries', r.inquiries],
          ['page views', r.page_views],
        ].map(([label, value]) => (
          <div key={label} className="p-6 border border-[var(--gold-line)]">
            <div className="meta-mono mb-3">{label}</div>
            <div className="display text-[44px] tabular leading-none">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
