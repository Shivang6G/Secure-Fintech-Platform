# Titanium Core - Secure Unified Financial & Investment Management Platform

## Team
Kanisha Yadav (Team Lead) | Anshika Sharma | Shivang Chaurasia | Shrishti Shahi
BBDITM, Lucknow | AKTU College Code: 054 | Guide: Mr. Arvind Gautam

This repository is the actual, buildable implementation that has been started
against the full platform vision described in
`Secure_Unified_Financial_&_Investment_Management_Platform_-_Complete_Project_Specification.md`.
That specification describes a ~14-phase, multi-entity FinTech platform
(family, business, restaurant, project, investment, and fund management,
plus a full AWS security/DevOps/AI layer). Building all of it to production
quality is a multi-month, multi-engineer effort — this README is deliberately
honest about **what is actually implemented and tested today** versus what
remains on the roadmap, so you always know exactly what you can demo, deploy,
and defend in an interview or a viva.

---

## 1. What's implemented right now

| Layer | Status | Detail |
|---|---|---|
| Auth | ✅ Working | Argon2 password hashing, HS256 JWT, org-scoped membership (OWNER/MEMBER roles) |
| Chart of Accounts | ✅ Working | ASSET / LIABILITY / EQUITY / INCOME / EXPENSE classification |
| Double-Entry Ledger | ✅ Working | Every journal entry is validated: sum(debits) == sum(credits), or the API rejects it (HTTP 400) |
| Net Worth Engine | ✅ Working | Real-time Assets − Liabilities from live ledger balances |
| Budgets | ✅ Working | Allocation vs. spend tracking with an alert threshold |
| **Financial Goals** | ✅ Working (this update) | Target-amount/target-date milestones with live progress %, required monthly contribution, and status (ON_TRACK / OVERDUE / ACHIEVED) |
| **Recurring Transactions** | ✅ Working (this update) | Scheduled DAILY/WEEKLY/MONTHLY/QUARTERLY/ANNUAL postings, auto-advances its own next-run date, manual "run due now" trigger, and a background sweep every 6 hours |
| **Cash Runway Advisory** | ✅ Working (this update) | Liquid assets ÷ trailing 90-day average burn rate → months of runway + projected zero-cash date |
| Apple-style UI | ✅ Working | Glassmorphism React frontend (Overview, Net Worth, Budgets, Goals, Automation, Accounts, Journal tabs) |
| Containerization | ✅ Working | Dockerfile + docker-compose (Postgres, backend); `docker compose up` gets you a running stack locally |
| AWS Infrastructure (Terraform) | ✅ Added (this update) | VPC, ALB, ECS Fargate, RDS Postgres, ECR, Secrets Manager, S3, CloudWatch — see `infra/terraform/` |
| Family / Business / Restaurant / Project / Investment / Fund modules | ❌ Not built | Spec sections 5–10. These are separate domain modules layered on top of the core ledger — each is its own sub-project |
| KMS field-level encryption, CloudTrail, WAF, pentesting | ❌ Not built | Spec sections 20–24, Phase 13 |
| CI/CD pipeline | ❌ Not built | Spec Phase 12 — GitHub Actions skeleton is a natural next step |
| AI features (categorization, forecasting, NL queries) | ❌ Not built | Spec section 35 / Phase 14 — explicitly marked "optional advanced phase" in the spec itself |
| Multi-region DR, RTO/RPO drills | ❌ Not built | Spec sections 24, 42 |

Everything marked ✅ above was actually run end-to-end during this update —
registration → chart of accounts → ledger posting → goal progress
calculation → recurring-schedule execution → runway analytics — against a
live async SQLAlchemy session, not just written and assumed correct.

---

## 2. System architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                              Client (Browser)                         │
│              React 18 + Vite + TypeScript, Apple-glass UI             │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ HTTPS / JSON (JWT bearer)
┌───────────────────────────────▼───────────────────────────────────────┐
│                         FastAPI Backend (Python 3.12)                 │
│  ┌───────────────┐ ┌──────────────┐ ┌───────────────┐ ┌─────────────┐ │
│  │ Auth & Membership│ Ledger Engine │ Goals & Budgets │ Recurring Sweep│ │
│  │ (Argon2 + JWT)   │ (double-entry)│ (analytics.py)  │ (asyncio loop) │ │
│  └───────────────┘ └──────────────┘ └───────────────┘ └─────────────┘ │
│                    SQLAlchemy 2.0 (async) + Alembic migrations         │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ asyncpg
┌───────────────────────────────▼───────────────────────────────────────┐
│                      PostgreSQL 16 (RDS in AWS mode)                  │
│   organizations · users · memberships · accounts · journal_entries ·  │
│   postings · budgets · goals · recurring_schedules                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### AWS deployment topology (`infra/terraform/`)

