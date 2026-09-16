variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai — lowest latency for India-based users
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Short project identifier used in resource names"
  type        = string
  default     = "titanium-core"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (ALB)"
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (ECS tasks, RDS)"
  type        = list(string)
  default     = ["10.20.11.0/24", "10.20.12.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to spread subnets across"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "fintech_engine"
}

variable "db_username" {
  description = "Master username for RDS PostgreSQL"
  type        = string
  default     = "engine_admin"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class. db.t4g.micro is Free-Tier eligible for 12 months."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "backend_container_port" {
  description = "Port the FastAPI backend container listens on"
  type        = number
  default     = 8000
}

variable "backend_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Number of backend Fargate tasks to run"
  type        = number
  default     = 1
}

variable "backend_image_tag" {
  description = "Docker image tag in ECR to deploy (set by CI/CD or manual push)"
  type        = string
  default     = "latest"
}
