package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

const (
	// ATLiveAPI represents the Africa's Talking live environment
	ATLiveAPI = "https://api.africastalking.com/version1/messaging"
	// ATSandboxAPI represents the Africa's Talking sandbox environment
	ATSandboxAPI = "https://api.sandbox.africastalking.com/version1/messaging"
)

// SendSMS sends an SMS using the Africa's Talking REST API
func SendSMS(to string, message string) error {
	username := os.Getenv("AT_USERNAME")
	apiKey := os.Getenv("AT_API_KEY")

	if username == "" || apiKey == "" {
		return fmt.Errorf("Africa's Talking credentials not configured")
	}

	// Determine endpoint based on username
	apiURL := ATLiveAPI
	if username == "sandbox" {
		apiURL = ATSandboxAPI
	}

	// Prepare x-www-form-urlencoded data
	data := url.Values{}
	data.Set("username", username)
	data.Set("to", to)
	data.Set("message", message)
	
	senderID := os.Getenv("AT_SENDER_ID")
	if senderID != "" {
		data.Set("from", senderID)
	}

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}

	req.Header.Add("Accept", "application/json")
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("apiKey", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var atResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&atResp); err != nil {
		// Just log if we can't parse the response, the message likely sent if status code is < 400
		log.Printf("Could not decode AT response: %v", err)
	}

	log.Printf("✅ [AT SMS] Sent to %s: %s", to, message)
	return nil
}
