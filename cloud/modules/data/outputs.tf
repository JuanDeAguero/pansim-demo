output "s3_bucket" {
  value = aws_s3_bucket.pansim_artifacts.arn
  description = "The ARN of the S3 bucket"
}

output "db_endpoint" {
  value = aws_db_instance.pansim.endpoint
}

output "db_name" {
  value = aws_db_instance.pansim.db_name
}

output "db_host" {
  value = aws_db_instance.pansim.address
}

output "db_port" {
  value = aws_db_instance.pansim.port
}