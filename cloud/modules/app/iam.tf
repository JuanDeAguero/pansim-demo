resource "aws_iam_role" "fargate" {
  name = "pansim-${var.env}-fargate-django-role"


  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = [
            "ecs.amazonaws.com",
            "ecs-tasks.amazonaws.com",
            "ec2.amazonaws.com"
          ]
        }
      }
    ]
  })

  inline_policy {
    name = "pansim-${var.env}-fargate-django-policy"
    policy = jsonencode(
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": [
            "ecr:DescribeImages",
            "ecr:DescribeRepositories",
            "ecr:ListImages",
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage"
          ],
          "Effect": "Allow",
          "Resource": [
            "${aws_ecr_repository.ecr_django.arn}"
          ]
        },
        {
          "Action": [
            "batch:SubmitJob",
            "batch:ListJobs",
            "batch:DescribeJobs",
            "ecr:GetAuthorizationToken"
          ],
          "Effect": "Allow",
          "Resource": [
            
            "*"

          ]
        },
        { 
          "Action": [
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:Get*"
          ],
          "Effect": "Allow",
          "Resource": [
            "*"
          ]
        },
        {
          "Action": [
            "s3:ListBucket",
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Effect": "Allow",
          "Resource": [
            "arn:aws:s3:::pansim-artifacts-${var.env}",
            "arn:aws:s3:::pansim-artifacts-${var.env}/*"
          ]
        },
        {
          "Action": [
          "secretsmanager:GetSecretValue"
          ],
          "Effect": "Allow",
          "Resource": [
            "*"
          ]
        }

      ]
    }
    )

}
}
resource "aws_iam_instance_profile" "fargate" {
  name = "pansim-${var.env}-django-profile"
  role = aws_iam_role.fargate.name
}
