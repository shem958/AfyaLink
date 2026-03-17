package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"chronic-disease-platform/backend/models"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var Redis *redis.Client

// Connect initialises a PostgreSQL connection via GORM.
// Set DATABASE_URL in the environment for production.
// Falls back to a sensible local default if unset.
func Connect() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		host := getenv("DB_HOST", "localhost")
		port := getenv("DB_PORT", "5432")
		user := getenv("DB_USER", "cdp")
		pass := getenv("DB_PASSWORD", "cdp_secret")
		name := getenv("DB_NAME", "chronic_disease")
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Africa/Nairobi",
			host, port, user, pass, name,
		)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Printf("⚠️  Failed to connect to PostgreSQL: %v. Falling back to SQLite...", err)
		fallbackDB, fallbackErr := gorm.Open(sqlite.Open("sqlite.db"), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if fallbackErr != nil {
			log.Fatalf("❌ Failed to connect to SQLite fallback: %v", fallbackErr)
		}
		log.Println("✅ SQLite connected (fallback mode)")
		return fallbackDB
	}

	// Connection pool settings
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	log.Println("✅ PostgreSQL connected")
	return db
}

// ConnectRedis initialises the Redis client.
func ConnectRedis() *redis.Client {
	addr  := getenv("REDIS_ADDR", "localhost:6379")
	pass  := getenv("REDIS_PASSWORD", "cdp_redis_secret")

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: pass,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Printf("⚠️  Redis unavailable (%v) – caching disabled", err)
	} else {
		log.Println("✅ Redis connected")
	}

	Redis = rdb
	return rdb
}

func Migrate(db *gorm.DB) {
	err := db.AutoMigrate(
		&models.Doctor{},
		&models.Patient{},
		&models.HealthReading{},
		&models.Medication{},
		&models.MedicationLog{},
		&models.Alert{},
		&models.Symptom{},
		&models.Message{},
		&models.Notification{},
	)
	if err != nil {
		log.Fatalf("❌ Failed to migrate database: %v", err)
	}
	log.Println("✅ Database schema migrated")
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
