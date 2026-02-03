package relay

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler contains relay API handlers
type Handler struct {
	service  *Service
	apiKey   string
}

// NewHandler creates a new relay handler
func NewHandler(service *Service, apiKey string) *Handler {
	return &Handler{
		service: service,
		apiKey:  apiKey,
	}
}

// APIKeyMiddleware validates relay API key
func (h *Handler) APIKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-Relay-API-Key")
		if apiKey == "" {
			apiKey = c.Query("api_key")
		}

		if apiKey != h.apiKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid API key"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Register handles relay server registration
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Name      string `json:"name" binding:"required"`
		PublicIP  string `json:"publicIP" binding:"required"`
		PublicKey string `json:"publicKey" binding:"required"`
		Region    string `json:"region" binding:"required"`
		Type      string `json:"type"` // defaults to "ios-relay"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Type == "" {
		req.Type = "ios-relay"
	}

	relay, err := h.service.RegisterRelay(c, req.Name, req.PublicIP, req.PublicKey, req.Region, req.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register relay"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "registered",
		"relay":  relay,
	})
}

// Heartbeat handles relay heartbeat/status updates
func (h *Handler) Heartbeat(c *gin.Context) {
	var req struct {
		PublicIP      string `json:"publicIP" binding:"required"`
		ActivePeers   int    `json:"activePeers"`
		BytesIn       int64  `json:"bytesIn"`
		BytesOut      int64  `json:"bytesOut"`
		Uptime        int64  `json:"uptime"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	stats := map[string]interface{}{
		"activePeers": req.ActivePeers,
		"bytesIn":     req.BytesIn,
		"bytesOut":    req.BytesOut,
		"uptime":      req.Uptime,
	}

	if err := h.service.Heartbeat(c, req.PublicIP, stats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update heartbeat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetPeers returns all peer configurations for relay to sync
func (h *Handler) GetPeers(c *gin.Context) {
	peers, err := h.service.GetPeers(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get peers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"peers": peers,
		"count": len(peers),
	})
}

// GetWireGuardConfig returns WireGuard config snippet for all peers
func (h *Handler) GetWireGuardConfig(c *gin.Context) {
	peers, err := h.service.GetPeers(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get peers"})
		return
	}

	// Generate WireGuard peer config snippets
	var config string
	for _, peer := range peers {
		if peer.Active && peer.PublicKey != "" {
			config += "# " + peer.Email + "\n"
			config += "[Peer]\n"
			config += "PublicKey = " + peer.PublicKey + "\n"
			config += "AllowedIPs = " + peer.ClientIP + "/32\n\n"
		}
	}

	c.Header("Content-Type", "text/plain")
	c.String(http.StatusOK, config)
}

// ListRelays returns all registered relay servers (for admin)
func (h *Handler) ListRelays(c *gin.Context) {
	relays, err := h.service.GetRelayServers(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get relays"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"relays": relays,
		"count":  len(relays),
	})
}
