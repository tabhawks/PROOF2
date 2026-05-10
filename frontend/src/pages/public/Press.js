import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { api } from '@/lib/api';

function fmtDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); } catch { return s.slice(0, 10); }
}

export default function Press() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { api.get('/cms/posts?status=published').then(({data}) => setPosts(data)).catch(()=>{}); }, []);
  return (
    <PublicLayout>
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container-x">
          <div className="eyebrow mb-8">Press &amp; Insights</div>
          <h1 className="display text-[60px] md:text-[112px]" style={{ lineHeight: 0.98 }}>Writing from <span className="gold">the firm.</span></h1>
        </div>
      </section>
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-x">
          <ul className="meta-strip">
            {posts.map(p => (
              <li key={p.id}>
                <Link to={`/press/${p.slug}`} className="row" style={{ display: 'grid' }}>
                  <div className="meta-mono" style={{ color: 'var(--accent)' }}>{fmtDate(p.publish_at || p.created_at)}</div>
                  <div className="meta-mono">{(p.categories || [])[0] || 'Insights'}</div>
                  <div className="desc">
                    <div className="font-serif italic text-[26px] md:text-[36px]">{p.title}</div>
                    {p.excerpt && <div className="text-[14px] mt-2 max-w-[680px]" style={{ color: 'var(--text-muted)' }}>{p.excerpt}</div>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicLayout>
  );
}
