# Nucleus Concierge Build Plan

## 1. Product Summary

Nucleus Concierge is an AI powered intake, routing, and match review system for the Nucleus Connections Hub.

The current Nucleus flow is simple: users fill out one of several contact forms, the submission enters Nucleus's CRM, and the team reviews new entries manually during a weekly meeting. The goal of this project is to make that process smarter, faster, and more useful without replacing the human trust layer that makes Nucleus valuable.

The product should feel like a high-touch concierge experience.

A user should be able to arrive with a vague goal like:

> "I am a professor with a promising invention and I do not know what the next business step is."

or:

> "I am a former COO and I would be open to helping a Utah startup part time."

The system should ask natural follow-up questions, infer what kind of person they are, build a structured profile in the background, search for relevant people or opportunities as information comes in, and show useful recommendations as soon as it has enough signal.

The admin side should give Nucleus a lightweight CRM and review dashboard where staff can see every incoming lead, understand how the AI classified them, review the matches, approve or reject recommendations, and import existing CRM data through a CSV upload flow.

The core promise:

> Replace static forms and manual weekly matching with an AI concierge that collects better information, recommends better next steps, and gives Nucleus staff a clear review workflow.

---

## 2. What We Are Building

We are building a web app with two main sides:

1. A public-facing concierge intake flow
2. A private admin dashboard

The public side is for people entering the Nucleus network.

The admin side is for Nucleus staff to manage incoming leads, review matches, import CSV data, and understand the network.

This is not a full CRM replacement. It is a focused workflow layer that improves the front door of the Nucleus ecosystem.

---

## 3. Core User Types

The system should support several different incoming lead types.

At minimum, support these types:

1. Researcher / Inventor
2. Startup / Founder
3. Operator / Executive
4. Mentor
5. Subject-Matter Expert
6. Investor / Venture
7. Service Provider
8. Student / Intern

These types can overlap. Someone may be both an operator and a mentor. A professor may be both a researcher and a startup founder. The system should support primary and secondary lead types.

### 3.1 Researcher / Inventor

This user has built, discovered, researched, or invented something. They may not know whether it should become a company, be licensed, receive grant funding, or be handed off to an operator.

The system should help clarify:

- What they built
- What problem it solves
- Who might use it
- How far along it is
- Whether there is IP, a patent, grant, publication, or tech transfer involvement
- Whether they want to personally lead commercialization
- What business-side help they need

Likely recommendations:

- Commercialization mentor
- Subject-matter expert
- Student discovery team
- Fractional operator
- Service provider
- Investor later, only if appropriate

### 3.2 Startup / Founder

This user already has a startup, project, or early company.

The system should clarify:

- What they are building
- Their stage
- Their sector
- Their current bottleneck
- Whether they need operators, advisors, investors, students, mentors, or service providers
- Whether they are actively hiring, raising, validating, or scaling

Likely recommendations:

- Operators
- Mentors
- Advisors
- Investors
- Students
- Service providers
- Relevant programs or network resources

### 3.3 Operator / Executive

This user has business, leadership, sales, technical, product, or operating experience and may be open to helping a startup.

The system should clarify:

- Role interest
- Full-time, fractional, advisory, board, cofounder, mentor, or project-based availability
- Sector experience
- Startup stage preference
- Risk tolerance
- Compensation expectations
- Location and availability

Likely recommendations:

- Startups needing operators
- Research projects needing commercialization leadership
- Advisory opportunities
- Board opportunities
- Mentorship opportunities

### 3.4 Mentor

This user wants to help but may not want a formal paid role.

The system should clarify:

- What they can help with
- Preferred mentee type
- Time commitment
- Stage preference
- Domain expertise
- Whether they are open to one-off calls or ongoing mentoring

Likely recommendations:

- Founders needing guidance
- Researchers needing first-step direction
- Students
- Early-stage startups
- Nucleus programs

### 3.5 Subject-Matter Expert

This user has deep technical, regulatory, scientific, or industry expertise.

The system should clarify:

- Areas of expertise
- Industries
- Types of questions they can answer
- Preferred engagement type
- Availability
- Conflicts or constraints

Likely recommendations:

- Research inventions needing technical/commercial review
- Startups needing diligence
- Advisory panels
- Mentorship opportunities

### 3.6 Investor / Venture

This user wants visibility into deal flow or may support companies as an investor.

The system should clarify:

- Investment stage
- Sector focus
- Check size
- Geographic focus
- Strategic interests
- Whether they want curated opportunities, events, intros, or advisory involvement

Likely recommendations:

- Startups raising
- Companies approaching investor readiness
- Nucleus Fund opportunities
- Curated venture pipeline

### 3.7 Service Provider

This user provides startup-related services.

The system should clarify:

- Type of service
- Sector expertise
- Stage fit
- Pricing/startup friendliness
- Prior university spinout experience
- Availability and geographic focus

Likely recommendations:

- Startups needing specific services
- Researchers needing IP/legal/grant/commercialization support
- Nucleus approved provider list

### 3.8 Student / Intern

This user wants experience, internship work, research commercialization exposure, or a startup project.

The system should clarify:

- School
- Major
- Skills
- Desired experience
- Weekly availability
- Paid/unpaid/project/internship preference
- Sector interests

Likely recommendations:

- Startup internships
- Research commercialization projects
- Customer discovery projects
- Mentor connections
- Student founder opportunities

---

## 4. Core Product Experience

The product experience should be simple and beautiful.

The user should not feel like they are filling out a long form. They should feel like Nucleus is guiding them through the right questions.

### 4.1 Public Flow

The public flow has five major steps:

1. Welcome
2. Identity
3. Open-ended intent
4. Adaptive questions
5. Recommendation reveal

### 4.2 Welcome

The welcome page should be simple.

MVP headline (Phase 0 lock):

> Find the right people and opportunities in Utah's innovation ecosystem.

MVP subheadline (Phase 0 lock):

> Tell us what you are building, looking for, or able to help with. Nucleus Concierge will ask a few smart questions and recommend the best next people, opportunities, or resources.

Primary CTA:

> Start

### 4.3 Identity

Collect:

- First name
- Last name
- Email

Do not overexplain storage or account creation. This should feel lightweight.

Possible future addition:

- Organization
- University
- LinkedIn

