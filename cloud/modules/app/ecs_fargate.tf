data "aws_secretsmanager_secret" "db_username" {
  name = "pansim/${var.env}/db/username"
}

data "aws_secretsmanager_secret" "db_password" {
  name = "pansim/${var.env}/db/password"
}

resource "aws_ecs_cluster" "pansim" {
  name = "pansim-${var.env}-django-app"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "pansim_app" {
    family = "pansim-django-${var.env}-task"
    execution_role_arn = aws_iam_role.fargate.arn
    task_role_arn = aws_iam_role.fargate.arn
    network_mode = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    cpu = 512
    memory = 1024

    container_definitions = jsonencode([{
        name      = "pansim-${var.env}-django"
        image     = "${aws_ecr_repository.ecr_django.repository_url}:latest"
        app_port = 80
        cpu       = 512
        memory    = 1024
        logConfiguration = {
            "logDriver": "awslogs",
            "options": {
                    "awslogs-group": aws_cloudwatch_log_group.ecs_container_logs.name,
                    "awslogs-region": "ca-central-1",
                    "awslogs-create-group": "true",
                    "awslogs-stream-prefix": "pansim-${var.env}-django"
            }
        }

        environment = [
            {
                "name": "env",
                "value": var.env
            },
            {
                "name": "other_variable",
                "value": "value_here"
            },
            {
                name = "DB_ENDPOINT"
                value = var.db_endpoint
            },
            {
                name = "DB_NAME"
                value = var.db_name
            },
            {
                name = "DB_HOST"
                value = var.db_host
            },
            {
                name = "DB_PORT"
                value = tostring(var.db_port)
            },
            {
                name = "MYSQL_ATTR_SSL_CA"
                value = "/etc/ssl/cert.pem"
            },
            {
                name = "USE_S3"
                value = "TRUE"
            },
            {
                name = "DEBUG"
                value = "TRUE"
            }
        ],
        secrets = [
            {
                name  = "DB_USERNAME"
                valueFrom = "${data.aws_secretsmanager_secret.db_username.arn}"
            },
            {
                name  = "DB_PASSWORD"
                valueFrom = "${data.aws_secretsmanager_secret.db_password.arn}"
            }
        ]
        essential = true
        portMappings = [
            {
            containerPort = 80
            hostPort      = 80
            }
        ]
    }])
}

resource "aws_ecs_service" "pansim_app" {
    cluster = aws_ecs_cluster.pansim.id
    name = "pansim-${var.env}-django"
    #task_definition = aws_ecs_task_definition.pansim_app.arn
    task_definition = "${aws_ecs_task_definition.pansim_app.family}:${max("${aws_ecs_task_definition.pansim_app.revision}", 1)}"

    #iam_role        = aws_iam_role.fargate.arn
    desired_count = var.desired_task_count
    launch_type = "FARGATE"
    force_new_deployment = true

    network_configuration {

        security_groups = [var.sg_id_application]
        subnets = [
            var.subnet_values["subnet-priv-pansim-${var.env}-app-01"].id, 
            var.subnet_values["subnet-priv-pansim-${var.env}-app-02"].id
        ]
  }

    load_balancer {
        target_group_arn = aws_alb_target_group.django_app.id
        container_name = "pansim-${var.env}-django"
        container_port = 80
  }

    depends_on = [aws_alb_listener.front_end]
  
}