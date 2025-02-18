resource "aws_sns_topic" "batch_job_completion" {
  name = "pansim-${var.env}-batch-job-completion-topic"
}

resource "aws_cloudwatch_event_rule" "batch_job_event_rule" {
  name        = "pansim-${var.env}-batch-job-completion-event"
  description = "Triggers on AWS Batch Job completion"
  event_pattern = jsonencode({
    "source" : ["aws.batch"],
    "detail-type" : ["Batch Job State Change"],
    "detail" : {
      "status" : ["SUCCEEDED", "FAILED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns_target" {
  rule      = aws_cloudwatch_event_rule.batch_job_event_rule.name
  arn       = aws_sns_topic.batch_job_completion.arn
  target_id = "SendToSNS"
}

resource "aws_sns_topic_subscription" "api_endpoint_subscription" {
  topic_arn = aws_sns_topic.batch_job_completion.arn
  protocol  = "https"
  endpoint  = "https://yourdomain.com/your_api_endpoint"
}
