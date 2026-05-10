import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export default function AdminPostsList() {
  const [items, setItems] = useState([]);
  const load = () => api.get('/cms/posts').then(({data}) => setItems(data));
  useEffect(() => { load(); }, []);
  const create = async () => {
    const { data } = await api.post('/cms/posts', { title: 'Untitled post', blocks: [] });
    window.location.href = `/admin/posts/${data.id}`;
  };
  const remove = async (p) => { if (!window.confirm(`Delete "${p.title}"?`)) return; await api.delete(`/cms/posts/${p.id}`); load(); };
  return (
    <div data-testid="admin-posts">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">content</div><h1 className="display text-[44px]">Posts.</h1></div>
        <button onClick={create} className="btn-line">new post</button>
      </div>
      <table className="w-full text-[14px]">
        <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">title</th><th className="text-left">slug</th><th className="text-left">status</th><th className="text-left">categories</th><th></th></tr></thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
              <td className="py-3 font-serif italic text-[20px]">{p.title}</td>
              <td className="font-mono text-[12px]">/press/{p.slug}</td>
              <td className="meta-mono" style={{ color: p.status === 'published' ? 'var(--gold)' : undefined }}>• {p.status}</td>
              <td className="meta-mono">{(p.categories || []).join(', ')}</td>
              <td className="text-right">
                <Link to={`/admin/posts/${p.id}`} className="meta-mono link-underline mr-4">edit</Link>
                {p.status === 'published' && <a href={`/press/${p.slug}`} target="_blank" rel="noreferrer" className="meta-mono link-underline mr-4">view</a>}
                <button onClick={() => remove(p)} className="meta-mono" style={{ color: 'red' }}>delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
