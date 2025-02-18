resource "aws_cloudwatch_log_group" "ecs_container_logs" {
  name = "/pansim/${var.env}/ecs-fargate/container-logs"
}