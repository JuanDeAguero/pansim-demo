variable "env" {
    description = "Environment's acronym. Used to distinguish resource names when deploying modules."
    type = string
}

variable "desired_task_count" {
    description = "The number of concurrent tasks in ECS Fargate"
    type = number
}

variable "vpc_cidr_block" {
    description = "CIDR block for the VPC IP range"
    type = string
}

variable "subnet_list" {
    description = "List of private subnets and their configurations"
    type = list(object({
        name = string
        cidr = string
        type = string
        az   = string
  }))
}
