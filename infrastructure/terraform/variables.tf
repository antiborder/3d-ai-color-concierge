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
    "http://localhost:5173",
    # CloudFront domain will be added later with specific domain name
    # Example: "https://d1234567890.cloudfront.net"
  ]
}

variable "gemini_api_key" {
  description = "Gemini API key (sensitive - set via TF_VAR_gemini_api_key or terraform.tfvars)"
  type        = string
  sensitive   = true
  # No default - must be provided via environment variable or terraform.tfvars
  # Example: export TF_VAR_gemini_api_key=\"your-key-here\"
  # Or create terraform.tfvars (which should be in .gitignore)
}

# ============================================
# ECS / Fargate Spot variables
# ============================================

variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_a_cidr_block" {
  description = "CIDR block for public subnet (AZ a)"
  type        = string
  default     = "10.0.0.0/24"
}

variable "public_subnet_c_cidr_block" {
  description = "CIDR block for public subnet (AZ c)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "backend_port" {
  description = "Backend container port"
  type        = number
  default     = 8000
}

variable "backend_cpu" {
  description = "Backend task CPU units (Fargate). Example: 256 (0.25 vCPU)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Backend task memory (MiB). Example: 512"
  type        = number
  default     = 512
}

variable "backend_image_tag" {
  description = "ECR image tag to deploy"
  type        = string
  default     = "latest"
}

variable "backend_cpu_architecture" {
  description = "ECS task CPU architecture for Fargate (X86_64 or ARM64)"
  type        = string
  default     = "X86_64"
}

variable "gemini_model_name" {
  description = "Gemini model name (text command parsing / fallback)"
  type        = string
  default     = "gemini-3-flash-preview"
}

variable "gemini_live_model_name" {
  description = "Gemini Live model name (audio streaming)"
  type        = string
  default     = "gemini-live"
}

variable "duckdns_domain" {
  description = "DuckDNS subdomain (without .duckdns.org). Example: yourapp"
  type        = string
  default     = ""
}

variable "duckdns_token" {
  description = "DuckDNS token (sensitive)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ws_token_secret" {
  description = "Secret for generating/validating websocket auth token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "debug_ingress_cidr" {
  description = "Temporary debug ingress CIDR allowed to reach backend_port directly (e.g. \"203.0.113.4/32\"). Leave empty to disable."
  type        = string
  default     = ""
}

