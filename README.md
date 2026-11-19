# Pulse CRM

A sales CRM demo with leads, contacts, companies, a drag-and-drop pipeline, tasks and forecasting.

**Live demo:** https://pulse-crm-murex-seven.vercel.app

> Demo data is generated in the browser and saved to `localStorage`, so every visitor gets their own sandbox. Create, edit and delete freely — use **Reset demo data** to start over.

## Features

- Drag-and-drop Kanban deal pipeline (Lead In → Qualified → Proposal → Negotiation → Won/Lost) plus list view
- Lead scoring and one-click conversion into contact + company + deal
- Contacts and companies with activity timelines, linked deals and quick call/email actions
- Log calls, emails, meetings, tasks and notes; overdue / today / upcoming task queue
- Dashboard: pipeline by stage, revenue won, win rate, lead sources, rep leaderboard vs. quota
- Reports: weighted revenue forecast, conversion funnel, team performance, won vs lost by source
- Team management with quotas and pipeline settings

## Tech stack

- React 18 + Vite
- Tailwind CSS v4
- React Router
- Recharts (charts) & Lucide (icons)
- Deployed on Vercel

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build` (outputs to `dist/`).

## Making it production-ready

This demo runs entirely in the browser. For a client project, the same UI connects to a real backend (e.g. Supabase / PostgreSQL + REST or tRPC API), with authentication, role-based permissions and server-side validation.
