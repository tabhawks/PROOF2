import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { api } from '@/lib/api';

function fmtDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); } catch { return s.slice(0, 10); }
}

export default function Press() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { api.get('/cms/posts?status=published').then(({data}) => setPosts(data)).catch(()=>{}); }, []);
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">press &amp; insights</div>
          <h1 className="display text-[56px] md:text-[104px] max-w-[1100px]">Writing from the firm.</h1>
        </div>
      </section>
      <section className="section" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <div className="container-x">
          <ul className="meta-strip">
            {posts.map(p => (
              <li key={p.id}>
                <Link to={`/press/${p.slug}`} className="row hover:bg-[rgba(200,169,106,0.06)] -mx-4 px-4">
                  <div className="meta-mono">{fmtDate(p.publish_at || p.created_at)} · {(p.categories || [])[0] || 'Insights'}</div>
                  <div>
                    <div className="font-serif italic text-[24px] md:text-[32px]">{p.title}</div>
                    {p.excerpt && <div className="text-[14px] mt-1 text-[rgba(10,10,10,0.65)] max-w-[680px]">{p.excerpt}</div>}
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
