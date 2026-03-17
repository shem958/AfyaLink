package handlers

import (
	"net/http"
	"time"

	"chronic-disease-platform/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetMessages(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.Param("patientId")
		doctorID := c.GetString("user_id")

		var messages []models.Message
		db.Where("patient_id = ? AND doctor_id = ?", patientID, doctorID).
			Order("sent_at asc").Find(&messages)

		// Mark doctor's messages to patient as read
		db.Model(&models.Message{}).
			Where("patient_id = ? AND doctor_id = ? AND sender_type = ?", patientID, doctorID, "patient").
			Update("read", true)

		c.JSON(http.StatusOK, gin.H{"messages": messages})
	}
}

func SendMessage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		senderID := c.GetString("user_id")
		senderType := c.GetString("user_type")

		var input struct {
			PatientID string `json:"patient_id" binding:"required"`
			DoctorID  string `json:"doctor_id"`
			Content   string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		doctorID := input.DoctorID
		if senderType == "doctor" {
			doctorID = senderID
		}

		msg := models.Message{
			ID:         uuid.New().String(),
			PatientID:  input.PatientID,
			DoctorID:   doctorID,
			SenderType: senderType,
			Content:    input.Content,
			SentAt:     time.Now(),
			CreatedAt:  time.Now(),
		}
		db.Create(&msg)
		c.JSON(http.StatusCreated, gin.H{"message": msg})
	}
}

func PatientMessages(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")
		var messages []models.Message
		db.Where("patient_id = ?", patientID).Order("sent_at asc").Find(&messages)
		c.JSON(http.StatusOK, gin.H{"messages": messages})
	}
}

func ReportSymptom(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		patientID := c.GetString("user_id")

		var input struct {
			Symptoms []string `json:"symptoms" binding:"required"`
			Severity string   `json:"severity"`
			Notes    string   `json:"notes"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		symptomsJSON := "["
		for i, s := range input.Symptoms {
			if i > 0 {
				symptomsJSON += ","
			}
			symptomsJSON += `"` + s + `"`
		}
		symptomsJSON += "]"

		symptom := models.Symptom{
			ID:         uuid.New().String(),
			PatientID:  patientID,
			Symptoms:   symptomsJSON,
			Severity:   input.Severity,
			Notes:      input.Notes,
			ReportedAt: time.Now(),
			CreatedAt:  time.Now(),
		}
		db.Create(&symptom)

		// Create alert for severe symptoms
		if input.Severity == "severe" {
			alert := models.Alert{
				ID:        uuid.New().String(),
				PatientID: patientID,
				Type:      "symptom",
				Severity:  "high",
				Message:   "Patient reported severe symptoms: " + symptom.Symptoms,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			db.Create(&alert)
		}

		c.JSON(http.StatusCreated, gin.H{"symptom": symptom})
	}
}

func DashboardSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		doctorID := c.GetString("user_id")

		var patientIDs []string
		db.Model(&models.Patient{}).Where("doctor_id = ?", doctorID).Pluck("id", &patientIDs)

		var totalPatients int64
		db.Model(&models.Patient{}).Where("doctor_id = ?", doctorID).Count(&totalPatients)

		var criticalAlerts int64
		db.Model(&models.Alert{}).
			Where("patient_id IN ? AND severity IN ? AND acknowledged = ?", patientIDs, []string{"critical", "high"}, false).
			Count(&criticalAlerts)

		var totalAlerts int64
		db.Model(&models.Alert{}).
			Where("patient_id IN ? AND acknowledged = ?", patientIDs, false).
			Count(&totalAlerts)

		var recentAlerts []models.Alert
		db.Preload("Patient").
			Where("patient_id IN ? AND acknowledged = ?", patientIDs, false).
			Order("created_at desc").Limit(5).Find(&recentAlerts)

		// Condition breakdown
		type ConditionCount struct {
			Condition string
			Count     int64
		}
		var conditionBreakdown []ConditionCount
		db.Model(&models.Patient{}).
			Select("condition, count(*) as count").
			Where("doctor_id = ?", doctorID).
			Group("condition").
			Scan(&conditionBreakdown)

		c.JSON(http.StatusOK, gin.H{
			"total_patients":      totalPatients,
			"critical_alerts":     criticalAlerts,
			"total_open_alerts":   totalAlerts,
			"recent_alerts":       recentAlerts,
			"condition_breakdown": conditionBreakdown,
		})
	}
}

func Analytics(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		doctorID := c.GetString("user_id")

		var patientIDs []string
		db.Model(&models.Patient{}).Where("doctor_id = ?", doctorID).Pluck("id", &patientIDs)

		// Recent readings trend (last 30 days)
		var readings []models.HealthReading
		db.Where("patient_id IN ?", patientIDs).
			Order("recorded_at desc").Limit(200).Find(&readings)

		// Alert stats by severity
		type SeverityCount struct {
			Severity string
			Count    int64
		}
		var alertStats []SeverityCount
		db.Model(&models.Alert{}).
			Select("severity, count(*) as count").
			Where("patient_id IN ?", patientIDs).
			Group("severity").Scan(&alertStats)

		c.JSON(http.StatusOK, gin.H{
			"readings":    readings,
			"alert_stats": alertStats,
		})
	}
}
