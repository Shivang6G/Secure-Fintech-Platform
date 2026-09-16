# SECURE UNIFIED FINANCIAL & INVESTMENT MANAGEMENT PLATFORM

## 1. PROJECT OVERVIEW

Build a comprehensive, modular, secure financial and investment management platform that can manage financial activities for:

1. Individuals
2. Families / households
3. Businesses
4. Restaurants
5. Projects
6. Investment portfolios
7. Investment funds

The platform should provide personalized financial management depending on the type of user/entity.

The system should combine:

- Personal Finance Management
- Family Finance Management
- Business Finance Management
- Restaurant Finance Management
- Project Finance Management
- Investment Portfolio Management
- Fund Management
- Financial Analytics
- Budgeting
- Cash Flow Management
- Asset & Liability Management
- Secure Personal Data Storage
- Strong Authentication & Authorization
- Encryption
- Audit Logging
- Backup & Disaster Recovery
- Cloud Infrastructure
- Monitoring
- Optional AI-powered financial insights

The project should be designed as a serious, scalable FinTech software system rather than a simple college CRUD application.

The architecture must allow the platform to start as a free/local development project and progressively evolve into a cloud-based production system.

---

# 2. PROJECT OBJECTIVE

The primary objective is:

"Create a secure unified financial operating platform where an individual, family, business, restaurant, project manager, investor, or fund manager can manage financial information, transactions, budgets, assets, liabilities, investments, financial goals, reports, and securely stored documents from one platform."

The platform should answer questions such as:

- How much money do I have?
- Where is my money going?
- What are my monthly expenses?
- What is my net worth?
- What are my assets and liabilities?
- Am I following my budget?
- How much am I saving?
- How are my investments performing?
- What is my cash flow?
- Which expenses are increasing?
- How profitable is my business?
- How profitable is my restaurant?
- How much has a project spent?
- Is a project within budget?
- How is an investment portfolio allocated?
- What is the performance of a fund?
- Which financial documents are stored?
- Who has access to financial information?
- Has anyone accessed or modified sensitive data?

---

# 3. CORE DESIGN PRINCIPLE

Do NOT build seven completely separate applications.

Build:

CORE FINANCIAL ENGINE

+

ENTITY-SPECIFIC MODULES

+

SECURITY LAYER

+

ANALYTICS LAYER

+

CLOUD/INFRASTRUCTURE LAYER

The architecture should maximize code and infrastructure reuse.

For example:

CORE ENGINE

- Users
- Organizations
- Accounts
- Transactions
- Categories
- Assets
- Liabilities
- Budgets
- Goals
- Documents
- Reports

Then specialized modules extend the core:

Individual Module
Family Module
Business Module
Restaurant Module
Project Module
Investment Module
Fund Module

---

# 4. USER TYPES

The system should support different account/entity types.

## A. Individual

A single person managing personal finances.

Features:

- Income
- Expenses
- Bank/cash accounts
- Credit cards
- Loans
- Assets
- Liabilities
- Investments
- Insurance records
- Financial goals
- Budgets
- Net worth
- Cash flow
- Financial documents
- Reports

---

# 5. FAMILY / HOUSEHOLD MODULE

Allow multiple users to participate in a family financial environment.

Example:

Family
|
|-- Member A
|-- Member B
|-- Member C
|-- Child

Support:

- Shared accounts
- Personal accounts
- Shared expenses
- Family income
- Family budget
- Family goals
- Family investments
- Family liabilities
- Family net worth
- Contribution tracking
- Member permissions

Example permissions:

OWNER
ADMIN
ADULT_MEMBER
LIMITED_MEMBER
VIEW_ONLY

A member must only see data they are authorized to access.

---

# 6. BUSINESS FINANCIAL MODULE

Support businesses with financial management.

Features:

- Business income
- Business expenses
- Revenue
- Accounts receivable
- Accounts payable
- Vendors
- Customers
- Payroll records
- Assets
- Liabilities
- Loans
- Taxes/financial obligations records
- Budgets
- Cash flow
- Profit & loss
- Balance sheet-style reporting
- Business profitability
- Department-wise expenses
- Financial documents
- Financial reports

Business roles:

OWNER
FINANCE_ADMIN
ACCOUNTANT
MANAGER
EMPLOYEE
VIEW_ONLY

---

# 7. RESTAURANT FINANCE MODULE

Create a specialized business template for restaurants.

