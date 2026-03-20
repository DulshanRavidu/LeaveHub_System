package handlers

import (
	"net/http"

	"leave-management/internal/middleware"
	"leave-management/internal/models"
	"leave-management/internal/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) Overview(c *gin.Context) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var totalEmployees int64
	_ = h.db.Model(&models.User{}).Count(&totalEmployees).Error

	var pendingLeaves int64
	_ = h.db.Model(&models.LeaveRequest{}).Where("status = ?", models.LeavePending).Count(&pendingLeaves).Error

	var approvedLeaves int64
	_ = h.db.Model(&models.LeaveRequest{}).Where("status = ?", models.LeaveApproved).Count(&approvedLeaves).Error

	var rejectedLeaves int64
	_ = h.db.Model(&models.LeaveRequest{}).Where("status = ?", models.LeaveRejected).Count(&rejectedLeaves).Error

	payload := gin.H{
		"totalEmployees": totalEmployees,
		"pendingLeaves":  pendingLeaves,
		"approvedLeaves": approvedLeaves,
		"rejectedLeaves": rejectedLeaves,
	}

	if authUser.Role == models.RoleEmployee {
		var myPending int64
		var myApproved int64
		var myRejected int64
		_ = h.db.Model(&models.LeaveRequest{}).Where("employee_id = ? AND status = ?", authUser.ID, models.LeavePending).Count(&myPending).Error
		_ = h.db.Model(&models.LeaveRequest{}).Where("employee_id = ? AND status = ?", authUser.ID, models.LeaveApproved).Count(&myApproved).Error
		_ = h.db.Model(&models.LeaveRequest{}).Where("employee_id = ? AND status = ?", authUser.ID, models.LeaveRejected).Count(&myRejected).Error

		payload["myPendingLeaves"] = myPending
		payload["myApprovedLeaves"] = myApproved
		payload["myRejectedLeaves"] = myRejected
	}

	response.Success(c, http.StatusOK, "Dashboard overview fetched successfully", payload)
}
