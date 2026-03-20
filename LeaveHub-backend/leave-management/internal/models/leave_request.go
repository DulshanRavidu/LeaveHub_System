package models

import "time"

type LeaveStatus string

const (
	LeavePending  LeaveStatus = "pending"
	LeaveApproved LeaveStatus = "approved"
	LeaveRejected LeaveStatus = "rejected"
)

type LeaveRequest struct {
	ID             uint        `gorm:"primaryKey" json:"id"`
	EmployeeID     uint        `gorm:"not null;index" json:"employeeId"`
	Employee       User        `gorm:"foreignKey:EmployeeID" json:"employee"`
	LeaveType      string      `gorm:"size:40;not null" json:"leaveType"`
	Reason         string      `gorm:"size:500;not null" json:"reason"`
	StartDate      time.Time   `gorm:"not null" json:"startDate"`
	EndDate        time.Time   `gorm:"not null" json:"endDate"`
	Status         LeaveStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`
	ManagerComment string      `gorm:"size:500" json:"managerComment"`
	ApprovedByID   *uint       `json:"approvedById"`
	ApprovedBy     *User       `gorm:"foreignKey:ApprovedByID" json:"approvedBy,omitempty"`
	CreatedAt      time.Time   `json:"createdAt"`
	UpdatedAt      time.Time   `json:"updatedAt"`
}
