terraform {
  backend "s3" {
    bucket = "aws-tfstate-pablocastano6-2026"
    key    = "agent-ai/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}
