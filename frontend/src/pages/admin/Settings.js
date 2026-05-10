import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import TwoFactorPanel from '@/components/auth/TwoFactorPanel';

export default function AdminSettings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/admin/settings').then(({data}) => setS(data)); }, []);
  if (!s) return <div className="meta-mono">loading…</div>;
  const save = async () => {
    const { data } = await api.patch('/admin/settings', s);
    setS(data); setMsg('Saved.'); setTimeout(() => setMsg(''), 2500);
  };
  const Field = (k, label, type='text') => (
    <div className="mb-5"><label className="meta-mono">{label}</label>
      <input type={type} className="input-line mt-1" value={s[k] ?? ''} onChange={e => setS({ ...s, [k]: type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value })} /></div>
  );
  return (
    <div data-testid="admin-settings">
      <div className="eyebrow mb-3">governance</div>
      <h1 className="display text-[44px] mb-8">Settings.</h1>
      <div className="max-w-[640px]">
        {Field('site_title','site title')}
        {Field('site_tagline','site tagline')}
        {Field('site_seo_title','SEO title')}
        <div className="mb-5"><label className="meta-mono">SEO description</label><textarea rows={3} className="w-full input-line mt-1 resize-none" value={s.site_seo_description || ''} onChange={e => setS({ ...s, site_seo_description: e.target.value })} /></div>
        {Field('edition_meta','edition meta')}
        {Field('contact_email','contact email')}
        {Field('session_timeout_minutes','session timeout (min)','number')}
        {Field('password_min_length','password min length','number')}
        <div className="mb-5 flex gap-6 items-center">
          <label className="meta-mono flex items-center gap-2"><input type="checkbox" checked={!!s.mfa_enforced_staff} onChange={e => setS({ ...s, mfa_enforced_staff: e.target.checked })} /> mfa enforced (staff)</label>
          <label className="meta-mono flex items-center gap-2"><input type="checkbox" checked={!!s.mfa_enforced_members} onChange={e => setS({ ...s, mfa_enforced_members: e.target.checked })} /> mfa enforced (members)</label>
        </div>
        <button onClick={save} className="btn-line gold">save settings</button>
        {msg && <span className="ml-4 meta-mono" style={{ color: 'var(--gold)' }}>{msg}</span>}
      </div>
      <div className="mt-16 max-w-[800px] pt-8" style={{ borderTop: '1px solid var(--gold-line)' }}>
        <TwoFactorPanel />
      </div>
    </div>
  );
}
