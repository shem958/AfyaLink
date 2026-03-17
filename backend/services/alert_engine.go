package services

import (
	"fmt"
	"log"
	"os"
	"time"

	"chronic-disease-platform/backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AlertRule defines a threshold-based rule
type AlertRule struct {
	Type     string
	Severity string
	Message  string
	Check    func(reading *models.HealthReading) bool
}

var alertRules = []AlertRule{
	// Blood Pressure – Critical
	{
		Type:     "high_bp",
		Severity: "critical",
		Message:  "Critically high blood pressure detected",
		Check: func(r *models.HealthReading) bool {
			if r.Type != "blood_pressure" || r.Systolic == nil || r.Diastolic == nil {
				return false
			}
			return *r.Systolic > 180 || *r.Diastolic > 110
		},
	},
	// Blood Pressure – High
	{
		Type:     "high_bp",
		Severity: "high",
		Message:  "High blood pressure detected",
		Check: func(r *models.HealthReading) bool {
			if r.Type != "blood_pressure" || r.Systolic == nil || r.Diastolic == nil {
				return false
			}
			return (*r.Systolic > 160 && *r.Systolic <= 180) || (*r.Diastolic > 100 && *r.Diastolic <= 110)
		},
	},
	// Blood Pressure – Warning
	{
		Type:     "high_bp",
		Severity: "medium",
		Message:  "Blood pressure above normal range",
		Check: func(r *models.HealthReading) bool {
			if r.Type != "blood_pressure" || r.Systolic == nil || r.Diastolic == nil {
				return false
			}
			return (*r.Systolic > 140 && *r.Systolic <= 160) || (*r.Diastolic > 90 && *r.Diastolic <= 100)
		},
	},
	// Blood Glucose – Critical
	{
		Type:     "high_glucose",
		Severity: "critical",
		Message:  "Critically high blood glucose level",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "glucose" && r.Value != nil && *r.Value > 15
		},
	},
	// Blood Glucose – High
	{
		Type:     "high_glucose",
		Severity: "high",
		Message:  "High blood glucose detected",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "glucose" && r.Value != nil && *r.Value > 10 && *r.Value <= 15
		},
	},
	// Blood Glucose – Warning
	{
		Type:     "high_glucose",
		Severity: "medium",
		Message:  "Blood glucose above target range",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "glucose" && r.Value != nil && *r.Value > 7 && *r.Value <= 10
		},
	},
	// Pain Level - Critical (Oncology)
	{
		Type:     "pain_level",
		Severity: "critical",
		Message:  "Patient reporting severe/critical pain",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "pain_level" && r.Value != nil && *r.Value >= 8
		},
	},
	// Pain Level - Warning (Oncology)
	{
		Type:     "pain_level",
		Severity: "high",
		Message:  "Patient reporting elevated pain",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "pain_level" && r.Value != nil && *r.Value >= 5 && *r.Value < 8
		},
	},
	// SpO2 - Critical (Asthma/Respiratory)
	{
		Type:     "low_spo2",
		Severity: "critical",
		Message:  "Critically low oxygen saturation detected",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "spo2" && r.Value != nil && *r.Value < 90
		},
	},
	// SpO2 - Warning (Asthma/Respiratory)
	{
		Type:     "low_spo2",
		Severity: "high",
		Message:  "Low oxygen saturation detected",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "spo2" && r.Value != nil && *r.Value >= 90 && *r.Value <= 92
		},
	},
	// Peak Flow - Warning (Asthma)
	{
		Type:     "low_peak_flow",
		Severity: "medium",
		Message:  "Peak expiratory flow is below target",
		Check: func(r *models.HealthReading) bool {
			return r.Type == "peak_flow" && r.Value != nil && *r.Value < 300 // Generic threshold for demo
		},
	},
}

