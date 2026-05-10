import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { BLOCK_TYPES, BlockRenderer } from '@/components/blocks/BlockRenderer';

function newBlock(type) {
  const id = Math.random().toString(36).slice(2, 10);
  const defaults = {
    hero: { title: 'New hero title', subtitle: 'A subtitle.', eyebrow: 'eyebrow', cta_label: 'request consideration', cta_href: '/contact', secondary_label: 'what we do', secondary_href: '/services' },
    heading: { text: 'New heading', level: 2 },
    paragraph: { text: 'A new paragraph.' },
    quote: { text: 'A new quotation.', attribution: 'firm doctrine' },
    image: { src: '', alt: '' },
    image_text: { src: '', alt: '', title: 'Title', text: 'Text', eyebrow: 'eyebrow' },
    two_col: { columns: [{ title: 'A', text: 'A text' }, { title: 'B', text: 'B text' }] },
    three_col: { columns: [{ title: 'A', text: '' }, { title: 'B', text: '' }, { title: 'C', text: '' }] },
    list: { items: ['Item one', 'Item two', 'Item three'] },
    stat_strip: { items: [{ label: 'Label', value: '01' }, { label: 'Label', value: '02' }] },
    cta: { title: 'A coordinated strategy.', cta_label: 'request consideration', cta_href: '/contact' },
    press_list: { items: [{ date: 'May 2026', title: 'A piece', href: '#' }] },
    athlete_grid: { items: [] },
    embed: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    custom_html: { html: '<div>HTML here</div>' },
    spacer: { size: 'md' },
    divider: {},
  };
  return { id, type, data: defaults[type] || {}, settings: {} };
}

function BlockEditor({ block, onChange }) {
  const d = block.data || {};
  const set = (k, v) => onChange({ ...block, data: { ...d, [k]: v } });
  const Field = ({ k, label, type = 'text', textarea }) => (
    <div className="mb-3">
      <label className="meta-mono block mb-1">{label || k}</label>
      {textarea
        ? <textarea rows={3} className="w-full input-line resize-none" value={d[k] || ''} onChange={e => set(k, e.target.value)} />
        : <input type={type} className="input-line" value={d[k] || ''} onChange={e => set(k, e.target.value)} />}
    </div>
  );
  switch (block.type) {
    case 'hero': return <><Field k="eyebrow" /><Field k="title" textarea /><Field k="subtitle" textarea /><Field k="cta_label" /><Field k="cta_href" /><Field k="secondary_label" /><Field k="secondary_href" /></>;
    case 'heading': return <><Field k="text" /><Field k="level" type="number" /></>;
    case 'paragraph': return <Field k="text" textarea />;
    case 'quote': return <><Field k="text" textarea /><Field k="attribution" /></>;
    case 'image': return <><Field k="src" /><Field k="alt" /><Field k="caption" /></>;
    case 'image_text': return <><Field k="eyebrow" /><Field k="title" /><Field k="text" textarea /><Field k="src" /><Field k="alt" /></>;
    case 'list': return <div className="mb-3"><label className="meta-mono">items (one per line)</label><textarea rows={4} className="w-full input-line resize-none" value={(d.items || []).join('\n')} onChange={e => set('items', e.target.value.split('\n').filter(Boolean))} /></div>;
    case 'stat_strip': return <div className="mb-3"><label className="meta-mono">items (label|value per line)</label><textarea rows={4} className="w-full input-line resize-none" value={(d.items || []).map(i => `${i.label}|${i.value}`).join('\n')} onChange={e => set('items', e.target.value.split('\n').filter(Boolean).map(s => { const [label, value] = s.split('|'); return { label, value }; }))} /></div>;
    case 'cta': return <><Field k="eyebrow" /><Field k="title" textarea /><Field k="text" textarea /><Field k="cta_label" /><Field k="cta_href" /></>;
    case 'two_col': case 'three_col': return <div className="mb-3"><label className="meta-mono">columns (title||text per line)</label><textarea rows={5} className="w-full input-line resize-none" value={(d.columns || []).map(c => `${c.title}||${c.text}`).join('\n')} onChange={e => set('columns', e.target.value.split('\n').filter(Boolean).map(s => { const [title, text] = s.split('||'); return { title, text }; }))} /></div>;
    case 'press_list': return <div className="mb-3"><label className="meta-mono">items (date|title|href per line)</label><textarea rows={4} className="w-full input-line resize-none" value={(d.items || []).map(i => `${i.date}|${i.title}|${i.href}`).join('\n')} onChange={e => set('items', e.target.value.split('\n').filter(Boolean).map(s => { const [date, title, href] = s.split('|'); return { date, title, href }; }))} /></div>;
    case 'embed': return <><Field k="url" /><Field k="title" /></>;
    case 'custom_html': return <Field k="html" textarea />;
    case 'spacer': return <div><label className="meta-mono">size</label><select className="input-line" value={d.size || 'md'} onChange={e => set('size', e.target.value)}><option>sm</option><option>md</option><option>lg</option></select></div>;
    default: return <div className="meta-mono text-[rgba(10,10,10,0.5)]">No properties.</div>;
  }
}

