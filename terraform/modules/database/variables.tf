variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "db_sg_id" {
  type = string
}
variable "db_password" {
  type      = string
  sensitive = true
}

