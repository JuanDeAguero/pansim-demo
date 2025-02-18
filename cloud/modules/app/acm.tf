resource "aws_acm_certificate" "django_certificate" {
  domain_name       = "django.${var.env}.pansim.ca"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "acm_verification" {
  for_each = {
    for dvo in aws_acm_certificate.django_certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.aws_route53_zone_id
}
