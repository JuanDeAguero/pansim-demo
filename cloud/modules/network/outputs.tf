output "vpc_id" {
  value = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "subnet_values" {
  value = { for s in aws_subnet.subnet : s.tags["Name"] => { name = s.tags["Name"], id = s.id } }
  description = "Map of subnet names to their IDs and names"
}

output "sg_id_application" {
  value = aws_security_group.application.id
}

output "aws_route53_zone_id" {
  value = aws_route53_zone.domain.zone_id
}