package main

import (
	"log"
	"os"

	"chronic-disease-platform/backend/database"
	"chronic-disease-platform/backend/handlers"
	"chronic-disease-platform/backend/middleware"
	"chronic-disease-platform/backend/seed"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect to database
	db := database.Connect()

	// Auto-migrate all models
	database.Migrate(db)

	// Seed demo data
	seed.Run(db)

	// Set up Gin router
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS – allow both dashboard and patient app origins
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:8081", "http://localhost:19006"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// ── Public routes ──────────────────────────────────────
	auth := r.Group("/api/auth")
	{
		auth.POST("/login/doctor", handlers.DoctorLogin(db))
		auth.POST("/login/patient", handlers.PatientLogin(db))
	}

	// ── Webhooks ───────────────────────────────────────────
	webhooks := r.Group("/api/webhook")
	{
		// Africa's Talking USSD HTTP POST Webhook
		webhooks.POST("/ussd", handlers.HandleUSSD(db))
	}

	// ── Doctor-authenticated routes ────────────────────────
	doctor := r.Group("/api")
	doctor.Use(middleware.AuthRequired())
	{
		// Dashboard summary
		doctor.GET("/dashboard", handlers.DashboardSummary(db))

		// Patients
		doctor.GET("/patients", handlers.ListPatients(db))
		doctor.POST("/patients", handlers.CreatePatient(db))
		doctor.GET("/patients/:id", handlers.GetPatient(db))
		doctor.PATCH("/patients/:id", handlers.UpdatePatient(db))

		// Readings
		doctor.GET("/readings/:patientId", handlers.GetReadings(db))

		// Medications
		doctor.GET("/medications/:patientId", handlers.GetMedications(db))
		doctor.POST("/medications", handlers.CreateMedication(db))

		// Alerts
		doctor.GET("/alerts", handlers.ListAlerts(db))
		doctor.PATCH("/alerts/:id/acknowledge", handlers.AcknowledgeAlert(db))

		// Messages
		doctor.GET("/messages/:patientId", handlers.GetMessages(db))
		doctor.POST("/messages", handlers.SendMessage(db))

		// Analytics
		doctor.GET("/analytics", handlers.Analytics(db))
	}

	// ── Patient-authenticated routes ───────────────────────
	patient := r.Group("/api/patient")
	patient.Use(middleware.AuthRequired())
	{
		patient.GET("/profile", handlers.PatientProfile(db))
		patient.GET("/readings", handlers.PatientReadings(db))
		patient.POST("/readings", handlers.PostReading(db))
		patient.GET("/medications", handlers.PatientMedications(db))
		patient.PATCH("/medications/:id/taken", handlers.MarkMedicationTaken(db))
		patient.GET("/messages", handlers.PatientMessages(db))
		patient.POST("/messages", handlers.SendMessage(db))
		patient.POST("/symptoms", handlers.ReportSymptom(db))
		patient.POST("/emergency", handlers.TriggerEmergency(db))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🏥 Chronic Disease Platform API running on http://localhost:%s", port)
	r.Run(":" + port)
}
