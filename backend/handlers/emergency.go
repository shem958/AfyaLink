package handlers

import (
	"log"
	"net/http"
	"time"

	"chronic-disease-platform/backend/models"
	"chronic-disease-platform/backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TriggerEmergency handles manual SOS signals from the patient application
func TriggerEmergency(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")

		alert := models.Alert{
			ID:        uuid.New().String(),
			PatientID: patientID,
			Type:      "emergency",
			Severity:  "critical",
			Message:   "EMERGENCY SOS Triggered by Patient",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := db.Create(&alert).Error; err != nil {
			log.Printf("Failed to log emergency: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to trigger emergency sequence"})
			return
		}

		// Dispatch SMS via the configured AT rules in services
		services.DispatchNotification(db, &alert)

		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"message": "Emergency alert dispatched to doctor",
			"alert": alert,
		})
	}
}