```
Internet
   │
   ▼
Application Load Balancer (public subnets, 2 AZs)
   │  HTTP :80 → target group :8000  (add ACM + :443 before real production use)
   ▼
ECS Fargate Service — "backend" task (private subnets, 2 AZs)
   │  env: DB_HOST/DB_NAME/DB_USER (plain) + DB_PASSWORD/JWT_SECRET_KEY (Secrets Manager)
   ▼
RDS PostgreSQL 16 (private subnets, not publicly accessible)

Supporting resources: ECR (image registry), S3 (encrypted document bucket,
foundation for Phase 10), CloudWatch (logs + CPU alarms), NAT Gateway (single,
cost-optimized — see infra README for the HA alternative), IAM execution/task
roles scoped to only the secrets and bucket they need. No Route 53 is
provisioned — point your own domain at the ALB DNS name if/when you have one.
```

### Entity-relationship diagram (implemented tables)

```
organizations ──< memberships >── users
      │
      ├──< accounts >──┬──< postings >── journal_entries
      │                ├──< budgets
      │                ├──< goals
      │                └──< recurring_schedules (debit_account, credit_account)
```

---

## 3. Security notes (read before you deploy this anywhere real)

This update found and fixed one real vulnerability from the original backup:
`config.py` required `ED25519_PRIVATE_KEY_PEM` / `ED25519_PUBLIC_KEY_PEM` as
settings, but `security.py` never used them — it signed every JWT with a
**hardcoded secret string compiled into the source code**. That's now fixed:
JWTs are signed with `JWT_SECRET_KEY`, sourced from an environment variable
locally and from AWS Secrets Manager in the Terraform deployment. If you fork
this project, treat the default value in `config.py` as a placeholder only.

Known gaps that the spec calls for but this update does not implement:
field-level encryption of sensitive columns (KMS), CloudTrail audit logging,
WAF/rate-limiting at the edge, and a formal secrets-rotation policy. Do not
put real financial data in a deployment of this project until those are
addressed.

---

## 4. Repository layout

```
TitaniumCore/
├── README.md                     ← you are here
├── EXECUTION_GUIDE.md             ← step-by-step Windows commands, local + AWS
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                  ← 0001_initial, 0002_goals_recurring
│   └── src/app/
│       ├── main.py               ← FastAPI app + background recurring sweep
│       ├── core/                 ← config, database, security
│       ├── models/domain.py      ← SQLAlchemy models
│       ├── services/             ← ledger.py, recurring.py, analytics.py
│       └── api/endpoints.py
├── frontend/
│   ├── package.json, tsconfig.json (added — was missing), vite.config.ts
│   └── src/App.tsx, main.tsx
└── infra/terraform/
    ├── providers.tf, variables.tf, terraform.tfvars.example
    ├── vpc.tf, security_groups.tf, rds.tf, ecr.tf, iam.tf, secrets.tf
    ├── s3.tf, alb.tf, ecs.tf, cloudwatch.tf, outputs.tf
    └── README.md                 ← Terraform-specific notes and cost estimate
```

---

## 5. Suggested next steps, in priority order

1. **Pick one domain module** (Family or Business is the fastest win) and
   build it as a thin layer on the existing ledger — new account types +
   a purpose-built dashboard, reusing everything in `services/ledger.py`.
2. **CI/CD** — a GitHub Actions workflow that builds the Docker image, pushes
   to the ECR repo Terraform already created, and updates the ECS service.
3. **HTTPS on the ALB** — request a free ACM certificate, add a 443 listener,
   redirect 80→443 (stubbed with a comment in `alb.tf`).
4. **Field-level encryption** for PII/financial columns via AWS KMS.
5. Only after 1–4: the AI features in spec section 35. They're explicitly
   optional in the spec itself and add the least defensible value until the
   core product is solid.
