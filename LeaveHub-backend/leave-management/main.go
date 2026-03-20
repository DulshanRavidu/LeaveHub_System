package main

import (
	"log"

	"leave-management/internal/config"
	"leave-management/internal/database"
	"leave-management/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := database.SeedDefaultManager(db, cfg); err != nil {
		log.Fatalf("failed to seed default manager: %v", err)
	}

	r := router.Setup(db, cfg)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