Track:

REVENUE:

- Dine-in
- Takeaway
- Delivery
- Online orders
- Catering
- Other income

EXPENSES:

- Food ingredients
- Raw materials
- Staff/labour
- Rent
- Electricity
- Water
- Gas
- Equipment
- Maintenance
- Delivery commissions
- Packaging
- Marketing
- Taxes/fees
- Other operating expenses

Analytics:

- Daily sales
- Weekly sales
- Monthly sales
- Food cost
- Labour cost
- Operating cost
- Gross profit
- Net profit
- Profit margin
- Cost percentage
- Branch comparison

If multiple restaurant branches are supported:

Restaurant
|
|-- Branch 1
|-- Branch 2
|-- Branch 3

Each branch should have isolated financial records while the owner can see consolidated reports.

---

# 8. PROJECT FINANCE MODULE

Allow users/businesses to create financial projects.

Example:

PROJECT:
Construction Project

Budget:
₹50,00,000

Categories:

- Materials
- Labour
- Equipment
- Transport
- Contractors
- Administration
- Marketing
- Miscellaneous
- Contingency

Track:

- Project budget
- Actual expenses
- Remaining budget
- Budget variance
- Forecast
- Completion percentage
- Project revenue
- Project profit
- ROI
- Milestones
- Financial documents

Dashboard should clearly show:

Budget
Actual
Remaining
Variance
Forecast

---

# 9. INVESTMENT MANAGEMENT MODULE

Support investment portfolio management.

Assets may include:

- Stocks
- Mutual Funds
- ETFs
- Bonds
- Fixed-income investments
- Gold
- Other investment assets

Track:

- Investment account
- Asset
- Quantity
- Purchase price
- Purchase date
- Current price
- Current value
- Cost basis
- Realized profit/loss
- Unrealized profit/loss
- Dividends/income
- Portfolio allocation
- Asset allocation
- Performance

Dashboard:

Total Invested
Current Value
Profit/Loss
Return %
Asset Allocation
Portfolio History

The system should separate:

PERSONAL INVESTMENTS

FAMILY INVESTMENTS

BUSINESS INVESTMENTS

FUND INVESTMENTS

---

# 10. FUND MANAGEMENT MODULE

Support management of investment funds.

Entities:

Fund
|
|-- Fund Manager
|-- Investors
|-- Capital
|-- Investments
|-- Expenses
|-- Returns
|-- Allocations
|-- Distributions

Track:

- Investor contributions
- Investor ownership
- Withdrawals
- Fund expenses
- Investment transactions
- Portfolio allocation
- Fund performance
- Investor statements
- Capital allocation

The system should be designed so that advanced fund accounting can be added later.

Do NOT claim regulatory compliance unless explicitly implemented and verified.

---

# 11. FINANCIAL CORE ENGINE

The financial core is the most important component.

It should support:

## Accounts

Examples:

- Cash
- Bank
- Credit Card
- Savings
- Investment
- Loan

## Transactions

Each transaction should include:

- ID
- User/entity
- Account
- Type
- Amount
- Currency
- Category
- Date/time
- Description
- Merchant/payee
- Tags
- Notes
- Attachments
- Created timestamp
- Updated timestamp

Transaction types:

INCOME
EXPENSE
TRANSFER
INVESTMENT
WITHDRAWAL
DEPOSIT
REFUND
LOAN_PAYMENT
DIVIDEND
INTEREST
OTHER

---

# 12. DOUBLE-ENTRY ACCOUNTING CONSIDERATION

Design the financial engine so that double-entry accounting can be introduced.

Use concepts such as:

- Ledger
- Journal Entry
- Debit
- Credit
- Account

The system should maintain financial consistency.

Do not simply modify balances independently without maintaining transaction history.

---

# 13. BUDGETING SYSTEM

Users should be able to create budgets.

Examples:

Monthly budget:

Food: ₹10,000
Transport: ₹5,000
Entertainment: ₹3,000
Utilities: ₹5,000

Show:

Budget
Actual
Remaining
Percentage Used

Alerts:

- 50% used
- 75% used
- 90% used
- Budget exceeded

Thresholds should be configurable.

---

# 14. FINANCIAL GOALS

Support goals such as:

- Emergency fund
- Car
- House
- Education
- Vacation
- Business expansion
- Retirement

Each goal:

- Target amount
- Current amount
- Target date
- Contribution
- Progress percentage
- Required monthly contribution

