resource "aws_route53_zone" "domain" {
  name = "${var.env}.pansim.ca"
}
