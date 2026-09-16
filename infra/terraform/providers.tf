terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment and configure once you have created the S3 bucket + DynamoDB
  # lock table for remote state (see EXECUTION_GUIDE.md, Step 7).
  # backend "s3" {
  #   bucket         = "titanium-core-tfstate-<your-unique-suffix>"
  #   key            = "titanium-core/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "titanium-core-tf-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "TitaniumCore"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
