package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"chronic-disease-platform/backend/models"
	"chronic-disease-platform/backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HandleUSSD processes incoming HTTP POST requests from Africa's Talking
// URL encoded form data: sessionId, serviceCode, phoneNumber, text
func HandleUSSD(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Africa's Talking sends USSD payload as form data
		phoneNumber := c.PostForm("phoneNumber")
		text := c.PostForm("text")

		// Remove the leading '+' from the phone number for easier DB lookup if necessary
		// or keep it depending on how phone numbers are stored. In the demo data, we use e.g. "0712345678"
		// AT sends it as "+254712345678" typically.
		// For the MVP, we'll strip "+254" and replace with "0" as a simple normalizer for Kenyan numbers.
		normalizedPhone := phoneNumber
		if strings.HasPrefix(normalizedPhone, "+254") {
			normalizedPhone = "0" + strings.TrimPrefix(normalizedPhone, "+254")
		}

		// Look up the patient
		var patient models.Patient
		if err := db.Where("phone = ?", normalizedPhone).First(&patient).Error; err != nil {
			// If we don't know this phone number, reject the session
			c.String(http.StatusOK, "END We cannot find a patient registered with this phone number.")
			return
		}

		// Route the USSD logic based on the text input
		response := routeUSSDCommand(db, &patient, text)

		// Africa's Talking requires the exact response string formatting
		c.String(http.StatusOK, response)
	}
}

func routeUSSDCommand(db *gorm.DB, patient *models.Patient, text string) string {
	// Root Menu
	if text == "" {
		menu := "CON Welcome to CHP Monitor, " + patient.Name + "\n"
		menu += "What would you like to log?\n"
		menu += "1. Blood Pressure\n"
		menu += "2. Blood Sugar\n"
		menu += "3. Request Call from Doctor"
		return menu
	}

	// Split input by '*' to see where we are in the flow
	parts := strings.Split(text, "*")
	mainChoice := parts[0]

	switch mainChoice {
	case "1": // Blood Pressure Flow
		return handleBPFlow(db, patient, parts)
	case "2": // Blood Sugar Flow
		return handleGlucoseFlow(db, patient, parts)
	case "3": // Request Call Flow
		return handleCallbackFlow(db, patient)
	default:
		return "END Invalid choice. Please try again."
	}
}

func handleBPFlow(db *gorm.DB, patient *models.Patient, parts []string) string {
	// Flow: "1" -> Enter Systolic -> "1*140" -> Enter Diastolic -> "1*140*90" -> Save
	
	if len(parts) == 1 {
		return "CON Enter your Systolic (top) reading:"
	}

	if len(parts) == 2 {
		return "CON Enter your Diastolic (bottom) reading:"
	}

	if len(parts) == 3 {
		systolicStr := parts[1]
		diastolicStr := parts[2]

		sys, errSys := strconv.ParseFloat(systolicStr, 64)
		dia, errDia := strconv.ParseFloat(diastolicStr, 64)

		if errSys != nil || errDia != nil {
			return "END Error: Please enter valid numbers for blood pressure."
		}

		reading := models.HealthReading{
			ID:         uuid.New().String(),
			PatientID:  patient.ID,
			Type:       "blood_pressure",
			Systolic:   &sys,
			Diastolic:  &dia,
			Unit:       "mmHg",
			RecordedAt: time.Now(),
			CreatedAt:  time.Now(),
		}

		if err := db.Create(&reading).Error; err != nil {
			log.Printf("Failed to save BP reading from USSD: %v", err)
			return "END Error saving reading. Please try again later."
		}

		// Trigger alert engine asynchronously
		go services.EvaluateReading(db, &reading)

		return fmt.Sprintf("END Thank you. Your reading of %.0f/%.0f has been saved.", sys, dia)
	}

	return "END Invalid input sequence."
}

func handleGlucoseFlow(db *gorm.DB, patient *models.Patient, parts []string) string {
	// Flow: "2" -> Enter Sugar -> "2*7.5" -> Save

	if len(parts) == 1 {
		return "CON Enter your blood sugar level (e.g., 6.5):"
	}

	if len(parts) == 2 {
		sugarStr := parts[1]
		val, err := strconv.ParseFloat(sugarStr, 64)

		if err != nil {
			return "END Error: Please enter a valid number."
		}

		reading := models.HealthReading{
			ID:         uuid.New().String(),
			PatientID:  patient.ID,
			Type:       "glucose",
			Value:      &val,
			Unit:       "mmol/L",
			RecordedAt: time.Now(),
			CreatedAt:  time.Now(),
		}

		if err := db.Create(&reading).Error; err != nil {
			log.Printf("Failed to save glucose reading from USSD: %v", err)
			return "END Error saving reading. Please try again later."
		}

		// Trigger alert engine asynchronously
		go services.EvaluateReading(db, &reading)

		return fmt.Sprintf("END Thank you. Your reading of %.1f mmol/L has been saved.", val)
	}

	return "END Invalid input sequence."
}

func handleCallbackFlow(db *gorm.DB, patient *models.Patient) string {
	// Just create a priority message to the doctor
	msg := models.Message{
		ID:         uuid.New().String(),
		PatientID:  patient.ID,
		DoctorID:   patient.DoctorID,
		SenderType: "patient",
		Content:    "[URGENT - Via USSD] Patient requested a callback.",
		SentAt:     time.Now(),
		CreatedAt:  time.Now(),
	}

	if err := db.Create(&msg).Error; err != nil {
		log.Printf("Failed to save callback request: %v", err)
		return "END System error. Please call the clinic directly."
	}

	// Trigger an SMS alert for urgent callback to the doctor if AT_API_KEY is configged
	var doc models.Doctor
	if err := db.First(&doc, "id = ?", patient.DoctorID).Error; err == nil {
		if doc.Phone != "" {
			go services.SendSMS(doc.Phone, fmt.Sprintf("[CHP Monitor] Patient %s requested an urgent callback via USSD.", patient.Name))
		}
	}

	return "END Your doctor has been notified and will call you back."
}
