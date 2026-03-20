package handlers

import (
	"net/http"
	"strings"

	"leave-management/internal/config"
	"leave-management/internal/middleware"
	"leave-management/internal/models"
	"leave-management/internal/response"
	"leave-management/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg config.Config
}

func NewAuthHandler(db *gorm.DB, cfg config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

type SignUpRequest struct {
	FullName    string `json:"fullName" binding:"required,min=3,max=120"`
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8,max=64"`
	Department  string `json:"department" binding:"max=80"`
	Designation string `json:"designation" binding:"max=80"`
}

func (h *AuthHandler) SignUp(c *gin.Context) {
	var req SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if strings.HasSuffix(req.Email, "@company.com") {
		response.Error(c, http.StatusBadRequest, "@company.com email is reserved for manager/admin accounts")
		return
	}

	var existing models.User
	if err := h.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		response.Error(c, http.StatusConflict, "email already in use")
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to process password")
		return
	}

	user := models.User{
		FullName:     req.FullName,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         models.RoleEmployee,
		Department:   req.Department,
		Designation:  req.Designation,
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create user")
		return
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role), h.cfg.JWTSecret)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create token")
		return
	}

	response.Success(c, http.StatusCreated, "User created successfully", gin.H{"token": token, "user": user})
}

type SignInRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) SignIn(c *gin.Context) {
	var req SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := utils.ComparePassword(user.PasswordHash, req.Password); err != nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role), h.cfg.JWTSecret)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create token")
		return
	}

	response.Success(c, http.StatusOK, "Signed in successfully", gin.H{"token": token, "user": user})
}

func (h *AuthHandler) Me(c *gin.Context) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var user models.User
	if err := h.db.First(&user, authUser.ID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "user not found")
		return
	}

	response.Success(c, http.StatusOK, "User profile fetched successfully", gin.H{"user": user})
}
