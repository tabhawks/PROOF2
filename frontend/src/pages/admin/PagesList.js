import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export default function AdminPagesList() {
  const [pages, setPages] = useState([]);
  const load = () => api.get('/cms/pages').then(({data}) => setPages(data));
  useEffect(() => { load(); }, []);
  const create = async () => {
    const { data } = await api.post('/cms/pages', { title: 'Untitled page', blocks: [] });
    window.location.href = `/admin/pages/${data.id}`;
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try { await api.delete(`/cms/pages/${p.id}`); load(); }
    catch (e) { alert(e?.response?.data?.detail || 'failed'); }
  };
  return (
    <div data-testid="admin-pages">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">content</div><h1 className="display text-[44px]">Pages.</h1></div>
        <button data-testid="new-page" onClick={create} className="btn-line">new page</button>
      </div>
      <table className="w-full text-[14px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">title</th><th className="text-left">slug</th><th className="text-left">status</th><th className="text-left">updated</th><th></th></tr></thead>
        <tbody>
          {pages.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
              <td className="py-3 font-serif italic text-[20px]">{p.title}</td>
              <td className="font-mono text-[12px]">/p/{p.slug}</td>
              <td className="meta-mono" style={{ color: p.status === 'published' ? 'var(--gold)' : undefined }}>• {p.status}</td>
              <td className="meta-mono">{(p.updated_at || '').slice(0,10)}</td>
              <td className="text-right">
                <Link to={`/admin/pages/${p.id}`} className="meta-mono link-underline mr-4">edit</Link>
                {p.status === 'published' && <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="meta-mono link-underline mr-4">view</a>}
                <button onClick={() => remove(p)} className="meta-mono" style={{ color: 'red' }}>delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
