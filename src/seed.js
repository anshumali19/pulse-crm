import { rng, pick, int, fullName, emailOf, phone, daysAgo, daysFromNow, COMPANIES, CITIES, uid } from './kit/format';

export const STAGES = ['Lead In', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
export const OPEN_STAGES = ['Lead In', 'Qualified', 'Proposal', 'Negotiation'];
export const STAGE_PROB = { 'Lead In': 10, Qualified: 25, Proposal: 50, Negotiation: 75, Won: 100, Lost: 0 };
export const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold outreach', 'Event', 'Google Ads'];
export const LEAD_STATUS = ['New', 'Contacted', 'Qualified', 'Unqualified'];
export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task', 'Note'];
export const INDUSTRIES = ['SaaS', 'Manufacturing', 'Healthcare', 'Retail', 'Finance', 'Logistics', 'Education'];

const DEAL_NAMES = ['Annual subscription', 'Platform upgrade', 'Enterprise rollout', 'Pilot program', 'Multi-year renewal', 'Analytics add-on', 'Onboarding package', 'Team expansion', 'API access tier', 'Support contract'];
const SUBJECTS = {
  Call: ['Discovery call', 'Follow-up call', 'Pricing discussion', 'Check-in call'],
  Email: ['Sent proposal', 'Shared case study', 'Follow-up email', 'Sent contract'],
  Meeting: ['Product demo', 'Stakeholder meeting', 'Quarterly review', 'Technical deep-dive'],
  Task: ['Prepare quote', 'Update proposal', 'Send onboarding docs', 'Research account'],
  Note: ['Budget approved for Q1', 'Decision maker is the CFO', 'Competitor evaluated', 'Needs SSO integration'],
};

export function seed() {
  const r = rng(23);
  const team = [
    { id: 'u1', name: 'Sarah Chen', role: 'Sales Director', email: 'sarah@pulse.example', quota: 600000 },
    { id: 'u2', name: 'Marcus Reid', role: 'Account Executive', email: 'marcus@pulse.example', quota: 400000 },
    { id: 'u3', name: 'Aisha Khan', role: 'Account Executive', email: 'aisha@pulse.example', quota: 400000 },
    { id: 'u4', name: 'Diego Alvarez', role: 'Account Executive', email: 'diego@pulse.example', quota: 350000 },
    { id: 'u5', name: 'Emily Park', role: 'SDR', email: 'emily@pulse.example', quota: 150000 },
  ];

  const companies = COMPANIES.slice(0, 22).map((name, i) => ({
    id: `co${i}`, name, industry: pick(r, INDUSTRIES), size: pick(r, ['1-50', '51-200', '201-1000', '1000+']),
    website: `${name.toLowerCase().replace(/[^a-z]/g, '')}.com`, city: pick(r, CITIES), ownerId: pick(r, team).id,
    annualRevenue: int(r, 2, 400) * 1e6, createdAt: daysAgo(int(r, 60, 600)),
  }));

  const contacts = [];
  companies.forEach((c) => {
    for (let k = 0; k < int(r, 1, 3); k++) {
      const name = fullName(r);
      contacts.push({
        id: `ct${contacts.length}`, name, email: emailOf(name, c.website), phone: phone(r),
        title: pick(r, ['CEO', 'CTO', 'VP Sales', 'Head of Operations', 'Procurement Manager', 'CFO', 'Product Manager', 'IT Director']),
        companyId: c.id, ownerId: c.ownerId, status: pick(r, ['Customer', 'Prospect', 'Prospect', 'Customer', 'Churned']),
        lastContacted: daysAgo(int(r, 0, 40)), createdAt: daysAgo(int(r, 30, 500)),
      });
    }
  });

  const deals = Array.from({ length: 64 }, (_, i) => {
    const co = pick(r, companies);
    const ct = contacts.find((c) => c.companyId === co.id);
    const age = int(r, 0, 330);
    const stage = age > 60 ? (r() < 0.58 ? 'Won' : 'Lost') : pick(r, ['Lead In', 'Lead In', 'Qualified', 'Qualified', 'Proposal', 'Proposal', 'Negotiation', 'Won']);
    const closed = stage === 'Won' || stage === 'Lost';
    return {
      id: `d${i}`, title: `${co.name} – ${pick(r, DEAL_NAMES)}`, companyId: co.id, contactId: ct?.id, ownerId: co.ownerId,
      value: int(r, 8, 140) * 1000, stage, probability: STAGE_PROB[stage], source: pick(r, SOURCES),
      closeDate: closed ? daysAgo(Math.max(0, age - int(r, 10, 45))) : daysFromNow(int(r, 5, 75)),
      closedAt: closed ? daysAgo(Math.max(0, age - int(r, 10, 45))) : null, createdAt: daysAgo(age),
    };
  });

  const leads = Array.from({ length: 38 }, (_, i) => {
    const name = fullName(r);
    const company = pick(r, ['Northstar Labs', 'Brightwave', 'Quantum Retail', 'Helix Health', 'Orbit Freight', 'Cobalt Systems', 'Evergreen Edu', 'Silverline Bank', 'Atlas Robotics', 'Lumen Analytics', 'Redwood Foods', 'Nimbus Cloud']);
    return {
      id: `l${i}`, name, company, email: emailOf(name, company.toLowerCase().replace(/[^a-z]/g, '') + '.io'), phone: phone(r),
      title: pick(r, ['Founder', 'Head of Sales', 'Operations Lead', 'CTO', 'Marketing Director']),
      source: pick(r, SOURCES), status: pick(r, LEAD_STATUS), score: int(r, 12, 98), ownerId: pick(r, team).id,
      estValue: int(r, 5, 80) * 1000, createdAt: daysAgo(int(r, 0, 45)),
    };
  });

  const activities = [];
  for (let i = 0; i < 120; i++) {
    const type = pick(r, ACTIVITY_TYPES);
    const deal = pick(r, deals);
    const offset = int(r, -30, 14);
    const done = offset < 0 ? r() < 0.88 : false;
    activities.push({
      id: uid(), type, subject: pick(r, SUBJECTS[type]), dealId: deal.id, contactId: deal.contactId, ownerId: deal.ownerId,
      due: offset < 0 ? daysAgo(-offset) : daysFromNow(offset), done, notes: '', createdAt: daysAgo(Math.max(0, -offset + 1)),
    });
  }

  return { team, companies, contacts, deals, leads, activities, me: 'u1' };
}
