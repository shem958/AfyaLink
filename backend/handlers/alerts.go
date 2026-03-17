package handlers

import (
	"net/http"
	"time"

	"chronic-disease-platform/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func ListAlerts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		doctorID := c.GetString("user_id")
		severity := c.Query("severity")
		acknowledged := c.Query("acknowledged")

		// Get all patient IDs for this doctor
		var patientIDs []string
		db.Model(&models.Patient{}).Where("doctor_id = ?", doctorID).Pluck("id", &patientIDs)

		query := db.Preload("Patient").Where("patient_id IN ?", patientIDs).Order("created_at desc")
		if severity != "" {
			query = query.Where("severity = ?", severity)
		}
		if acknowledged == "false" || acknowledged == "" {
			query = query.Where("acknowledged = ?", false)
		}

		var alerts []models.Alert
		query.Limit(100).Find(&alerts)

		c.JSON(http.StatusOK, gin.H{"alerts": alerts})
	}
}

func AcknowledgeAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		alertID := c.Param("id")
		db.Model(&models.Alert{}).Where("id = ?", alertID).Updates(map[string]interface{}{
			"acknowledged": true,
			"updated_at":   time.Now(),
		})
		c.JSON(http.StatusOK, gin.H{"message": "alert acknowledged"})
	}
}

func GetMedications(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.Param("patientId")
		var medications []models.Medication
		db.Where("patient_id = ?", patientID).Find(&medications)
		c.JSON(http.StatusOK, gin.H{"medications": medications})
	}
}

func CreateMedication(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			PatientID string `json:"patient_id" binding:"required"`
			Name      string `json:"name" binding:"required"`
			Dosage    string `json:"dosage"`
			Schedule  string `json:"schedule"`
			Frequency string `json:"frequency"`
			StartDate string `json:"start_date"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		start := time.Now()
		if input.StartDate != "" {
			start, _ = time.Parse("2006-01-02", input.StartDate)
		}

		med := models.Medication{
			ID:        uuid.New().String(),
			PatientID: input.PatientID,
			Name:      input.Name,
			Dosage:    input.Dosage,
			Schedule:  input.Schedule,
			Frequency: input.Frequency,
			StartDate: start,
			Active:    true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		db.Create(&med)
		c.JSON(http.StatusCreated, gin.H{"medication": med})
	}
}

func PatientMedications(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")
		var medications []models.Medication
		db.Where("patient_id = ? AND active = ?", patientID, true).Find(&medications)
		c.JSON(http.StatusOK, gin.H{"medications": medications})
	}
}

func MarkMedicationTaken(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		medID := c.Param("id")
		patientID := c.GetString("user_id")

		log := models.MedicationLog{
			ID:           uuid.New().String(),
			MedicationID: medID,
			PatientID:    patientID,
			TakenAt:      time.Now(),
			CreatedAt:    time.Now(),
		}
		db.Create(&log)
		c.JSON(http.StatusOK, gin.H{"message": "medication marked as taken"})
	}
}
