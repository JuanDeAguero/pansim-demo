data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "ecs-tasks.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "batch_instance_role" {
  name               = "pansim-${var.env}-batch-instance-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  inline_policy {
    name = "pansim-${var.env}-batch-instance-policy"
    policy = jsonencode(
    {
      "Version": "2012-10-17",
      "Statement": [
        { 
          "Action": [
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:DescribeLogStreams",
              "secretsmanager:GetSecretValue"
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
            "${aws_ecr_repository.ecr_simulation.arn}"
          ]
        }

      ]
    }
    )

}

}

resource "aws_iam_role_policy_attachment" "batch_instance_role" {
  role       = aws_iam_role.batch_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "batch_instance_profile" {
  name = "pansim-${var.env}-batch-instance-profile"
  role = aws_iam_role.batch_instance_role.name
}

data "aws_iam_policy_document" "batch_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["batch.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "aws_batch_service_role" {
  name               = "pansim-${var.env}-batch-service-role"
  assume_role_policy = data.aws_iam_policy_document.batch_assume_role.json

  inline_policy {
    name = "pansim-${var.env}-batch-instance-policy"
    policy = jsonencode(
    {
      "Version": "2012-10-17",
      "Statement": [
        { 
          "Action": [
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:DescribeLogStreams",
              "secretsmanager:GetSecretValue"
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
            "${aws_ecr_repository.ecr_simulation.arn}"
          ]
        }

      ]
    }
    )

}
}

resource "aws_iam_role_policy_attachment" "aws_batch_service_role" {
  role       = aws_iam_role.aws_batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}
