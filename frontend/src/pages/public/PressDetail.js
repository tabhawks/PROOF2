import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { api } from '@/lib/api';

function fmtDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); } catch { return s.slice(0, 10); }
}

export default function PressDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preview = params.get('preview');
    api.get(`/cms/posts/by-slug/${slug}${preview ? `?preview=${preview}` : ''}`).then(({data}) => setPost(data)).catch(e => setErr(e?.response?.status === 404 ? 'not found' : 'error'));
  }, [slug]);
  if (err) return <PublicLayout><div className="section container-x"><h1 className="display text-[60px]">Not found.</h1></div></PublicLayout>;
  if (!post) return <PublicLayout><div className="section container-x"><div className="meta-mono">loading…</div></div></PublicLayout>;
  return (
    <PublicLayout>
      <article>
        <section className="section">
          <div className="container-narrow">
            <Link to="/press" className="meta-mono link-underline">← all writing</Link>
            <div className="meta-mono mt-12">{fmtDate(post.publish_at || post.created_at)} · {(post.categories || [])[0] || 'Insights'}</div>
            <h1 className="display text-[44px] md:text-[80px] mt-6 leading-[1.05]">{post.title}</h1>
            {post.excerpt && <p className="font-serif text-[22px] md:text-[26px] mt-10 leading-[1.45] text-[rgba(10,10,10,0.78)]">{post.excerpt}</p>}
          </div>
        </section>
        <BlockRenderer blocks={post.blocks} />
        <section className="section" style={{ borderTop: '1px solid var(--gold-line)' }}>
          <div className="container-narrow text-center">
            <Link to="/press" className="btn-line">all writing</Link>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
