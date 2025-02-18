data "aws_secretsmanager_secret" "db_username" {
  name = "pansim/${var.env}/db/username"
}

data "aws_secretsmanager_secret" "db_password" {
  name = "pansim/${var.env}/db/password"
}

resource "aws_batch_compute_environment" "simulations" {
  compute_environment_name = "pansim-${var.env}-simulation-environment"

  compute_resources {
    max_vcpus = 16

    security_group_ids = [
      aws_security_group.batch.id
    ]

    subnets = [
      var.subnet_values["subnet-priv-pansim-${var.env}-app-01"].id, 
      var.subnet_values["subnet-priv-pansim-${var.env}-app-02"].id
      # var.subnet_values["subnet-pub-pansim-${var.env}-app-01"].id, 
      # var.subnet_values["subnet-pub-pansim-${var.env}-app-02"].id
    ]

    type = "FARGATE"

  }

  service_role = aws_iam_role.aws_batch_service_role.arn
  type         = "MANAGED"
  depends_on   = [aws_iam_role_policy_attachment.aws_batch_service_role]
}


resource "aws_batch_job_definition" "default_job_definition" {
  name = "pansim-${var.env}-simulation-job-definition"
  type = "container"
  platform_capabilities = ["FARGATE"]
  
  container_properties = jsonencode({
    command = ["sh", "-c", "chmod +x ./simulation_entry.sh && ./simulation_entry.sh"],
    executionRoleArn = aws_iam_role.batch_instance_role.arn
    image   = "${aws_ecr_repository.ecr_simulation.repository_url}:latest", 
    jobRoleArn = aws_iam_role.batch_instance_role.arn

    resourceRequirements = [
      {
        type  = "VCPU"
        value = "4.0"
      },
      {
        type  = "MEMORY"
        value = "8192"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs",
      options = {
        "awslogs-group" = "/aws/batch/job",
        "awslogs-region" = "ca-central-1", # Adjust to your region
        "awslogs-stream-prefix" = "pansim"
      }
    }

    network_configuration = {
      assign_public_ip = "ENABLED"
    }

    environment = [
      {
        name = "DB_ENDPOINT"
        value = var.db_endpoint
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
        name = "DB_NAME"
        value = var.db_name
      },
      {
        name = "ENV"
        value = var.env
      },
      {
        name  = "BUCKET_NAME"
        value = "pansim-artifacts-${var.env}"
      }

    ]

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
  })
}

resource "aws_batch_job_queue" "main_queue" {
  name     = "pansim-${var.env}-job-queue"
  state    = "ENABLED"
  priority = 1
  compute_environments = [
    aws_batch_compute_environment.simulations.arn
  ]
}