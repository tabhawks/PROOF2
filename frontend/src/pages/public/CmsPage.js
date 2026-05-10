import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '@/components/site/PublicLayout';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { api } from '@/lib/api';

export default function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get('preview');
    api.get(`/cms/pages/by-slug/${slug}${preview ? `?preview=${preview}` : ''}`).then(({data}) => setPage(data)).catch(e => setErr(e?.response?.status === 404 ? 'not found' : 'error'));
  }, [slug]);
  if (err) return <PublicLayout><div className="section container-x"><h1 className="display text-[60px]">Not found.</h1></div></PublicLayout>;
  if (!page) return <PublicLayout><div className="section container-x"><div className="meta-mono">loading…</div></div></PublicLayout>;
  return (
    <PublicLayout>
      <section className="section">
        <div className="container-x">
          <div className="eyebrow mb-6">{page.locale}</div>
          <h1 className="display text-[56px] md:text-[100px] max-w-[1100px]">{page.title}</h1>
          {page.seo_description && <p className="font-serif text-[20px] md:text-[22px] mt-10 max-w-[720px] text-[rgba(10,10,10,0.78)] leading-[1.5]">{page.seo_description}</p>}
        </div>
      </section>
      <BlockRenderer blocks={page.blocks} />
    </PublicLayout>
  );
}