For the hackathon MVP, first name, last name, and email are enough.

### 4.4 Open-Ended Intent

Ask:

> What brings you to Nucleus?

Give example placeholder text:

> Example: I am a professor with a promising invention and I need help figuring out whether it could become a company.

or:

> Example: I am a former operator and I am interested in helping Utah startups part time.

The user should be able to type naturally.

After this answer, the AI should classify lead type and begin building a structured profile.

### 4.5 Adaptive Questions

The flow asks one question at a time.

Each question should include:

- A natural language question
- 2 to 5 quick-select options when possible
- A short free-response field
- An "I'm not sure" option when appropriate

The user should not be forced to know startup jargon.

The AI should decide the next question based on:

- The current lead type
- The current profile completeness
- Missing required information
- Match confidence
- Candidate matches found so far
- Ambiguity in previous answers

### 4.6 Live Understanding Panel

During intake, show a subtle side panel or progress card.

Label (Phase 0 lock):

> What we're learning

Example fields:

- Type: Researcher / Inventor
- Sector: Energy
- Stage: Lab validated
- Need: Market discovery, commercialization help
- Possible next step: Commercialization mentor

This creates trust because the user can see that the system is understanding them.

### 4.7 Recommendation Reveal

Once the system has enough information, stop asking questions and show recommendations.

The transition should feel like:

> We have enough to recommend a few strong next steps.

Then show 2 to 4 cards.

Each card should include:

- Recommendation title
- Type of match
- Why this fits
- Best next step
- Confidence
- Potential gap or risk

Do not make the match score the main visual. Percentages can feel fake. Use confidence labels like High, Medium-high, Medium, and Exploratory.

Example card:

**Commercialization Mentor**

Why this fits:
Your project appears technically promising but commercially early. A commercialization mentor can help clarify customer demand, market path, and whether this should become a startup or licensing opportunity.

Best next step:
Ask for a 30-minute commercialization review.

Confidence:
High

Potential gap:
Not the right person for full-time operating help yet.

---

## 5. Admin Experience

The admin dashboard is critical.

Nucleus staff should be able to log in and see incoming submissions, profiles, AI summaries, and match recommendations.

The admin dashboard should act like a simple CRM focused on review and routing.

### 5.1 Admin Goals

Admins need to:

- See every person who has submitted
- See lead type
- See AI-generated profile summaries
- See recommended matches
- See bad-fit or low-quality submissions
- Review, approve, reject, or hold matches
- See missing information
- Import existing people/opportunities by CSV
- Manually edit profile fields
- Trigger or rerun matching
- Export or mock sync data to Affinity

### 5.2 Admin Login

Use Supabase Auth.

Public users do not need full accounts for the MVP. Admins do.

Admin authentication should support:

- Email/password login for hackathon simplicity
- Admin role stored in an `admin_users` table (Phase 0 lock)
- Row Level Security to restrict admin-only data

For the hackathon, create one admin account manually.

### 5.3 Admin Dashboard Sections

The dashboard should have these pages:

1. Overview
2. People
3. Opportunities
4. Matches
5. Intake Review
6. CSV Import
7. Settings (mock integrations and light tooling for the hackathon)

### 5.4 Overview Page

Show simple metrics:

- New submissions
- Pending review
- High-confidence matches
- Low-confidence submissions
- Imported people
- People by lead type
- Opportunities by type

Also show recent activity:

- New researcher submission
- New operator imported
- Match generated
- Intro approved

### 5.5 People Page

This is the lightweight CRM view.

Table columns:

- Name
- Email
- Primary type
- Secondary type
- Organization
- Sector
- Stage preference or current stage
- Availability
- Profile status
- Match count
- Review status
- Created date

Filters:

- Lead type
- Sector
- Review status
- Confidence
- Imported/manual/public intake
- Has matches
- Missing info

Clicking a person opens a profile detail page.

### 5.6 Person Detail Page

Show:

- Name and email
- Lead type
- AI profile summary
- Structured fields
- Raw intake conversation
- Tags
- Match recommendations
- Missing information
- Admin notes
- Review status

Admin actions:

- Edit structured fields
- Rerun matching
- Approve match
- Reject match
- Hold for later
- Generate intro draft
- Mock sync to Affinity
- Archive or mark as bad fit

### 5.7 Opportunities Page

Opportunities are anything a person can be matched to.

This can include:

- Startups
- Research projects
- Mentorship needs
- Advisor needs
- Student projects
- Service needs
- Investor-ready opportunities

Columns:

- Name
- Type
- Sector
- Stage
- Need type
- Organization
- Status
- Match count

### 5.8 Matches Page

Show all generated matches.

Columns:

- Person
- Matched entity
- Match type
- Confidence
- Status
- Why it fits
- Created date

Statuses:

- Generated
- Admin reviewed
- Approved
- Rejected
- Intro drafted
- Intro sent
- Outcome pending
- Closed

For the hackathon, we only need:

- Generated
- Approved
- Rejected
- Hold

### 5.9 Intake Review Page

This is the weekly review replacement.

It should show new submissions as review cards.

Each card should include:

- Lead summary
- Classification
- Recommended matches
- Bad-fit warning
- Missing info
- Suggested action

Admin can choose:

- Approve all high-confidence matches
- Approve selected match
- Reject selected match
- Ask for more info
- Mark bad fit
- Sync to Affinity mock

### 5.10 CSV Import Page

This is important because Nucleus likely already has people in Affinity.

The system should let admins upload a CSV and import people, startups, mentors, advisors, investors, service providers, or opportunities.

The flow:

1. Upload CSV
2. Preview first 10 rows
3. AI detects what kind of data it is
4. AI maps columns to internal fields
5. Admin reviews mapping
6. Admin confirms import
7. System imports rows
8. System generates embeddings
9. System makes imported records available for matching

This turns existing CRM data into useful matching inventory.

---

## 6. AI Use Cases

AI should be used in several parts of the product.

### 6.1 Lead Classification

Input:

- Open-ended user answer
- Basic identity fields
- Previous answers if any

Output:

- Primary lead type
- Secondary lead types
- Confidence
- Initial tags
- Suggested next question type

Example output:

