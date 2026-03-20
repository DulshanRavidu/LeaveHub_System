package handlers

import (
	"net/http"
	"strings"

	"leave-management/internal/middleware"
	"leave-management/internal/models"
	"leave-management/internal/response"
	"leave-management/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EmployeeHandler struct {
	db *gorm.DB
}

func NewEmployeeHandler(db *gorm.DB) *EmployeeHandler {
	return &EmployeeHandler{db: db}
}

func (h *EmployeeHandler) requireCompanyManagementAccess(c *gin.Context) (models.User, bool) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return models.User{}, false
	}

	var actor models.User
	if err := h.db.First(&actor, authUser.ID).Error; err != nil {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return models.User{}, false
	}

	isManagerOrAdmin := actor.Role == models.RoleManager || actor.Role == models.RoleAdmin
	hasCompanyEmail := strings.HasSuffix(strings.ToLower(strings.TrimSpace(actor.Email)), "@company.com")

	if !isManagerOrAdmin || !hasCompanyEmail {
		response.Error(c, http.StatusForbidden, "only @company.com manager/admin can edit or delete employees")
		return models.User{}, false
	}

	return actor, true
}

func (h *EmployeeHandler) ListEmployees(c *gin.Context) {
	var users []models.User
	if err := h.db.Order("id desc").Find(&users).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to fetch employees")
		return
	}
	response.Success(c, http.StatusOK, "Employees fetched successfully", gin.H{"employees": users})
}

type CreateEmployeeRequest struct {
	FullName    string          `json:"fullName" binding:"required,min=3,max=120"`
	Email       string          `json:"email" binding:"required,email"`
	Password    string          `json:"password" binding:"required,min=8,max=64"`
	Role        models.UserRole `json:"role" binding:"required,oneof=employee manager admin"`
	Department  string          `json:"department" binding:"max=80"`
	Designation string          `json:"designation" binding:"max=80"`
}

func (h *EmployeeHandler) CreateEmployee(c *gin.Context) {
	var req CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Department = strings.TrimSpace(req.Department)

	if req.Role == models.RoleEmployee && strings.HasSuffix(req.Email, "@company.com") {
		response.Error(c, http.StatusBadRequest, "employee role cannot use @company.com email")
		return
	}

	if req.Role == models.RoleEmployee && strings.EqualFold(req.Department, "hr") {
		response.Error(c, http.StatusBadRequest, "HR users must be manager or admin")
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
		Role:         req.Role,
		Department:   req.Department,
		Designation:  req.Designation,
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create employee")
		return
	}

	response.Success(c, http.StatusCreated, "Employee created successfully", gin.H{"employee": user})
}

type UpdateEmployeeRequest struct {
	FullName    string          `json:"fullName" binding:"min=3,max=120"`
	Role        models.UserRole `json:"role" binding:"omitempty,oneof=employee manager admin"`
	Department  string          `json:"department" binding:"max=80"`
	Designation string          `json:"designation" binding:"max=80"`
}

func (h *EmployeeHandler) UpdateEmployee(c *gin.Context) {
	_, ok := h.requireCompanyManagementAccess(c)
	if !ok {
		return
	}

	id := c.Param("id")

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "employee not found")
		return
	}

	var req UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.Department != "" {
		user.Department = strings.TrimSpace(req.Department)
	}
	if req.Designation != "" {
		user.Designation = req.Designation
	}

	if user.Role == models.RoleEmployee && strings.HasSuffix(strings.ToLower(strings.TrimSpace(user.Email)), "@company.com") {
		response.Error(c, http.StatusBadRequest, "employee role cannot use @company.com email")
		return
	}

	if user.Role == models.RoleEmployee && strings.EqualFold(strings.TrimSpace(user.Department), "hr") {
		response.Error(c, http.StatusBadRequest, "HR users must be manager or admin")
		return
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to update employee")
		return
	}

	response.Success(c, http.StatusOK, "Employee updated successfully", gin.H{"employee": user})
}

func (h *EmployeeHandler) DeleteEmployee(c *gin.Context) {
	actor, ok := h.requireCompanyManagementAccess(c)
	if !ok {
		return
	}

	id := c.Param("id")

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "employee not found")
		return
	}

	if user.ID == actor.ID {
		response.Error(c, http.StatusBadRequest, "cannot delete your own account")
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.LeaveRequest{}).Where("approved_by_id = ?", user.ID).Update("approved_by_id", nil).Error; err != nil {
			return err
		}

		if err := tx.Where("employee_id = ?", user.ID).Delete(&models.LeaveRequest{}).Error; err != nil {
			return err
		}

		if err := tx.Delete(&user).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to delete employee")
		return
	}

	response.Success(c, http.StatusOK, "Employee deleted successfully", gin.H{})
}