export default function PageEditor({ resourceType = 'page' }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [doc, setDoc] = useState(null);
  const [media, setMedia] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revs, setRevs] = useState([]);
  const [showRevs, setShowRevs] = useState(false);

  const baseUrl = resourceType === 'page' ? '/cms/pages' : '/cms/posts';

  const load = useCallback(() => {
    api.get(`${baseUrl}/${id}`).then(({data}) => setDoc(data));
    api.get(`/cms/revisions/${resourceType}/${id}`).then(({data}) => setRevs(data));
  }, [id, baseUrl, resourceType]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/cms/media').then(({data}) => setMedia(data)).catch(()=>{}); }, []);

  const save = async (partial = {}) => {
    setBusy(true);
    const payload = { ...doc, ...partial };
    const { data } = await api.patch(`${baseUrl}/${id}`, payload);
    setDoc(data); setBusy(false);
    api.get(`/cms/revisions/${resourceType}/${id}`).then(({data}) => setRevs(data));
  };
  const publish = async () => { await save(); await api.post(`${baseUrl}/${id}/publish`); load(); };

  if (!doc) return <div className="meta-mono">loading…</div>;

  const updateBlock = (idx, b) => { const blocks = [...(doc.blocks || [])]; blocks[idx] = b; setDoc({ ...doc, blocks }); };
  const deleteBlock = (idx) => { const blocks = [...(doc.blocks || [])]; blocks.splice(idx, 1); setDoc({ ...doc, blocks }); setSelected(null); };
  const moveBlock = (idx, dir) => { const blocks = [...(doc.blocks || [])]; const j = idx + dir; if (j < 0 || j >= blocks.length) return; const tmp = blocks[idx]; blocks[idx] = blocks[j]; blocks[j] = tmp; setDoc({ ...doc, blocks }); };
  const addBlock = (type) => { const b = newBlock(type); setDoc({ ...doc, blocks: [...(doc.blocks || []), b] }); setSelected(b.id); };

  const restoreRev = async (rev) => {
    if (!window.confirm('Restore this revision? Current edits will be saved as a new revision first.')) return;
    await api.post(`/cms/revisions/${rev.id}/restore`); load();
  };

  const previewUrl = `/${resourceType === 'page' ? 'p' : 'press'}/${doc.slug}?preview=${doc.preview_token}`;

  return (
    <div data-testid="page-editor" className="grid grid-cols-[1fr_360px] gap-0 -m-10 min-h-[calc(100vh-0px)]">
      <div className="overflow-auto">
        <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-[var(--gold-line)]" style={{ background: 'rgba(245,241,234,0.92)', backdropFilter: 'blur(8px)' }}>
          <div>
            <Link to={`/admin/${resourceType === 'page' ? 'pages' : 'posts'}`} className="meta-mono link-underline">← all {resourceType}s</Link>
            <div className="meta-mono mt-1" style={{ color: doc.status === 'published' ? 'var(--gold)' : undefined }}>• {doc.status}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRevs(s => !s)} className="btn-line">revisions ({revs.length})</button>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-line">preview</a>
            <button onClick={() => save()} disabled={busy} className="btn-line">save</button>
            <button onClick={publish} disabled={busy} className="btn-line gold">publish</button>
          </div>
        </div>

        {showRevs && (
          <div className="px-6 py-4 border-b border-[var(--gold-line)]" style={{ background: 'var(--bone)' }}>
            <h3 className="display text-[20px] mb-3">Revisions</h3>
            <ul className="space-y-2">
              {revs.map(r => (
                <li key={r.id} className="flex justify-between items-center text-[13px]">
                  <span className="font-mono">{r.created_at?.slice(0, 19).replace('T', ' ')}</span>
                  <span className="flex-1 mx-4 italic">{r.note || '—'}</span>
                  <button onClick={() => restoreRev(r)} className="meta-mono link-underline">restore</button>
                </li>
              ))}
              {revs.length === 0 && <li className="meta-mono">No revisions yet.</li>}
            </ul>
          </div>
        )}

        <div className="px-6 py-4 border-b border-[var(--gold-line)]">
          <input className="display text-[44px] w-full bg-transparent border-0 outline-none" value={doc.title} onChange={e => setDoc({ ...doc, title: e.target.value })} />
          <div className="flex gap-4 mt-2">
            <span className="meta-mono">slug:</span>
            <input className="font-mono text-[12px] bg-transparent border-0 outline-none flex-1" value={doc.slug} onChange={e => setDoc({ ...doc, slug: e.target.value })} />
          </div>
        </div>

        <div className="py-2">
          {(doc.blocks || []).map((b, i) => (
            <div key={b.id} className={`group relative ${selected === b.id ? 'outline outline-2 outline-[var(--gold)]' : ''}`} onClick={() => setSelected(b.id)}>
              <BlockRenderer blocks={[b]} />
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 z-10">
                <button onClick={(e) => { e.stopPropagation(); moveBlock(i, -1); }} className="px-2 py-1 text-[10px] font-mono bg-[var(--obsidian)] text-[var(--ivory)]">↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 1); }} className="px-2 py-1 text-[10px] font-mono bg-[var(--obsidian)] text-[var(--ivory)]">↓</button>
                <button onClick={(e) => { e.stopPropagation(); deleteBlock(i); }} className="px-2 py-1 text-[10px] font-mono bg-[red] text-[var(--ivory)]">×</button>
              </div>
            </div>
          ))}
          <div className="px-6 py-12 text-center" style={{ background: 'var(--bone)' }}>
            <div className="meta-mono mb-3">add block</div>
            <div className="flex flex-wrap justify-center gap-2">
              {BLOCK_TYPES.map(b => (
                <button key={b.type} onClick={() => addBlock(b.type)} data-testid={`add-block-${b.type}`} className="btn-line text-[10px]">{b.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="border-l border-[var(--gold-line)] p-6 overflow-auto" style={{ background: 'var(--bone)' }}>
        {selected ? (() => {
          const idx = (doc.blocks || []).findIndex(b => b.id === selected);
          const block = doc.blocks[idx];
          if (!block) return <div className="meta-mono">Block not found.</div>;
          return (
            <div>
              <div className="eyebrow mb-2">block</div>
              <h3 className="display text-[24px] mb-4">{BLOCK_TYPES.find(t => t.type === block.type)?.label || block.type}</h3>
              <BlockEditor block={block} onChange={(b) => updateBlock(idx, b)} />
              <div className="mt-6 flex gap-2">
                <button onClick={() => deleteBlock(idx)} className="btn-line">remove</button>
              </div>
            </div>
          );
        })() : (
          <div>
            <div className="eyebrow mb-2">SEO &amp; meta</div>
            <h3 className="display text-[24px] mb-4">Page details</h3>
            <div className="mb-4"><label className="meta-mono">SEO title</label><input className="input-line mt-1" value={doc.seo_title || ''} onChange={e => setDoc({ ...doc, seo_title: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">SEO description</label><textarea rows={3} className="w-full input-line resize-none" value={doc.seo_description || ''} onChange={e => setDoc({ ...doc, seo_description: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">canonical URL</label><input className="input-line mt-1" value={doc.canonical_url || ''} onChange={e => setDoc({ ...doc, canonical_url: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">robots</label><select className="input-line mt-1" value={doc.robots} onChange={e => setDoc({ ...doc, robots: e.target.value })}><option>index,follow</option><option>noindex,nofollow</option></select></div>
            <div className="mb-4"><label className="meta-mono">og image url</label><input className="input-line mt-1" value={doc.og_image || ''} onChange={e => setDoc({ ...doc, og_image: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">locale</label><input className="input-line mt-1" value={doc.locale} onChange={e => setDoc({ ...doc, locale: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">schedule publish at (UTC)</label><input data-testid="schedule-input" type="datetime-local" className="input-line mt-1" value={doc.publish_at ? doc.publish_at.slice(0, 16) : ''} onChange={e => setDoc({ ...doc, publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
            {resourceType === 'post' && <>
              <div className="mb-4"><label className="meta-mono">excerpt</label><textarea rows={2} className="w-full input-line resize-none" value={doc.excerpt || ''} onChange={e => setDoc({ ...doc, excerpt: e.target.value })} /></div>
              <div className="mb-4"><label className="meta-mono">categories (comma)</label><input className="input-line mt-1" value={(doc.categories || []).join(', ')} onChange={e => setDoc({ ...doc, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="mb-4"><label className="meta-mono">tags (comma)</label><input className="input-line mt-1" value={(doc.tags || []).join(', ')} onChange={e => setDoc({ ...doc, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
            </>}
          </div>
        )}
      </aside>
    </div>
  );
}