```json
{
  "primary_type": "researcher_inventor",
  "secondary_types": ["startup_potential"],
  "confidence": 0.87,
  "sector_guess": "energy",
  "stage_guess": "research_discovery",
  "intent_guess": "explore_commercialization"
}
```

### 6.2 Structured Profile Extraction

Input:

- Full conversation so far

Output:

- Structured fields
- Missing fields
- Profile summary
- Confidence

Example output:

```json
{
  "profile_fields": {
    "sector": "energy",
    "technical_stage": "lab_validated",
    "customer_validation": "none",
    "ip_status": "university_review",
    "commercialization_goal": "explore_company_creation",
    "needs": ["market_discovery", "commercialization_mentor"]
  },
  "missing_fields": ["target_customer", "founder_intent"],
  "summary": "BYU researcher with a lab-validated battery materials invention exploring whether it could become a company."
}
```

### 6.3 Next Best Question

Input:

- Current profile
- Missing fields
- Candidate matches found so far
- Lead type
- Question history

Output:

- Next question
- Quick-select options
- Why this question is useful
- Whether to stop asking and show recommendations

Example output:

```json
{
  "should_show_recommendations": false,
  "question": "Are you hoping to personally lead this into a company, find someone else to commercialize it, or just explore whether there is a market?",
  "options": [
    "I want to lead it",
    "I want someone else to lead it",
    "I just want to explore the market",
    "I'm not sure"
  ],
  "field_target": "founder_intent"
}
```

### 6.4 Matching and Opportunity Retrieval

AI helps find matches using a hybrid process.

Use:

- Hard filters
- Vector search
- Structured scoring
- LLM reranking
- LLM explanations

The LLM should not invent matches. It should only rank and explain candidates retrieved from the database.

### 6.5 Match Explanation

Input:

- User profile
- Candidate/opportunity profile
- Structured score

Output:

- Why this fits
- Best next step
- Potential gap
- Confidence explanation

Example output:

```json
{
  "why_this_fits": "This is a strong first conversation because the researcher is commercially early and needs market discovery before a CEO search. The mentor has experience helping university spinouts evaluate market path and customer demand.",
  "best_next_step": "Ask for a 30-minute commercialization review.",
  "potential_gap": "This mentor is not likely to take a full-time operating role.",
  "confidence_label": "High"
}
```

### 6.6 Admin Summary

For each submission, generate:

- One-paragraph summary
- Recommended action
- Bad-fit risk
- Missing information
- Suggested tags
- Suggested Affinity fields
- Intro email draft

### 6.7 CSV Column Mapping

This is one of the most useful AI features for the admin side.

Input:

- CSV headers
- Sample rows
- Internal schema

Output:

- Suggested mapping
- Data type guesses
- Confidence per mapped column
- Import type guess

Example:

CSV headers:

- Full Name
- Email Address
- Company
- Background
- Interested In
- Industry
- LinkedIn URL

AI output:

```json
{
  "import_type": "people",
  "column_mapping": {
    "Full Name": "full_name",
    "Email Address": "email",
    "Company": "organization",
    "Background": "bio",
    "Interested In": "intent_text",
    "Industry": "sector",
    "LinkedIn URL": "linkedin_url"
  },
  "confidence": 0.91,
  "requires_review": ["Full Name"]
}
```

The admin should be able to edit this before importing.

### 6.8 CSV Row Enrichment

After import, AI can enrich each row.

For each imported person:

- Infer lead type
- Extract tags
- Generate summary
- Normalize sector
- Normalize availability
- Generate embedding text

This makes messy CRM exports useful.

---

## 7. Matching Engine

The matching engine should be explainable and practical.

### 7.1 Record Types

There are two broad types of matchable records:

1. People
2. Opportunities

People can be:

- Operators
- Mentors
- Experts
- Investors
- Students
- Service providers
- Researchers
- Founders

Opportunities can be:

- Startup needs
- Researcher needs
- Internship roles
- Advisory needs
- Investor-ready companies
- Commercialization projects
- Service requests

### 7.2 Matching Direction

The system should support multiple directions:

- Researcher to mentor
- Researcher to operator
- Researcher to student support
- Startup to operator
- Startup to investor
- Startup to service provider
- Operator to startup
- Student to project
- Investor to startup
- Mentor to founder
- Expert to technical diligence opportunity

### 7.3 Matching Pipeline

The matching pipeline:

1. Build profile query
2. Apply hard filters
3. Run vector search
4. Apply structured scoring
5. LLM rerank top candidates
6. Generate explanations
7. Save match results

### 7.4 Hard Filters

Examples:

- Lead type compatibility
- Availability
- Stage preference
- Sector compatibility
- Engagement type
- Compensation type
- Investor stage fit
- Service provider scope
- Student availability
- Geographic constraints if needed

### 7.5 Vector Search

**Phase 0 decision:** Enable **pgvector** on Supabase for MVP and use it as the primary vector path. Implement a keyword or structured-score fallback path if pgvector is unavailable in a given environment.

Each **`people`** and **`opportunities`** record should have an `embedding_text` field (see Section 9.11).

Example embedding text for a person:

> Former COO in Utah with experience scaling B2B SaaS and advanced manufacturing startups. Open to fractional operating roles, advisory work, and mentoring pre-seed to Series A teams.

Example embedding text for a startup need:

> Early-stage advanced manufacturing startup in Utah needs fractional operations leadership, supply chain strategy, and help preparing for first enterprise customers.

### 7.6 Structured Score

Score dimensions:

- Type fit
- Sector fit
- Stage fit
- Role/need fit
- Availability fit
- Intent fit
- Utah relevance
- Confidence/completeness

Example weighting:

- Type fit: 20%
- Role/need fit: 25%
- Sector/domain fit: 20%
- Stage fit: 15%
- Availability fit: 10%
- Utah relevance: 5%
- Profile confidence: 5%

Weights can change by lead type.

### 7.7 LLM Reranking

The LLM receives only the top candidates found by the database and vector search.

It should return:

- Final rank
- Reasoning summary
- Confidence
- Potential concern
- Best next action

It must not create new candidates that do not exist.

### 7.8 Recommendation Types

Not every recommendation should be a person.

Recommendations can be:

- Person
- Startup
- Project
- Program
- Service provider
- Investor
- Mentor
- Student opportunity
- Next step
- Hold for later

