# Execution Guide — Titanium Core

All paths below assume you extract the delivered zip to:

```
C:\Users\shiva\TitaniumCore
```

If you extract it somewhere else, substitute that path everywhere `cd` is used.

---

## Part 1 — Run it locally with Docker (fastest way to see it working)

**Prerequisites:** Docker Desktop installed and running on Windows.

```powershell
# 1. Unzip and enter the project
cd C:\Users\shiva
Expand-Archive -Path .\TitaniumCore.zip -DestinationPath C:\Users\shiva\TitaniumCore
cd C:\Users\shiva\TitaniumCore

# 2. Build and start Postgres + the FastAPI backend
docker compose up --build -d

# 3. Apply database migrations (creates organizations/users/accounts/... tables)
docker compose exec backend alembic upgrade head

# 4. Sync any ORM-only tables (budgets, goals, recurring_schedules use
#    Base.metadata.create_all as a lightweight fallback alongside Alembic)
docker compose exec backend python /app/init_db.py

# 5. Confirm the backend is healthy
curl.exe http://localhost:8000/healthz
# Expected: {"status":"ok"}

# 6. Open interactive API docs in your browser
start http://localhost:8000/docs
```

**View logs / stop the stack:**

```powershell
docker compose logs -f backend      # tail backend logs, Ctrl+C to stop tailing
docker compose down                 # stop and remove containers
docker compose down -v              # also wipe the Postgres volume (fresh start)
```

---

## Part 2 — Run the frontend locally

**Prerequisites:** Node.js 18+ and npm installed.

```powershell
cd C:\Users\shiva\TitaniumCore\frontend
npm install
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). Open it —
you should see the Apple-glass sign-up/login screen. Register an account,
create a couple of ASSET/EXPENSE accounts, post a journal entry, then check
the **Goals** and **Automation** tabs added in this update.

To produce a production build (this now works — the previously missing
`tsconfig.json` has been added):

```powershell
npm run build
```

Output lands in `frontend\dist\` — serve it with any static host (S3+CloudFront,
Netlify, Vercel, or `npx serve dist`).

---

## Part 3 — Deploy the infrastructure to AWS with Terraform

**Prerequisites:**
- An AWS account with an IAM user/role that has permission to create VPC,
  RDS, ECS, ALB, ECR, IAM, Secrets Manager, S3, and CloudWatch resources.
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
  (`aws configure`) with that user's access key.
- [Terraform](https://developer.hashicorp.com/terraform/install) 1.6+ installed and on your PATH.
- Docker Desktop (to build and push the backend image).

```powershell
cd C:\Users\shiva\TitaniumCore\infra\terraform

# 1. Copy and (optionally) edit variables
Copy-Item terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars

# 2. Initialize Terraform (downloads the AWS + random providers)
terraform init

# 3. Review the plan — read this before applying, it lists every resource
terraform plan -out plan.tfplan

# 4. Apply — this takes ~8-12 minutes, mostly waiting on RDS
terraform apply plan.tfplan
```

Once it finishes, Terraform prints outputs including `ecr_repository_url`,
`alb_dns_name`, `ecs_cluster_name`, `ecs_service_name`, and `rds_endpoint`.
Keep this terminal open, or re-run `terraform output` any time.

### 3a. Build and push the backend image

```powershell
cd C:\Users\shiva\TitaniumCore
$ECR_URL = terraform -chdir=infra\terraform output -raw ecr_repository_url
$REGION  = terraform -chdir=infra\terraform output -raw -json | Out-Null  # (region is in your tfvars, e.g. ap-south-1)

aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_URL
docker build -t "${ECR_URL}:latest" .\backend
docker push "${ECR_URL}:latest"
```

### 3b. Force the ECS service to pick up the new image

```powershell
$CLUSTER = terraform -chdir=infra\terraform output -raw ecs_cluster_name
$SERVICE = terraform -chdir=infra\terraform output -raw ecs_service_name

aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment --region ap-south-1
```

Wait 2-3 minutes for the new task to become healthy, then check:

```powershell
$ALB = terraform -chdir=infra\terraform output -raw alb_dns_name
curl.exe "http://$ALB/healthz"
```

### 3c. Run migrations against RDS

RDS is intentionally **not** publicly accessible. The simplest way to run
Alembic against it from Windows is a one-off ECS task using the same image
and network config as the service:

```powershell
aws ecs run-task `
  --cluster $CLUSTER `
  --task-definition (aws ecs describe-services --cluster $CLUSTER --services $SERVICE --query "services[0].taskDefinition" --output text --region ap-south-1) `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-id>],securityGroups=[<ecs-sg-id>],assignPublicIp=DISABLED}" `
  --overrides '{"containerOverrides":[{"name":"backend","command":["alembic","upgrade","head"]}]}' `
  --region ap-south-1
```

Get the actual subnet/security-group IDs from `terraform output vpc_id` plus
`aws ec2 describe-subnets` / `describe-security-groups`, or read them
straight from the AWS Console → VPC.

### 3d. Tear it down when you're done demoing

```powershell
cd C:\Users\shiva\TitaniumCore\infra\terraform
terraform destroy
```

Confirm with `yes` when prompted. This avoids ongoing charges (see
`infra/terraform/README.md` for the cost breakdown — the NAT Gateway and ALB
are the two line items that bill even when idle).

---

## Troubleshooting quick reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `docker compose up` fails to pull postgres image | No internet / Docker not running | Start Docker Desktop, retry |
| `alembic upgrade head` errors on a missing table | Migrations run before `init_db.py` sync step | Run Part 1, Step 3 before Step 4, in that order |
| Frontend shows CORS errors | Backend not running on :8000, or `VITE` dev server on unexpected port | Confirm `docker compose ps` shows backend `Up`; CORS in `main.py` already allows `*` for local dev |
| `terraform apply` fails with "no available AZ" | Your account/region doesn't have `ap-south-1a`/`1b` enabled | Change `availability_zones` and `aws_region` in `terraform.tfvars` |
| ECS tasks stuck `PENDING` | No image pushed to ECR yet | Complete step 3a before expecting the service to go healthy |
| `curl` not recognized | Using old PowerShell alias conflict | Use `curl.exe` explicitly, as shown above |
