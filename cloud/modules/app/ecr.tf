resource "aws_ecr_repository" "ecr_django" {
  name                 = "pansim-${var.env}-django"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}