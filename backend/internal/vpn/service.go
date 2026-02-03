package vpn

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"
	"net"
	"sync"
	"text/template"
	"bytes"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/curve25519"
)

// Service handles VPN-related operations
type Service struct {
	db       *sql.DB
	redis    *redis.Client
	servers  []Server
	ipPool   *IPPool
	mu       sync.RWMutex
}

// Server represents a VPN server location
type Server struct {
	ID        string `json:"id"`
	Country   string `json:"country"`
	City      string `json:"city"`
	PublicIP  string `json:"publicIP"`
	PublicKey string `json:"publicKey"`
	Port      int    `json:"port"`
	Load      int    `json:"load"`
}

// UserConfig represents a user's VPN configuration
type UserConfig struct {
	PublicKey  string `json:"publicKey"`
	PrivateKey string `json:"privateKey,omitempty"`
	ClientIP   string `json:"clientIP"`
	CreatedAt  string `json:"createdAt"`
}

// IPPool manages IP address allocation for WireGuard clients
type IPPool struct {
	subnet   *net.IPNet
	allocated map[string]string // userID -> IP
	mu       sync.Mutex
}

// NewService creates a new VPN service
func NewService(db *sql.DB, redis *redis.Client) *Service {
	_, subnet, _ := net.ParseCIDR("10.0.0.0/16")

	return &Service{
		db:    db,
		redis: redis,
		servers: []Server{
			{ID: "us-east", Country: "United States", City: "New York", PublicIP: "us-east.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 45},
			{ID: "us-west", Country: "United States", City: "Los Angeles", PublicIP: "us-west.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 32},
			{ID: "uk", Country: "United Kingdom", City: "London", PublicIP: "uk.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 58},
			{ID: "de", Country: "Germany", City: "Frankfurt", PublicIP: "de.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 41},
			{ID: "nl", Country: "Netherlands", City: "Amsterdam", PublicIP: "nl.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 28},
			{ID: "jp", Country: "Japan", City: "Tokyo", PublicIP: "jp.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 67},
			{ID: "sg", Country: "Singapore", City: "Singapore", PublicIP: "sg.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 35},
			{ID: "au", Country: "Australia", City: "Sydney", PublicIP: "au.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 22},
			{ID: "ca", Country: "Canada", City: "Toronto", PublicIP: "ca.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 39},
			{ID: "fr", Country: "France", City: "Paris", PublicIP: "fr.vpn.z-q.me", PublicKey: generateServerKey(), Port: 51820, Load: 51},
		},
		ipPool: &IPPool{
			subnet:    subnet,
			allocated: make(map[string]string),
		},
	}
}

// GetServers returns available VPN servers
func (s *Service) GetServers() []Server {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.servers
}

// GetUserConfig returns the user's current VPN configuration
func (s *Service) GetUserConfig(ctx context.Context, userID string) (*UserConfig, error) {
	var config UserConfig
	err := s.db.QueryRowContext(ctx,
		"SELECT public_key, client_ip, created_at FROM wireguard_keys WHERE user_id = $1",
		userID,
	).Scan(&config.PublicKey, &config.ClientIP, &config.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &config, nil
}

// GenerateConfig generates a WireGuard configuration file
func (s *Service) GenerateConfig(ctx context.Context, userID, serverID, format string) (string, error) {
	// Get or create user keys
	config, err := s.getOrCreateUserKeys(ctx, userID)
	if err != nil {
		return "", err
	}

	// Find server
	server := s.findServer(serverID)
	if server == nil {
		return "", fmt.Errorf("server not found")
	}

	switch format {
	case "mobileconfig":
		return s.generateMobileConfig(config, server)
	default:
		return s.generateWireGuardConfig(config, server)
	}
}

// GetMinimalConfig returns minimal config info for API responses
func (s *Service) GetMinimalConfig(ctx context.Context, userID, serverID string) map[string]interface{} {
	config, _ := s.getOrCreateUserKeys(ctx, userID)
	server := s.findServer(serverID)

	return map[string]interface{}{
		"publicKey":  config.PublicKey,
		"clientIP":   config.ClientIP,
		"endpoint":   fmt.Sprintf("%s:%d", server.PublicIP, server.Port),
		"serverKey":  server.PublicKey,
		"dns":        []string{"1.1.1.1", "1.0.0.1"},
		"allowedIPs": "0.0.0.0/0",
	}
}

// RegenerateKeys creates new WireGuard keys for a user
func (s *Service) RegenerateKeys(ctx context.Context, userID string) (*UserConfig, error) {
	privateKey, publicKey := generateKeyPair()
	clientIP := s.allocateIP(userID)

	// Update database
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO wireguard_keys (id, user_id, private_key_encrypted, public_key, client_ip, created_at, rotated_at)
		 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		 ON CONFLICT (user_id) DO UPDATE SET
		 private_key_encrypted = $3, public_key = $4, rotated_at = NOW()`,
		uuid.New().String(), userID, privateKey, publicKey, clientIP,
	)

	if err != nil {
		return nil, err
	}

	return &UserConfig{
		PublicKey: publicKey,
		ClientIP:  clientIP,
	}, nil
}

func (s *Service) getOrCreateUserKeys(ctx context.Context, userID string) (*UserConfig, error) {
	config, err := s.GetUserConfig(ctx, userID)
	if err != nil {
		return nil, err
	}

	if config == nil {
		// Generate new keys
		return s.RegenerateKeys(ctx, userID)
	}

	// Get private key for config generation
	var privateKey string
	s.db.QueryRowContext(ctx,
		"SELECT private_key_encrypted FROM wireguard_keys WHERE user_id = $1",
		userID,
	).Scan(&privateKey)
	config.PrivateKey = privateKey

	return config, nil
}

func (s *Service) findServer(serverID string) *Server {
	for _, server := range s.servers {
		if server.ID == serverID {
			return &server
		}
	}
	return &s.servers[0] // Default to first server
}

func (s *Service) allocateIP(userID string) string {
	s.ipPool.mu.Lock()
	defer s.ipPool.mu.Unlock()

	// Check if user already has an IP
	if ip, ok := s.ipPool.allocated[userID]; ok {
		return ip
	}

	// Generate next available IP (simplified - in production use proper IP allocation)
	nextIP := fmt.Sprintf("10.0.%d.%d", len(s.ipPool.allocated)/254+1, len(s.ipPool.allocated)%254+2)
	s.ipPool.allocated[userID] = nextIP
	return nextIP
}

func (s *Service) generateWireGuardConfig(config *UserConfig, server *Server) (string, error) {
	tmpl := `[Interface]
PrivateKey = {{ .PrivateKey }}
Address = {{ .ClientIP }}/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = {{ .ServerPublicKey }}
Endpoint = {{ .ServerEndpoint }}:{{ .ServerPort }}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`

	t, err := template.New("wgconfig").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	err = t.Execute(&buf, map[string]interface{}{
		"PrivateKey":      config.PrivateKey,
		"ClientIP":        config.ClientIP,
		"ServerPublicKey": server.PublicKey,
		"ServerEndpoint":  server.PublicIP,
		"ServerPort":      server.Port,
	})

	return buf.String(), err
}

func (s *Service) generateMobileConfig(config *UserConfig, server *Server) (string, error) {
	tmpl := `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadDisplayName</key>
            <string>HomelabVPN</string>
            <key>PayloadIdentifier</key>
            <string>com.homelabvpn.wireguard</string>
            <key>PayloadType</key>
            <string>com.wireguard.macos</string>
            <key>PayloadUUID</key>
            <string>{{ .UUID }}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>WgQuickConfig</key>
            <string>[Interface]
PrivateKey = {{ .PrivateKey }}
Address = {{ .ClientIP }}/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = {{ .ServerPublicKey }}
Endpoint = {{ .ServerEndpoint }}:{{ .ServerPort }}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>HomelabVPN Configuration</string>
    <key>PayloadIdentifier</key>
    <string>com.homelabvpn.profile</string>
    <key>PayloadOrganization</key>
    <string>HomelabVPN</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>{{ .ProfileUUID }}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`

	t, err := template.New("mobileconfig").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	err = t.Execute(&buf, map[string]interface{}{
		"UUID":            uuid.New().String(),
		"ProfileUUID":     uuid.New().String(),
		"PrivateKey":      config.PrivateKey,
		"ClientIP":        config.ClientIP,
		"ServerPublicKey": server.PublicKey,
		"ServerEndpoint":  server.PublicIP,
		"ServerPort":      server.Port,
	})

	return buf.String(), err
}

// generateKeyPair creates a new WireGuard key pair
func generateKeyPair() (privateKey, publicKey string) {
	var private [32]byte
	rand.Read(private[:])

	// Clamp the private key
	private[0] &= 248
	private[31] &= 127
	private[31] |= 64

	var public [32]byte
	curve25519.ScalarBaseMult(&public, &private)

	return base64.StdEncoding.EncodeToString(private[:]),
		base64.StdEncoding.EncodeToString(public[:])
}

// generateServerKey generates a key for demo purposes
func generateServerKey() string {
	_, pub := generateKeyPair()
	return pub
}
