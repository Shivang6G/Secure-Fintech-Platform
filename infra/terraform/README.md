# Titanium Core — Terraform (AWS)

Provisions: VPC (2 public + 2 private subnets across 2 AZs), single NAT
Gateway, Application Load Balancer, ECS Fargate cluster/service running the
backend container, RDS PostgreSQL 16 (private, encrypted), ECR repository,
Secrets Manager (DB credentials + JWT key), an encrypted+versioned S3 bucket
for future document storage, and CloudWatch logs/alarms. No Route 53 record
is created — point your own domain at the `alb_dns_name` output if you have
one.

## Estimated monthly cost (ap-south-1, dev-sized, first 12 months)

| Resource | Est. cost/month |
|---|---|
| RDS db.t4g.micro | Free Tier eligible (₹0 for 12 months, then ~$13) |
| NAT Gateway (1x) | ~$32 (largest single cost — see note below) |
| ECS Fargate (0.25 vCPU / 0.5GB, 1 task) | ~$9 |
| Application Load Balancer | ~$16 |
| S3 + Secrets Manager + CloudWatch | ~$2–3 |
| **Total** | **~$60/month** (~₹5,000) after Free Tier RDS expires; **~$59/month** during it |

The NAT Gateway is the biggest line item relative to what this project needs.
For a portfolio/demo deployment you don't run 24/7, consider:
`terraform destroy` when not actively demoing it, or replacing the NAT
Gateway with a NAT instance (cheaper, more ops overhead) — not done here to
keep the module simple and correct by default.

## Usage

See `../../EXECUTION_GUIDE.md` Part 2 for the full Windows PowerShell
walkthrough. Short version:

```powershell
cd infra\terraform
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan
```

Build and push the backend image before the ECS service will have anything
to run (also covered in EXECUTION_GUIDE.md):

```powershell
$ECR = terraform output -raw ecr_repository_url
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR
docker build -t "$ECR:latest" ..\..\backend
docker push "$ECR:latest"
aws ecs update-service --cluster (terraform output -raw ecs_cluster_name) --service (terraform output -raw ecs_service_name) --force-new-deployment
```

Run the Alembic migration against the RDS instance once it's reachable
(from a machine inside the VPC, e.g. an ECS Exec session or a temporary
bastion — RDS is intentionally not publicly accessible).

## Tearing down

```powershell
terraform destroy
```

This deletes everything Terraform created, including the RDS instance
(`skip_final_snapshot = true` in `dev`, so no snapshot is kept — set
`environment = "prod"` in your tfvars if you want deletion protection and a
final snapshot instead).
