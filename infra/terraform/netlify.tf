resource "netlify_environment_variable" "database_url" {
  site_id = var.netlify_site_id
  team_id = var.netlify_team_id
  key     = "DATABASE_URL"

  values = [{
    context = "all"
    value   = "postgres://${aiven_pg.tt_players_db.service_username}:${aiven_pg.tt_players_db.service_password}@${aiven_pg.tt_players_db.service_host}:${aiven_pg.tt_players_db.service_port}/tt_players?sslmode=require"
  }]
}

resource "netlify_environment_variable" "vite_api_url" {
  site_id = var.netlify_site_id
  team_id = var.netlify_team_id
  key     = "VITE_API_URL"

  values = [{
    context = "all"
    value   = "/.netlify/functions/api"
  }]
}
