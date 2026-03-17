package seed

import (
	"log"
	"time"

	"chronic-disease-platform/backend/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Run(db *gorm.DB) {
	var count int64
	db.Model(&models.Doctor{}).Count(&count)
	if count > 0 {
		log.Println("ℹ️  Seed data already exists, skipping")
		return
	}

	log.Println("🌱 Seeding demo data...")

	// ── Doctors ───────────────────────────────────────────
	passHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	doctor1 := models.Doctor{
		ID:             uuid.New().String(),
		Name:           "Dr. Amina Odhiambo",
		Hospital:       "Nairobi General Hospital",
		Specialization: "Cardiology",
		Email:          "doctor@hospital.com",
		Phone:          "+254700000001",
		PasswordHash:   string(passHash),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	doctor2 := models.Doctor{
		ID:             uuid.New().String(),
		Name:           "Dr. James Mutua",
		Hospital:       "Kenyatta National Hospital",
		Specialization: "Endocrinology",
		Email:          "doctor2@hospital.com",
		Phone:          "+254700000002",
		PasswordHash:   string(passHash),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	db.Create(&doctor1)
	db.Create(&doctor2)

	// ── Patients ──────────────────────────────────────────
	pinHash, _ := bcrypt.GenerateFromPassword([]byte("1234"), bcrypt.DefaultCost)

	patients := []models.Patient{
		{ID: uuid.New().String(), Name: "John Mwangi", Age: 58, Gender: "Male", Phone: "0712345678", Condition: "hypertension", DoctorID: doctor1.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), Name: "Mary Achieng", Age: 45, Gender: "Female", Phone: "0723456789", Condition: "diabetes", DoctorID: doctor1.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), Name: "David Otieno", Age: 34, Gender: "Male", Phone: "0734567890", Condition: "asthma", DoctorID: doctor1.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), Name: "Grace Njeri", Age: 62, Gender: "Female", Phone: "0745678901", Condition: "hypertension", DoctorID: doctor1.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), Name: "Samuel Kamau", Age: 51, Gender: "Male", Phone: "0756789012", Condition: "diabetes", DoctorID: doctor1.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), Name: "Faith Wambui", Age: 39, Gender: "Female", Phone: "0767890123", Condition: "hypertension", DoctorID: doctor2.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), Name: "Peter Omondi", Age: 67, Gender: "Male", Phone: "0778901234", Condition: "diabetes", DoctorID: doctor2.ID, PinHash: string(pinHash), CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}

	for _, p := range patients {
		db.Create(&p)
	}

	// ── Health Readings (30 days) ─────────────────────────
	seedReadings(db, patients)

	// ── Medications ───────────────────────────────────────
	meds := []models.Medication{
		{ID: uuid.New().String(), PatientID: patients[0].ID, Name: "Amlodipine", Dosage: "5mg", Schedule: "08:00", Frequency: "daily", StartDate: time.Now().AddDate(0, -3, 0), Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), PatientID: patients[0].ID, Name: "Losartan", Dosage: "50mg", Schedule: "20:00", Frequency: "daily", StartDate: time.Now().AddDate(0, -3, 0), Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), PatientID: patients[1].ID, Name: "Metformin", Dosage: "500mg", Schedule: "08:00,20:00", Frequency: "twice_daily", StartDate: time.Now().AddDate(0, -2, 0), Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), PatientID: patients[1].ID, Name: "Glibenclamide", Dosage: "5mg", Schedule: "07:00", Frequency: "daily", StartDate: time.Now().AddDate(0, -2, 0), Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New().String(), PatientID: patients[3].ID, Name: "Hydrochlorothiazide", Dosage: "25mg", Schedule: "08:00", Frequency: "daily", StartDate: time.Now().AddDate(0, -4, 0), Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
	for _, m := range meds {
		db.Create(&m)
	}

	// ── Alerts (pre-seeded) ───────────────────────────────
	now := time.Now()
	alerts := []models.Alert{
		{ID: uuid.New().String(), PatientID: patients[0].ID, Type: "high_bp", Severity: "critical", Message: "Critically high blood pressure: 182/115 mmHg", Acknowledged: false, CreatedAt: now.Add(-2 * time.Hour), UpdatedAt: now.Add(-2 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[1].ID, Type: "high_glucose", Severity: "high", Message: "High blood glucose detected: 13.2 mmol/L", Acknowledged: false, CreatedAt: now.Add(-5 * time.Hour), UpdatedAt: now.Add(-5 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[3].ID, Type: "high_bp", Severity: "high", Message: "High blood pressure detected: 165/105 mmHg", Acknowledged: false, CreatedAt: now.Add(-1 * time.Hour), UpdatedAt: now.Add(-1 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[4].ID, Type: "missed_medication", Severity: "medium", Message: "Medication 'Metformin' not logged for 3+ days", Acknowledged: false, CreatedAt: now.Add(-3 * time.Hour), UpdatedAt: now.Add(-3 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[2].ID, Type: "symptom", Severity: "high", Message: "Patient reported severe symptoms: [\"chest pain\",\"dizziness\"]", Acknowledged: false, CreatedAt: now.Add(-30 * time.Minute), UpdatedAt: now.Add(-30 * time.Minute)},
	}
	for _, a := range alerts {
		db.Create(&a)
	}

	// ── Messages ──────────────────────────────────────────
	messages := []models.Message{
		{ID: uuid.New().String(), PatientID: patients[0].ID, DoctorID: doctor1.ID, SenderType: "doctor", Content: "John, your blood pressure readings have been concerning this week. Please avoid salty foods and take your medication at the prescribed times.", SentAt: now.Add(-24 * time.Hour), CreatedAt: now.Add(-24 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[0].ID, DoctorID: doctor1.ID, SenderType: "patient", Content: "Thank you doctor. I have been under a lot of stress at work. I will try to rest more.", SentAt: now.Add(-20 * time.Hour), CreatedAt: now.Add(-20 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[0].ID, DoctorID: doctor1.ID, SenderType: "doctor", Content: "Please visit the clinic this Friday for a follow-up checkup. Your readings are still elevated.", SentAt: now.Add(-4 * time.Hour), CreatedAt: now.Add(-4 * time.Hour)},
		{ID: uuid.New().String(), PatientID: patients[1].ID, DoctorID: doctor1.ID, SenderType: "doctor", Content: "Mary, remember to log your glucose readings twice daily. I have noticed gaps in your history.", SentAt: now.Add(-12 * time.Hour), CreatedAt: now.Add(-12 * time.Hour)},
	}
	for _, m := range messages {
		db.Create(&m)
	}

	log.Println("✅ Demo data seeded successfully")
	log.Println("   Doctor login: doctor@hospital.com / password123")
	log.Println("   Patient login: phone 0712345678 / pin 1234")
}

func seedReadings(db *gorm.DB, patients []models.Patient) {
	// Seed 30 days of BP readings for hypertension patients, glucose for diabetes
	for day := 30; day >= 0; day-- {
		ts := time.Now().AddDate(0, 0, -day)

		// John Mwangi – hypertension (trending upward)
		sys := 130.0 + float64(30-day)*1.8 + float64(day%3)*3
		dia := 85.0 + float64(30-day)*0.8
		db.Create(&models.HealthReading{ID: uuid.New().String(), PatientID: patients[0].ID, Type: "blood_pressure", Systolic: &sys, Diastolic: &dia, Unit: "mmHg", RecordedAt: ts, CreatedAt: ts})

		// Mary Achieng – diabetes (glucose varying)
		gluc := 6.5 + float64(day%7)*1.1
		db.Create(&models.HealthReading{ID: uuid.New().String(), PatientID: patients[1].ID, Type: "glucose", Value: &gluc, Unit: "mmol/L", RecordedAt: ts, CreatedAt: ts})

		// Grace Njeri – hypertension
		sys2 := 145.0 + float64(day%5)*4.0
		dia2 := 92.0 + float64(day%4)*2.5
		db.Create(&models.HealthReading{ID: uuid.New().String(), PatientID: patients[3].ID, Type: "blood_pressure", Systolic: &sys2, Diastolic: &dia2, Unit: "mmHg", RecordedAt: ts, CreatedAt: ts})
	}
}
