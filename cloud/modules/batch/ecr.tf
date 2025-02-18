resource "aws_ecr_repository" "ecr_simulation" {
  name                 = "pansim-${var.env}-simulation-environment"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}