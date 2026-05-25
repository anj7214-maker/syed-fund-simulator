variable "project_name" {
  type    = string
  default = "syed-fund-simulator"
}

variable "environment" {
  type    = string
  default = "customer-vpc"
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}

variable "allowed_vercel_egress_cidrs" {
  type        = list(string)
  description = "Explicit egress ranges allowed to call the customer API gateway. Use a controlled egress proxy for production."
  default     = []
}

variable "db_name" {
  type    = string
  default = "syed_fund"
}
