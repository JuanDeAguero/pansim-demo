resource "aws_secretsmanager_secret" "db_username" {
  name        = "pansim/${var.env}/db/username"
  description = "MySQL database username"

  tags = {
    Environment = var.env
  }
}


resource "aws_secretsmanager_secret" "db_password" {
  name        = "pansim/${var.env}/db/password"
  description = "MySQL database password"

  tags = {
    Environment = var.env
  }
}
