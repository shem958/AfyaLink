package handlers

import (
	"net/http"
	"time"

	"chronic-disease-platform/backend/middleware"
	"chronic-disease-platform/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type loginRequest struct {
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Pin      string `json:"pin"`
}

func DoctorLogin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		var doctor models.Doctor
		if err := db.Where("email = ?", req.Email).First(&doctor).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(doctor.PasswordHash), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		token, err := generateToken(doctor.ID, "doctor", doctor.Email, "")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"doctor": gin.H{
				"id":             doctor.ID,
				"name":           doctor.Name,
				"email":          doctor.Email,
				"hospital":       doctor.Hospital,
				"specialization": doctor.Specialization,
			},
		})
	}
}

func PatientLogin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		var patient models.Patient
		if err := db.Where("phone = ?", req.Phone).First(&patient).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(patient.PinHash), []byte(req.Pin)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid PIN"})
			return
		}

		token, err := generateToken(patient.ID, "patient", "", patient.Phone)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"patient": gin.H{
				"id":        patient.ID,
				"name":      patient.Name,
				"age":       patient.Age,
				"condition": patient.Condition,
				"phone":     patient.Phone,
			},
		})
	}
}

func generateToken(userID, userType, email, phone string) (string, error) {
	claims := middleware.Claims{
		UserID:   userID,
		UserType: userType,
		Email:    email,
		Phone:    phone,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(middleware.JWTSecret)
}
