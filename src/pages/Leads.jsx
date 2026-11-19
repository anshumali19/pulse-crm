import { useState } from 'react';
import { Plus, ArrowRightCircle, Pencil, Trash2, Mail, Phone, Flame } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Button, DataTable, FormModal, Badge, Avatar, StatCard, Modal, Field, Input, useToast } from '../kit/ui';
import { money, timeAgo, uid } from '../kit/format';
import { SOURCES, LEAD_STATUS, STAGE_PROB } from '../seed';
import { byId } from './shared';

const STATUS_TONE = { New: 'blue', Contacted: 'purple', Qualified: 'green', Unqualified: 'gray' };

export function ScoreBadge({ score }) {
  const tone = score >= 75 ? 'bg-rose-50 text-rose-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{score >= 75 && <Flame size={11} />}{score}</span>;
}

export default function Leads() {
  const { db, add, update, remove, setDb } = useDB();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [convert, setConvert] = useState(null);
  const [dealName, setDealName] = useState('');
  const [dealValue, setDealValue] = useState(0);
  const team = byId(db.team);

  const FIELDS = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'company', label: 'Company', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'title', label: 'Job title' },
    { name: 'source', label: 'Source', type: 'select', options: SOURCES },
    { name: 'status', label: 'Status', type: 'select', options: LEAD_STATUS },
    { name: 'score', label: 'Lead score (0-100)', type: 'number', default: 50 },
    { name: 'estValue', label: 'Estimated value ($)', type: 'number' },
    { name: 'ownerId', label: 'Owner', type: 'select', options: db.team.map((t) => ({ value: t.id, label: t.name })) },
  ];

  const doConvert = () => {
    const l = convert;
    const coId = 'co' + uid();
    const ctId = 'ct' + uid();
    const now = new Date().toISOString();
    setDb((d) => {
      const existing = d.companies.find((c) => c.name.toLowerCase() === l.company.toLowerCase());
      const companyId = existing ? existing.id : coId;
      return {
        ...d,
        companies: existing ? d.companies : [{ id: coId, name: l.company, industry: 'SaaS', size: '51-200', website: l.email.split('@')[1], city: '—', ownerId: l.ownerId, annualRevenue: 0, createdAt: now }, ...d.companies],
        contacts: [{ id: ctId, name: l.name, email: l.email, phone: l.phone, title: l.title, companyId, ownerId: l.ownerId, status: 'Prospect', lastContacted: now, createdAt: now }, ...d.contacts],
        deals: [{ id: 'd' + uid(), title: `${l.company} – ${dealName}`, companyId, contactId: ctId, ownerId: l.ownerId, value: Number(dealValue) || 0, stage: 'Qualified', probability: STAGE_PROB.Qualified, source: l.source, closeDate: new Date(Date.now() + 45 * 864e5).toISOString(), closedAt: null, createdAt: now }, ...d.deals],
        leads: d.leads.filter((x) => x.id !== l.id),
      };
    });
    toast(`${l.name} converted — contact, company and deal created`);
    setConvert(null);
  };

  const hot = db.leads.filter((l) => l.score >= 75).length;
  return (
    <>
      <PageHeader title="Leads" subtitle="Score, qualify and convert inbound and outbound leads." actions={<Button icon={Plus} onClick={() => setEdit({ ownerId: db.me, status: 'New' })}>Add lead</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open leads" value={db.leads.length} />
        <StatCard label="Hot leads (75+)" value={hot} tone="red" />
        <StatCard label="Qualified" value={db.leads.filter((l) => l.status === 'Qualified').length} tone="green" />
        <StatCard label="Potential value" value={money(db.leads.reduce((s, l) => s + (l.estValue || 0), 0))} tone="purple" />
      </div>
      <DataTable
        rows={db.leads.map((l) => ({ ...l, owner: team[l.ownerId]?.name }))}
        exportName="leads"
        searchKeys={['name', 'company', 'email', 'source']}
        filter={{ key: 'status', options: LEAD_STATUS }}
        initialSort={{ key: 'score', dir: 'desc' }}
        columns={[
          { key: 'name', label: 'Lead', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.title} · {r.company}</div></div></div> },
          { key: 'score', label: 'Score', render: (r) => <ScoreBadge score={r.score} /> },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
          { key: 'source', label: 'Source' },
          { key: 'estValue', label: 'Est. value', align: 'right', render: (r) => money(r.estValue) },
          { key: 'owner', label: 'Owner', render: (r) => <span className="flex items-center gap-2"><Avatar name={r.owner} size={22} />{r.owner?.split(' ')[0]}</span> },
          { key: 'createdAt', label: 'Created', render: (r) => <span className="text-slate-500">{timeAgo(r.createdAt)}</span>, sortValue: (r) => new Date(r.createdAt).getTime() },
          { key: 'act', label: '', sortable: false, render: (r) => (
            <div className="flex justify-end gap-1">
              <a href={`mailto:${r.email}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Email"><Mail size={14} /></a>
              <a href={`tel:${r.phone}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Call"><Phone size={14} /></a>
              <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEdit(r)} />
              <Button size="xs" variant="ghost" icon={Trash2} onClick={() => { remove('leads', r.id); toast('Lead deleted'); }} />
              <Button size="xs" variant="secondary" icon={ArrowRightCircle} onClick={() => { setConvert(r); setDealName('New business'); setDealValue(r.estValue || 10000); }}>Convert</Button>
            </div>
          ) },
        ]}
      />
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit lead' : 'New lead'} fields={FIELDS} initial={edit}
        onSubmit={(v) => { const { owner, ...c } = v; edit.id ? update('leads', edit.id, c) : add('leads', c); toast('Lead saved'); setEdit(null); }} />
      <Modal open={!!convert} onClose={() => setConvert(null)} title={`Convert ${convert?.name}`} subtitle="Creates a contact, links or creates the company, and opens a deal in the pipeline."
        footer={<><Button variant="secondary" onClick={() => setConvert(null)}>Cancel</Button><Button icon={ArrowRightCircle} onClick={doConvert}>Convert lead</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deal name" className="sm:col-span-2"><Input value={dealName} onChange={(e) => setDealName(e.target.value)} /></Field>
          <Field label="Deal value ($)"><Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} /></Field>
          <Field label="Company"><Input value={convert?.company || ''} disabled /></Field>
        </div>
      </Modal>
    </>
  );
}
