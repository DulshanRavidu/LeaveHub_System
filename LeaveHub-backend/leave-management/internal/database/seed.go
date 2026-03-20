package database

import (
	"errors"
	"strings"

	"leave-management/internal/config"
	"leave-management/internal/models"
	"leave-management/internal/utils"

	"gorm.io/gorm"
)

func SeedDefaultManager(db *gorm.DB, cfg config.Config) error {
	if err := db.Where("LOWER(full_name) = ?", "kusal perera").Delete(&models.User{}).Error; err != nil {
		return err
	}

	email := strings.ToLower(strings.TrimSpace(cfg.DefaultManagerEmail))
	password := strings.TrimSpace(cfg.DefaultManagerPassword)
	name := strings.TrimSpace(cfg.DefaultManagerName)

	if email == "" || password == "" || name == "" {
		return nil
	}

	var user models.User
	err := db.Where("email = ?", email).First(&user).Error
	if err == nil {
		if user.Role == models.RoleAdmin || user.Role == models.RoleManager {
			return nil
		}

		hash, hashErr := utils.HashPassword(password)
		if hashErr != nil {
			return hashErr
		}

		user.Role = models.RoleManager
		user.PasswordHash = hash
		if user.FullName == "" {
			user.FullName = name
		}
		if user.Department == "" {
			user.Department = "Management"
		}
		if user.Designation == "" {
			user.Designation = "Manager"
		}
		return db.Save(&user).Error
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hash, hashErr := utils.HashPassword(password)
	if hashErr != nil {
		return hashErr
	}

	seedUser := models.User{
		FullName:     name,
		Email:        email,
		PasswordHash: hash,
		Role:         models.RoleManager,
		Department:   "Management",
		Designation:  "Manager",
	}

	return db.Create(&seedUser).Error
}
