import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const EMPTY_PLAN = { name: '', tagline: '', monthly_amount_usd: 0, currency: 'USD', features: [], payment_link_url: '', order: 0, active: true };

export default function AdminRetainers() {
  const [tab, setTab] = useState('assignments');
  const [plans, setPlans] = useState([]);
  const [retainers, setRetainers] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [planEdit, setPlanEdit] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ athlete_id: '', plan_id: '', status: 'active', note: '' });
  const load = () => {
    api.get('/billing/plans').then(({data}) => setPlans(data));
    api.get('/billing/retainers').then(({data}) => setRetainers(data));
    api.get('/ops/athletes').then(({data}) => setAthletes(data));
  };
  useEffect(() => { load(); }, []);

  const savePlan = async (e) => {
    e.preventDefault();
    const p = { ...planEdit, monthly_amount_usd: parseInt(planEdit.monthly_amount_usd, 10) || 0, order: parseInt(planEdit.order || 0, 10), features: typeof planEdit.features === 'string' ? planEdit.features.split('\n').filter(Boolean) : (planEdit.features || []) };
    if (planEdit.id) await api.patch(`/billing/plans/${planEdit.id}`, p); else await api.post('/billing/plans', p);
    setPlanOpen(false); setPlanEdit(null); load();
  };
  const deletePlan = async (p) => { if (!window.confirm(`Delete plan "${p.name}"?`)) return; await api.delete(`/billing/plans/${p.id}`); load(); };

  const createAssign = async (e) => {
    e.preventDefault();
    await api.post('/billing/retainers', { ...assignForm, started_at: new Date().toISOString() });
    setAssignOpen(false); setAssignForm({ athlete_id: '', plan_id: '', status: 'active', note: '' }); load();
  };
  const updateRetainer = async (r, changes) => { await api.patch(`/billing/retainers/${r.id}`, changes); load(); };
  const removeRetainer = async (r) => { if (!window.confirm('Delete retainer?')) return; await api.delete(`/billing/retainers/${r.id}`); load(); };

  return (
    <div data-testid="admin-retainers">
      <div className="flex justify-between items-center mb-8">
        <div><div className="eyebrow mb-3">billing</div><h1 className="display text-[44px]">Retainers.</h1></div>
        <div className="flex gap-2">
          {['assignments', 'plans'].map(t => <button key={t} onClick={() => setTab(t)} className={`btn-line ${tab === t ? 'gold' : ''}`}>{t}</button>)}
        </div>
      </div>

      {tab === 'plans' && (
        <>
          <div className="flex justify-end mb-4"><button onClick={() => { setPlanEdit({ ...EMPTY_PLAN }); setPlanOpen(true); }} className="btn-line">new plan</button></div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.id} className="p-6 border border-[var(--gold-line)]">
                <div className="meta-mono mb-2">tier {String(p.order).padStart(2,'0')}</div>
                <div className="display text-[28px]">{p.name}</div>
                <div className="meta-mono mt-1">{p.tagline}</div>
                <div className="display text-[40px] tabular mt-4">${(p.monthly_amount_usd || 0).toLocaleString()}<span className="meta-mono ml-2">/mo</span></div>
                <ul className="mt-4 space-y-1">
                  {(p.features || []).map((f, i) => <li key={i} className="text-[13px] text-[rgba(10,10,10,0.7)]">— {f}</li>)}
                </ul>
                {p.payment_link_url && <div className="meta-mono mt-4 text-[10px] truncate">{p.payment_link_url}</div>}
                <div className="flex gap-3 mt-4"><button onClick={() => { setPlanEdit({ ...p, features: (p.features || []).join('\n') }); setPlanOpen(true); }} className="meta-mono link-underline">edit</button><button onClick={() => deletePlan(p)} className="meta-mono" style={{ color: 'red' }}>delete</button></div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'assignments' && (
        <>
          <div className="flex justify-end mb-4"><button onClick={() => setAssignOpen(true)} className="btn-line">assign retainer</button></div>
          <table className="w-full text-[14px]">
            <thead><tr className="meta-mono" style={{ borderBottom: '1px solid var(--gold-line)' }}><th className="text-left py-3">athlete</th><th className="text-left">plan</th><th className="text-left">status</th><th className="text-left">started</th><th className="text-left">payment link</th><th></th></tr></thead>
            <tbody>
              {retainers.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--gold-line)' }}>
                  <td className="py-3 font-serif italic text-[18px]">{r.athlete?.name}</td>
                  <td>{r.plan?.name} <span className="meta-mono">${(r.plan?.monthly_amount_usd || 0).toLocaleString()}/mo</span></td>
                  <td><select className="text-[13px] bg-transparent" value={r.status} onChange={e => updateRetainer(r, { status: e.target.value })}>{['pending','active','paused','ended'].map(s => <option key={s}>{s}</option>)}</select></td>
                  <td className="meta-mono">{(r.started_at || '').slice(0,10)}</td>
                  <td>{r.plan?.payment_link_url ? <a href={r.plan.payment_link_url} target="_blank" rel="noreferrer" className="meta-mono link-underline">open</a> : <span className="meta-mono">—</span>}</td>
                  <td className="text-right"><button onClick={() => removeRetainer(r)} className="meta-mono" style={{ color: 'red' }}>delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {planOpen && planEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setPlanOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={savePlan} className="w-full max-w-[520px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">{planEdit.id ? 'Edit plan' : 'New plan'}</h2>
            <div className="mb-3"><label className="meta-mono">name</label><input required className="input-line mt-1" value={planEdit.name} onChange={e => setPlanEdit({ ...planEdit, name: e.target.value })} /></div>
            <div className="mb-3"><label className="meta-mono">tagline</label><input className="input-line mt-1" value={planEdit.tagline} onChange={e => setPlanEdit({ ...planEdit, tagline: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="meta-mono">monthly USD</label><input type="number" className="input-line mt-1" value={planEdit.monthly_amount_usd} onChange={e => setPlanEdit({ ...planEdit, monthly_amount_usd: e.target.value })} /></div>
              <div><label className="meta-mono">order</label><input type="number" className="input-line mt-1" value={planEdit.order} onChange={e => setPlanEdit({ ...planEdit, order: e.target.value })} /></div>
            </div>
            <div className="mb-3"><label className="meta-mono">features (one per line)</label><textarea rows={4} className="w-full input-line resize-none" value={typeof planEdit.features === 'string' ? planEdit.features : (planEdit.features || []).join('\n')} onChange={e => setPlanEdit({ ...planEdit, features: e.target.value })} /></div>
            <div className="mb-6"><label className="meta-mono">stripe payment link</label><input className="input-line mt-1" value={planEdit.payment_link_url} onChange={e => setPlanEdit({ ...planEdit, payment_link_url: e.target.value })} placeholder="https://buy.stripe.com/..." /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setPlanOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">save</button></div>
          </form>
        </div>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.6)' }} onClick={() => setAssignOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={createAssign} className="w-full max-w-[480px] p-8" style={{ background: 'var(--ivory)' }}>
            <h2 className="display text-[28px] mb-4">Assign retainer</h2>
            <div className="mb-3"><label className="meta-mono">athlete</label><select required className="input-line mt-1" value={assignForm.athlete_id} onChange={e => setAssignForm({ ...assignForm, athlete_id: e.target.value })}><option value="">— select —</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div className="mb-3"><label className="meta-mono">plan</label><select required className="input-line mt-1" value={assignForm.plan_id} onChange={e => setAssignForm({ ...assignForm, plan_id: e.target.value })}><option value="">— select —</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name} · ${p.monthly_amount_usd}/mo</option>)}</select></div>
            <div className="mb-3"><label className="meta-mono">status</label><select className="input-line mt-1" value={assignForm.status} onChange={e => setAssignForm({ ...assignForm, status: e.target.value })}>{['pending','active','paused','ended'].map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="mb-6"><label className="meta-mono">note</label><input className="input-line mt-1" value={assignForm.note} onChange={e => setAssignForm({ ...assignForm, note: e.target.value })} /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setAssignOpen(false)} className="btn-line">cancel</button><button className="btn-line gold">assign</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