This matters because sometimes the best recommendation is not a direct match. It may be:

> Complete customer discovery first.

or:

> Talk to a commercialization mentor before approaching investors.

---

## 8. Tech Stack

### 8.1 Frontend

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form
- Zod
- PapaParse for CSV parsing
- Lucide React for icons

Suggested frontend stack:

```txt
React + Vite + TypeScript
Tailwind CSS
shadcn/ui
React Router
TanStack Query
React Hook Form + Zod
PapaParse
Lucide React
```

### 8.2 Backend

Use Supabase as the backend.

Supabase features:

- Auth
- Postgres database
- Row Level Security
- Edge Functions
- Storage for CSV uploads if needed
- pgvector for embeddings if enabled

Suggested backend stack:

```txt
Supabase Auth
Supabase Postgres
Supabase Edge Functions
Supabase Storage
Supabase pgvector
```

### 8.3 AI

Use an LLM provider through Supabase Edge Functions.

AI tasks:

- Lead classification
- Profile extraction
- Next question generation
- Match reranking
- Explanation generation
- CSV column mapping
- CSV row enrichment
- Embeddings

Suggested model setup:

- Fast/cheap model for classification and extraction
- Embedding model for vector search
- Stronger model for reranking and explanation generation

All AI calls should go through Edge Functions. Do not call AI providers directly from the browser.

### 8.4 Auth

Public users:

- No full login required for MVP
- Collect first name, last name, and email
- Store submission and profile data
- After the lead row exists, store `lead_id` and a **`public_session_id`** (UUID) in localStorage so the user can continue the flow across refresh (Phase 0 lock)

Admins:

- Supabase Auth required
- Admin role required
- Protected admin routes

This keeps the public intake lightweight while still securing the staff dashboard.

---

## 9. Database Schema

This is a suggested schema for the MVP.

### 9.1 `admin_users`

Stores admin role info for authenticated users.

Fields:

```sql
id uuid primary key default gen_random_uuid()
auth_user_id uuid references auth.users(id)
email text not null
role text not null default 'admin'
created_at timestamptz default now()
```

### 9.2 `leads`

Stores public submissions.

Fields:

```sql
id uuid primary key default gen_random_uuid()
first_name text
last_name text
email text
organization text
source text default 'public_intake'
primary_type text
secondary_types text[]
status text default 'intake_started'
review_status text default 'pending'
ai_summary text
raw_intent text
profile_confidence numeric
bad_fit_risk text
created_at timestamptz default now()
updated_at timestamptz default now()
```

**Phase 0:** `primary_type` and each entry in `secondary_types` use the canonical slugs in Phase 0.2.

Possible `status` values:

- intake_started
- intake_complete
- recommendations_shown
- admin_reviewed
- archived

Possible `review_status` values:

- pending
- approved
- rejected
- hold
- needs_more_info
- bad_fit

### 9.3 `lead_profile_fields`

Stores structured extracted fields.

Fields:

```sql
id uuid primary key default gen_random_uuid()
lead_id uuid references leads(id) on delete cascade
field_key text not null
field_value jsonb
confidence numeric
source text default 'ai_extracted'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Example fields:

- sector
- stage
- availability
- risk_tolerance
- commercialization_goal
- role_interest
- expertise
- university
- ip_status
- funding_status
- needs

### 9.4 `intake_messages`

Stores the conversation.

Fields:

```sql
id uuid primary key default gen_random_uuid()
lead_id uuid references leads(id) on delete cascade
sender text not null
message text not null
metadata jsonb
created_at timestamptz default now()
```

Possible `sender` values:

- user
- assistant
- system

### 9.5 `opportunities`

Stores matchable opportunities.

Fields:

```sql
id uuid primary key default gen_random_uuid()
name text not null
type text not null
description text
organization text
sector text[]
stage text
need_types text[]
status text default 'active'
source text default 'manual'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Opportunity types:

- startup_need
- research_project
- internship
- advisory_need
- investor_opportunity
- mentorship_need
- service_need
- program

### 9.6 `people`

Stores matchable people imported by admin or submitted publicly.

Fields:

```sql
id uuid primary key default gen_random_uuid()
lead_id uuid references leads(id)
first_name text
last_name text
email text
organization text
title text
bio text
person_types text[]
sectors text[]
skills text[]
availability text[]
stage_preferences text[]
engagement_preferences text[]
source text default 'public_intake'
status text default 'active'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Person types:

- operator
- executive
- mentor
- expert
- investor
- service_provider
- student
- researcher
- founder
- advisor
- board_member

### 9.7 `match_records`

Stores generated matches.

Fields:

```sql
id uuid primary key default gen_random_uuid()
lead_id uuid references leads(id) on delete cascade
person_id uuid references people(id)
opportunity_id uuid references opportunities(id)
matched_record_type text not null
matched_record_id uuid not null
overall_score numeric
confidence_label text
why_this_fits text
best_next_step text
potential_gap text
score_breakdown jsonb
status text default 'generated'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Possible statuses:

- generated
- approved
- rejected
- hold
- intro_drafted
- synced

### 9.8 `admin_notes`

Fields:

```sql
id uuid primary key default gen_random_uuid()
lead_id uuid references leads(id) on delete cascade
admin_user_id uuid references admin_users(id)
note text not null
created_at timestamptz default now()
```

### 9.9 `csv_imports`

Stores uploaded import jobs.

Fields:

```sql
id uuid primary key default gen_random_uuid()
admin_user_id uuid references admin_users(id)
file_name text
status text default 'uploaded'
detected_import_type text
column_mapping jsonb
row_count integer
error_count integer default 0
created_at timestamptz default now()
updated_at timestamptz default now()
```

### 9.10 `csv_import_rows`

Stores raw and processed import rows.

Fields:

```sql
id uuid primary key default gen_random_uuid()
csv_import_id uuid references csv_imports(id) on delete cascade
row_index integer
raw_data jsonb
mapped_data jsonb
status text default 'pending'
error_message text
created_record_type text
created_record_id uuid
created_at timestamptz default now()
```

### 9.11 Embeddings

**Phase 0 decision:** Use **direct embedding columns** on `people` and `opportunities` only (no generic `embeddings` table and no `leads` embedding column in MVP).