---

# 15. ASSET MANAGEMENT

Track assets.

Examples:

- Cash
- Bank deposits
- Property
- Vehicle
- Gold
- Investments
- Equipment
- Other assets

Each asset should support:

- Purchase value
- Current estimated value
- Purchase date
- Ownership
- Documentation
- Notes
- Valuation history

---

# 16. LIABILITY MANAGEMENT

Track:

- Credit cards
- Personal loans
- Business loans
- Mortgages
- Other liabilities

Track:

- Principal
- Interest rate
- Outstanding amount
- EMI/payment
- Due date
- Start date
- End date
- Payment history

Dashboard:

Total liabilities
Debt-to-asset ratio
Upcoming payments
Outstanding debt

---

# 17. NET WORTH

Calculate:

NET WORTH = TOTAL ASSETS - TOTAL LIABILITIES

Show historical net worth.

Example:

January → ₹5L
February → ₹5.4L
March → ₹5.8L

Provide charts and trends.

---

# 18. CASH FLOW

Calculate:

Opening Balance
+
Income
-
Expenses
+
Transfers/other adjustments
=
Closing Balance

Show:

- Daily cash flow
- Weekly cash flow
- Monthly cash flow
- Annual cash flow

---

# 19. DOCUMENT / PERSONAL DATA STORAGE

Create a secure document storage module.

Possible documents:

- Bills
- Invoices
- Receipts
- Investment statements
- Insurance documents
- Loan documents
- Property documents
- Tax documents
- Business documents
- Personal financial records

Requirements:

- Secure upload
- Encryption
- Access control
- Metadata
- File versioning
- Audit logs
- Backup
- Secure download
- File type validation
- File size limits
- Malware scanning architecture

Never expose private files through public URLs.

---

# 20. SECURITY ARCHITECTURE

Security is a first-class component of the project.

Implement:

## Authentication

- Secure login
- Password hashing
- Session management
- MFA/2FA
- Account recovery
- Email verification

## Authorization

Use:

RBAC

and preferably:

ABAC where necessary.

Enforce least privilege.

---

# 21. DATA SECURITY

Sensitive data should be protected using:

- TLS/HTTPS
- Encryption at rest
- Encryption in transit
- Database encryption
- Object storage encryption
- Key management
- Secrets management
- Secure password hashing
- Token security

Do not store passwords in plaintext.

Do not store secrets in source code.

Do not expose database credentials.

---

# 22. AUDIT LOGGING

Maintain an immutable-style audit trail for important actions.

Record:

- Login
- Logout
- Failed login
- Data creation
- Data modification
- Data deletion
- Document upload
- Document download
- Permission changes
- Password changes
- MFA changes
- Financial transaction changes

Example:

USER:
user_123

ACTION:
UPDATED_TRANSACTION

TIMESTAMP:
2026-09-15 10:30

RESOURCE:
transaction_456

IP:
stored only if legally/privacy appropriate

---

# 23. SECURITY MONITORING

Detect suspicious activity such as:

- Multiple failed logins
- Unusual login locations
- Excessive downloads
- Permission escalation
- Suspicious API requests
- Unusual account activity

The system should generate security alerts.

---

# 24. BACKUP & DISASTER RECOVERY

Implement:

- Automated database backups
- File backups
- Versioning
- Recovery procedures
- Backup monitoring
- Restore testing

The architecture should eventually support:

RPO
RTO

Document these clearly.

---

# 25. CLOUD ARCHITECTURE

The platform should be deployable on AWS.

Potential architecture:

Users
|
CloudFront
|
WAF
|
Load Balancer
|
Application Layer
|
Database
|
Object Storage

Supporting services:

IAM
KMS
Secrets Manager
CloudWatch
CloudTrail
AWS Backup

Potential compute options:

- EC2
- ECS
- Lambda

The initial version should remain simple.

Do not introduce microservices unnecessarily.

Start with a modular monolith and evolve only when justified.

---

# 26. RECOMMENDED INITIAL TECHNOLOGY STACK

Frontend:

- React
- TypeScript
- Modern CSS/UI framework

Backend:

- Python
- FastAPI

Database:

- PostgreSQL

Authentication:

- JWT/session-based architecture initially
- AWS Cognito can be introduced later

Object storage:

- Local filesystem for development
- Amazon S3 for cloud deployment

Containerization:

