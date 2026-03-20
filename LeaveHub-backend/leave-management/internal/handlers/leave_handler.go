package handlers

import (
	"net/http"
	"time"

	"leave-management/internal/middleware"
	"leave-management/internal/models"
	"leave-management/internal/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LeaveHandler struct {
	db *gorm.DB
}

func NewLeaveHandler(db *gorm.DB) *LeaveHandler {
	return &LeaveHandler{db: db}
}

type CreateLeaveRequest struct {
	LeaveType string `json:"leaveType" binding:"required,max=40"`
	Reason    string `json:"reason" binding:"required,max=500"`
	StartDate string `json:"startDate" binding:"required"`
	EndDate   string `json:"endDate" binding:"required"`
}

func (h *LeaveHandler) CreateLeave(c *gin.Context) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid startDate, expected YYYY-MM-DD")
		return
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid endDate, expected YYYY-MM-DD")
		return
	}
	if endDate.Before(startDate) {
		response.Error(c, http.StatusBadRequest, "endDate cannot be before startDate")
		return
	}

	leave := models.LeaveRequest{
		EmployeeID: authUser.ID,
		LeaveType:  req.LeaveType,
		Reason:     req.Reason,
		StartDate:  startDate,
		EndDate:    endDate,
		Status:     models.LeavePending,
	}

	if err := h.db.Create(&leave).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create leave request")
		return
	}

	response.Success(c, http.StatusCreated, "Leave request created successfully", gin.H{"leave": leave})
}

func (h *LeaveHandler) ListMyLeaves(c *gin.Context) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var leaves []models.LeaveRequest
	if err := h.db.Preload("Employee").Preload("ApprovedBy").Where("employee_id = ?", authUser.ID).Order("id desc").Find(&leaves).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to fetch leave requests")
		return
	}

	response.Success(c, http.StatusOK, "Leave requests fetched successfully", gin.H{"leaves": leaves})
}

func (h *LeaveHandler) ListAllLeaves(c *gin.Context) {
	status := c.Query("status")

	query := h.db.Preload("Employee").Preload("ApprovedBy").Order("id desc")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var leaves []models.LeaveRequest
	if err := query.Find(&leaves).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to fetch leave requests")
		return
	}

	response.Success(c, http.StatusOK, "Leave requests fetched successfully", gin.H{"leaves": leaves})
}

type ReviewLeaveRequest struct {
	ManagerComment string `json:"managerComment" binding:"max=500"`
}

func (h *LeaveHandler) ApproveLeave(c *gin.Context) {
	h.reviewLeave(c, models.LeaveApproved)
}

func (h *LeaveHandler) RejectLeave(c *gin.Context) {
	h.reviewLeave(c, models.LeaveRejected)
}

func (h *LeaveHandler) reviewLeave(c *gin.Context, status models.LeaveStatus) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := c.Param("id")

	var leave models.LeaveRequest
	if err := h.db.First(&leave, id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "leave request not found")
		return
	}

	if leave.Status != models.LeavePending {
		response.Error(c, http.StatusBadRequest, "leave request already reviewed")
		return
	}

	var req ReviewLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	leave.Status = status
	leave.ManagerComment = req.ManagerComment
	leave.ApprovedByID = &authUser.ID

	if err := h.db.Save(&leave).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to update leave request")
		return
	}

	if err := h.db.Preload("Employee").Preload("ApprovedBy").First(&leave, leave.ID).Error; err != nil {
		response.Success(c, http.StatusOK, "Leave request reviewed successfully", gin.H{"leave": leave})
		return
	}

	response.Success(c, http.StatusOK, "Leave request reviewed successfully", gin.H{"leave": leave})
}
