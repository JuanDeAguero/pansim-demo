resource "aws_alb" "main" {
  name                       = "pansim-${var.env}-django-lb"
  internal                   = false 
  enable_deletion_protection = false
  security_groups            = [var.sg_id_application]

  subnets = [
        var.subnet_values["subnet-pub-pansim-${var.env}-app-01"].id, 
        var.subnet_values["subnet-pub-pansim-${var.env}-app-02"].id
  ]
}

resource "aws_alb_target_group" "django_app" {
  name        = "pansim-${var.env}-django-target-group"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  stickiness {
    enabled = true
    type    = "lb_cookie"
  }

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200-499" #Change this after testing is done
    timeout             = "3"
    path                = "/"
    unhealthy_threshold = "2"
  }

}

resource "aws_alb_listener" "front_end" {
  load_balancer_arn = aws_alb.main.id
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.django_certificate.arn


  default_action {
    target_group_arn = aws_alb_target_group.django_app.id
    type = "forward"
  }
}

resource "aws_alb_listener" "redirect" {
  load_balancer_arn = aws_alb.main.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
  
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_route53_record" "django_lb" {
  zone_id = var.aws_route53_zone_id
  name    = "django"
  type    = "CNAME"
  ttl     = 300
  records = [aws_alb.main.dns_name]
}
