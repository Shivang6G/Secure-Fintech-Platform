# Autonomous Financial OS (Titanium Core)
## Comprehensive Architecture, Troubleshooting, and Next Steps Runbook

---

## 1. Executive Summary & Architecture Overview

The **Autonomous Financial OS (Titanium Core)** is an enterprise-grade financial management platform designed with an Apple-inspired glassmorphic dark interface. Unlike traditional consumer budget trackers that maintain mutable balance fields, Titanium Core operates strictly on an **immutable, double-entry ledger**. 

### 1.1 Fundamental Accounting Invariants
1. **Double-Entry Invariant:** Every financial event generates at least two balanced postings such that:
   $$\sum \text{Debits} = \sum \text{Credits}$$
2. **Balance Sheet Dynamic Derivation:** Account balances are never stored as static records. They are computed dynamically by summing historical postings:
   * **Assets & Expenses (Debit Normal):**
     $$\text{Balance} = \sum \text{Debits} - \sum \text{Credits}$$
   * **Liabilities, Equity & Revenue (Credit Normal):**
     $$\text{Balance} = \sum \text{Credits} - \sum \text{Debits}$$
3. **Net Worth Aggregation:**
   $$\text{Net Worth} = \sum \text{Total Assets} - \sum \text{Total Liabilities}$$

### 1.2 Technology Stack
* **Backend:** FastAPI (Python 3.12, Async/Await), SQLAlchemy 2.0 (Asyncpg), Pydantic v2.
* **Database:** PostgreSQL 16 (enforcing strict foreign keys, check constraints, and unique compound indices).
* **Security:** Cryptographic password hashing (Argon2 / Bcrypt), JWT bearer authentication.
* **Frontend:** React 18, TypeScript, Vite, Apple Glassmorphism UI (Pure CSS / inline styled components with -webkit-backdrop-filter).

---

## 2. Directory Layout

```text
C:\Users\shiva\Project\
├── docker-compose.yml
├── backend\
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── init_db.py
│   └── src\
│       └── app\
│           ├── main.py
│           ├── core\
│           │   ├── config.py
│           │   ├── database.py
│           │   └── security.py
│           ├── models\
│           │   └── domain.py
│           ├── services\
│           │   └── ledger.py
│           └── api\
│               └── endpoints.py
└── frontend\
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src\
        ├── main.tsx
        └── App.tsx
```

---

## 3. Operational Troubleshooting & Resolved Edge Cases

### 3.1 Resolving CORS (`No 'Access-Control-Allow-Origin' header`)
When Vite operates on `http://localhost:3000` and FastAPI listens on `http://localhost:8000`, the browser blocks cross-origin requests unless the backend explicitly accepts pre-flight requests.

* **Fix Applied:** `backend/src/app/main.py` incorporates `CORSMiddleware`:
  ```python
  from fastapi.middleware.cors import CORSMiddleware

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### 3.2 Resolving `UndefinedColumnError` (`accounts.created_at`)
When database tables are initialized before a column is added to SQLAlchemy models, querying the whole model causes query failures.
* **Fix Applied:** All queries in `endpoints.py` explicitly select existing physical columns (`Account.id`, `Account.account_number`, `Account.name`, `Account.classification`, `Account.currency`).

### 3.3 Database Table Synchronization for New Modules
Inline `-c` Python one-liners in PowerShell often trigger `SyntaxError` due to semicolons combined with `async def`.
* **Fix Applied:** The dedicated script `backend/init_db.py` handles database migrations safely:
  ```powershell
  docker compose exec backend python /app/init_db.py
  ```

---

## 4. Current State: Phase 1 & Phase 2 Modules

1. **Authentication & Multi-Tenant Isolation:**
   * Automated workspace bootstrap via `/api/v1/auth/register`.
   * Organization isolation enforced across every ledger query via `organization_id`.
2. **Chart of Accounts:**
   * Account registration under five standard classes: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`.
3. **Double-Entry Journal Posting:**
   * Atomically committed transactions requiring balanced debits and credits.
4. **Real-time Net Worth Engine:**
   * Live calculation displaying Aggregate Enterprise Value, Assets, Liabilities, and Equity base.
5. **Budgets & Spending Limits:**
   * Envelope allocation tied directly to `EXPENSE` classification accounts.
   * Dynamic spend aggregation over specified date windows:
     $$\text{Utilization \%} = \left( \frac{\sum \text{Debits in Period}}{\text{Allocated Amount}} \right) \times 100$$
   * Color-coded status markers: `HEALTHY` (< Alert Threshold), `WARNING` (Threshold Reached), and `BREACHED` ($\ge 100\%$).

