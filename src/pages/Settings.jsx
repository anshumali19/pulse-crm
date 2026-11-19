import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Card, CardHeader, Button, Avatar, Badge, FormModal, Toggle, useToast } from '../kit/ui';
import { money } from '../kit/format';
import { STAGES, STAGE_PROB } from '../seed';
import { STAGE_COLOR } from './shared';

export default function Settings() {
  const { db, add, update } = useDB();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [prefs, setPrefs] = useState({ digest: true, assign: true, roundRobin: false });
  return (
    <>
      <PageHeader title="Team & settings" subtitle="Users, quotas, pipeline stages and automation." actions={<Button icon={Plus} onClick={() => setEdit({ quota: 300000 })}>Invite member</Button>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Team members" subtitle={`${db.team.length} seats`} />
          <ul className="divide-y divide-slate-100">
            {db.team.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3">
                <Avatar name={t.name} size={36} />
                <div className="flex-1"><div className="text-sm font-medium">{t.name} {t.id === db.me && <Badge tone="brand">You</Badge>}</div><div className="text-xs text-slate-500">{t.email}</div></div>
                <Badge>{t.role}</Badge>
                <div className="hidden w-32 text-right text-sm sm:block"><div className="text-xs text-slate-500">Annual quota</div>{money(t.quota)}</div>
                <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEdit(t)} />
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Pipeline stages" subtitle="Default win probability" />
            <ul className="space-y-2 p-5">
              {STAGES.map((s) => <li key={s} className="flex items-center gap-3 text-sm"><span className="h-3 w-3 rounded" style={{ background: STAGE_COLOR[s] }} /><span className="flex-1">{s}</span><span className="text-slate-500">{STAGE_PROB[s]}%</span></li>)}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Automation" />
            <div className="space-y-4 p-5">
              <Toggle checked={prefs.digest} onChange={(v) => setPrefs({ ...prefs, digest: v })} label="Daily task digest email" />
              <Toggle checked={prefs.assign} onChange={(v) => setPrefs({ ...prefs, assign: v })} label="Create follow-up task on new deal" />
              <Toggle checked={prefs.roundRobin} onChange={(v) => setPrefs({ ...prefs, roundRobin: v })} label="Round-robin lead assignment" />
            </div>
          </Card>
        </div>
      </div>
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit member' : 'Invite team member'}
        fields={[
          { name: 'name', label: 'Full name', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'role', label: 'Role', type: 'select', options: ['Account Executive', 'SDR', 'Sales Manager', 'Sales Director'] },
          { name: 'quota', label: 'Annual quota ($)', type: 'number' },
        ]}
        initial={edit}
        onSubmit={(v) => { edit.id ? update('team', edit.id, v) : add('team', v); toast(edit.id ? 'Member updated' : `Invitation sent to ${v.email}`); setEdit(null); }} />
    </>
  );
}
