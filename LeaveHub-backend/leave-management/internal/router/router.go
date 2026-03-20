package router

import (
	"leave-management/internal/config"
	"leave-management/internal/handlers"
	"leave-management/internal/middleware"
	"leave-management/internal/models"
	"leave-management/internal/response"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg config.Config) *gin.Engine {
	r := gin.Default()
	r.Use(cors.Default())

	authHandler := handlers.NewAuthHandler(db, cfg)
	employeeHandler := handlers.NewEmployeeHandler(db)
	leaveHandler := handlers.NewLeaveHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)

	r.GET("/", func(c *gin.Context) {
		response.Success(c, 200, "Success", gin.H{"service": "LeaveHub backend is running"})
	})

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			response.Success(c, 200, "Success", gin.H{"status": "ok"})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.SignUp)
			auth.POST("/signin", authHandler.SignIn)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(cfg))
		{
			protected.GET("/me", authHandler.Me)
			protected.GET("/dashboard/overview", dashboardHandler.Overview)

			employees := protected.Group("")
			employees.Use(middleware.RequireRoles(models.RoleEmployee))
			{
				employees.POST("/leaves", leaveHandler.CreateLeave)
				employees.GET("/leaves/my", leaveHandler.ListMyLeaves)
			}

			management := protected.Group("")
			management.Use(middleware.RequireRoles(models.RoleManager, models.RoleAdmin))
			{
				management.GET("/employees", employeeHandler.ListEmployees)
				management.POST("/employees", employeeHandler.CreateEmployee)
				management.PUT("/employees/:id", employeeHandler.UpdateEmployee)
				management.DELETE("/employees/:id", employeeHandler.DeleteEmployee)

				management.GET("/leaves", leaveHandler.ListAllLeaves)
				management.PATCH("/leaves/:id/approve", leaveHandler.ApproveLeave)
				management.PATCH("/leaves/:id/reject", leaveHandler.RejectLeave)
			}
		}
	}

	return r
}
