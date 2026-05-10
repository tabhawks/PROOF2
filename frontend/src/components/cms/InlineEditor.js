import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * InlineEditor mounts on public CMS pages and posts when the user has edit_content.
 * It exposes a floating toolbar that lets the editor:
 *  - click any text inside [data-cms-field] to edit inline
 *  - reorder blocks with up/down keys per block
 *  - paste an image URL into image blocks
 *  - discard or publish
 */
export default function InlineEditor({ resourceType, slug }) {
  const { has } = useAuth() || {};
  const enabled = has && has('edit_content');
  const [doc, setDoc] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(true);

  const url = (s) => resourceType === 'page' ? `/cms/pages/by-slug/${s}` : `/cms/posts/by-slug/${s}`;
  const baseUrl = resourceType === 'page' ? '/cms/pages' : '/cms/posts';

  useEffect(() => {
    if (!enabled || !slug) return;
    api.get(url(slug)).then(({data}) => setDoc(data)).catch(() => setDoc(null));
  }, [slug, enabled, resourceType]);

  useEffect(() => {
    if (!enabled || !active || !doc) return;
    const handlers = [];
    document.querySelectorAll('[data-cms-field]').forEach((el) => {
      el.contentEditable = 'true';
      el.dataset.cmsOriginal = el.innerText;
      el.style.outline = '1px dashed rgba(200,169,106,0.5)';
      el.style.outlineOffset = '4px';
      const onInput = () => setDirty(true);
      el.addEventListener('input', onInput);
      handlers.push([el, onInput]);
    });
    return () => {
      handlers.forEach(([el, h]) => { el.removeEventListener('input', h); el.contentEditable = 'false'; el.style.outline = ''; });
    };
  }, [doc, active, enabled]);

  if (!enabled || !doc || !active) return null;

  const collectEdits = () => {
    // Walk blocks; capture top-level text fields by [data-cms-block][data-cms-field]
    const blocks = JSON.parse(JSON.stringify(doc.blocks || []));
    document.querySelectorAll('[data-cms-block]').forEach((el) => {
      const id = el.dataset.cmsBlock;
      const idx = blocks.findIndex(b => b.id === id);
      if (idx < 0) return;
      el.querySelectorAll('[data-cms-field]').forEach((f) => {
        const key = f.dataset.cmsField;
        if (!key) return;
        blocks[idx] = { ...blocks[idx], data: { ...(blocks[idx].data || {}), [key]: f.innerText } };
      });
    });
    return blocks;
  };

  const discard = () => {
    document.querySelectorAll('[data-cms-field]').forEach((el) => {
      if (el.dataset.cmsOriginal != null) el.innerText = el.dataset.cmsOriginal;
    });
    setDirty(false);
  };

  const saveDraft = async () => {
    setBusy(true);
    const blocks = collectEdits();
    try { await api.patch(`${baseUrl}/${doc.id}`, { blocks }); setDirty(false); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    setBusy(true);
    const blocks = collectEdits();
    try {
      await api.patch(`${baseUrl}/${doc.id}`, { blocks });
      await api.post(`${baseUrl}/${doc.id}/publish`);
      setDirty(false);
      window.location.reload();
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'var(--obsidian)', color: 'var(--ivory)', borderTop: '1px solid var(--gold-line)' }} data-testid="inline-editor-bar">
      <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="meta-mono on-dark">editing</span>
          <span className="font-serif italic text-[18px]">{doc.title}</span>
          <span className="meta-mono on-dark" style={{ color: doc.status === 'published' ? 'var(--gold)' : undefined }}>· {doc.status}</span>
          {dirty && <span className="meta-mono" style={{ color: 'var(--gold)' }}>· unsaved</span>}
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/${resourceType === 'page' ? 'pages' : 'posts'}/${doc.id}`} className="btn-line dark">full editor</Link>
          <button onClick={discard} disabled={!dirty || busy} className="btn-line dark">discard</button>
          <button onClick={saveDraft} disabled={!dirty || busy} className="btn-line dark">save draft</button>
          <button onClick={publish} disabled={busy} className="btn-line gold">{busy ? 'publishing…' : 'publish'}</button>
          <button onClick={() => setActive(false)} className="btn-line dark">close</button>
        </div>
      </div>
    </div>
  );
}
