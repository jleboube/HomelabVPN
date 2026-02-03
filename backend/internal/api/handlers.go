package api

import (
	"database/sql"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/homelabvpn/backend/internal/auth"
	"github.com/homelabvpn/backend/internal/subscription"
	"github.com/homelabvpn/backend/internal/vpn"
)

// Handler contains all API handlers
type Handler struct {
	db                  *sql.DB
	redis               *redis.Client
	jwtManager          *auth.JWTManager
	oauthManager        *auth.GoogleOAuthManager
	vpnService          *vpn.Service
	subscriptionService *subscription.Service
	webhookHandler      *subscription.WebhookHandler
	frontendURL         string
}

// NewHandler creates a new API handler
func NewHandler(
	db *sql.DB,
	redis *redis.Client,
	jwtManager *auth.JWTManager,
	oauthManager *auth.GoogleOAuthManager,
	vpnService *vpn.Service,
	subscriptionService *subscription.Service,
	webhookHandler *subscription.WebhookHandler,
	frontendURL string,
) *Handler {
	return &Handler{
		db:                  db,
		redis:               redis,
		jwtManager:          jwtManager,
		oauthManager:        oauthManager,
		vpnService:          vpnService,
		subscriptionService: subscriptionService,
		webhookHandler:      webhookHandler,
		frontendURL:         frontendURL,
	}
}

// AuthMiddleware validates JWT tokens
func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		// Verify token
		claims, err := h.jwtManager.VerifyToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Next()
	}
}

// StartGoogleOAuth initiates the Google OAuth flow
func (h *Handler) StartGoogleOAuth(c *gin.Context) {
	// Generate state for CSRF protection
	state := uuid.New().String()

	// Store state in Redis with expiration
	if err := h.redis.Set(c, "oauth_state:"+state, "1", 10*60*1000000000).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store state"})
		return
	}

	authURL := h.oauthManager.GetAuthURL(state)
	c.JSON(http.StatusOK, gin.H{"redirectUrl": authURL, "state": state})
}

