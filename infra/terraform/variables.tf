variable "aiven_api_token" {
  description = "Aiven API token"
  type        = string
  sensitive   = true
}

variable "netlify_api_token" {
  description = "Netlify API token"
  type        = string
  sensitive   = true
}

variable "netlify_site_id" {
  description = "Netlify Site ID"
  type        = string
}

variable "netlify_team_id" {
  description = "Netlify Team ID (slug or ID)"
  type        = string
}

variable "aiven_project_name" {
  description = "Aiven project name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "tt-players"
}

variable "aiven_plan" {
  description = "Aiven service plan"
  type        = string
  default     = "hobbyist"
}

variable "region" {
  description = "Cloud region for Aiven"
  type        = string
  default     = "google-europe-west1"
}
