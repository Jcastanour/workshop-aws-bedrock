resource "aws_s3_bucket" "frontend" {
  bucket = "aws-agent-ai-pablocastano6-2026"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  depends_on = [
    aws_s3_bucket_public_access_block.frontend
  ]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = ["${aws_s3_bucket.frontend.arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role" "lambda_role" {
  name = "ai-lambda-role-pablocastano6"
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

resource "aws_iam_role_policy" "lambda_policy" {
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["bedrock:InvokeModel"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["logs:*"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "ai_api" {
  function_name    = "pablocastano6-ai-cloud-practitioner-agente"
  role             = aws_iam_role.lambda_role.arn
  handler          = "app.lambda_handler"
  runtime          = "python3.12"
  filename         = "../app/lambda/lambda.zip"
  source_code_hash = filebase64sha256("../app/lambda/lambda.zip")
  timeout          = 30
}

resource "aws_apigatewayv2_api" "api" {
  name          = "ai-api-pablocastano6"
  protocol_type = "HTTP"
  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.ai_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "ask" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /ask"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "dev" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
