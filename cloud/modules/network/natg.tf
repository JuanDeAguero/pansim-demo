resource "aws_eip" "nat_eip" {
}

resource "aws_nat_gateway" "nat_gateway" {
    allocation_id = aws_eip.nat_eip.id
    subnet_id = aws_subnet.subnet["subnet-pub-pansim-${var.env}-app-01"].id
}
