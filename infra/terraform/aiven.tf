resource "aiven_pg" "tt_players_db" {
  project      = var.aiven_project_name
  cloud_name   = var.region
  plan         = var.aiven_plan
  service_name = "${var.app_name}-db"

  pg_user_config {
    pg_version = 17

    public_access {
      pg = true
    }
  }
}

resource "aiven_pg_database" "main" {
  project       = var.aiven_project_name
  service_name  = aiven_pg.tt_players_db.service_name
  database_name = "tt_players"
}
