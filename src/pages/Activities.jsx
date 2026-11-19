import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Button, Card, FormModal, Avatar, Badge, Tabs, EmptyState, cx, useToast } from '../kit/ui';
import { date } from '../kit/format';
import { ACTIVITY_TYPES } from '../seed';
import { byId, ACT_ICON, ACT_TONE, DealDrawer } from './shared';

export default function Activities() {
  const { db, add, update, remove } = useDB();
  const toast = useToast();
  const [tab, setTab] = useState('open');
  const [mine, setMine] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dealId, setDealId] = useState(null);
  const team = byId(db.team);
  const deals = byId(db.deals);
  const contacts = byId(db.contacts);

  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const endWeek = new Date(endToday.getTime() + 7 * 864e5);
  let list = db.activities.filter((a) => !mine || a.ownerId === db.me);
  const open = list.filter((a) => !a.done);
  const groups = tab === 'done'
    ? [{ title: 'Completed', items: list.filter((a) => a.done).sort((a, b) => new Date(b.due) - new Date(a.due)).slice(0, 40) }]
    : [
        { title: 'Overdue', tone: 'text-rose-600', items: open.filter((a) => new Date(a.due) < startToday) },
        { title: 'Today', tone: 'text-brand-700', items: open.filter((a) => new Date(a.due) >= startToday && new Date(a.due) <= endToday) },
        { title: 'Next 7 days', items: open.filter((a) => new Date(a.due) > endToday && new Date(a.due) <= endWeek) },
        { title: 'Later', items: open.filter((a) => new Date(a.due) > endWeek) },
      ].map((g) => ({ ...g, items: g.items.sort((a, b) => new Date(a.due) - new Date(b.due)) }));

  return (
    <>
      <PageHeader title="Tasks & activities" subtitle="Every call, email, meeting and to-do in one queue." actions={<>
        <Button variant={mine ? 'primary' : 'secondary'} onClick={() => setMine((m) => !m)}>{mine ? 'My tasks' : 'All team'}</Button>
        <Button icon={Plus} onClick={() => setCreating(true)}>New activity</Button>
      </>} />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ value: 'open', label: `Open (${open.length})` }, { value: 'done', label: 'Completed' }]} />
      <div className="space-y-6">
        {groups.map((g) => g.items.length > 0 && (
          <div key={g.title}>
            <h3 className={cx('mb-2 text-xs font-semibold uppercase tracking-wide', g.tone || 'text-slate-500')}>{g.title} · {g.items.length}</h3>
            <Card className="divide-y divide-slate-100">
              {g.items.map((a) => {
                const I = ACT_ICON[a.type];
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <input type="checkbox" checked={a.done} onChange={() => { update('activities', a.id, { done: !a.done }); toast(a.done ? 'Reopened' : 'Completed ✓'); }} className="h-4 w-4 cursor-pointer accent-brand-600" />
                    <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', ACT_TONE[a.type])}><I size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className={cx('truncate text-sm font-medium', a.done && 'text-slate-400 line-through')}>{a.subject}</div>
                      <div className="truncate text-xs text-slate-500">
                        {contacts[a.contactId]?.name}{deals[a.dealId] && <> · <button className="text-brand-600 hover:underline cursor-pointer" onClick={() => setDealId(a.dealId)}>{deals[a.dealId].title}</button></>}
                      </div>
                    </div>
                    <Badge>{a.type}</Badge>
                    <span className={cx('hidden w-24 text-right text-xs sm:block', !a.done && new Date(a.due) < startToday ? 'font-medium text-rose-600' : 'text-slate-500')}>{date(a.due)}</span>
                    <Avatar name={team[a.ownerId]?.name} size={26} />
                    <button onClick={() => { remove('activities', a.id); toast('Activity deleted'); }} className="text-slate-300 hover:text-rose-500 cursor-pointer" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
        {groups.every((g) => g.items.length === 0) && <Card><EmptyState title="All clear" text="No activities here. Enjoy the calm!" /></Card>}
      </div>
      <FormModal open={creating} onClose={() => setCreating(false)} title="New activity"
        fields={[
          { name: 'type', label: 'Type', type: 'select', options: ACTIVITY_TYPES },
          { name: 'due', label: 'Due date', type: 'date', required: true },
          { name: 'subject', label: 'Subject', required: true, span: 2 },
          { name: 'dealId', label: 'Related deal', type: 'select', options: [{ value: '', label: '— none —' }, ...db.deals.filter((d) => !['Won', 'Lost'].includes(d.stage)).map((d) => ({ value: d.id, label: d.title }))], span: 2 },
          { name: 'ownerId', label: 'Assigned to', type: 'select', options: db.team.map((t) => ({ value: t.id, label: t.name })) },
        ]}
        initial={{ ownerId: db.me, due: new Date().toISOString() }}
        onSubmit={(v) => { add('activities', { ...v, contactId: deals[v.dealId]?.contactId, done: false }); setCreating(false); toast('Activity scheduled'); }} />
      {dealId && <DealDrawer dealId={dealId} onClose={() => setDealId(null)} />}
    </>
  );
}
