package middleware

import (
	"net/http"
	"strings"

	"leave-management/internal/config"
	"leave-management/internal/models"
	"leave-management/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthUser struct {
	ID   uint
	Role models.UserRole
}

const ContextUserKey = "authUser"

func AuthRequired(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(token, cfg.JWTSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set(ContextUserKey, AuthUser{ID: claims.UserID, Role: models.UserRole(claims.Role)})
		c.Next()
	}
}

func RequireRoles(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawUser, exists := c.Get(ContextUserKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		authUser, ok := rawUser.(AuthUser)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if authUser.Role == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		c.Abort()
	}
}

func GetAuthUser(c *gin.Context) (AuthUser, bool) {
	rawUser, exists := c.Get(ContextUserKey)
	if !exists {
		return AuthUser{}, false
	}
	authUser, ok := rawUser.(AuthUser)
	return authUser, ok
}