// GoogleOAuthCallback handles the OAuth callback
func (h *Handler) GoogleOAuthCallback(c *gin.Context) {
	var req struct {
		Code  string `json:"code" binding:"required"`
		State string `json:"state" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Verify state
	exists, err := h.redis.Get(c, "oauth_state:"+req.State).Result()
	if err != nil || exists == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired state"})
		return
	}

	// Delete used state
	h.redis.Del(c, "oauth_state:"+req.State)

	// Exchange code for tokens
	token, err := h.oauthManager.ExchangeCode(c, req.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to exchange code"})
		return
	}

	// Get user info from Google
	userInfo, err := h.oauthManager.GetUserInfo(c, token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
		return
	}

	// Create or update user in database
	userID, err := h.createOrUpdateUser(userInfo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// Generate JWT tokens
	accessToken, err := h.jwtManager.GenerateToken(userID, userInfo.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(userID, userInfo.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate refresh token"})
		return
	}

	// Get subscription info
	sub, _ := h.subscriptionService.GetUserSubscription(c, userID)

	c.JSON(http.StatusOK, gin.H{
		"token":        accessToken,
		"refreshToken": refreshToken,
		"expiresIn":    int(h.jwtManager.GetTokenDuration().Seconds()),
		"user": gin.H{
			"id":    userID,
			"email": userInfo.Email,
			"name":  userInfo.Name,
		},
		"subscription": sub,
	})
}

// RefreshToken refreshes an expired access token
func (h *Handler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	claims, err := h.jwtManager.VerifyToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	accessToken, err := h.jwtManager.GenerateToken(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":     accessToken,
		"expiresIn": int(h.jwtManager.GetTokenDuration().Seconds()),
	})
}

// Logout invalidates the user session
func (h *Handler) Logout(c *gin.Context) {
	userID := c.GetString("userID")

	// In a full implementation, you'd invalidate the token in Redis
	h.redis.Del(c, "session:"+userID)

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetCurrentUser returns the current user's info
func (h *Handler) GetCurrentUser(c *gin.Context) {
	userID := c.GetString("userID")
	email := c.GetString("email")

	// Get subscription
	sub, _ := h.subscriptionService.GetUserSubscription(c, userID)

	// Get VPN config status
	vpnConfig, _ := h.vpnService.GetUserConfig(c, userID)

	c.JSON(http.StatusOK, gin.H{
		"id":           userID,
		"email":        email,
		"subscription": sub,
		"vpnConfig":    vpnConfig,
	})
}

// DeleteUser requests account deletion
func (h *Handler) DeleteUser(c *gin.Context) {
	userID := c.GetString("userID")

	// In production, you'd schedule deletion and notify user
	// For now, we'll just mark as deleted
	_, err := h.db.ExecContext(c, "UPDATE users SET deleted_at = NOW() WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "deletion_scheduled",
		"deleteAfter": "30 days",
	})
}

// GetVPNConfig returns the user's WireGuard configuration
func (h *Handler) GetVPNConfig(c *gin.Context) {
	userID := c.GetString("userID")
	format := c.DefaultQuery("format", "wg-config")
	server := c.DefaultQuery("server", "us-east")

	config, err := h.vpnService.GenerateConfig(c, userID, server, format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate config"})
		return
	}

	switch format {
	case "mobileconfig":
		c.Header("Content-Type", "application/x-apple-aspen-config")
		c.Header("Content-Disposition", "attachment; filename=HomelabVPN.mobileconfig")
		c.String(http.StatusOK, config)
	case "minimal":
		c.JSON(http.StatusOK, h.vpnService.GetMinimalConfig(c, userID, server))
	default:
		c.Header("Content-Type", "text/plain")
		c.Header("Content-Disposition", "attachment; filename=homelabvpn.conf")
		c.String(http.StatusOK, config)
	}
}

// RegenerateVPNKeys regenerates the user's WireGuard keys
func (h *Handler) RegenerateVPNKeys(c *gin.Context) {
	userID := c.GetString("userID")

	config, err := h.vpnService.RegenerateKeys(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to regenerate keys"})
		return
	}

	c.JSON(http.StatusOK, config)
}

// GetVPNServers returns available VPN server locations
func (h *Handler) GetVPNServers(c *gin.Context) {
	servers := h.vpnService.GetServers()
	c.JSON(http.StatusOK, servers)
}

// GetPlans returns available subscription plans
func (h *Handler) GetPlans(c *gin.Context) {
	plans := h.subscriptionService.GetPlans()
	c.JSON(http.StatusOK, plans)
}

// CreateCheckoutSession creates a Stripe checkout session
func (h *Handler) CreateCheckoutSession(c *gin.Context) {
	userID := c.GetString("userID")
	email := c.GetString("email")

	var req struct {
		PlanID        string `json:"planId" binding:"required"`
		BillingPeriod string `json:"billingPeriod" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	session, err := h.subscriptionService.CreateCheckoutSession(c, userID, email, req.PlanID, req.BillingPeriod, h.frontendURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create checkout session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId":   session.ID,
		"checkoutUrl": session.URL,
	})
}

// HandleStripeWebhook handles Stripe webhook events
func (h *Handler) HandleStripeWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	signature := c.GetHeader("Stripe-Signature")
	if err := h.webhookHandler.HandleWebhook(body, signature); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// GetCurrentSubscription returns the user's current subscription
func (h *Handler) GetCurrentSubscription(c *gin.Context) {
	userID := c.GetString("userID")

	sub, err := h.subscriptionService.GetUserSubscription(c, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no subscription found"})
		return
	}

	c.JSON(http.StatusOK, sub)
}

// CancelSubscription cancels the user's subscription
func (h *Handler) CancelSubscription(c *gin.Context) {
	userID := c.GetString("userID")

	result, err := h.subscriptionService.CancelSubscription(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel subscription"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Helper functions

func (h *Handler) createOrUpdateUser(userInfo *auth.GoogleUserInfo) (string, error) {
	var userID string

	// Try to find existing user
	err := h.db.QueryRow(
		"SELECT id FROM users WHERE google_id = $1",
		userInfo.ID,
	).Scan(&userID)

	if err == sql.ErrNoRows {
		// Create new user
		userID = uuid.New().String()
		_, err = h.db.Exec(
			"INSERT INTO users (id, email, google_id, created_at) VALUES ($1, $2, $3, NOW())",
			userID, userInfo.Email, userInfo.ID,
		)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	} else {
		// Update last login
		_, err = h.db.Exec(
			"UPDATE users SET last_login_at = NOW() WHERE id = $1",
			userID,
		)
		if err != nil {
			return "", err
		}
	}

	return userID, nil
}
