data "aws_secretsmanager_secret" "db_username" {
  name = "pansim/${var.env}/db/username"
}

data "aws_secretsmanager_secret_version" "db_username" {
  secret_id = data.aws_secretsmanager_secret.db_username.id
}

data "aws_secretsmanager_secret" "db_password" {
  name = "pansim/${var.env}/db/password"
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
}

resource "aws_db_instance" "pansim" {
  allocated_storage      = 10
  identifier             = "pansim${var.env}mysqldb"
  db_name                = "pansim${var.env}"
  engine                 = "mysql"
  engine_version         = "8.0.36"
  instance_class         = "db.t3.micro"
  username               = data.aws_secretsmanager_secret_version.db_username.secret_string
  password               = data.aws_secretsmanager_secret_version.db_password.secret_string
  parameter_group_name   = "default.mysql8.0"
  skip_final_snapshot    = true
  db_subnet_group_name   = aws_db_subnet_group.pansim.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true #Set to false once development is complete
}

resource "aws_db_subnet_group" "pansim" {
  name       = "pansim-${var.env}-subnet-group"
  subnet_ids = [            
            #For the POC, we will keep all services in a public zone to reduce complexity and costs
            # var.subnet_values["subnet-priv-pansim-${var.env}-app-01"].id, 
            # var.subnet_values["subnet-priv-pansim-${var.env}-app-02"].id
            var.subnet_values["subnet-pub-pansim-${var.env}-app-01"].id, 
            var.subnet_values["subnet-pub-pansim-${var.env}-app-02"].id
    ]
}