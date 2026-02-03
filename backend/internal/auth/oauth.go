package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// GoogleOAuthManager handles Google OAuth 2.0 authentication
type GoogleOAuthManager struct {
	config *oauth2.Config
}

// GoogleUserInfo represents user info from Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// NewGoogleOAuthManager creates a new Google OAuth manager
func NewGoogleOAuthManager(clientID, clientSecret, redirectURL string) *GoogleOAuthManager {
	return &GoogleOAuthManager{
		config: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		},
	}
}

// GetAuthURL returns the URL to redirect users for Google OAuth
func (m *GoogleOAuthManager) GetAuthURL(state string) string {
	return m.config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// ExchangeCode exchanges an authorization code for tokens
func (m *GoogleOAuthManager) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
	return m.config.Exchange(ctx, code)
}

// GetUserInfo fetches user information from Google
func (m *GoogleOAuthManager) GetUserInfo(ctx context.Context, token *oauth2.Token) (*GoogleUserInfo, error) {
	client := m.config.Client(ctx, token)

	resp, err := client.Get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google API returned status %d", resp.StatusCode)
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &userInfo, nil
}

// ValidateToken checks if the token is still valid
func (m *GoogleOAuthManager) ValidateToken(ctx context.Context, token *oauth2.Token) bool {
	return token.Valid()
}

// RefreshToken refreshes an expired token
func (m *GoogleOAuthManager) RefreshToken(ctx context.Context, token *oauth2.Token) (*oauth2.Token, error) {
	tokenSource := m.config.TokenSource(ctx, token)
	return tokenSource.Token()
}
