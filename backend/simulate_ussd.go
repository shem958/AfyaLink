//go:build ignore

package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// This script simulates Africa's Talking hitting our USSD endpoint
func main() {
	baseURL := "http://localhost:8080/api/webhook/ussd"
	client := &http.Client{Timeout: 5 * time.Second}

	// Make sure the server is running on 8080!
	
	fmt.Println("📞 SIMULATING AFRICA'S TALKING USSD REQUESTS")
	fmt.Println("============================================")

	// In the seed script, John Mwangi has phone "0712345678"
	phone := "+254712345678" 

	// Scenario 1: Initial Dial (Empty Text)
	fmt.Println("\n1. Dialing *384*11231# (Empty text)")
	simulateRequest(client, baseURL, phone, "")
	time.Sleep(1 * time.Second)

	// Scenario 2: Select "1. Blood Pressure"
	fmt.Println("\n2. Replying with '1'")
	simulateRequest(client, baseURL, phone, "1")
	time.Sleep(1 * time.Second)

	// Scenario 3: Entering Systolic (135)
	fmt.Println("\n3. Replying with '135' (Full text: 1*135)")
	simulateRequest(client, baseURL, phone, "1*135")
	time.Sleep(1 * time.Second)

	// Scenario 4: Entering Diastolic (85)
	fmt.Println("\n4. Replying with '85' (Full text: 1*135*85)")
	simulateRequest(client, baseURL, phone, "1*135*85")
}

func simulateRequest(client *http.Client, targetURL, phone, text string) {
	data := url.Values{}
	data.Set("sessionId", "test-session-123")
	data.Set("serviceCode", "*384*11231#")
	data.Set("phoneNumber", phone)
	data.Set("text", text)

	req, err := http.NewRequest("POST", targetURL, strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return
	}

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Failed to reach backend: %v\n", err)
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	responseStr := string(bodyBytes)

	if strings.HasPrefix(responseStr, "CON") {
		fmt.Printf("✅ Server Responded with MENU:\n%s\n", strings.TrimPrefix(responseStr, "CON "))
	} else if strings.HasPrefix(responseStr, "END") {
		fmt.Printf("🛑 Server Responded with END:\n%s\n", strings.TrimPrefix(responseStr, "END "))
	} else {
		fmt.Printf("⚠️ Invalid AT Response format:\n%s\n", responseStr)
	}
}
