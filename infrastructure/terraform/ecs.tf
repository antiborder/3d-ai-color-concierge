# ============================================
# ECS / Fargate Spot (backend)
# ============================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}/backend"
  retention_in_days = 14
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_conv_log_s3" {
  name = "${var.project_name}-ecs-task-conv-log-s3"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.conv_logs.arn}/conversations/*"
      }
    ]
  })
}

data "aws_ec2_managed_prefix_list" "cloudfront_origin_facing" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "backend" {
  name        = "${var.project_name}-backend-sg"
  description = "Backend (FastAPI WS) exposed only to CloudFront origin-facing"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound (Gemini Live + DuckDNS update etc)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_security_group_rule" "backend_inbound_from_cloudfront" {
  type              = "ingress"
  security_group_id = aws_security_group.backend.id
  description       = "Allow CloudFront origin-facing to reach backend port"

  from_port = var.backend_port
  to_port   = var.backend_port
  protocol  = "tcp"

  prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront_origin_facing.id]
}

resource "aws_security_group_rule" "backend_inbound_debug" {
  count             = var.debug_ingress_cidr != "" ? 1 : 0
  type              = "ingress"
  security_group_id = aws_security_group.backend.id
  description       = "DEBUG: Allow direct access to backend port from a specific CIDR"

  from_port   = var.backend_port
  to_port     = var.backend_port
  protocol    = "tcp"
  cidr_blocks = [var.debug_ingress_cidr]
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.backend_cpu)
  memory                   = tostring(var.backend_memory)
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.backend_cpu_architecture
  }

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = var.backend_port
          hostPort      = var.backend_port
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "ENVIRONMENT", value = var.environment },
        { name = "CORS_ORIGINS", value = join(",", var.cors_origins) },
        { name = "GEMINI_API_KEY", value = var.gemini_api_key },
        { name = "GEMINI_MODEL_NAME", value = var.gemini_model_name },
        { name = "GEMINI_LIVE_MODEL_NAME", value = var.gemini_live_model_name },
        { name = "DUCKDNS_DOMAIN", value = var.duckdns_domain },
        { name = "DUCKDNS_TOKEN", value = var.duckdns_token },
        { name = "WS_TOKEN_SECRET", value = var.ws_token_secret },
        { name = "CONV_LOG_S3_BUCKET", value = aws_s3_bucket.conv_logs.id }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  depends_on      = [aws_ecs_cluster_capacity_providers.main]

  # Fargate Spot優先
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  # フォールバック（在庫切れ時）
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 0
    base              = 0
  }

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_c.id]
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = true
  }

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  enable_execute_command = false

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

