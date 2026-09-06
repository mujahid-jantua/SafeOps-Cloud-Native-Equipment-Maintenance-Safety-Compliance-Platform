resource "aws_ecr_repository" "repo" {
  for_each = toset([
    "frontend",
    "backend",
    "ml-service"
  ])

  name                 = "seplat-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecs_cluster" "cluster" {
  name = "seplat-cluster"
}

resource "aws_cloudwatch_log_group" "logs" {
  for_each = toset([
    "frontend",
    "backend",
    "ml-service"
  ])

  name              = "/ecs/seplat-${each.key}"
  retention_in_days = 7
}

resource "aws_alb" "alb" {
  name               = "seplat-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    var.alb_sg_id
  ]

  subnets = var.subnet_ids
}

resource "aws_lb_target_group" "tg" {
  for_each = {
    frontend   = 80
    backend    = 5000
    ml-service = 8000
  }

  name        = "seplat-tg-${each.key}"
  port        = each.value
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path = each.key == "frontend" ? "/" : (
      each.key == "backend"
      ? "/api/v1/health"
      : "/api/ml/health"
    )

    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_alb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg["frontend"].arn
  }
}

resource "aws_lb_listener_rule" "ml" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg["ml-service"].arn
  }

  condition {
    path_pattern {
      values = ["/api/ml*"]
    }
  }
}

resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg["backend"].arn
  }

  condition {
    path_pattern {
      values = ["/api/v1*"]
    }
  }
}

resource "aws_ecs_task_definition" "task" {
  for_each = toset([
    "frontend",
    "backend",
    "ml-service"
  ])

  family                   = "seplat-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  cpu = each.key == "frontend" ? "256" : (
    each.key == "backend" ? "256" : "512"
  )

  memory = each.key == "frontend" ? "512" : (
    each.key == "backend" ? "512" : "1024"
  )

  execution_role_arn = var.execution_role_arn

  container_definitions = jsonencode([
    {
      name = "seplat-${each.key}"

      image = "${aws_ecr_repository.repo[each.key].repository_url}:latest"

      essential = true

      portMappings = [
        {
          containerPort = each.key == "frontend" ? 80 : (
            each.key == "backend" ? 5000 : 8000
          )
        }
      ]

      environment = [
        {
          name  = "DATABASE_URL"
          value = "postgresql://seplat_admin:${var.db_password}@${var.db_endpoint}/seplat_ops"
        },
        {
          name  = "ML_SERVICE_URL"
          value = "http://${aws_alb.alb.dns_name}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.logs[each.key].name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = each.key
        }
      }
    }
  ])
}

resource "aws_ecs_service" "service" {
  for_each = toset([
    "frontend",
    "backend",
    "ml-service"
  ])

  name            = "seplat-${each.key}-service"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.task[each.key].arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets = var.subnet_ids

    security_groups = [
      var.ecs_sg_id
    ]

    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tg[each.key].arn

    container_name = "seplat-${each.key}"

    container_port = each.key == "frontend" ? 80 : (
      each.key == "backend" ? 5000 : 8000
    )
  }
}

