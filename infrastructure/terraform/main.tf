terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    # 後で設定（S3バケットとDynamoDBテーブルが必要）
    # bucket = "your-terraform-state-bucket"
    # key    = "3d-color-concierge/terraform.tfstate"
    # region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# IAMロール（Lambda実行用）
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda基本実行ポリシーのアタッチ
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda関数のZIPパッケージ
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend"
  output_path = "${path.module}/lambda_function.zip"
  excludes = [
    "__pycache__",
    "*.pyc",
    ".env",
    "venv",
    "tests",
    "*.pyc",
    ".pytest_cache",
    ".git",
    "README.md"
  ]
}

# Lambda関数
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name   = "${var.project_name}-api"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "app.lambda_handler.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.13"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      ENVIRONMENT = var.environment
      CORS_ORIGINS = join(",", var.cors_origins)
      API_STAGE_NAME = var.stage_name
      GEMINI_API_KEY = var.gemini_api_key
    }
  }
}

# API Gateway REST API
resource "aws_apigatewayv2_api" "rest_api" {
  name          = "${var.project_name}-rest-api"
  protocol_type = "HTTP"
  description   = "REST API for 3D Color Concierge"
  
  cors_configuration {
    allow_origins = var.cors_origins
    allow_methods = ["*"]
    allow_headers = ["*"]
    allow_credentials = true
    max_age = 300
  }
}

# API Gateway統合
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.rest_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
}

# API Gatewayルート
resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.rest_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Lambda関数へのAPI Gateway実行権限
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action       = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal    = "apigateway.amazonaws.com"
  source_arn   = "${aws_apigatewayv2_api.rest_api.execution_arn}/*/*"
}

# API Gatewayステージ
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.rest_api.id
  name        = var.stage_name
  auto_deploy = true
}

