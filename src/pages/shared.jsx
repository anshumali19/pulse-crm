import { useState } from 'react';
import { Phone, Mail, Users, CheckSquare, StickyNote, Trophy, XCircle, Pencil, Trash2, Calendar, Building2, User } from 'lucide-react';
import { useDB } from '../kit/db';
import { Button, Badge, Drawer, Select, Input, Textarea, FormModal, Avatar, Card, cx, useToast } from '../kit/ui';
import { money, date, dateTime, timeAgo, isoDay } from '../kit/format';
import { STAGES, STAGE_PROB, SOURCES, ACTIVITY_TYPES } from '../seed';

export const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
export const STAGE_TONE = { 'Lead In': 'gray', Qualified: 'blue', Proposal: 'purple', Negotiation: 'orange', Won: 'green', Lost: 'red' };
export const STAGE_COLOR = { 'Lead In': '#94a3b8', Qualified: '#0ea5e9', Proposal: '#8b5cf6', Negotiation: '#f97316', Won: '#22c55e', Lost: '#f43f5e' };
export const ACT_ICON = { Call: Phone, Email: Mail, Meeting: Users, Task: CheckSquare, Note: StickyNote };
export const ACT_TONE = { Call: 'bg-sky-50 text-sky-600', Email: 'bg-violet-50 text-violet-600', Meeting: 'bg-amber-50 text-amber-600', Task: 'bg-emerald-50 text-emerald-600', Note: 'bg-slate-100 text-slate-600' };

export function dealFields(db) {
  return [
    { name: 'title', label: 'Deal name', required: true, span: 2 },
    { name: 'companyId', label: 'Company', type: 'select', options: db.companies.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'contactId', label: 'Primary contact', type: 'select', options: db.contacts.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'value', label: 'Value ($)', type: 'number', required: true },
    { name: 'stage', label: 'Stage', type: 'select', options: STAGES },
    { name: 'closeDate', label: 'Expected close', type: 'date', required: true },
    { name: 'ownerId', label: 'Owner', type: 'select', options: db.team.map((t) => ({ value: t.id, label: t.name })) },
    { name: 'source', label: 'Source', type: 'select', options: SOURCES },
  ];
}

