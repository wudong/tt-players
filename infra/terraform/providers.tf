terraform {
  required_providers {
    aiven = {
      source  = "aiven/aiven"
      version = "~> 4.0"
    }
    netlify = {
      source  = "netlify/netlify"
      version = "~> 0.1"
    }
  }
}

provider "aiven" {
  api_token = var.aiven_api_token
}

provider "netlify" {
  token = var.netlify_api_token
}
