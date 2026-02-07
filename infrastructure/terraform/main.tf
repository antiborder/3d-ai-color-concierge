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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
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

# S3バケット（Lambdaデプロイ用）
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.project_name}-lambda-deployments-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3オブジェクト（Lambda ZIPをアップロード）
resource "aws_s3_object" "lambda_zip" {
  bucket = aws_s3_bucket.lambda_deployments.id
  key    = "lambda_function_${data.archive_file.lambda_zip.output_base64sha256}.zip"
  source = data.archive_file.lambda_zip.output_path
  etag   = data.archive_file.lambda_zip.output_md5
}

# Lambda実行ロールにS3読み取り権限を追加
resource "aws_iam_role_policy" "lambda_s3_read" {
  name = "${var.project_name}-lambda-s3-read"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.lambda_deployments.arn}/*"
      }
    ]
  })
}

# Lambda関数
resource "aws_lambda_function" "api" {
  s3_bucket        = aws_s3_bucket.lambda_deployments.id
  s3_key           = aws_s3_object.lambda_zip.key
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

# ============================================
# フロントエンド用リソース
# ============================================

# S3バケット（フロントエンド用）
resource "random_id" "frontend_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}-${random_id.frontend_bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3バケットポリシー（CloudFront経由でアクセス可能にする）
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# S3バケットのウェブサイトホスティング設定（CloudFront用）
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFrontディストリビューション
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "${var.project_name} frontend distribution"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # SPA用のエラーページ設定
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudFront URLをCORS設定に追加するためのローカル変数
locals {
  cloudfront_url = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  cors_origins_with_cloudfront = concat(
    var.cors_origins,
    [local.cloudfront_url]
  )
}