Example:

```sql
embedding_text text
embedding vector(1536)
```

_Deferred:_ Option B (generic `embeddings` table) and lead-level vectors are out of scope unless post-MVP needs them.

---

## 10. Supabase Edge Functions

### 10.1 `classify-lead`

Purpose:

Classify the lead after the first open-ended answer.

Input:

```json
{
  "lead_id": "uuid",
  "raw_intent": "string"
}
```

Output:

```json
{
  "primary_type": "researcher_inventor",
  "secondary_types": ["startup_potential"],
  "confidence": 0.87,
  "initial_tags": ["energy", "university_research"],
  "next_question": {}
}
```

### 10.2 `process-intake-answer`

Purpose:

After each answer, update structured profile fields and decide next step.

Input:

```json
{
  "lead_id": "uuid",
  "question": "string",
  "answer": "string"
}
```

Output:

```json
{
  "updated_fields": {},
  "profile_summary": "string",
  "missing_fields": [],
  "should_show_recommendations": false,
  "next_question": {},
  "candidate_match_count": 3
}
```

### 10.3 `generate-next-question`

**Phase 0 decision:** For MVP, this logic **runs inside `process-intake-answer`** (not a separate Edge Function deployment). The contract below is the internal shape the orchestration returns to the client.

Input:

```json
{
  "lead": {},
  "profile_fields": {},
  "missing_fields": [],
  "match_signal": {}
}
```

Output:

```json
{
  "question": "string",
  "options": [],
  "allow_free_response": true,
  "allow_unsure": true,
  "field_target": "string"
}
```

### 10.4 `find-matches`

Purpose:

Find and store match recommendations.

Input:

```json
{
  "lead_id": "uuid",
  "limit": 5
}
```

Output:

```json
{
  "matches": []
}
```

### 10.5 `generate-match-explanations`

Purpose:

Generate user-friendly explanation text for match cards.

Input:

```json
{
  "lead_id": "uuid",
  "match_ids": []
}
```

Output:

```json
{
  "matches": [
    {
      "match_id": "uuid",
      "why_this_fits": "string",
      "best_next_step": "string",
      "potential_gap": "string",
      "confidence_label": "High"
    }
  ]
}
```

### 10.6 `generate-admin-summary`

Purpose:

Generate a staff-facing profile summary.

Input:

```json
{
  "lead_id": "uuid"
}
```

Output:

```json
{
  "summary": "string",
  "recommended_action": "string",
  "bad_fit_risk": "low",
  "missing_info": [],
  "suggested_tags": [],
  "affinity_fields": {}
}
```

### 10.7 `map-csv-columns`

Purpose:

AI maps uploaded CSV columns to the internal schema.

Input:

```json
{
  "headers": [],
  "sample_rows": [],
  "target_schema": {}
}
```

Output:

```json
{
  "detected_import_type": "people",
  "column_mapping": {},
  "confidence": 0.91,
  "requires_review": []
}
```

### 10.8 `process-csv-import`

Purpose:

Apply approved mapping and import rows.

Input:

```json
{
  "csv_import_id": "uuid",
  "approved_mapping": {}
}
```

Output:

```json
{
  "created_count": 100,
  "error_count": 2
}
```

### 10.9 `enrich-imported-record`

Purpose:

Infer lead/person type, normalize fields, generate summary, and create embedding.

Input:

```json
{
  "record_type": "person",
  "record_id": "uuid"
}
```

Output:

```json
{
  "status": "enriched"
}
```

### 10.10 `sync-affinity-mock`

Purpose:

For hackathon demo, show what would be sent to Affinity.

Input:

```json
{
  "lead_id": "uuid",
  "match_ids": []
}
```

Output:

```json
{
  "status": "ready_to_sync",
  "payload": {}
}
```

For MVP, this can be a mock that displays the payload rather than actually calling Affinity.

---

## 11. Frontend Routes

Routes (Phase 0 lock):

```txt
/
  Public landing page

/intake
  Start intake flow

/intake/:leadId
  Active concierge flow

/recommendations/:leadId
  Recommendation reveal

/admin/login
  Admin login

/admin
  Admin overview

/admin/people
  People CRM table

/admin/people/:personId
  Person detail

/admin/leads
  Intake review queue

/admin/leads/:leadId
  Lead detail

/admin/opportunities
  Opportunities table

/admin/matches
  Matches table

/admin/import
  CSV import flow

/admin/settings
  Basic settings and mock integration status
```

---

## 12. Frontend Component Plan

### 12.1 Public Components

- `LandingPage`
- `IntakeShell`
- `IdentityStep`
- `IntentStep`
- `QuestionCard`
- `QuickSelectOptions`
- `FreeResponseInput`
- `UnderstandingPanel`
- `ProgressIndicator`
- `RecommendationReveal`
- `RecommendationCard`

### 12.2 Admin Components

- `AdminLayout`
- `AdminSidebar`
- `MetricCard`
- `PeopleTable`
- `LeadReviewQueue`
- `LeadReviewCard`
- `PersonDetailPanel`
- `OpportunityTable`
- `MatchTable`
- `MatchReviewCard`
- `CSVUploadDropzone`
- `CSVPreviewTable`
- `ColumnMappingReview`
- `ImportResults`
- `AffinityPayloadPreview`

### 12.3 Shared Components

- `Badge`
- `ConfidencePill`
- `StatusSelect`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `SearchFilterBar`

---

## 13. Data Seeding for Demo

We should seed enough data for a compelling demo.

### 13.1 Seed People

Create 15 to 25 people.

Include:

- 3 operators/executives
- 3 mentors
- 3 subject-matter experts
- 3 investors
- 3 service providers
- 3 students/interns
- 2 commercialization advisors
- 2 board/advisor profiles

Example seed people:

1. Former med device COO
2. Regulatory advisor with FDA experience
3. BYU MBA student interested in customer discovery
4. U of U commercialization mentor
5. AI product operator
6. Advanced manufacturing sales leader
7. Energy investor
8. Cybersecurity expert
9. Grant writing service provider
10. IP attorney familiar with university spinouts

### 13.2 Seed Opportunities

Create 8 to 12 opportunities.

Examples:

