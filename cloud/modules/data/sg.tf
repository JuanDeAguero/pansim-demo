resource "aws_security_group" "rds" {
    name = "pansim-${var.env}-sg-database-mysql"
    vpc_id      = var.vpc_id

    ingress {
        from_port   = 3306
        to_port     = 3306
        protocol    = "tcp"
        cidr_blocks = [var.vpc_cidr_block]
    }

    #For development work. Delete later.
    ingress {
        from_port   = 3306
        to_port     = 3306
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"] #For development work. Delete later.
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
        }
}
