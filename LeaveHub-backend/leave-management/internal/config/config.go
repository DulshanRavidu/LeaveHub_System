package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                   string
	DatabaseURL            string
	JWTSecret              string
	DefaultManagerEmail    string
	DefaultManagerPassword string
	DefaultManagerName     string
}

func Load() Config {
	_ = godotenv.Load()

	port := getEnv("PORT", "8080")
	databaseURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/leavehub?sslmode=disable")
	jwtSecret := getEnv("JWT_SECRET", "change-me-in-production")
	defaultManagerEmail := getEnv("DEFAULT_MANAGER_EMAIL", "dulshan001@company.com")
	defaultManagerPassword := getEnv("DEFAULT_MANAGER_PASSWORD", "Manager@123")
	defaultManagerName := getEnv("DEFAULT_MANAGER_NAME", "Default Manager")

	return Config{
		Port:                   port,
		DatabaseURL:            databaseURL,
		JWTSecret:              jwtSecret,
		DefaultManagerEmail:    defaultManagerEmail,
		DefaultManagerPassword: defaultManagerPassword,
		DefaultManagerName:     defaultManagerName,
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
