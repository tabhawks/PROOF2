import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function fmtSize(b) { if (!b) return '—'; if (b < 1024) return b + ' B'; if (b < 1024*1024) return (b/1024).toFixed(1)+' KB'; return (b/1024/1024).toFixed(1)+' MB'; }

export default function PortalDocuments() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/ops/documents').then(({data}) => setDocs(data)).catch(e => setError(e?.response?.data?.detail || 'load failed')); }, []);
  const download = async (d) => {
    try {
      const { data } = await api.get(`/ops/documents/${d.id}/signed-url`);
      const url = `${process.env.REACT_APP_BACKEND_URL}${data.url}`;
      window.open(url, '_blank');
    } catch (e) { alert(e?.response?.data?.detail || 'download failed'); }
  };
  return (
    <div data-testid="portal-documents">
      <div className="eyebrow mb-3">documents</div>
      <h1 className="display text-[44px] md:text-[64px] mb-10">Vault.</h1>
      {error && <div className="text-red-700 mb-6">{error}</div>}
      <ul className="meta-strip">
        {docs.length === 0 && <li className="row"><div className="meta-mono">—</div><div className="font-serif italic">No documents.</div></li>}
        {docs.map(d => (
          <li key={d.id} className="row">
            <div className="meta-mono">{(d.created_at || '').slice(0,10)}</div>
            <div className="flex justify-between items-center gap-4">
              <div>
                <div className="font-serif italic text-[20px]">{d.title}</div>
                <div className="meta-mono mt-1">{d.visibility} · {fmtSize(d.size)} · {d.mime}</div>
              </div>
              <button data-testid={`doc-download-${d.id}`} onClick={() => download(d)} className="btn-line">download</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
