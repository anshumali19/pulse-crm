import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Mail, Phone, Globe, MapPin, Briefcase } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Button, DataTable, FormModal, Drawer, Badge, Avatar, Card, Tabs, useToast } from '../kit/ui';
import { money, compact, timeAgo } from '../kit/format';
import { INDUSTRIES } from '../seed';
import { byId, Timeline, DealDrawer, STAGE_TONE } from './shared';

const CONTACT_STATUS_TONE = { Customer: 'green', Prospect: 'blue', Churned: 'gray' };

export function Contacts() {
  const { db, add, update, remove } = useDB();
  const toast = useToast();
  const [params] = useSearchParams();
  const [edit, setEdit] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [tab, setTab] = useState('activity');
  const [dealId, setDealId] = useState(null);
  const co = byId(db.companies);
  const team = byId(db.team);
  const view = db.contacts.find((c) => c.id === viewId);
  const FIELDS = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'title', label: 'Job title' },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone' },
    { name: 'companyId', label: 'Company', type: 'select', options: db.companies.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'status', label: 'Lifecycle', type: 'select', options: ['Prospect', 'Customer', 'Churned'] },
    { name: 'ownerId', label: 'Owner', type: 'select', options: db.team.map((t) => ({ value: t.id, label: t.name })) },
  ];
  return (
    <>
      <PageHeader title="Contacts" subtitle={`${db.contacts.length} people across ${db.companies.length} companies`} actions={<Button icon={Plus} onClick={() => setEdit({ ownerId: db.me })}>Add contact</Button>} />
      <DataTable
        rows={db.contacts.map((c) => ({ ...c, company: co[c.companyId]?.name, owner: team[c.ownerId]?.name }))}
        initialQuery={params.get('q') || undefined}
        exportName="contacts"
        searchKeys={['name', 'email', 'company', 'title']}
        filter={{ key: 'status', options: ['Customer', 'Prospect', 'Churned'] }}
        onRowClick={(r) => { setViewId(r.id); setTab('activity'); }}
        columns={[
          { key: 'name', label: 'Name', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div> },
          { key: 'title', label: 'Title' },
          { key: 'company', label: 'Company' },
          { key: 'status', label: 'Lifecycle', render: (r) => <Badge tone={CONTACT_STATUS_TONE[r.status]}>{r.status}</Badge> },
          { key: 'owner', label: 'Owner' },
          { key: 'lastContacted', label: 'Last contacted', render: (r) => <span className="text-slate-500">{timeAgo(r.lastContacted)}</span>, sortValue: (r) => new Date(r.lastContacted).getTime() },
        ]}
      />
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit contact' : 'New contact'} fields={FIELDS} initial={edit}
        onSubmit={(v) => { const { company, owner, ...c } = v; edit.id ? update('contacts', edit.id, c) : add('contacts', { ...c, lastContacted: new Date().toISOString() }); toast('Contact saved'); setEdit(null); }} />
      <Drawer open={!!view} onClose={() => setViewId(null)} title="Contact" width="max-w-2xl"
        footer={view && <><Button variant="ghost" icon={Trash2} onClick={() => { if (confirm('Delete contact?')) { remove('contacts', view.id); setViewId(null); toast('Contact deleted'); } }}>Delete</Button><Button icon={Pencil} onClick={() => { setEdit(view); setViewId(null); }}>Edit</Button></>}>
        {view && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={view.name} size={60} />
              <div>
                <div className="text-lg font-semibold">{view.name}</div>
                <div className="text-sm text-slate-500">{view.title} at {co[view.companyId]?.name}</div>
                <Badge tone={CONTACT_STATUS_TONE[view.status]} className="mt-1">{view.status}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${view.email}`}><Button size="sm" variant="secondary" icon={Mail}>{view.email}</Button></a>
              <a href={`tel:${view.phone}`}><Button size="sm" variant="secondary" icon={Phone}>{view.phone}</Button></a>
            </div>
            <Tabs value={tab} onChange={setTab} tabs={[{ value: 'activity', label: 'Activity' }, { value: 'deals', label: 'Deals' }]} />
            {tab === 'activity' ? (
              <Timeline filter={(a) => a.contactId === view.id} defaults={{ contactId: view.id, dealId: db.deals.find((d) => d.contactId === view.id)?.id }} />
            ) : (
              <ul className="space-y-2">
                {db.deals.filter((d) => d.contactId === view.id || d.companyId === view.companyId).map((d) => (
                  <li key={d.id}><button onClick={() => setDealId(d.id)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-300 cursor-pointer"><span className="font-medium">{d.title}</span><span className="flex items-center gap-2"><Badge tone={STAGE_TONE[d.stage]}>{d.stage}</Badge>{money(d.value)}</span></button></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Drawer>
      {dealId && <DealDrawer dealId={dealId} onClose={() => setDealId(null)} />}
    </>
  );
}

export function Companies() {
  const { db, add, update, remove } = useDB();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [dealId, setDealId] = useState(null);
  const team = byId(db.team);
  const view = db.companies.find((c) => c.id === viewId);
  const FIELDS = [
    { name: 'name', label: 'Company name', required: true },
    { name: 'website', label: 'Website' },
    { name: 'industry', label: 'Industry', type: 'select', options: INDUSTRIES },
    { name: 'size', label: 'Employees', type: 'select', options: ['1-50', '51-200', '201-1000', '1000+'] },
    { name: 'city', label: 'City' },
    { name: 'annualRevenue', label: 'Annual revenue ($)', type: 'number' },
    { name: 'ownerId', label: 'Account owner', type: 'select', options: db.team.map((t) => ({ value: t.id, label: t.name })) },
  ];
  const rows = db.companies.map((c) => {
    const deals = db.deals.filter((d) => d.companyId === c.id);
    return { ...c, owner: team[c.ownerId]?.name, contacts: db.contacts.filter((x) => x.companyId === c.id).length, open: deals.filter((d) => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0), won: deals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.value, 0) };
  });
  return (
    <>
      <PageHeader title="Companies" subtitle="Accounts with their contacts, deals and revenue." actions={<Button icon={Plus} onClick={() => setEdit({ ownerId: db.me })}>Add company</Button>} />
      <DataTable rows={rows} exportName="companies" searchKeys={['name', 'industry', 'city', 'owner']} filter={{ key: 'industry', options: INDUSTRIES }} onRowClick={(r) => setViewId(r.id)}
        columns={[
          { key: 'name', label: 'Company', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.website}</div></div></div> },
          { key: 'industry', label: 'Industry', render: (r) => <Badge>{r.industry}</Badge> },
          { key: 'size', label: 'Size' },
          { key: 'contacts', label: 'Contacts', align: 'right' },
          { key: 'open', label: 'Open pipeline', align: 'right', render: (r) => money(r.open) },
          { key: 'won', label: 'Won revenue', align: 'right', render: (r) => <span className="font-medium text-emerald-700">{money(r.won)}</span> },
          { key: 'owner', label: 'Owner' },
        ]} />
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit company' : 'New company'} fields={FIELDS} initial={edit}
        onSubmit={(v) => { const { owner, contacts, open, won, ...c } = v; edit.id ? update('companies', edit.id, c) : add('companies', c); toast('Company saved'); setEdit(null); }} />
      <Drawer open={!!view} onClose={() => setViewId(null)} title="Company" width="max-w-2xl"
        footer={view && <><Button variant="ghost" icon={Trash2} onClick={() => { if (confirm('Delete company?')) { remove('companies', view.id); setViewId(null); toast('Company deleted'); } }}>Delete</Button><Button icon={Pencil} onClick={() => { setEdit(view); setViewId(null); }}>Edit</Button></>}>
        {view && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={view.name} size={60} />
              <div>
                <div className="text-lg font-semibold">{view.name}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Globe size={12} />{view.website}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{view.city}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} />{view.industry} · {view.size}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="p-3"><div className="font-semibold">${compact(view.annualRevenue)}</div><div className="text-xs text-slate-500">Annual revenue</div></Card>
              <Card className="p-3"><div className="font-semibold">{db.contacts.filter((c) => c.companyId === view.id).length}</div><div className="text-xs text-slate-500">Contacts</div></Card>
              <Card className="p-3"><div className="font-semibold">{db.deals.filter((d) => d.companyId === view.id).length}</div><div className="text-xs text-slate-500">Deals</div></Card>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">People</h4>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {db.contacts.filter((c) => c.companyId === view.id).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2"><Avatar name={c.name} size={28} /><div className="flex-1"><div className="text-sm font-medium">{c.name}</div><div className="text-xs text-slate-500">{c.title}</div></div><a href={`mailto:${c.email}`} className="text-slate-400 hover:text-brand-600"><Mail size={15} /></a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Deals</h4>
              <ul className="space-y-2">
                {db.deals.filter((d) => d.companyId === view.id).map((d) => (
                  <li key={d.id}><button onClick={() => setDealId(d.id)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-300 cursor-pointer"><span className="font-medium">{d.title.split(' – ')[1] || d.title}</span><span className="flex items-center gap-2"><Badge tone={STAGE_TONE[d.stage]}>{d.stage}</Badge>{money(d.value)}</span></button></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>
      {dealId && <DealDrawer dealId={dealId} onClose={() => setDealId(null)} />}
    </>
  );
}