/** Activity timeline + quick logger used on deals and contacts. */
export function Timeline({ filter, defaults }) {
  const { db, add, update } = useDB();
  const toast = useToast();
  const team = byId(db.team);
  const [type, setType] = useState('Call');
  const [subject, setSubject] = useState('');
  const [due, setDue] = useState(isoDay(new Date()));
  const items = db.activities.filter(filter).sort((a, b) => new Date(b.due) - new Date(a.due));
  const log = (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    const isFuture = new Date(due + 'T23:59') > new Date() && isoDay(new Date()) !== due;
    add('activities', { type, subject, due: new Date(due + 'T12:00').toISOString(), done: !isFuture && type !== 'Task', ownerId: db.me, notes: '', ...defaults });
    setSubject('');
    toast(`${type} logged`);
  };
  return (
    <div>
      <form onSubmit={log} className="mb-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-2 flex gap-1">
          {ACTIVITY_TYPES.map((t) => {
            const I = ACT_ICON[t];
            return (
              <button type="button" key={t} onClick={() => setType(t)} className={cx('flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium cursor-pointer', type === t ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800')}>
                <I size={13} /> {t}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={type === 'Note' ? 'Write a note…' : `${type} subject…`} />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-40" />
          <Button type="submit">Log</Button>
        </div>
      </form>
      <ol className="relative space-y-4 border-l border-slate-200 pl-6">
        {items.map((a) => {
          const I = ACT_ICON[a.type];
          const overdue = !a.done && new Date(a.due) < new Date(Date.now() - 864e5);
          return (
            <li key={a.id} className="relative">
              <span className={cx('absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white', ACT_TONE[a.type])}><I size={13} /></span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={cx('text-sm font-medium', a.done && a.type === 'Task' ? 'text-slate-400 line-through' : 'text-slate-800')}>{a.subject}</div>
                  <div className="text-xs text-slate-500">{a.type} · {team[a.ownerId]?.name} · {date(a.due)}</div>
                </div>
                {!a.done ? (
                  <button onClick={() => { update('activities', a.id, { done: true }); toast('Marked complete'); }} className={cx('shrink-0 rounded-md px-2 py-0.5 text-xs font-medium cursor-pointer', overdue ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>
                    {overdue ? 'Overdue · complete' : 'Upcoming · complete'}
                  </button>
                ) : <Badge tone="green">Done</Badge>}
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-slate-500">No activity yet — log the first touchpoint above.</li>}
      </ol>
    </div>
  );
}

export function DealDrawer({ dealId, onClose }) {
  const { db, update, remove } = useDB();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const deal = db.deals.find((d) => d.id === dealId);
  const co = byId(db.companies);
  const ct = byId(db.contacts);
  const team = byId(db.team);
  if (!deal) return null;
  const setStage = (stage) => {
    update('deals', deal.id, { stage, probability: STAGE_PROB[stage], closedAt: ['Won', 'Lost'].includes(stage) ? new Date().toISOString() : null });
    toast(stage === 'Won' ? '🎉 Deal won!' : `Moved to ${stage}`);
  };
  return (
    <>
      <Drawer open={!!deal && !edit} onClose={onClose} title="Deal" width="max-w-2xl"
        footer={<>
          <Button variant="ghost" icon={Trash2} onClick={() => { if (confirm('Delete this deal?')) { remove('deals', deal.id); onClose(); toast('Deal deleted'); } }}>Delete</Button>
          <Button variant="secondary" icon={Pencil} onClick={() => setEdit(true)}>Edit</Button>
          {!['Won', 'Lost'].includes(deal.stage) && <><Button variant="danger" icon={XCircle} onClick={() => setStage('Lost')}>Lost</Button><Button variant="success" icon={Trophy} onClick={() => setStage('Won')}>Won</Button></>}
        </>}>
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2"><Badge tone={STAGE_TONE[deal.stage]} dot>{deal.stage}</Badge><span className="text-xs text-slate-500">{deal.probability}% probability</span></div>
            <h3 className="mt-2 text-xl font-semibold">{deal.title}</h3>
            <div className="mt-1 text-3xl font-semibold text-brand-700">{money(deal.value)}</div>
          </div>
          <div className="flex overflow-x-auto rounded-lg bg-slate-100 p-1">
            {STAGES.slice(0, 4).map((s) => (
              <button key={s} onClick={() => setStage(s)} className={cx('flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer', deal.stage === s ? 'bg-brand-600 text-white shadow' : STAGES.indexOf(s) < STAGES.indexOf(deal.stage) && deal.stage !== 'Lost' ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800')}>{s}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="flex items-center gap-3 p-3"><Building2 size={18} className="text-slate-400" /><div><div className="text-xs text-slate-500">Company</div><div className="text-sm font-medium">{co[deal.companyId]?.name || '—'}</div></div></Card>
            <Card className="flex items-center gap-3 p-3"><User size={18} className="text-slate-400" /><div><div className="text-xs text-slate-500">Contact</div><div className="text-sm font-medium">{ct[deal.contactId]?.name || '—'}</div></div></Card>
            <Card className="flex items-center gap-3 p-3"><Calendar size={18} className="text-slate-400" /><div><div className="text-xs text-slate-500">{deal.closedAt ? 'Closed' : 'Expected close'}</div><div className="text-sm font-medium">{date(deal.closedAt || deal.closeDate)}</div></div></Card>
            <Card className="flex items-center gap-3 p-3"><Avatar name={team[deal.ownerId]?.name} size={28} /><div><div className="text-xs text-slate-500">Owner</div><div className="text-sm font-medium">{team[deal.ownerId]?.name}</div></div></Card>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</h4>
            <Timeline filter={(a) => a.dealId === deal.id} defaults={{ dealId: deal.id, contactId: deal.contactId }} />
          </div>
          <p className="text-xs text-slate-400">Created {timeAgo(deal.createdAt)} · source: {deal.source}</p>
        </div>
      </Drawer>
      <FormModal open={edit} onClose={() => setEdit(false)} title="Edit deal" fields={dealFields(db)} initial={deal}
        onSubmit={(v) => { update('deals', deal.id, { ...v, probability: STAGE_PROB[v.stage] }); setEdit(false); toast('Deal updated'); }} />
    </>
  );
}

export { dateTime };