- Docker
- Docker Compose

Infrastructure:

- Terraform

CI/CD:

- GitHub Actions

Monitoring:

- Application logs
- Prometheus/Grafana locally if useful
- AWS CloudWatch in AWS deployment

---

# 27. ARCHITECTURE STYLE

Use a modular monolith initially.

Suggested structure:

backend/
|
|-- auth/
|-- users/
|-- organizations/
|-- accounts/
|-- transactions/
|-- budgets/
|-- goals/
|-- assets/
|-- liabilities/
|-- investments/
|-- projects/
|-- restaurants/
|-- funds/
|-- documents/
|-- reports/
|-- notifications/
|-- audit/
|-- security/

The architecture must have clear separation of concerns.

---

# 28. DATABASE DESIGN

Important entities:

User
Organization
Family
FamilyMember
Role
Permission
Account
Transaction
Category
Budget
BudgetItem
Goal
Asset
Liability
Loan
InvestmentAccount
InvestmentAsset
InvestmentTransaction
Portfolio
Fund
Investor
Project
ProjectBudget
ProjectExpense
Restaurant
RestaurantBranch
Document
DocumentVersion
Notification
AuditLog

Use:

- UUIDs where appropriate
- Foreign keys
- Constraints
- Indexes
- Timestamps
- Soft deletion where appropriate
- Database migrations

Do not duplicate financial data unnecessarily.

---

# 29. MULTI-TENANCY

The platform should eventually support multiple independent users/organizations.

Tenant isolation is critical.

User A must never be able to access User B's financial information.

Organization A must never be able to access Organization B's information.

Every data access should be authorization checked server-side.

Never trust the frontend for authorization.

---

# 30. API DESIGN

Build REST APIs initially.

Example:

POST /auth/login
POST /auth/register

GET /accounts
POST /accounts

GET /transactions
POST /transactions
PUT /transactions/{id}
DELETE /transactions/{id}

GET /budgets
POST /budgets

GET /goals
POST /goals

GET /assets
POST /assets

GET /liabilities
POST /liabilities

GET /investments
POST /investments

GET /projects
POST /projects

GET /documents
POST /documents

GET /reports/net-worth
GET /reports/cash-flow
GET /reports/profit-loss

API documentation should use OpenAPI/Swagger.

---

# 31. DASHBOARDS

Create different dashboards depending on entity type.

## Individual Dashboard

Show:

- Net worth
- Balance
- Income
- Expenses
- Savings
- Budget status
- Investments
- Goals
- Recent transactions

## Family Dashboard

Show:

- Family net worth
- Family income
- Family expenses
- Shared accounts
- Goals
- Investments
- Member contributions

## Business Dashboard

Show:

- Revenue
- Expenses
- Profit
- Cash flow
- Receivables
- Payables
- Budget
- Assets
- Liabilities

## Restaurant Dashboard

Show:

- Sales
- Food cost
- Labour cost
- Operating expenses
- Gross profit
- Net profit
- Branch performance

## Project Dashboard

Show:

- Budget
- Actual cost
- Variance
- Revenue
- Profit
- Completion
- Forecast

## Investment Dashboard

Show:

- Portfolio value
- Invested amount
- Profit/loss
- Allocation
- Performance

---

# 32. REPORTING

Generate:

- Income report
- Expense report
- Cash flow report
- Net worth report
- Budget report
- Profit & loss
- Asset report
- Liability report
- Investment report
- Project financial report
- Restaurant profitability report

Allow export to:

- CSV
- PDF

---

# 33. NOTIFICATIONS

Support notifications for:

- Budget exceeded
- Bill due
- Loan payment due
- Goal milestone
- Investment events
- Suspicious login
- Security events
- Project budget exceeded

Notification channels can initially be:

- In-app
- Email

SMS/push notifications can be added later.

---

# 34. SEARCH

Provide secure search for:

- Transactions
- Accounts
- Documents
- Investments
- Projects
- Businesses
- Categories

Search must respect authorization.

---

# 35. AI FEATURES — OPTIONAL ADVANCED PHASE

AI should NOT control financial decisions.

AI should provide insights, explanations and assistance.

Potential features:

## Expense categorization

Automatically classify:

"Swiggy ₹450"

→ Food / Delivery

## Financial summaries

"Your expenses increased 12% this month."

## Anomaly detection

"This transaction is significantly different from your historical spending."

## Budget insights

