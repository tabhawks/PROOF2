import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminMedia() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);
  const load = () => api.get('/cms/media').then(({data}) => setItems(data));
  useEffect(() => { load(); }, []);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData(); fd.append('file', file); fd.append('alt', file.name);
    try { await api.post('/cms/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); load(); }
    catch (err) { alert(err?.response?.data?.detail || 'upload failed'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };
  const remove = async (m) => { if (!window.confirm('Delete?')) return; await api.delete(`/cms/media/${m.id}`); load(); };
  const save = async () => { if (!editing) return; await api.patch(`/cms/media/${editing.id}`, { alt: editing.alt, title: editing.title, original_name: editing.original_name }); setEditing(null); load(); };
  const url = (m) => `${process.env.REACT_APP_BACKEND_URL}${m.variants?.thumb || m.variants?.full}`;
  return (
    <div data-testid="admin-media">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">content</div><h1 className="display text-[44px]">Media library.</h1></div>
        <label className="btn-line cursor-pointer">{busy ? 'uploading…' : 'upload'}<input ref={fileRef} type="file" data-testid="media-upload" className="hidden" onChange={upload} accept="image/*" /></label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(m => (
          <div key={m.id} className="border border-[var(--gold-line)]">
            <div className="aspect-square bg-[var(--charcoal)] overflow-hidden">
              {m.variants?.thumb || m.variants?.full ? <img src={url(m)} alt={m.alt} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full meta-mono on-dark">{m.mime}</div>}
            </div>
            <div className="p-3">
              <div className="font-mono text-[11px] truncate">{m.original_name}</div>
              <div className="meta-mono mt-1 text-[10px]">{m.alt || '— missing alt —'}</div>
              <div className="meta-mono mt-1 text-[10px]">used: {m.usage?.length || 0}</div>
              <div className="flex gap-2 mt-3"><button onClick={() => setEditing({ ...m })} className="meta-mono link-underline">edit</button><button onClick={() => remove(m)} className="meta-mono" style={{ color: 'red' }}>delete</button></div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[480px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">Edit media</h2>
            <div className="mb-4"><label className="meta-mono">name</label><input className="input-line mt-1" value={editing.original_name || ''} onChange={e => setEditing({ ...editing, original_name: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">alt text (required)</label><input className="input-line mt-1" value={editing.alt || ''} onChange={e => setEditing({ ...editing, alt: e.target.value })} /></div>
            <div className="mb-4"><label className="meta-mono">title</label><input className="input-line mt-1" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
            <div className="flex gap-3"><button onClick={() => setEditing(null)} className="btn-line">cancel</button><button onClick={save} className="btn-line gold" disabled={!editing.alt}>save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
