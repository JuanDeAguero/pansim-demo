resource "aws_s3_bucket" "pansim_artifacts" {
  bucket = "pansim-artifacts-${var.env}"
}

# resource "aws_s3_object" "simulation_model" {
#   bucket = aws_s3_bucket.pansim_artifacts.bucket
#   key    = "/artifacts/model/simulation_model"
#   source = "../../files/simulation_model"
#   etag = filemd5("../../files/simulation_model")
# }

# resource "aws_s3_object" "simulation_data_aggregator" {
#   bucket = aws_s3_bucket.pansim_artifacts.bucket
#   key    = "/artifacts/model/data_aggregator.py"
#   source = "../../files/data_aggregator.py"
#   etag = filemd5("../../files/data_aggregator.py")
# }

# resource "aws_s3_object" "simulation_entry_point" {
#   bucket = aws_s3_bucket.pansim_artifacts.bucket
#   key    = "/artifacts/model/simulation_entry.sh"
#   source = "../../files/simulation_entry.sh"
#   etag = filemd5("../../files/simulation_entry.sh")
# }