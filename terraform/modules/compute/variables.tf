variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "alb_sg_id" {
  type = string
}

variable "ecs_sg_id" {
  type = string
}

variable "execution_role_arn" {
  type = string
}

variable "db_endpoint" {
  type = string
}
variable "db_password" {
  type      = string
  sensitive = true
}
