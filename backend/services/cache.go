package services

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"chronic-disease-platform/backend/database"
)

const (
	CacheTTL       = 30 * time.Second
	CacheTTLLong   = 5 * time.Minute
)

// GetCached retrieves a JSON-encoded value from Redis.
// Returns (data, true) on hit, (nil, false) on miss or error.
func GetCached(key string) ([]byte, bool) {
	if database.Redis == nil {
		return nil, false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	val, err := database.Redis.Get(ctx, key).Bytes()
	if err != nil {
		return nil, false
	}
	return val, true
}

// SetCached stores a value in Redis with the given TTL.
func SetCached(key string, value interface{}, ttl time.Duration) {
	if database.Redis == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	data, err := json.Marshal(value)
	if err != nil {
		log.Printf("redis marshal error for key %s: %v", key, err)
		return
	}
	if err := database.Redis.Set(ctx, key, data, ttl).Err(); err != nil {
		log.Printf("redis set error for key %s: %v", key, err)
	}
}

// InvalidateCache deletes one or more keys from Redis.
func InvalidateCache(keys ...string) {
	if database.Redis == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	database.Redis.Del(ctx, keys...)
}

// PublishAlert publishes an alert event to a Redis Pub/Sub channel
// that could be consumed by a websocket gateway or notification worker.
func PublishAlert(channel string, payload interface{}) {
	if database.Redis == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	data, _ := json.Marshal(payload)
	if err := database.Redis.Publish(ctx, channel, data).Err(); err != nil {
		log.Printf("redis publish error on %s: %v", channel, err)
	}
}