---

## 5. Next Steps Runbook: Phase 3 Implementation Plan

Phase 3 transitions the platform from a reactive ledger to a proactive Autonomous Financial OS. Below are the sequential modules to build next.

```
+-------------------------------------------------------------------------------+
|                             Phase 3 Evolution                                |
+------------------------------------+------------------------------------------+
| Module 1: Financial Goals          | Milestone targets, dead-line countdowns, |
|                                    | and dedicated allocation tracking.       |
+------------------------------------+------------------------------------------+
| Module 2: Automated Subscriptions  | Recurring transaction engine with drift  |
|                                    | detection and schedule execution.        |
+------------------------------------+------------------------------------------+
| Module 3: Autonomous Advisory      | LLM/Heuristic rule-engine for cash-burn  |
|                                    | runway analysis and budget alerts.       |
+------------------------------------+------------------------------------------+
```

---

### Step 5.1: Financial Goals & Milestone Tracking

#### Objective:
Allow users to create wealth goals (e.g., "Emergency Reserve Fund", "Venture Seed Round", "Tax Escrow") linked to an `ASSET` account, track progress percentage, and calculate required monthly deposits to meet deadlines.

#### Schema Addition (`backend/src/app/models/domain.py`):
```python
class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(18, 4), nullable=False)
    target_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    organization = relationship("Organization")
    account = relationship("Account")

    __table_args__ = (
        CheckConstraint("target_amount > 0", name="check_goal_target_positive"),
    )
```

#### API Endpoints to Add (`backend/src/app/api/endpoints.py`):
* `GET /organizations/{org_id}/goals`: Returns list of goals with computed current progress:
  $$\text{Progress \%} = \left( \frac{\text{Current Account Balance}}{\text{Target Amount}} \right) \times 100$$
* `POST /organizations/{org_id}/goals`: Validates that the linked account is an `ASSET` account and establishes the goal milestone.

---

### Step 5.2: Recurring Transactions & Subscription Detection

#### Objective:
Track scheduled operational expenses (SaaS subscriptions, payroll, office lease) and execute auto-commit balanced transactions on specified calendar intervals (Daily, Monthly, Quarterly).

#### Schema Addition:
```python
class RecurringSchedule(Base):
    __tablename__ = "recurring_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)
    frequency = Column(String(20), nullable=False) # 'MONTHLY', 'QUARTERLY', 'ANNUAL'
    next_execution_date = Column(Date, nullable=False)
    narration = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
```

#### Autonomous Worker Service:
* An asynchronous background worker using `APScheduler` or FastAPI background tasks that checks for due schedules daily at midnight UTC, posts a balanced journal entry automatically, and advances `next_execution_date`.

---

### Step 5.3: AI Autonomous Advisory & Runway Engine

#### Objective:
Analyze the net cash outflow velocity over the preceding 90 days to generate runway projections and risk alerts.

#### Core Formula:
$$\text{Average Monthly Burn Rate} = \frac{\sum \text{Expenses (Last 90 Days)}}{3}$$
$$\text{Runway (Months)} = \frac{\text{Liquid Cash Assets}}{\text{Average Monthly Burn Rate}}$$

#### Cockpit Display:
* Add a glassmorphic **Runway Card** to the Overview tab displaying:
  * Estimated Runway in Months.
  * Projected Cash Zero Date.
  * AI Recommendations (e.g., *"Cloud spend spiked 34% this month; consider reserved instance restructuring."*).

---

## 6. Commands Reference Cheat Sheet

### Refresh Backend Services:
```powershell
cd C:\Users\shiva\Project
docker compose restart backend
```

### Inspect Live API Logs:
```powershell
docker compose logs backend --tail 40 -f
```

### Run Frontend Development Cockpit:
```powershell
cd C:\Users\shiva\Project\frontend
npm run dev
```

### Interactive Database Table Initialization:
```powershell
docker compose exec backend python /app/init_db.py
```

### Update Archive Backup with Documentation:
```powershell
Compress-Archive -Path "C:\Users\shiva\Project\backend", "C:\Users\shiva\Project\frontend\src", "C:\Users\shiva\Project\frontend\package.json", "C:\Users\shiva\Project\frontend\index.html", "C:\Users\shiva\Project\frontend\vite.config.ts", "C:\Users\shiva\Project\docker-compose.yml", "C:\Users\shiva\Project\TITANIUM_OS_RUNBOOK.md" -DestinationPath "C:\Users\shiva\Project_TitaniumCore_Full.zip" -Force
```