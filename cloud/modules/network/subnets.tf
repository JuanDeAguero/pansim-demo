resource "aws_subnet" "subnet" {
  for_each = { for s in var.subnet_list : s.name => s }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  map_public_ip_on_launch = each.value.type == "public" ? true : false
  
  tags = {
    Name = each.value.name
    Type = each.value.type
  }
}