import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Button, FormModal, Avatar, Badge, DataTable, Select, cx, useToast } from '../kit/ui';
import { money, compact, date } from '../kit/format';
import { STAGES, STAGE_PROB } from '../seed';
import { byId, dealFields, DealDrawer, STAGE_COLOR, STAGE_TONE } from './shared';

export default function Pipeline() {
  const { db, add, update } = useDB();
  const toast = useToast();
  const [view, setView] = useState('board');
  const [owner, setOwner] = useState('all');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const co = byId(db.companies);
  const team = byId(db.team);

  const deals = db.deals.filter((d) => owner === 'all' || d.ownerId === owner);
  const recentClosed = (d) => !['Won', 'Lost'].includes(d.stage) || Date.now() - new Date(d.closedAt || d.createdAt) < 30 * 864e5;
  const open = deals.filter((d) => !['Won', 'Lost'].includes(d.stage));
  const weighted = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0);

  const drop = (stage) => {
    if (!drag) return;
    const d = db.deals.find((x) => x.id === drag);
    if (d && d.stage !== stage) {
      update('deals', drag, { stage, probability: STAGE_PROB[stage], closedAt: ['Won', 'Lost'].includes(stage) ? new Date().toISOString() : null });
      toast(stage === 'Won' ? `🎉 ${d.title} won — ${money(d.value)}` : `Moved to ${stage}`);
    }
    setDrag(null);
    setOver(null);
  };

  return (
    <>
      <PageHeader
        title="Deals pipeline"
        subtitle={`${open.length} open deals · ${money(open.reduce((s, d) => s + d.value, 0))} total · ${money(weighted)} weighted`}
        actions={<>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-44" options={[{ value: 'all', label: 'All owners' }, ...db.team.map((t) => ({ value: t.id, label: t.name }))]} />
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button onClick={() => setView('board')} className={cx('rounded-md p-1.5 cursor-pointer', view === 'board' ? 'bg-slate-100 text-slate-900' : 'text-slate-400')} aria-label="Board view"><LayoutGrid size={16} /></button>
            <button onClick={() => setView('list')} className={cx('rounded-md p-1.5 cursor-pointer', view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400')} aria-label="List view"><List size={16} /></button>
          </div>
          <Button icon={Plus} onClick={() => setCreating(true)}>New deal</Button>
        </>}
      />

      {view === 'board' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          <p className="mb-3 text-xs text-slate-500">Tip: drag cards between columns to update the stage. Won/Lost show the last 30 days.</p>
          <div className="flex min-w-max gap-4">
            {STAGES.map((stage) => {
              const items = deals.filter((d) => d.stage === stage && recentClosed(d)).sort((a, b) => b.value - a.value);
              return (
                <div
                  key={stage}
                  onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
                  onDragLeave={() => setOver((o) => (o === stage ? null : o))}
                  onDrop={() => drop(stage)}
                  className={cx('flex w-72 flex-col rounded-xl bg-slate-100/80 transition', over === stage && 'ring-2 ring-brand-500 bg-brand-50')}
                >
                  <div className="flex items-center justify-between px-3 pt-3">
                    <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[stage] }} /><span className="text-sm font-semibold">{stage}</span><span className="rounded-full bg-white px-2 text-xs text-slate-500">{items.length}</span></div>
                    <span className="text-xs font-medium text-slate-500">${compact(items.reduce((s, d) => s + d.value, 0))}</span>
                  </div>
                  <div className="flex max-h-[calc(100vh-260px)] min-h-[200px] flex-col gap-2 overflow-y-auto p-3">
                    {items.map((d) => (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={() => setDrag(d.id)}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onClick={() => setOpenId(d.id)}
                        className={cx('cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:shadow-md active:cursor-grabbing', drag === d.id && 'opacity-40')}
                      >
                        <div className="text-sm font-medium leading-snug text-slate-900">{d.title.split(' – ')[1] || d.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{co[d.companyId]?.name}</div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold">{money(d.value)}</span>
                          <div className="flex items-center gap-2">
                            <span className={cx('text-[11px]', !['Won', 'Lost'].includes(d.stage) && new Date(d.closeDate) < new Date() ? 'font-medium text-rose-600' : 'text-slate-400')}>{date(d.closedAt || d.closeDate).replace(/, \d{4}/, '')}</span>
                            <Avatar name={team[d.ownerId]?.name} size={22} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">Drop deals here</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DataTable
          rows={deals.map((d) => ({ ...d, company: co[d.companyId]?.name, owner: team[d.ownerId]?.name }))}
          exportName="deals"
          searchKeys={['title', 'company', 'owner']}
          filter={{ key: 'stage', options: STAGES }}
          onRowClick={(r) => setOpenId(r.id)}
          initialSort={{ key: 'value', dir: 'desc' }}
          columns={[
            { key: 'title', label: 'Deal', render: (r) => <span className="font-medium text-slate-900">{r.title}</span> },
            { key: 'stage', label: 'Stage', render: (r) => <Badge tone={STAGE_TONE[r.stage]} dot>{r.stage}</Badge> },
            { key: 'owner', label: 'Owner', render: (r) => <span className="flex items-center gap-2"><Avatar name={r.owner} size={22} />{r.owner}</span> },
            { key: 'closeDate', label: 'Close date', render: (r) => date(r.closedAt || r.closeDate), sortValue: (r) => new Date(r.closeDate).getTime(), csv: (r) => date(r.closeDate) },
            { key: 'probability', label: 'Prob.', align: 'right', render: (r) => `${r.probability}%` },
            { key: 'value', label: 'Value', align: 'right', render: (r) => <span className="font-semibold">{money(r.value)}</span> },
          ]}
        />
      )}

      <FormModal open={creating} onClose={() => setCreating(false)} title="New deal" fields={dealFields(db)} initial={{ stage: 'Lead In', ownerId: db.me, closeDate: new Date(Date.now() + 30 * 864e5).toISOString() }}
        onSubmit={(v) => { add('deals', { ...v, probability: STAGE_PROB[v.stage], closedAt: null }); setCreating(false); toast('Deal created'); }} />
      {openId && <DealDrawer dealId={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