1. University battery materials invention needing market discovery
2. Life sciences diagnostic spinout needing regulatory guidance
3. AI startup needing student engineering intern
4. Advanced manufacturing company needing fractional sales operator
5. Cybersecurity startup seeking mentor
6. Energy startup raising pre-seed
7. Professor looking for commercialization path
8. Student founder looking for advisor

### 13.3 Demo Scenarios

**Phase 0 decision:** Deliver **three** polished demo paths first; treat **Investor / Venture** as stretch only after those are stable.

Required for MVP rehearsal:

1. Researcher / Inventor
2. Operator / Executive
3. Student / Intern

Stretch (time permitting):

4. Investor / Venture

---


## 14. Phase-by-Phase Build Plan

## Phase 0: Product Lock

Goal:
Record final decisions before building so later phases do not reopen scope.

Status:
**Locked for MVP build** (decisions below).

### 0.1 Product name

**Decision:** Ship as **Nucleus Concierge**. Marketing line stays aligned with the Nucleus Connections Hub (this is the smart front door, not a separate brand).

### 0.2 Supported lead types (canonical)

**Decision:** The eight lead types in Section 3 are in scope for classification, primary/secondary typing, and demo seeding. Use these **canonical slugs** everywhere in the database, Edge Functions, and prompts (display labels can stay human-readable).

| Display label | Canonical slug |
| --- | --- |
| Researcher / Inventor | `researcher_inventor` |
| Startup / Founder | `startup_founder` |
| Operator / Executive | `operator_executive` |
| Mentor | `mentor` |
| Subject-Matter Expert | `subject_matter_expert` |
| Investor / Venture | `investor_venture` |
| Service Provider | `service_provider` |
| Student / Intern | `student_intern` |

**Decision:** Overlaps are allowed; every lead has exactly one `primary_type` and zero or more `secondary_types` from this list only (no ad-hoc new types in MVP).

### 0.3 Public flow

**Decision:** The public journey is exactly the five steps in Section 4.1—no extra steps in MVP:

1. Welcome  
2. Identity (first name, last name, email only—no org/LinkedIn in MVP)  
3. Open-ended intent  
4. Adaptive questions (one at a time)  
5. Recommendation reveal (2–4 cards, confidence as labels not fake percentages)

**Decision:** After identity, create the `leads` row and persist a **`public_session_id`** (UUID) in `localStorage`, keyed to `lead_id`, so a refresh mid-intake does not lose progress. No password, magic link, or public Supabase Auth (see Section 20).

**Decision:** Live panel label is fixed copy: **"What we're learning"** (Section 4.6).

**Decision:** Welcome headline and subheadline for MVP are the copy in Section 4.2 (no A/B variants in build).

### 0.4 Admin flow

**Decision:** Admin IA matches Section 5.3 and Section 11 routes. The seventh nav item is **Settings** only (mock Affinity status, lightweight data/tooling toggles as needed for the hackathon)—no separate "Data Tools" page in MVP.

**Decision:** Match lifecycle states staff can set in MVP remain the hackathon subset: **Generated**, **Approved**, **Rejected**, **Hold** (other statuses in Section 5.8 are post-MVP).

**Decision:** Admin identity uses **Supabase Auth email/password** plus an **`admin_users`** row (not a generic `profiles` table for this MVP).

### 0.5 Demo scenarios

**Decision:** The **required** live demo paths are three, matching Section 13.3:

1. Researcher / Inventor  
2. Operator / Executive  
3. Student / Intern  

**Decision:** **Investor / Venture** is a **stretch** fourth script—prepare seed data and one walkthrough only if time allows after the three core paths are solid.

### 0.6 Data model and infra choices

**Decision:** Adopt the schema in Section 9 as the MVP source of truth, with these clarifications:

- **Embeddings:** **Option A**—`embedding_text` + `embedding vector(1536)` on **`people` and `opportunities` only**. No embedding column on `leads` for MVP (match retrieval uses the structured profile + text built from intake, not a stored lead vector).
- **pgvector:** Target **pgvector enabled** on Supabase for MVP. Keep keyword/fallback matching in code paths if the extension is unavailable in a given environment (Phase 5).
- **Edge Functions:** **`generate-next-question` is not a separate deployed function for MVP**—next-question generation lives inside **`process-intake-answer`** (Section 10.3 describes behavior only; one deployment surface).

### 0.7 Design style

**Decision:** Section 19 (**Design Direction**) is the **locked visual and UX bar** for MVP: premium, calm, high trust; public side concierge, admin side clean operating dashboard; avoid chat-bubble overload and fake precision.

### 0.8 Auth (summary)

**Decision:** No public auth; admin auth only. Full detail in Section 20 (updated to match).

### Phase 0 checklist (complete)

1. ~~Confirm product name~~ → Nucleus Concierge  
2. ~~Confirm supported lead types~~ → Eight types, slugs in 0.2  
3. ~~Confirm public flow~~ → Five steps + session persistence + fixed copy per 0.3  
4. ~~Confirm admin flow~~ → Seven areas, Settings naming, four match states, `admin_users`  
5. ~~Confirm demo scenarios~~ → Three required, Investor stretch  
6. ~~Confirm data model~~ → Section 9 + embedding and function decisions in 0.6  
7. ~~Confirm design style~~ → Section 19 locked  

**Output for later phase planning:**

- Final product scope: Sections 1–7 + Phase 0 locks  
- Final lead type list: table in 0.2  
- Final MVP feature list: Section 24  
- Final demo script: three paths in 13.3 + optional Investor  

**Recommended time:** 1 to 2 hours (documentation only; already captured above).

---

## Phase 1: Project Setup

Goal:
Set up the technical foundation.

Tasks:

1. Create Vite React TypeScript app
2. Install Tailwind CSS
3. Install shadcn/ui
4. Install Supabase JS client
5. Install React Router
6. Install TanStack Query
7. Install React Hook Form
8. Install Zod
9. Install PapaParse
10. Set up environment variables
11. Create Supabase project
12. Configure Supabase Auth
13. Create initial database migrations
14. Configure RLS policies
15. Set up seed scripts

Output:

- Running local app
- Supabase connected
- Admin login works
- Basic database tables exist

---

## Phase 2: Database and Seed Data

Goal:
Create the data layer for leads, people, opportunities, matches, and imports.

