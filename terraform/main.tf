terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  public_subnets     = var.public_subnets
  availability_zones = var.availability_zones
}

module "security" {
  source = "./modules/security"

  vpc_id = module.vpc.vpc_id
}

module "database" {
  source = "./modules/database"

  db_password = var.db_password
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.subnet_ids
  db_sg_id    = module.security.db_sg_id
}

module "compute" {
  source = "./modules/compute"

  aws_region         = var.aws_region
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.subnet_ids
  alb_sg_id          = module.security.alb_sg_id
  ecs_sg_id          = module.security.ecs_sg_id
  execution_role_arn = module.security.execution_role_arn
  db_endpoint        = module.database.db_endpoint
  db_password        = var.db_password
}
