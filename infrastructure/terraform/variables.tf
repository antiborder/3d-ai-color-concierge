variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "3d-color-concierge"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "dev"
}

variable "cors_origins" {
  description = "CORS allowed origins (wildcards not supported in API Gateway v2)"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "http://localhost:5173"
    # CloudFront domain will be added later with specific domain name
    # Example: "https://d1234567890.cloudfront.net"
  ]
}

