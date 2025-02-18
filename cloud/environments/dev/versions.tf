terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      #version = ">= 3.49.0"
    }
  }
  backend "s3" {
    bucket = "pansim-artifacts-dev"
    key    = "terraform-states/environment.tfstate"
    region = "ca-central-1"
  }
}

provider "aws" {
  region = "ca-central-1"
}