Tasks:

1. Create `leads` table
2. Create `lead_profile_fields` table
3. Create `intake_messages` table
4. Create `people` table
5. Create `opportunities` table
6. Create `match_records` table
7. Create `admin_notes` table
8. Create `csv_imports` table
9. Create `csv_import_rows` table
10. Add `embedding_text` and `embedding vector(1536)` on `people` and `opportunities` (enable pgvector per Phase 0; keep migration safe if a dev env omits the extension)
11. Create admin user table
12. Add RLS policies
13. Create seed people
14. Create seed opportunities
15. Create seed admin user

Output:

- Database ready
- Seed data available
- Admin can view seed records

---

## Phase 3: Public Intake UI

Goal:
Build the beautiful user-facing concierge flow.

Tasks:

1. Build landing page
2. Build identity step
3. Build open-ended intent step
4. Create intake session in Supabase
5. Store messages
6. Build question card component
7. Build quick-select answer UI
8. Build free response input
9. Build "I'm not sure" option
10. Build live understanding panel
11. Build loading states
12. Build recommendation reveal page

Output:

- User can start intake
- User can answer questions
- Answers are stored
- UI feels polished and simple

---

## Phase 4: AI Intake Engine

Goal:
Make the intake adaptive.

Tasks:

1. Build `classify-lead` Edge Function
2. Build `process-intake-answer` Edge Function (includes next-question generation; no separate `generate-next-question` deployment)
3. Build structured extraction prompt
4. Build next-question prompt (invoked from within `process-intake-answer`)
5. Save extracted fields to Supabase
6. Update lead summary after each answer
7. Return next best question
8. Detect when enough information exists
9. Handle fallback questions if AI fails
10. Add confidence and missing fields

Output:

- AI classifies lead type
- AI extracts structured fields
- AI asks tailored questions
- Intake stops when recommendations are ready

---

## Phase 5: Matching Engine

Goal:
Generate useful recommendations.

Tasks:

1. Create compatibility rules by lead type
2. Create basic hard filters
3. Create embedding text generator
4. Generate embeddings for seed people and opportunities
5. Create vector search function (pgvector is the default path per Phase 0; implement fallback when the extension is unavailable)
6. Create fallback keyword search if vector is not available
7. Create structured scoring function
8. Build `find-matches` Edge Function
9. Build LLM reranking prompt
10. Save match records
11. Generate match explanations
12. Display match cards

Output:

- User receives 2 to 4 recommendations
- Each recommendation has a clear explanation
- Admin can see generated matches

---

## Phase 6: Admin Dashboard

Goal:
Create the staff review workflow.

Tasks:

1. Build admin login
2. Build protected admin layout
3. Build overview dashboard
4. Build people table
5. Build lead review queue
6. Build lead detail page
7. Build person detail page
8. Build match review table
9. Add approve/reject/hold actions
10. Add admin notes
11. Add rerun matching button
12. Add generated intro draft
13. Add mock Affinity sync preview

Output:

- Admin can log in
- Admin can see all submissions
- Admin can review matches
- Admin can approve or reject recommendations
- Admin can preview CRM sync data

---

## Phase 7: CSV Import Flow

Goal:
Allow admins to import existing CRM data.

Tasks:

1. Build CSV upload UI
2. Parse CSV in browser with PapaParse
3. Show preview table
4. Send headers and sample rows to `map-csv-columns`
5. Show AI-suggested column mapping
6. Allow admin to edit mapping
7. Confirm import
8. Store import job
9. Store raw rows
10. Process mapped rows
11. Create people or opportunities
12. Run AI enrichment on imported records
13. Generate embeddings
14. Show import results

Output:

- Admin can upload a CSV
- AI maps columns
- Admin confirms mapping
- Records are imported and matchable

---

## Phase 8: Polish and Demo Readiness

Goal:
Make the product feel complete and impressive.

Tasks:

1. Improve copy
2. Improve visual hierarchy
3. Add loading animations
4. Add empty states
5. Add realistic seed data
6. Add demo reset button
7. Add error handling
8. Add fake Affinity sync success state
9. Add demo script
10. Test all demo scenarios
11. Record backup demo video if possible

Output:

- Smooth end-to-end demo
- Public flow feels beautiful
- Admin dashboard feels useful
- CSV import feels magical

---

## 15. MVP Priorities

If time is short, build in this order:

1. Public intake UI
2. Lead classification
3. Adaptive questions
4. Match reveal with seeded data
5. Admin review dashboard
6. CSV import
7. Affinity mock
8. Embeddings and advanced matching

Do not start with CSV import. It is valuable, but the public concierge flow is the product's first impression.

Do not overbuild auth. Admin auth is needed. Public auth is not.

Do not overbuild the matching algorithm before the UI works. A beautiful, convincing flow with simple matching will beat a complex backend with a bad demo.

---

## 16. Hackathon Scope

### Must Have

- React/Vite app
- Supabase backend
- Public intake flow
- AI lead classification
- Adaptive questions
- Structured profile extraction
- Match recommendations
- Match explanations
- Admin login
- Admin review queue
- Seeded people and opportunities

### Should Have

- CSV upload
- AI column mapping
- People CRM table
- Opportunities table
- Match approve/reject
- Intro draft
- Mock Affinity sync

### Nice to Have

- pgvector embeddings
- Real Affinity integration
- Role-based admin permissions
- Email notifications
- Follow-up outcome tracking
- Analytics and ecosystem gap reporting

---

## 17. Detailed Demo Script

### Demo 1: Researcher / Inventor

User:

> I am a professor working on a new diagnostic technology. It has worked in the lab, but I do not know how to turn it into a company.

System classifies:

- Researcher / Inventor
- Life sciences
- Lab validated
- Commercialization unclear

System asks:

1. Are you trying to lead this into a company, find someone else to commercialize it, or just explore the market?
2. Is there any IP, patent, grant, or university tech transfer involvement?
3. Do you know who the buyer or end user would be?

System recommends:

1. Commercialization mentor
2. Regulatory advisor
3. Student discovery team
4. Fractional operator later

Admin sees:

- Summary
- Suggested action
- Recommended matches
- Missing info
- Intro draft

### Demo 2: Operator / Executive

User:

