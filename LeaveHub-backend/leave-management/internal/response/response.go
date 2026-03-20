package response

import "github.com/gin-gonic/gin"

type APIResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

func Success(c *gin.Context, status int, message string, data any) {
	if data == nil {
		data = gin.H{}
	}

	c.JSON(status, APIResponse{
		Status:  status,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, status int, message string) {
	c.JSON(status, APIResponse{
		Status:  status,
		Message: message,
		Data:    nil,
	})
}
