data "netlify_site" "main" {
  id = var.netlify_site_id
}

output "database_host" {
  value = aiven_pg.tt_players_db.service_host
}

output "database_port" {
  value = aiven_pg.tt_players_db.service_port
}

output "netlify_site_name" {
  value = data.netlify_site.main.name
}

output "netlify_custom_domain" {
  value = data.netlify_site.main.custom_domain
}