> I used to run operations for a manufacturing company and would be open to helping a Utah startup part time.

System classifies:

- Operator / Executive
- Advanced manufacturing
- Fractional availability

System asks:

1. What kind of role would interest you?
2. What stage of startup are you comfortable with?
3. Are you open to equity, paid fractional work, advisory, or mentoring?

System recommends:

1. Advanced manufacturing startup needing operations help
2. University spinout needing commercialization operator
3. Founder needing supply chain mentorship

### Demo 3: Student / Intern

User:

> I am a BYU student studying computer science and I want startup experience in AI.

System classifies:

- Student / Intern
- AI/software
- Startup experience seeker

System asks:

1. What kind of work do you want to do?
2. How many hours per week are you available?
3. Are you looking for paid work, internship credit, project experience, or mentorship?

System recommends:

1. AI startup internship
2. Research commercialization project
3. Mentor connection

### Demo 4: CSV Import

Admin uploads a CSV with messy columns.

Example headers:

- Name
- Email Address
- Company
- Background
- Interested In
- Industry
- LinkedIn

AI maps:

- Name to full_name
- Email Address to email
- Company to organization
- Background to bio
- Interested In to intent_text
- Industry to sector
- LinkedIn to linkedin_url

Admin confirms.

System imports records and makes them available for matching.

---

## 18. Prompt Design

### 18.1 Lead Classification Prompt

System instruction:

You classify incoming Nucleus Connections Hub leads. Return strict JSON. Do not invent facts. If uncertain, use null or low confidence.

User input:

- Name
- Email
- Raw intent text
- Conversation so far

Return:

- primary_type
- secondary_types
- confidence
- sector_guess
- stage_guess
- intent_guess
- suggested_tags
- first_followup_question

### 18.2 Profile Extraction Prompt

System instruction:

Extract structured profile fields from the conversation. Use only information provided by the user. Normalize fields into the allowed taxonomy. Return strict JSON.

Return:

- profile_fields
- missing_fields
- confidence_by_field
- profile_summary
- recommended_next_question_targets

### 18.3 Next Question Prompt

System instruction:

Choose the single most useful next question. The goal is to collect the minimum information needed to make good recommendations. Avoid jargon. Include quick-select options and allow free response.

Return:

- question
- options
- allow_free_response
- allow_unsure
- target_field
- should_show_recommendations

### 18.4 Match Reranking Prompt

System instruction:

You are reranking retrieved candidate matches for Nucleus. You may only use candidates provided. Do not create new candidates. Prefer recommendations that are actionable, stage-appropriate, and explainable.

Return:

- ranked_candidate_ids
- confidence
- why_this_fits
- best_next_step
- potential_gap

### 18.5 CSV Column Mapping Prompt

System instruction:

Map CSV columns to the internal schema. Use headers and sample rows. Return strict JSON. Mark uncertain mappings for admin review.

Return:

- detected_import_type
- column_mapping
- confidence_by_column
- unmapped_columns
- requires_review

---

## 19. Design Direction (Phase 0 lock)

The product should feel premium, calm, and high trust.

Design traits:

- Clean white or off-white background
- Soft card surfaces
- Rounded corners
- Minimal heavy color
- Nucleus-style accent color if available
- Large readable questions
- One primary action per screen
- Small trust-building notes
- Subtle progress indicators

Avoid:

- Chatbot bubble overload
- Dense CRM look on public side
- Overusing AI sparkle icons
- Fake precision
- Long forms

Public side should feel like a concierge.

Admin side should feel like a clean operating dashboard.

---

## 20. Auth Decision

**Phase 0 decision:** Public user auth is **out of scope** for MVP.

Use this approach:

### Public users

- No password
- No magic link
- Create lead record after email entry (identity step)
- Store `lead_id` and **`public_session_id`** (UUID) in localStorage for resume-across-refresh (Phase 0)
- Let user complete intake
- Optionally email them later outside MVP

### Admin users

- Supabase Auth
- Email/password
- **`admin_users` table** (Phase 0)
- Protected routes
- RLS enforced

This is the right tradeoff. Public auth adds friction and does not help the demo much.

---

## 21. Security and Data Privacy

Even for a hackathon, handle the basics.

Do:

- Keep AI API keys in Edge Functions only
- Use RLS for admin tables
- Do not expose admin data publicly
- Validate inputs with Zod
- Limit CSV file size
- Store raw CSV rows carefully
- Avoid sensitive personal data in demo seed data
- Show that proprietary data is not required

Do not:

- Call LLM APIs directly from the browser
- Make all database tables public
- Store unnecessary sensitive data
- Auto-send intros without admin approval

---

## 22. Affinity Integration Plan

For hackathon MVP, build a mock Affinity sync.

The sync preview should show:

- Person name
- Email
- Organization
- Lead type
- Tags
- AI summary
- Match recommendations
- Review status
- Suggested next action

Button:

> Sync to Affinity

After click:

> Ready to sync / Synced successfully

If time allows, add real integration later using Affinity API.

The important demo point is that the product fits into Nucleus's current workflow rather than replacing it.

---

## 23. What To Avoid

Avoid building:

- A generic job board
- A social network
- A full applicant tracking system
- A full CRM
- A complex graph visualization
- Messaging between users
- Public profiles
- Overcomplicated auth
- Too many lead types in the first demo
- Too much AI explanation text

The winning experience is simple:

> Answer a few natural questions. See useful recommendations. Admin reviews and acts.

---

## 24. Final MVP Definition

The MVP is complete when:

1. A public user can enter their name, email, and intent.
2. AI classifies the user.
3. The system asks tailored follow-up questions.
4. The system builds a structured profile.
5. The system generates 2 to 4 recommendations.
6. The user can see why each recommendation fits.
7. Admin can log in.
8. Admin can see all submissions.
9. Admin can see AI summaries and matches.
10. Admin can approve, reject, or hold matches.
11. Admin can upload a CSV.
12. AI maps CSV columns.
13. Imported records become available for matching.
14. A mock Affinity sync preview exists.

---

## 25. Final Build Philosophy

The strongest version of this product is not the most complex version.

The strongest version is the one that makes the user think:

> "That was easy, and it understood what I needed."

And makes Nucleus staff think:

> "This would save us hours every week and help us make better introductions."

That is the target.
