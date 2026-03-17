package handlers

import (
	"net/http"
	"time"

	"chronic-disease-platform/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func ListPatients(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		doctorID := c.GetString("user_id")
		condition := c.Query("condition")
		search := c.Query("search")

		query := db.Where("doctor_id = ?", doctorID)
		if condition != "" {
			query = query.Where("condition = ?", condition)
		}
		if search != "" {
			query = query.Where("name LIKE ? OR phone LIKE ?", "%"+search+"%", "%"+search+"%")
		}

		var patients []models.Patient
		query.Find(&patients)

		// Attach latest reading and alert count
		type PatientSummary struct {
			models.Patient
			LatestReading *models.HealthReading `json:"latest_reading"`
			AlertCount    int64                  `json:"alert_count"`
		}

		var summaries []PatientSummary
		for _, p := range patients {
			var latest models.HealthReading
			db.Where("patient_id = ?", p.ID).Order("recorded_at desc").First(&latest)

			var alertCount int64
			db.Model(&models.Alert{}).Where("patient_id = ? AND acknowledged = ?", p.ID, false).Count(&alertCount)

			summaries = append(summaries, PatientSummary{
				Patient:       p,
				LatestReading: &latest,
				AlertCount:    alertCount,
			})
		}

		c.JSON(http.StatusOK, gin.H{"patients": summaries})
	}
}

func CreatePatient(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		doctorID := c.GetString("user_id")

		var input struct {
			Name      string `json:"name" binding:"required"`
			Age       int    `json:"age"`
			Gender    string `json:"gender"`
			Phone     string `json:"phone" binding:"required"`
			Condition string `json:"condition" binding:"required"`
			Pin       string `json:"pin" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		pinHash, err := bcrypt.GenerateFromPassword([]byte(input.Pin), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
			return
		}

		patient := models.Patient{
			ID:        uuid.New().String(),
			Name:      input.Name,
			Age:       input.Age,
			Gender:    input.Gender,
			Phone:     input.Phone,
			Condition: input.Condition,
			DoctorID:  doctorID,
			PinHash:   string(pinHash),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := db.Create(&patient).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create patient"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"patient": patient})
	}
}

func GetPatient(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.Param("id")
		var patient models.Patient
		if err := db.Preload("Medications").First(&patient, "id = ?", patientID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "patient not found"})
			return
		}

		var recentReadings []models.HealthReading
		db.Where("patient_id = ?", patientID).Order("recorded_at desc").Limit(30).Find(&recentReadings)

		var openAlerts []models.Alert
		db.Where("patient_id = ? AND acknowledged = ?", patientID, false).Find(&openAlerts)

		c.JSON(http.StatusOK, gin.H{
			"patient":         patient,
			"recent_readings": recentReadings,
			"open_alerts":     openAlerts,
		})
	}
}

func UpdatePatient(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.Param("id")
		var input map[string]interface{}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		db.Model(&models.Patient{}).Where("id = ?", patientID).Updates(input)
		c.JSON(http.StatusOK, gin.H{"message": "patient updated"})
	}
}

func PatientProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")
		var patient models.Patient
		db.Preload("Medications").First(&patient, "id = ?", patientID)
		c.JSON(http.StatusOK, gin.H{"patient": patient})
	}
}
