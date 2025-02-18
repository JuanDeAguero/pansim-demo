resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id 

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route_table_association" "public" {
  for_each = { for s in var.subnet_list : s.name => s if s.type == "public" }

  subnet_id      = aws_subnet.subnet[each.key].id
  route_table_id = aws_route_table.public.id
}


resource "aws_route_table" "private_route_table" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = null
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route_table_association" "private_subnet_association" {
  for_each = { for id, subnet in aws_subnet.subnet : id => subnet if subnet.tags["Type"] == "private" }

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_route_table.id
}
