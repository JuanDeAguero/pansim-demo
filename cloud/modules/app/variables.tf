variable "env" {}
variable "desired_task_count" {}
variable "vpc_id" {}
data "aws_caller_identity" "current" {}
variable "subnet_values" {
  description = "Map of subnet names to their IDs and names"
  type = map(object({
    name = string
    id = string
  }))
}
variable "sg_id_application" {}
variable "aws_route53_zone_id" {}
variable "db_endpoint" {}
variable "db_name" {}
variable "db_host" {}
variable "db_port" {}