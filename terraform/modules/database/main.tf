resource "aws_db_subnet_group" "db_subnets" {
  name       = "seplat-db-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_db_instance" "postgres" {
  identifier = "seplat-production-db"

  allocated_storage = 20
  storage_type      = "gp3"

  engine         = "postgres"
  engine_version = "16.3"

  instance_class = "db.t3.micro"

  db_name  = "seplat_ops"
  username = "seplat_admin"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [var.db_sg_id]

  skip_final_snapshot = true
  publicly_accessible = false
}
