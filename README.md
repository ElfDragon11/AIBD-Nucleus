# Nucleus Concierge

**Live app:** [https://nucleus.aibd.calvinblood.com](https://nucleus.aibd.calvinblood.com)

Nucleus Concierge is an AI-assisted front door for [The Nucleus Institute](https://www.nucleusutah.org/)—Utah’s network connecting universities, industry, founders, and policymakers. This codebase implements a **concierge intake flow** and a **staff review dashboard** so incoming people and opportunities can be understood, matched, and curated faster than static forms and ad hoc weekly triage alone.

---

## What we built (and what we did not)

We are **not** replacing Nucleus’s full CRM. We are a **focused workflow layer**: better information at intake, structured profiles in the background, ranked suggestions with clear rationale, and tools for staff to approve, adjust, and act (including introduction drafts and email flows where configured).

The product goal is a **high-touch concierge** feel: natural follow-up questions, early value as soon as there is enough signal, and **humans staying in the loop** for trust and judgment.

---

## How it works

### Public experience

1. **Landing** — Branded entry aligned with the main Nucleus site (typography, color, layout language).
2. **Intake** — A conversational-style flow captures intent and details. Answers are sent to Supabase Edge Functions that:
   - **Classify** the lead and infer structured profile fields.
   - **Guide** the next question (LLM + guardrails and fallbacks).
3. **Recommendations** — When ready, the app surfaces **people and opportunities** that fit the lead, with short explanations framed as curated introductions—not a raw algorithm dump.

### Admin experience

Staff use a protected **admin shell** to:

- Browse **leads**, **people**, **opportunities**, and **matches**
- Inspect how the system classified a lead and what it recommended
- Run **CSV import** with column mapping and validation (Edge-assisted)
- Manage **introduction requests** and related settings where enabled

Authentication is **Supabase Auth** with role-gated access for admin routes.

### Backend and “intelligence”

- **Supabase (Postgres)** holds leads, profiles, network entities, embeddings, and match records.
- **Supabase Edge Functions** (Deno) orchestrate OpenAI calls for classification, Q&A, column mapping, CSV processing, match explanation, and related tasks.
- **Embeddings + scoring rules** support semantic retrieval and ranked matches; the LLM adds narrative context and pairing language where appropriate.
- Optional **email delivery** (e.g. Resend) is configured via Supabase secrets, not in the Vite frontend.

---

## Concepts behind the build

1. **Concierge, not chatbot theater** — The UX is goal-directed: collect signal, reflect it back usefully, and move people toward real connections inside Utah’s innovation ecosystem.
2. **Human trust layer** — Automation speeds intake and drafting; **decisions and introductions stay with Nucleus staff**.
3. **Brand-native UI** — The app should feel like a natural extension of [nucleusutah.org](https://www.nucleusutah.org/) (tokens, header, restrained sections), not generic SaaS chrome.
4. **Composable pipeline** — Intake → classify → enrich → match → review is implemented as **discrete Edge Functions and tables**, so each step can be inspected, tuned, and extended without collapsing everything into one opaque agent.

For a full product and implementation checklist, see `Docs/nucleus_concierge_build_plan.md`.

---

## Repository layout

| Path | Role |
|------|------|
| `web/` | Vite + React 19 + TypeScript, Tailwind, shadcn-style UI, TanStack Query, React Router |
| `supabase/migrations/` | Postgres schema and RLS-related changes |
| `supabase/functions/` | Edge Functions (intake, matching, imports, email helpers) |
| `supabase/scripts/` | Maintenance scripts (e.g. embedding backfill) |
| `Docs/` | Build plan and project documentation |

---

## Local development

### Web app

```bash
cd web
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or legacy anon key)
npm install
npm run dev
```

### Supabase

Use the [Supabase CLI](https://supabase.com/docs/guides/cli) to link this project, run migrations, and deploy functions. Edge Functions expect project secrets such as `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and service-specific keys (see comments in `web/.env.example`).

---

## License / attribution

Built for **The Nucleus Institute**. Public marketing and mission context: [https://www.nucleusutah.org/](https://www.nucleusutah.org/).