"You are likely to exceed your dining budget."

## Cash-flow forecasting

Estimate future cash flow based on historical data.

## Natural-language queries

Example:

"How much did I spend on food last month?"

"Which category increased the most?"

"Show my investment performance."

AI must not execute financial transactions without explicit user confirmation and appropriate controls.

---

# 36. PRIVACY PRINCIPLES

Financial data is extremely sensitive.

Follow:

- Data minimization
- Purpose limitation
- Least privilege
- Encryption
- Access logging
- Secure deletion
- Backup controls
- User-controlled permissions

Do not collect unnecessary personal information.

Do not use real financial data during development.

Use synthetic/dummy data.

---

# 37. IMPORTANT FINANCIAL SAFETY PRINCIPLE

This application is a financial management and analytics platform.

It must NOT automatically provide regulated financial advice unless appropriate legal/compliance requirements have been addressed.

Clearly distinguish:

FINANCIAL DATA

FINANCIAL ANALYTICS

FINANCIAL EDUCATION

from:

PERSONALIZED INVESTMENT ADVICE

Do not represent the system as a bank, broker, investment adviser, payment processor, or regulated financial institution unless the necessary regulatory requirements are actually satisfied.

---

# 38. COST STRATEGY

The project should initially be designed to run at approximately ₹0 for development.

Local:

- PostgreSQL
- Docker
- Backend
- Frontend
- Local storage
- Local testing

AWS deployment should be introduced progressively.

Avoid unnecessary always-on paid resources.

Use free-tier/low-cost services where currently available, but verify AWS pricing before deployment.

Never assume a cloud service is permanently free.

---

# 39. DEVELOPMENT PHASES

## PHASE 0 — Planning

Create:

- Requirements
- Architecture
- Database ERD
- Threat model
- API specification
- UI wireframes

Do not code yet.

---

## PHASE 1 — Core Application

Build:

- Registration
- Login
- User profile
- Accounts
- Transactions
- Categories
- Dashboard

---

## PHASE 2 — Financial Engine

Build:

- Budgets
- Goals
- Assets
- Liabilities
- Net worth
- Cash flow
- Reports

---

## PHASE 3 — Security

Implement:

- RBAC
- MFA
- encryption
- secure sessions
- audit logs
- rate limiting
- secure API validation
- security testing

---

## PHASE 4 — Family

Implement:

- Family creation
- Member invitations
- Shared finances
- Roles
- Permissions
- Family dashboard

---

## PHASE 5 — Business

Implement:

- Organization
- Business accounts
- Revenue
- Expenses
- Customers
- Vendors
- P&L
- Cash flow

---

## PHASE 6 — Restaurant

Implement:

- Restaurant
- Branches
- Sales
- Food cost
- Labour
- Operating expenses
- Profitability analytics

---

## PHASE 7 — Project Finance

Implement:

- Projects
- Budgets
- Expenses
- Milestones
- Forecast
- ROI

---

## PHASE 8 — Investments

Implement:

- Portfolio
- Assets
- Transactions
- Performance
- Allocation
- Profit/loss

Use synthetic market data initially.

---

## PHASE 9 — Fund Management

Implement:

- Fund
- Investors
- Contributions
- Withdrawals
- Investments
- Expenses
- Performance

---

## PHASE 10 — Secure Document Storage

Implement:

- Upload
- Encryption
- Metadata
- Versioning
- Authorization
- Audit trail
- Backup

---

## PHASE 11 — Cloud

Deploy progressively to AWS.

Start simple.

Then add:

- VPC
- IAM
- EC2/ECS
- RDS
- S3
- KMS
- CloudWatch
- CloudTrail
- Backup

---

## PHASE 12 — DevOps

Implement:

- Docker
- CI/CD
- Terraform
- Automated testing
- Automated deployment
- Infrastructure validation

---

## PHASE 13 — Advanced Security

Add:

- Threat detection
- Security monitoring
- anomaly detection
- vulnerability scanning
- penetration testing in an authorized environment
- disaster recovery
- backup restoration testing

---

## PHASE 14 — AI

Add:

- Categorization
- Financial summaries
- Anomaly detection
- Forecasting
- Natural-language analytics

---

# 40. TESTING REQUIREMENTS

Implement:

### Unit Testing

Test financial calculations thoroughly.

### Integration Testing

Test:

Frontend → API → Database

### Security Testing

Test:

