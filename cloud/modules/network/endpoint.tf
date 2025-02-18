#Private endpoints not needed for POC 

# resource "aws_vpc_endpoint" "ecr" {
#   vpc_id       = aws_vpc.main.id
#   service_name = "com.amazonaws.ca-central-1.ecr"
# }

# resource "aws_vpc_endpoint" "s3" {
#   vpc_id       = aws_vpc.main.id
#   service_name = "com.amazonaws.ca-central-1.s3"
# }

# resource "aws_vpc_endpoint" "cloudwatch" {
#   vpc_id       = aws_vpc.main.id
#   service_name = "com.amazonaws.ca-central-1.cloudwatch"
# }