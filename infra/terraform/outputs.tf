output "alb_dns_name" {
  description = "Public DNS name of the load balancer — this is your API base URL"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "Push your backend Docker image here"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (private — reachable only from within the VPC)"
  value       = aws_db_instance.postgres.address
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.backend.name
}

output "s3_documents_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "db_credentials_secret_name" {
  description = "Secrets Manager secret holding the RDS master credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "app_secrets_secret_name" {
  description = "Secrets Manager secret holding the JWT signing key"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "vpc_id" {
  value = aws_vpc.main.id
}