- authentication
- authorization
- IDOR prevention
- SQL injection
- XSS
- CSRF where applicable
- rate limiting
- file upload security
- privilege escalation

### Financial Testing

Verify:

- balances
- transaction calculations
- budget calculations
- net worth
- profit/loss
- investment returns

Financial calculations must be deterministic and tested with edge cases.

---

# 41. OBSERVABILITY

Track:

- application errors
- latency
- request rates
- database performance
- authentication failures
- security events
- storage usage

Create dashboards and alerts.

---

# 42. DISASTER RECOVERY

Document:

RPO:
How much data can potentially be lost?

RTO:
How quickly should the system recover?

Create:

- backup strategy
- restore procedure
- disaster scenario
- recovery testing procedure

---

# 43. PROJECT DOCUMENTATION

The final project must include:

README.md

Architecture Diagram

ER Diagram

API Documentation

Security Architecture

Threat Model

Deployment Guide

Local Development Guide

AWS Deployment Guide

Database Documentation

Testing Documentation

Disaster Recovery Plan

Cost Estimation

Future Roadmap

---

# 44. PROJECT QUALITY REQUIREMENT

Do NOT create a fake enterprise system consisting only of UI screens.

Every important UI feature should connect to a real backend implementation.

Avoid:

- hardcoded financial numbers
- fake dashboards
- fake security
- fake authentication
- fake AWS architecture
- unnecessary microservices
- unnecessary AI

The project should prioritize:

CORRECTNESS
SECURITY
SIMPLICITY
MAINTAINABILITY
TESTABILITY
SCALABILITY

---

# 45. DEVELOPMENT RULE

Build incrementally.

Do NOT attempt all modules simultaneously.

At every phase:

1. Design
2. Implement
3. Test
4. Secure
5. Document
6. Commit to Git
7. Review
8. Move to next phase

Each phase should leave the application functional.

---

# 46. FINAL TARGET ARCHITECTURE

The final conceptual system should look like:

                         USERS
                           |
                           v
                    AUTHENTICATION
                           |
                           v
                    AUTHORIZATION
                           |
                           v
                    APPLICATION
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
 PERSONAL             FAMILY              BUSINESS
 FINANCE              FINANCE             FINANCE
       |                   |                   |
       +-------------------+-------------------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
        RESTAURANT      PROJECT      INVESTMENTS
             |             |             |
             +-------------+-------------+
                           |
                           v
                    FUND MANAGEMENT
                           |
                           v
                   FINANCIAL ENGINE
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
    REPORTS            ANALYTICS             AI
                           |
                           v
                   SECURE DATA LAYER
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
   DATABASE           DOCUMENT STORAGE      BACKUPS
       |
       v
                 CLOUD INFRASTRUCTURE
       |
       +--- IAM
       +--- KMS
       +--- Monitoring
       +--- Logging
       +--- Security
       +--- Disaster Recovery

---

# 47. EXPECTED END RESULT

The final product should be a unified platform capable of managing financial information for different entity types while maintaining strong separation, authorization and privacy.

It should demonstrate professional skills in:

- Software Engineering
- FinTech
- Financial Systems
- Database Engineering
- Backend Development
- Frontend Development
- Cloud Computing
- AWS
- Cybersecurity
- DevOps
- Infrastructure as Code
- Data Analytics
- AI/ML
- System Design

The project should be suitable as:

1. A major academic project
2. A portfolio project
3. A Cloud Engineering project
4. A Cybersecurity/Cloud Security demonstration
5. A FinTech engineering project
6. A possible foundation for a future real-world product

---

# 48. FIRST TASK FOR THE AI

Before writing code, produce the following:

1. Complete system architecture
2. High-level architecture diagram
3. Detailed module breakdown
4. Database ER diagram
5. Database schema
6. User roles and permissions matrix
7. Threat model
8. Security architecture
9. REST API specification
10. Frontend page hierarchy
11. Backend folder structure
12. Development roadmap
13. Testing strategy
14. Local development setup
15. AWS deployment architecture
16. Estimated AWS cost for development
17. Production scaling strategy
18. Disaster recovery strategy
19. AI integration strategy
20. Future roadmap

After producing these, wait for approval before generating the complete implementation.

IMPORTANT:

Do not try to build everything in one step.

Start with the architecture and planning.

The system must remain modular so that new financial entity types and features can be added later without redesigning the entire platform.