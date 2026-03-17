package handlers

import (
	"net/http"
	"time"

	"chronic-disease-platform/backend/models"
	"chronic-disease-platform/backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetReadings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.Param("patientId")
		readingType := c.Query("type")
		limit := 90 // last 90 readings

		query := db.Where("patient_id = ?", patientID).Order("recorded_at desc").Limit(limit)
		if readingType != "" {
			query = query.Where("type = ?", readingType)
		}

		var readings []models.HealthReading
		query.Find(&readings)
		c.JSON(http.StatusOK, gin.H{"readings": readings})
	}
}

func PatientReadings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")
		var readings []models.HealthReading
		db.Where("patient_id = ?", patientID).Order("recorded_at desc").Limit(60).Find(&readings)
		c.JSON(http.StatusOK, gin.H{"readings": readings})
	}
}

func PostReading(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")

		var input struct {
			Type      string   `json:"type" binding:"required"` // "blood_pressure", "glucose", "heart_rate"
			Systolic  *float64 `json:"systolic"`
			Diastolic *float64 `json:"diastolic"`
			Value     *float64 `json:"value"`
			Unit      string   `json:"unit"`
			Notes     string   `json:"notes"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		reading := models.HealthReading{
			ID:         uuid.New().String(),
			PatientID:  patientID,
			Type:       input.Type,
			Systolic:   input.Systolic,
			Diastolic:  input.Diastolic,
			Value:      input.Value,
			Unit:       input.Unit,
			Notes:      input.Notes,
			RecordedAt: time.Now(),
			CreatedAt:  time.Now(),
		}

		if err := db.Create(&reading).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save reading"})
			return
		}

		// Run alert engine asynchronously
		go services.EvaluateReading(db, &reading)

		c.JSON(http.StatusCreated, gin.H{"reading": reading})
	}
}
