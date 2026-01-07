output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.rest_api.api_endpoint
}

output "api_stage_url" {
  description = "API Gateway stage URL"
  value       = "${aws_apigatewayv2_api.rest_api.api_endpoint}/${aws_apigatewayv2_stage.api_stage.name}"
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