// EvaluateReading runs all alert rules against a new reading
func EvaluateReading(db *gorm.DB, reading *models.HealthReading) {
	for _, rule := range alertRules {
		if rule.Check(reading) {
			alert := models.Alert{
				ID:        uuid.New().String(),
				PatientID: reading.PatientID,
				ReadingID: reading.ID,
				Type:      rule.Type,
				Severity:  rule.Severity,
				Message:   buildAlertMessage(rule, reading),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			if err := db.Create(&alert).Error; err != nil {
				log.Printf("Failed to create alert: %v", err)
			} else {
				log.Printf("🚨 Alert created [%s] for patient %s: %s", rule.Severity, reading.PatientID, alert.Message)
				DispatchNotification(db, &alert)
			}
			// Only fire the first matching rule (most severe)
			break
		}
	}
}

func buildAlertMessage(rule AlertRule, reading *models.HealthReading) string {
	switch reading.Type {
	case "blood_pressure":
		if reading.Systolic != nil && reading.Diastolic != nil {
			return fmt.Sprintf("%s: %.0f/%.0f mmHg", rule.Message, *reading.Systolic, *reading.Diastolic)
		}
	case "glucose":
		if reading.Value != nil {
			return fmt.Sprintf("%s: %.1f mmol/L", rule.Message, *reading.Value)
		}
	case "pain_level":
		if reading.Value != nil {
			return fmt.Sprintf("%s: %.0f/10", rule.Message, *reading.Value)
		}
	}
	return rule.Message
}

// DispatchNotification sends an alert notification via configured channels
func DispatchNotification(db *gorm.DB, alert *models.Alert) {
	apiKey := os.Getenv("AT_API_KEY")

	// Get Doctor Phone via Patient
	var doctorPhone string
	var patient models.Patient
	if err := db.Preload("Doctor").First(&patient, "id = ?", alert.PatientID).Error; err == nil && patient.Doctor != nil {
		doctorPhone = patient.Doctor.Phone // assuming Doctor relation exists and has Phone (to verify with model)
	} else {
	    // Fallback or log if doctor not found
	    log.Printf("Could not find doctor phone for patient %s", alert.PatientID)
	}

	if apiKey != "" && doctorPhone != "" {
		err := SendSMS(doctorPhone, "[CHP Monitor Alert] "+alert.Message)
		if err != nil {
		    log.Printf("❌ [SMS ERROR] Failed to send SMS to %s: %v", doctorPhone, err)
		}
	} else if apiKey == "" {
		log.Printf("📋 [STUB] Notification for alert %s (set AT_API_KEY for real SMS)", alert.ID)
	}

	// Log notification to DB
	notification := models.Notification{
		ID:            uuid.New().String(),
		RecipientID:   alert.PatientID,
		RecipientType: "doctor",
		Channel:       "sms",
		Message:       alert.Message,
		Status:        "pending",
		CreatedAt:     time.Now(),
	}
	db.Create(&notification)
}

// CheckMedicationAdherence checks for missed medications and creates alerts
func CheckMedicationAdherence(db *gorm.DB) {
	var medications []models.Medication
	db.Where("active = ?", true).Find(&medications)

	for _, med := range medications {
		var count int64
		threeDaysAgo := time.Now().AddDate(0, 0, -3)
		db.Model(&models.MedicationLog{}).
			Where("medication_id = ? AND taken_at > ?", med.ID, threeDaysAgo).
			Count(&count)

		if count == 0 {
			// Check if we already have a recent alert for this
			var existingAlert models.Alert
			result := db.Where("patient_id = ? AND type = ? AND created_at > ?",
				med.PatientID, "missed_medication", threeDaysAgo).First(&existingAlert)

			if result.Error != nil { // No recent alert
				alert := models.Alert{
					ID:        uuid.New().String(),
					PatientID: med.PatientID,
					Type:      "missed_medication",
					Severity:  "medium",
					Message:   fmt.Sprintf("Medication '%s' not logged for 3+ days", med.Name),
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				}
				db.Create(&alert)
				log.Printf("💊 Adherence alert for patient %s: %s", med.PatientID, alert.Message)
			}
		}
	}
}
